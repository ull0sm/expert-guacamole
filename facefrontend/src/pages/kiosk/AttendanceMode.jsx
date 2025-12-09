
import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Camera, CheckCircle, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const AttendanceMode = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // State
    const [className, setClassName] = useState('');
    const [currentSlot, setCurrentSlot] = useState(null);
    const [studentsMap, setStudentsMap] = useState(new Map()); // USN -> Profile
    const [logs, setLogs] = useState([]);
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [lastRecognized, setLastRecognized] = useState(new Map()); // USN -> Timestamp (Cooldown)

    // Load Class & Students
    useEffect(() => {
        const loadData = async () => {
            // Class Info
            const { data: cls } = await supabase.from('classes').select('*').eq('id', classId).single();
            if (cls) setClassName(`${cls.name}-${cls.section}`);

            // Students (Ideally filter by class if we had that link, for now fetch all students)
            // Optimization: Fetch all students with USN
            const { data: stus } = await supabase.from('profiles').select('*').eq('role', 'student');
            if (stus) {
                const map = new Map();
                stus.forEach(s => {
                    if (s.usn) map.set(s.usn, s); // USN keys are case-sensitive usually, ensure consistency
                });
                setStudentsMap(map);
            }
        };
        loadData();
        startCamera();

        // Initial Timetable Check
        checkTimetable();
        const slotInterval = setInterval(checkTimetable, 60000); // Check every min for slot change

        return () => {
            clearInterval(slotInterval);
            stopCamera();
        };
    }, [classId]);

    // Recognition Loop
    useEffect(() => {
        let interval;
        if (isAutoMode) {
            interval = setInterval(() => {
                if (!processing) captureAndRecognize();
            }, 3000); // Every 3s
        }
        return () => clearInterval(interval);
    }, [isAutoMode, processing, currentSlot, studentsMap]); // Dep change triggers restart

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error", err);
            toast.error("Could not access camera");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const checkTimetable = async () => {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[now.getDay()];
        const currentTime = now.toLocaleTimeString('en-GB', { hour12: false }); // HH:MM:SS

        // Fetch slots for this class and day
        const { data: slots } = await supabase
            .from('timetable')
            .select('*, subjects(name, code)')
            .eq('class_id', classId)
            .eq('day', dayName)
            .lte('start_time', currentTime)
            .gte('end_time', currentTime)
            .single();

        setCurrentSlot(slots || null);
    };

    const captureAndRecognize = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setProcessing(true);

        try {
            // Draw frame to canvas
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get Base64
            const imageBase64 = canvas.toDataURL('image/jpeg');

            // Send to Python API
            const response = await axios.post('http://localhost:5006/recognize', { image: imageBase64 });
            const recognized = response.data; // [{ usn: '...', confidence: ... }]

            if (recognized.length > 0) {
                for (const rec of recognized) {
                    await handleAttendance(rec.usn);
                }
            }

        } catch (err) {
            console.error("Recognition error", err);
        } finally {
            setProcessing(false);
        }
    };

    const handleAttendance = async (usn) => {
        // Warning: USN from Python might be slightly different if case mismatch or hidden chars
        // But we rely on exact string match for now.
        const student = studentsMap.get(usn);

        if (!student) {
            // IMPORTANT: Notify user of mismatch so they know why attendance isn't marked
            // Only warn once every few seconds to avoid spam
            const lastWarn = lastRecognized.get(`WARN_${usn}`);
            if (!lastWarn || Date.now() - lastWarn > 5000) {
                toast.warn(`Unknown Student: ${usn} (Not found in DB)`);
                setLastRecognized(prev => new Map(prev).set(`WARN_${usn}`, Date.now()));
            }
            return;
        }

        // Check Cooldown (Local) - Prevent spamming API
        const lastTime = lastRecognized.get(usn);
        if (lastTime && (Date.now() - lastTime < 300000)) { // 5 mins cooldown
            return;
        }

        // Mark Attendance
        // toast.info(`Recognized: ${student.full_name}`);
        setLastRecognized(prev => new Map(prev).set(usn, Date.now()));

        try {
            // Check if already marked for this slot/day in DB
            // If we have a slot, link to it. If not, just mark present for Class + Date.
            const today = new Date().toISOString().split('T')[0];

            // Construct query
            let query = supabase.from('attendance')
                .select('*')
                .eq('student_id', student.id)
                .eq('date', today)
                .eq('class_id', classId);

            if (currentSlot) {
                query = query.eq('subject_id', currentSlot.subject_id);
            }

            const { data: existing } = await query;

            if (existing && existing.length > 0) {
                toast.warning(`${student.full_name} already marked.`);
                return;
            }

            // Insert
            const { error } = await supabase.from('attendance').insert([{
                student_id: student.id,
                class_id: classId,
                subject_id: currentSlot?.subject_id || null, // Optional if no slot active
                timetable_id: currentSlot?.id || null,
                date: today,
                status: 'present',
                method: isAutoMode ? 'auto' : 'manual'
            }]);

            if (error) throw error;

            toast.success(`Marked Present: ${student.full_name}`);

            // Add to UI Log
            const newLog = {
                id: Date.now(),
                name: student.full_name,
                usn: student.usn,
                time: new Date().toLocaleTimeString(),
                avatar: student.avatar_url
            };
            setLogs(prev => [newLog, ...prev].slice(0, 10)); // Keep last 10

        } catch (err) {
            console.error("DB Insert Error", err);
            toast.error(`Failed to mark ${student.full_name}`);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full gap-6">
            {/* Left: Camera Source */}
            <div className="flex-1 flex flex-col gap-4 relative">
                <div className="absolute top-4 left-4 z-10">
                    <button onClick={() => navigate('/kiosk')} className="bg-black/50 text-white p-2 rounded-full hover:bg-white/20 backdrop-blur-md transition-all">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black aspect-video flex items-center justify-center group">
                    <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{className}</h2>
                                {currentSlot ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                        <span className="font-mono text-sm uppercase tracking-wider">Current: {currentSlot.subjects?.name} ({currentSlot.start_time.slice(0, 5)} - {currentSlot.end_time.slice(0, 5)})</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <AlertTriangle size={14} />
                                        <span className="font-mono text-sm uppercase tracking-wider">No Active Session</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {isAutoMode && (
                                    <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-bold animate-pulse flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        LIVE SCAN
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 justify-center">
                    <button
                        onClick={() => setIsAutoMode(!isAutoMode)}
                        className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${isAutoMode ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                    >
                        <RefreshCw size={20} className={isAutoMode ? 'animate-spin' : ''} />
                        {isAutoMode ? 'Stop Auto Scan' : 'Start Auto Mode'}
                    </button>

                    <button
                        onClick={captureAndRecognize}
                        disabled={isAutoMode || processing}
                        className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Camera size={20} />
                        Manual Scan
                    </button>
                </div>
            </div>

            {/* Right: Logs */}
            <div className="w-full lg:w-96 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={20} />
                    Recent Attendance
                </h3>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {logs.length === 0 ? (
                        <p className="text-slate-500 text-center py-10 italic">Waiting for students...</p>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 animate-slide-up">
                                {log.avatar ? (
                                    <img src={log.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
                                        {log.name[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-white text-sm">{log.name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{log.usn}</p>
                                </div>
                                <div className="ml-auto text-xs text-slate-500 font-mono">
                                    {log.time}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceMode;
