
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../supabaseClient';
import { Calendar, Clock, MapPin, Layers } from 'lucide-react';

const TeacherTimetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        const init = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             setUser(user);
             if(user) fetchTimetable(user.id);
        };
        init();
    }, []);

    const fetchTimetable = async (userId) => {
        try {
            const res = await axios.get(`http://localhost:5001/api/timetable?teacherId=${userId}`);
            setTimetable(res.data);
        } catch (error) {
            console.error("Error fetching timetable:", error);
        } finally {
            setLoading(false);
        }
    };

    const getClassesForDay = (day) => {
        return timetable
            .filter(t => t.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Weekly Schedule</h2>
                    <p className="text-slate-400">Your classes at a glance</p>
                </div>
                <div className="bg-teal-500/10 text-teal-400 px-4 py-2 rounded-xl border border-teal-500/20 flex items-center gap-2">
                    <Layers size={18} />
                    <span className="font-bold">{timetable.length} Classes / Week</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {DAYS.map(day => (
                    <div key={day} className="flex flex-col gap-3">
                        {/* Day Header */}
                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center backdrop-blur-sm">
                            <h3 className="font-bold text-slate-300 uppercase text-sm tracking-wider">{day}</h3>
                        </div>

                        {/* Class Cards */}
                        <div className="flex flex-col gap-3 h-full">
                            {loading ? (
                                <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
                            ) : getClassesForDay(day).length === 0 ? (
                                <div className="flex-1 min-h-[100px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                                    <span className="text-slate-600 text-xs font-medium">Free Day</span>
                                </div>
                            ) : (
                                getClassesForDay(day).map((cls, idx) => (
                                    <div key={idx} className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 p-4 rounded-xl hover:border-indigo-500/50 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-black/40 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded">
                                                {cls.startTime.slice(0,5)}
                                            </span>
                                            <span className="text-slate-500 text-[10px]">{cls.endTime.slice(0,5)}</span>
                                        </div>
                                        
                                        <h4 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1">
                                            {cls.subject}
                                        </h4>
                                        
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <MapPin size={12} />
                                            <span>
                                                {cls.className} - {cls.section}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherTimetable;
