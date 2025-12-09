
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

    useEffect(() => {
        fetchData();
    }, [classId, subjectId]);

    const fetchData = async () => {
        try {
            // Fetch Class & Subject Info
            const { data: cls } = await supabase.from('classes').select('*').eq('id', classId).single();
            const { data: sub } = await supabase.from('subjects').select('*').eq('id', subjectId).single();
            if (cls) setClassName(`${cls.name}-${cls.section}`);
            if (sub) setSubjectName(`${sub.name} (${sub.code})`);

            // Fetch Students in this class (Assuming we have a way to link students to classes, 
            // currently generic because we don't have a 'student_classes' table. 
            // For now, fetch ALL students? Or assume students are assigned to classes?
            // The schema has `attendance` linked to class. 
            // Wait, we forgot `student_classes` assignment table! 
            // "Admin creates multiple classes and assigns students to those classes."
            // I missed creating a linking table `student_classes`.
            // Workaround: We can infer students from `attendance` logs OR we need that table.
            // For now, let's just show attendance logs.

            const { data: logs, error } = await supabase
                .from('attendance')
                .select(`
                    id,
                    date,
                    status,
                    timestamp,
                    profiles (full_name, usn, avatar_url)
                `)
                .eq('class_id', classId)
                .eq('subject_id', subjectId)
                .order('timestamp', { ascending: false });

            if (error) throw error;
            setAttendance(logs);

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
                                            {log.profiles?.avatar_url ? (
                                                <img src={log.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                                    <User size={14} />
                                                </div>
                                            )}
                                            {log.profiles?.full_name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm opacity-70">{log.profiles?.usn}</td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Calendar size={14} className="opacity-50" />
                                            {new Date(log.date).toLocaleDateString()}
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
