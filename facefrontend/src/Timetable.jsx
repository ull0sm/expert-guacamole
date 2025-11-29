import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaEdit } from "react-icons/fa";

const Timetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [subject, setSubject] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [day, setDay] = useState("Monday");
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const res = await axios.get("http://localhost:5001/api/timetable");
            setTimetable(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load timetable");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject || !startTime || !endTime || !day) {
            toast.warn("Please fill all fields");
            return;
        }

        try {
            if (isEditing) {
                await axios.put(`http://localhost:5001/api/timetable/${editId}`, {
                    subject,
                    startTime,
                    endTime,
                    day
                });
                toast.success("Period updated successfully");
                setIsEditing(false);
                setEditId(null);
            } else {
                await axios.post("http://localhost:5001/api/timetable", {
                    subject,
                    startTime,
                    endTime,
                    day
                });
                toast.success("Period added successfully");
            }
            setSubject("");
            setStartTime("");
            setEndTime("");
            setDay("Monday");
            fetchTimetable();
        } catch (err) {
            console.error(err);
            toast.error(isEditing ? "Failed to update period" : "Failed to add period");
        }
    };

    const handleEdit = (period) => {
        setSubject(period.subject);
        setStartTime(period.startTime);
        setEndTime(period.endTime);
        setDay(period.day || "Monday");
        setIsEditing(true);
        setEditId(period.id);
    };

    const handleCancelEdit = () => {
        setSubject("");
        setStartTime("");
        setEndTime("");
        setDay("Monday");
        setIsEditing(false);
        setEditId(null);
    };

    const handleDeletePeriod = async (id) => {
        if (!window.confirm("Are you sure you want to delete this period?")) return;

        try {
            await axios.delete(`http://localhost:5001/api/timetable/${id}`);
            toast.success("Period deleted successfully");
            fetchTimetable();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete period");
        }
    };

    // Group periods by day
    const groupedTimetable = daysOfWeek.reduce((acc, d) => {
        acc[d] = timetable.filter(p => p.day === d);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center mb-8">
                    <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
                        <FaArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Manage Weekly Timetable</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add/Edit Period Form */}
                    <div className="bg-white p-6 rounded-lg shadow-md h-fit lg:col-span-1">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">{isEditing ? "Edit Class Period" : "Add New Class Period"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Day</label>
                                <select
                                    value={day}
                                    onChange={(e) => setDay(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                >
                                    {daysOfWeek.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    placeholder="e.g. Java"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className={`w-full text-white py-2 px-4 rounded-md transition duration-200 font-medium ${isEditing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                                >
                                    {isEditing ? "Update Period" : "Add Period"}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="w-full bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-gray-500 transition duration-200 font-medium"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Timetable List */}
                    <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Weekly Schedule</h2>
                        {timetable.length === 0 ? (
                            <p className="text-gray-500 italic">No periods scheduled.</p>
                        ) : (
                            <div className="space-y-6">
                                {daysOfWeek.map(d => (
                                    groupedTimetable[d] && groupedTimetable[d].length > 0 && (
                                        <div key={d} className="border-b pb-4 last:border-0">
                                            <h3 className="font-bold text-lg text-indigo-600 mb-2">{d}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {groupedTimetable[d].map((period) => (
                                                    <div key={period.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
                                                        <div>
                                                            <h4 className="font-bold text-gray-800">{period.subject}</h4>
                                                            <p className="text-sm text-gray-600">
                                                                {period.startTime} - {period.endTime}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEdit(period)}
                                                                className="text-blue-500 hover:text-blue-700 p-2"
                                                                title="Edit Period"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePeriod(period.id)}
                                                                className="text-red-500 hover:text-red-700 p-2"
                                                                title="Delete Period"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Timetable;
