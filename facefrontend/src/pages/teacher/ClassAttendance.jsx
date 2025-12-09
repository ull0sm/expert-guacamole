
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useParams } from 'react-router-dom';
import { Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const ClassAttendance = () => {
    const { classId, subjectId } = useParams();
    const [attendance, setAttendance] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [className, setClassName] = useState('');
    const [subjectName, setSubjectName] = useState('');

    const [user, setUser] = useState(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) fetchData(user.id);
        };
        init();
    }, [classId, subjectId]);

    const fetchData = async (userId) => {
        try {
            setClassName('General Class');
            setSubjectName(subjectId); 

            // Secure: Only fetch attendance for this teacher
            const res = await axios.get(`http://localhost:5001/api/attendance?teacherId=${userId}`);
            const allLogs = res.data;

            const courseName = decodeURIComponent(subjectId);
            const filteredLogs = allLogs.filter(log => log.course === courseName);
            
            const adaptedLogs = filteredLogs.map(log => ({
                id: log.id || Math.random(),
                name: log.name,
                usn: log.usn,
                timestamp: log.recognizedAt,
                status: 'present',
                avatar_url: log.avatar_url
            }));

            setAttendance(adaptedLogs);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error("Failed to load attendance data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <h2 className="text-2xl font-bold text-white mb-1">{subjectName}</h2>
                <p className="text-slate-400">Class {className} • Attendance History</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-300">
                        <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">USN</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8">Loading history...</td></tr>
                            ) : attendance.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No attendance records found.</td></tr>
                            ) : (
                                attendance.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            {log.avatar_url ? (
                                                <img src={log.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                                    <User size={14} />
                                                </div>
                                            )}
                                            {log.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm opacity-70">{log.usn}</td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Calendar size={14} className="opacity-50" />
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-sm opacity-70">
                                                <Clock size={14} />
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.status === 'present' ? (
                                                <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                    <CheckCircle size={12} /> Present
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                    <XCircle size={12} /> Absent
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClassAttendance;
