
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { BookOpen, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
    const [myClasses, setMyClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) fetchMyClasses(user.id);
        };
        getUser();
    }, []);

    const fetchMyClasses = async (userId) => {
        try {
            // Distinct classes from timetable
            // Supabase doesn't support SELECT DISTINCT easy with relationships, so we fetch all and filter JS side or use a view.
            // For now, fetch all slots and unique them.
            const { data, error } = await supabase
                .from('timetable')
                .select(`
                    class_id,
                    subject_id,
                    classes (name, section),
                    subjects (name, code)
                `)
                .eq('teacher_id', userId);

            if (error) throw error;

            console.log("Raw Timetable:", data);

            // De-duplicate based on class_id + subject_id
            const uniqueMap = new Map();
            data.forEach(item => {
                const key = `${item.class_id}-${item.subject_id}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, {
                        class_id: item.class_id,
                        subject_id: item.subject_id,
                        className: item.classes.name,
                        section: item.classes.section,
                        subjectName: item.subjects.name,
                        subjectCode: item.subjects.code
                    });
                }
            });

            setMyClasses(Array.from(uniqueMap.values()));

        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">My Classes</h2>

            {loading ? (
                <div className="text-slate-400">Loading your classes...</div>
            ) : myClasses.length === 0 ? (
                <div className="text-slate-500 bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                    You have no assigned classes in the timetable yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myClasses.map((cls, idx) => (
                        <Link
                            to={`/teacher/class/${cls.class_id}/${cls.subject_id}`}
                            key={idx}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-teal-500/50 transition-all hover:-translate-y-1 block group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="bg-teal-500/20 text-teal-400 text-xs px-2 py-1 rounded-lg font-mono">
                                    {cls.subjectCode}
                                </span>
                                <BookOpen className="text-slate-500 group-hover:text-teal-400 transition-colors" size={20} />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-1">Class {cls.className}-{cls.section}</h3>
                            <p className="text-slate-400 font-medium mb-4">{cls.subjectName}</p>

                            <div className="flex items-center gap-4 text-sm text-slate-500 border-t border-white/5 pt-4">
                                <div className="flex items-center gap-1">
                                    <Users size={14} />
                                    <span>View Students</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>History</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
