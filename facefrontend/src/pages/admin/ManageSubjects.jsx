
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Edit, Book } from 'lucide-react';
import { toast } from 'react-toastify';

const ManageSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('subjects').select('*').order('name');
            if (error) throw error;
            setSubjects(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load subjects");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setFormData({ name: '', code: '' });
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const openEditModal = (sub) => {
        setFormData({ name: sub.name, code: sub.code });
        setIsEditing(true);
        setEditId(sub.id);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase.from('subjects').update(formData).eq('id', editId);
                if (error) throw error;
                toast.success("Subject updated");
            } else {
                const { error } = await supabase.from('subjects').insert([formData]);
                if (error) throw error;
                toast.success("Subject created");
            }
            setShowModal(false);
            fetchSubjects();
        } catch (error) {
            console.error("Error saving subject", error);
            toast.error("Operation failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this subject?")) return;
        try {
            const { error } = await supabase.from('subjects').delete().eq('id', id);
            if (error) throw error;
            toast.success("Subject deleted");
            fetchSubjects();
        } catch (error) {
            toast.error("Failed to delete subject");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Subjects</h2>
                <button
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25"
                >
                    <Plus size={20} />
                    Add Subject
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((sub) => (
                    <div key={sub.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all group relative">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(sub)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center text-green-400">
                                <Book size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{sub.name}</h3>
                                <p className="text-slate-400 text-sm font-mono">{sub.code}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                        <h3 className="text-xl font-bold text-white mb-4">{isEditing ? 'Edit Subject' : 'Add New Subject'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Subject Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Subject Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
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
                                    {saving ? 'Saving...' : (isEditing ? 'Update Subject' : 'Create Subject')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSubjects;
