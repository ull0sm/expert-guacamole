import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaUserGraduate } from 'react-icons/fa';

const StudentPortal = () => {
    const [usn, setUsn] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (!usn.trim()) return;
        navigate(`/student-dashboard/${usn}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center p-4">

            {/* Navbar */}
            <div className="w-full max-w-4xl relative flex justify-center items-center mb-8">
                <Link to="/" className="absolute left-0 flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium">
                    <FaArrowLeft /> Back to Home
                </Link>
                <h1 className="text-3xl font-bold text-slate-800">Student Portal</h1>
            </div>

            <div className="w-full max-w-md mt-20">
                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-slate-100">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Enter Student USN</label>
                        <div className="relative">
                            <FaUserGraduate className="absolute left-4 top-4 text-slate-400 text-lg" />
                            <input
                                type="text"
                                placeholder="e.g., 1RV23CS001"
                                value={usn}
                                onChange={(e) => setUsn(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-lg font-medium text-slate-700 placeholder:text-slate-300"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-lg"
                        >
                            <FaSearch /> Check Attendance
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentPortal;
