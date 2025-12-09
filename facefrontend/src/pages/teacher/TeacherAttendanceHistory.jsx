
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../supabaseClient';
import { Calendar, User, Clock, CheckCircle, Download, FileText, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherAttendanceHistory = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [user, setUser] = useState(null);
    const [allClassData, setAllClassData] = useState([]); // Raw data
    const [uniqueClasses, setUniqueClasses] = useState([]); // Filtered Classes
    
    // Selection State
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [availableSubjects, setAvailableSubjects] = useState([]); // Derived from class

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportType, setReportType] = useState('detailed'); // 'detailed' | 'summary'

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if(user) fetchDropdowns(user.id);
        };
        init();
    }, []);

    const fetchDropdowns = async (userId) => {
        try {
            const res = await axios.get(`http://localhost:5001/api/teacher/my-classes?teacherId=${userId}`);
            setAllClassData(res.data);
            
            // Extract Unique Classes
            const classMap = new Map();
            res.data.forEach(item => {
                if (!classMap.has(item.classId)) {
                    classMap.set(item.classId, {
                        id: item.classId,
                        name: item.className,
                        section: item.section
                    });
                }
            });
            setUniqueClasses(Array.from(classMap.values()));

        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    // Handle Class Change -> Update Subjects
    const handleClassChange = (e) => {
        const classId = e.target.value;
        setSelectedClassId(classId);
        setSelectedSubjectId(''); // Reset subject

        if (classId) {
            const subjects = allClassData
                .filter(item => item.classId == classId) // Loose equality for safety
                .map(item => ({
                    id: item.subjectId,
                    name: item.subjectName
                }));
            setAvailableSubjects(subjects);
        } else {
            setAvailableSubjects([]);
        }
    };

    const handleDownload = async () => {
        if (!selectedClassId || !selectedSubjectId || !startDate || !endDate) {
            toast.warn("Please select Class, Subject, and Date Range.");
            return;
        }

        try {
            toast.info("Generating report...");
            const response = await axios.get(`http://localhost:5001/api/reports/custom`, {
                params: {
                    teacherId: user.id,
                    classId: selectedClassId,
                    subjectId: selectedSubjectId,
                    startDate,
                    endDate,
                    type: reportType
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportType}_report_${startDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Report downloaded!");

        } catch (error) {
            console.error("Download failed:", error);
            if (error.response?.status === 403) {
                 toast.error("Unauthorized: You don't teach this class.");
            } else {
                 toast.error("Failed to download.");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Attendance Reports</h2>
                    <p className="text-slate-400">Generate strict reports for your classes</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                
                {/* Row 1: Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Class Dropdown */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium ml-1">1. Select Class</label>
                        <div className="relative">
                            <select 
                                value={selectedClassId}
                                onChange={handleClassChange}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500 appearance-none pointer-events-auto cursor-pointer hover:bg-black/30 transition-colors"
                            >
                                <option value="">-- Choose Class --</option>
                                {uniqueClasses.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} - {cls.section}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">
                                <Filter size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Subject Dropdown */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium ml-1">2. Select Subject</label>
                        <div className="relative">
                            <select 
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                disabled={!selectedClassId}
                                className={`w-full border border-white/10 rounded-xl px-4 py-3 text-white outline-none appearance-none transition-all ${
                                    !selectedClassId 
                                    ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                                    : 'bg-black/20 focus:border-teal-500 cursor-pointer hover:bg-black/30'
                                }`}
                            >
                                <option value="">
                                    {!selectedClassId ? "Select Class First" : "-- Choose Subject --"}
                                </option>
                                {availableSubjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">
                                <FileText size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Row 2: Dates & Format */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">From Date</label>
                        <input 
                            type="date" 
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-teal-500"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">To Date</label>
                        <input 
                            type="date" 
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-teal-500"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium ml-1">Report Format</label>
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/10 h-[42px]">
                            <button 
                                onClick={() => setReportType('detailed')}
                                className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${reportType === 'detailed' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Detailed
                            </button>
                            <button 
                                onClick={() => setReportType('summary')}
                                className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${reportType === 'summary' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Summary
                            </button>
                        </div>
                    </div>

                   <div className="flex items-end">
                       <button 
                            onClick={handleDownload}
                            disabled={!selectedClassId || !selectedSubjectId || !startDate || !endDate}
                            className={`w-full h-[42px] rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                (!selectedClassId || !selectedSubjectId || !startDate || !endDate) 
                                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                                : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                            }`}
                       >
                           <Download size={18} />
                           Download Report
                       </button>
                   </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                 <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                 Select your filters above to generate a secure CSV report.
                 <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            </div>
        </div>
    );
};

export default TeacherAttendanceHistory;
