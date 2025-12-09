
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Calendar, Clock, Book, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminTimetable = () => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [modalDay, setModalDay] = useState('Monday');
    const [formData, setFormData] = useState({ subject_id: '', teacher_id: '', start_time: '', end_time: '' });
    const [saving, setSaving] = useState(false);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable(selectedClass);
        } else {
            setTimetable([]);
        }
    }, [selectedClass]);

    const fetchMetadata = async () => {
        try {
            const { data: cls } = await supabase.from('classes').select('*').order('name');
            setClasses(cls || []);
            const { data: sub } = await supabase.from('subjects').select('*').order('name');
            setSubjects(sub || []);
            const { data: tch } = await supabase.from('profiles').select('*').eq('role', 'teacher');
            setTeachers(tch || []);
        } catch (err) {
            console.error("Error loading metadata", err);
        }
    };

    const fetchTimetable = async (classId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('timetable')
                .select(`
                *,
                subjects (name, code),
                profiles (full_name)
            `)
                .eq('class_id', classId)
                .order('start_time');

            if (error) throw error;
            setTimetable(data);
        } catch (error) {
            console.error("Error loading timetable", error);
            toast.error("Failed to load timetable");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = (day) => {
        setModalDay(day);
        setFormData({ subject_id: '', teacher_id: '', start_time: '', end_time: '' });
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const handleEditSlot = (slot) => {
        setModalDay(slot.day);
        setFormData({
            subject_id: slot.subject_id,
            teacher_id: slot.teacher_id || '',
            start_time: slot.start_time,
            end_time: slot.end_time
        });
        setIsEditing(true);
        setEditId(slot.id);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClass) {
            toast.error("Please select a class first");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                class_id: selectedClass,
                day: modalDay,
                subject_id: formData.subject_id,
                teacher_id: formData.teacher_id || null, // Convert empty string to null
                start_time: formData.start_time,
                end_time: formData.end_time
            };

            if (isEditing) {
                const { error } = await supabase.from('timetable').update(payload).eq('id', editId);
                if (error) throw error;
                toast.success("Slot updated");
            } else {
                const { error } = await supabase.from('timetable').insert([payload]);
                if (error) throw error;
                toast.success("Slot added");
            }

            setShowModal(false);
            fetchTimetable(selectedClass);
        } catch (error) {
            console.error("Error saving slot", error);
            toast.error("Failed to save slot");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this slot?")) return;
        try {
            await supabase.from('timetable').delete().eq('id', id);
            toast.success("Slot deleted");
            fetchTimetable(selectedClass);
        } catch (error) {
            console.error("Error deleting slot", error);
            toast.error("Failed to delete slot");
        }
    };

    // Group timetable by day
    const timetableByDay = days.reduce((acc, day) => {
        acc[day] = timetable.filter(t => t.day === day);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Timetable</h2>
                <div className="w-64">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                    </select>
                </div>
            </div>

            {!selectedClass ? (
                <div className="text-center py-20 text-slate-500 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select a class to manage its timetable</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {days.map(day => (
                        <div key={day} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                                <h3 className="font-bold text-lg text-white">{day}</h3>
                                <button onClick={() => handleAddSlot(day)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors">
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="space-y-3 flex-1">
                                {timetableByDay[day]?.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No classes</p>}
                                {timetableByDay[day]?.map(slot => (
                                    <div key={slot.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-3 hover:border-blue-500/30 transition-colors group relative">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button onClick={() => handleEditSlot(slot)} className="text-blue-400 hover:text-blue-300 p-1">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(slot.id)} className="text-red-400 hover:text-red-300 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-200 mb-1">
                                            <Book size={14} />
                                            {slot.subjects?.name || 'Unknown'} <span className="text-slate-500 text-xs font-normal">({slot.subjects?.code})</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                            <Clock size={12} />
                                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                        </div>
                                        {slot.profiles && (
                                            <div className="text-xs text-slate-500 mt-1 pl-6 border-l-2 border-slate-700">
                                                {slot.profiles.full_name}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                        <h3 className="text-xl font-bold text-white mb-2">{isEditing ? 'Edit Slot' : 'Add Slot'} ({modalDay})</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Subject</label>
                                <select
                                    required
                                    value={formData.subject_id}
                                    onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Teacher (Optional)</label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Slot'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminTimetable;
