
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ChevronRight, Users } from 'lucide-react';
import { toast } from 'react-toastify';

const KioskLanding = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const { data, error } = await supabase.from('classes').select('*').order('name');
                if (error) throw error;
                setClasses(data);
            } catch (err) {
                console.error("Error loading classes", err);
                toast.error("Failed to load classes");
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    const handleStart = () => {
        if (!selectedClass) {
            toast.warn("Please select a class");
            return;
        }
        navigate(`/kiosk/attendance/${selectedClass}`);
    };

    return (
        <div className="flex flex-col items-center text-center space-y-8">
            <h2 className="text-5xl font-bold text-white mb-4 tracking-tight">Select Class Session</h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
                Choose the class currently in session to begin tracking attendance.
            </p>

            <div className="w-full max-w-md space-y-4 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
                <div>
                    <label className="block text-left text-sm font-medium text-slate-400 mb-2 pl-1">Class</label>
                    <div className="relative">
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none transition-all"
                        >
                            <option value="">-- Choose Class --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <ChevronRight className="rotate-90" size={16} />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    disabled={!selectedClass}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    Start Attendance <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default KioskLanding;
