
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Edit, User, Mail, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'teacher')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTeachers(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load teachers");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setFormData({ fullName: '', email: '', password: '' });
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const openEditModal = (teacher) => {
        setFormData({ fullName: teacher.full_name, email: teacher.email, password: '' }); // Pass empty to keep unchanged
        setIsEditing(true);
        setEditId(teacher.id);
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await axios.put(`http://localhost:5001/api/admin/update-teacher/${editId}`, formData);
                toast.success("Teacher updated");
            } else {
                await axios.post('http://localhost:5001/api/admin/create-teacher', formData);
                toast.success("Teacher created");
            }
            setShowModal(false);
            fetchTeachers();
        } catch (error) {
            console.error("Error saving teacher", error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this teacher?")) return;
        try {
            await axios.delete(`http://localhost:5001/api/admin/users/${id}`);
            toast.success("Teacher deleted");
            fetchTeachers();
        } catch (error) {
            toast.error("Failed to delete teacher");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Teachers</h2>
                <button
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25"
                >
                    <Plus size={20} />
                    Add Teacher
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading teachers...</div>
                ) : teachers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No teachers found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-slate-300">
                            <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {teachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
                                                <User size={16} />
                                            </div>
                                            <span className="font-medium text-white">{teacher.full_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} />
                                                {teacher.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(teacher)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(teacher.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                        <h3 className="text-xl font-bold text-white mb-4">{isEditing ? 'Edit Teacher' : 'Add New Teacher'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Password {isEditing && '(Leave blank to keep current)'}</label>
                                <input
                                    type="password"
                                    name="password"
                                    required={!isEditing}
                                    minLength={6}
                                    value={formData.password}
                                    onChange={handleChange}
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
                                    {saving ? 'Saving...' : (isEditing ? 'Update Teacher' : 'Create Teacher')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTeachers;
