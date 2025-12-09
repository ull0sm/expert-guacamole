
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { BookOpen, Users, Clock, TrendingUp, Download, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const TeacherDashboard = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ todayPresent: 0, upcoming: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) await fetchStats(user.id);
        };
        init();
    }, []);

    const fetchStats = async (userId) => {
        try {
            const res = await axios.get(`http://localhost:5001/api/teacher/dashboard-stats?teacherId=${userId}`);
            setStats(res.data);
        } catch (error) {
            console.error("Stats Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickDownload = async (cls) => {
        if (!user) return;
        try {
            toast.info("Downloading Today's Report...");
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.get(`http://localhost:5001/api/reports/custom`, {
                params: {
                    teacherId: user.id,
                    classId: cls.class_id,
                    subjectId: cls.subject_id,
                    startDate: today,
                    endDate: today,
                    type: 'detailed'
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Today_${cls.subjects?.name}_Report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Downloaded!");

        } catch (error) {
            console.error(error);
            toast.error("Download failed.");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-white">Teacher Dashboard</h2>

            {/* Top Cards (Refined to 2 Columns for better symmetry since risk is gone) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 p-6 rounded-2xl backdrop-blur-xl transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-500/20 rounded-xl text-teal-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Present Today</p>
                            <h3 className="text-3xl font-bold text-white">{stats.todayPresent}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 p-6 rounded-2xl backdrop-blur-xl transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Scheduled Classes</p>
                            <h3 className="text-3xl font-bold text-white">{stats.upcoming.length}</h3>
                        </div>
                    </div>
                </div>
                
                 <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 p-6 rounded-2xl backdrop-blur-xl transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">System Status</p>
                            <h3 className="text-xl font-bold text-teal-400">Online</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule (Now Full Width & Detailed) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Clock className="text-teal-400" size={20} /> Today's Schedule & Attendance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {loading ? (
                            <p className="text-slate-500 italic col-span-2 text-center py-8">Loading schedule...</p>
                    ) : stats.upcoming.length === 0 ? (
                        <p className="text-slate-500 italic col-span-2 text-center py-8">No classes scheduled for today.</p>
                    ) : (
                        stats.upcoming.map((cls, idx) => (
                            <div key={idx} className="flex flex-col p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-teal-500/30 transition-all group gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-white text-lg group-hover:text-teal-400 transition-colors">{cls.subjects?.name}</h4>
                                        <p className="text-sm text-slate-400 font-medium">{cls.classes?.name} - {cls.classes?.section}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-teal-400 font-mono font-bold text-lg">{cls.start_time.slice(0,5)}</span>
                                        <span className="text-xs text-slate-500">{cls.end_time.slice(0,5)}</span>
                                    </div>
                                </div>
                                
                                <div className="h-px bg-white/10 w-full"></div>
                                
                                <div className="flex items-center justify-between">
                                    {/* Stats Display */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                                            <CheckCircle size={14} />
                                            <span className="font-bold">{cls.stats?.present || 0}</span> Present
                                        </div>
                                        <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                                            <XCircle size={14} />
                                            <span className="font-bold">{cls.stats?.absent || 0}</span> Absent
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleQuickDownload(cls)}
                                        className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500 hover:text-white transition-all flex items-center gap-2 group/btn"
                                        title="Download Today's Report"
                                    >
                                        <span className="text-xs font-bold uppercase tracking-wider px-1">Download Report</span>
                                        <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
