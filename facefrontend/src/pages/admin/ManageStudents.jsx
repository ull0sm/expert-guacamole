
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Edit, User, Upload, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({ fullName: '', usn: '', course: '', classId: '' });
    const [imageFile, setImageFile] = useState(null);
    const [existingImage, setExistingImage] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Classes
            const { data: cls } = await supabase.from('classes').select('*').order('name');
            setClasses(cls || []);

            // Fetch Students with Class info
            // Using the view or just basic join if view not present. 
            // Supabase select() with relations:
            const { data: stus, error } = await supabase
                .from('profiles')
                .select(`
                *,
                classes (name, section)
            `)
                .eq('role', 'student')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStudents(stus);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setFormData({ fullName: '', usn: '', course: '', classId: '' });
        setImageFile(null);
        setExistingImage(null);
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const openEditModal = (student) => {
        setFormData({
            fullName: student.full_name,
            usn: student.usn,
            course: student.course || '',
            classId: student.class_id || ''
        });
        setExistingImage(student.avatar_url);
        setImageFile(null);
        setIsEditing(true);
        setEditId(student.id);
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let imageUrl = existingImage;

            // Upload new Image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${formData.usn}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('face-images')
                    .upload(filePath, imageFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('face-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const payload = { ...formData, image: imageUrl };

            if (isEditing) {
                await axios.put(`http://localhost:5001/api/admin/update-student/${editId}`, payload);
                toast.success("Student updated");
            } else {
                await axios.post('http://localhost:5001/api/admin/create-student', payload);
                toast.success("Student created");
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving student:', error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this student?")) return;

        try {
            await axios.delete(`http://localhost:5001/api/admin/users/${id}`);
            toast.success("Student deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete student");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Students</h2>
                <button
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25"
                >
                    <Plus size={20} />
                    Add Student
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No students found. Add one to get started.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-slate-300">
                            <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">USN</th>
                                    <th className="px-6 py-4">Class</th>
                                    <th className="px-6 py-4">Course</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            {student.avatar_url ? (
                                                <img src={student.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                                                    <User size={16} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-white">{student.full_name}</div>
                                                <div className="text-xs text-slate-500">{student.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm">{student.usn}</td>
                                        <td className="px-6 py-4">
                                            {student.classes ? (
                                                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs font-bold">
                                                    {student.classes.name}-{student.classes.section}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">{student.course}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(student)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(student.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
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
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">{isEditing ? 'Edit Student' : 'Add New Student'}</h3>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">USN</label>
                                    <input
                                        type="text"
                                        name="usn"
                                        required
                                        value={formData.usn}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Class</label>
                                    <select
                                        name="classId"
                                        required
                                        value={formData.classId}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Course (Optional)</label>
                                <input
                                    type="text"
                                    name="course"
                                    value={formData.course}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Face Image</label>
                                <div className="flex items-center gap-4">
                                    {existingImage && !imageFile && (
                                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                                            <img src={existingImage} className="w-full h-full object-cover" alt="Current" />
                                        </div>
                                    )}
                                    <div className="flex-1 relative border-2 border-dashed border-white/10 rounded-xl p-4 hover:border-blue-500/50 transition-colors text-center cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {imageFile ? (
                                            <div className="text-sm text-green-400">{imageFile.name}</div>
                                        ) : (
                                            <div className="text-slate-500 text-sm flex flex-col items-center gap-1">
                                                <Upload size={20} />
                                                <span>{isEditing ? 'Change Image (Optional)' : 'Upload Face Image'}</span>
                                            </div>
                                        )}
                                    </div>
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
                                    {saving ? 'Saving...' : (isEditing ? 'Update Student' : 'Create Student')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStudents;
