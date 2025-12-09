
import React, { useEffect, useState } from 'react';
import { Users, BookOpen, UserCheck, Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const [stats, setStats] = useState({
        teachers: 0,
        students: 0,
        classes: 0,
        subjects: 0
    });
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { count: teachers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
            const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
            const { count: classes } = await supabase.from('classes').select('*', { count: 'exact', head: true });
            const { count: subjects } = await supabase.from('subjects').select('*', { count: 'exact', head: true });

            setStats({ teachers, students, classes, subjects });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncFaces = async () => {
        setSyncing(true);
        try {
            // Call Python API
            const response = await axios.post('http://localhost:5006/sync');
            toast.success(response.data.message);
        } catch (error) {
            console.error("Sync failed", error);
            if (error.code === 'ERR_NETWORK') {
                toast.error("Python API is not running (Port 5006). Check terminal.");
            } else {
                toast.error("Failed to sync faces.");
            }
        } finally {
            setSyncing(false);
        }
    };

    const statCards = [
        { label: 'Total Teachers', value: stats.teachers, icon: Users, color: 'from-blue-500 to-cyan-500' },
        { label: 'Total Students', value: stats.students, icon: UserCheck, color: 'from-purple-500 to-pink-500' },
        { label: 'Classes', value: stats.classes, icon: BookOpen, color: 'from-orange-500 to-red-500' },
        { label: 'Subjects', value: stats.subjects, icon: Calendar, color: 'from-green-500 to-emerald-500' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
                    <p className="text-slate-400">Welcome to the administration portal.</p>
                </div>
                <button
                    onClick={handleSyncFaces}
                    disabled={syncing}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50"
                >
                    <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing...' : 'Sync Face Data'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl hover:translate-y-[-5px] transition-transform duration-300">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20`}>
                            <stat.icon size={24} className="text-white" />
                        </div>
                        <h3 className="text-slate-400 font-medium mb-1">{stat.label}</h3>
                        <p className="text-3xl font-bold text-white">{loading ? '-' : stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl h-64 flex items-center justify-center">
                    <p className="text-slate-500">Attendance Chart Placeholder</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl h-64 flex items-center justify-center">
                    <p className="text-slate-500">Recent Activity Placeholder</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
