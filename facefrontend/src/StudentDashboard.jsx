import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUserGraduate, FaExclamationTriangle, FaCheckCircle, FaHistory, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import confetti from 'canvas-confetti';

const StudentDashboard = () => {
    const { usn } = useParams();
    const [studentData, setStudentData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/students/${usn}/summary`);
                setStudentData(response.data);

                // Check for 100% attendance and trigger confetti
                const hasPerfectAttendance = response.data.summary.some(item => {
                    const { percentage } = calculateStats(item.classesAttended);
                    return percentage === 100;
                });

                if (hasPerfectAttendance) {
                    triggerConfetti();
                }

            } catch (err) {
                setError(err.response?.data?.message || "Student not found or server error");
            } finally {
                setLoading(false);
            }
        };

        if (usn) {
            fetchStudentData();
        }
    }, [usn]);

    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const toggleHistory = (subject) => {
        if (expandedSubject === subject) {
            setExpandedSubject(null);
        } else {
            setExpandedSubject(subject);
        }
    };

    // Helper to calculate percentage (Mocking Total Classes = Attended + 5 for demo)
    const calculateStats = (attended) => {
        const total = attended + 5; // Mock logic
        const percentage = Math.round((attended / total) * 100);
        return { total, percentage };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-xl p-8 rounded-2xl text-center max-w-md animate-slide-up">
                    <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <Link to="/student-portal" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                        Try Again
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center p-4">

            {/* Navbar */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 animate-slide-up">
                <Link to="/student-portal" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium">
                    <FaArrowLeft /> Back to Search
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
            </div>

            {/* Results Section */}
            {studentData && (
                <div className="w-full max-w-4xl space-y-6">

                    {/* Profile Card */}
                    <div className="bg-white/60 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-blue-200/50 hover:border-blue-300/50 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col md:flex-row animate-slide-up delay-100">
                        <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex flex-col items-center justify-center text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="w-32 h-32 rounded-full border-4 border-white/30 shadow-2xl mb-4 overflow-hidden bg-white/10 backdrop-blur-sm">
                                {studentData.image ? (
                                    <img src={studentData.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <FaUserGraduate className="w-full h-full p-6 text-white/50" />
                                )}
                            </div>
                            <h2 className="text-2xl font-bold relative z-10">{studentData.name}</h2>
                            <p className="text-blue-100 font-mono mt-1 relative z-10">{studentData.usn}</p>
                            <span className="mt-3 px-4 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-md border border-white/10 relative z-10">
                                {studentData.course || "Computer Science"}
                            </span>
                        </div>

                        <div className="md:w-2/3 p-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <FaCheckCircle className="text-green-500" /> Attendance Overview
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                {studentData.summary.length > 0 ? (
                                    studentData.summary.map((item, index) => {
                                        const { total, percentage } = calculateStats(item.classesAttended);
                                        const isLow = percentage < 75;
                                        const isPerfect = percentage === 100;

                                        return (
                                            <div
                                                key={index}
                                                className={`bg-white/60 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-blue-200/50 hover:border-blue-300/50 transition-all duration-300 rounded-2xl p-5 border border-slate-100 animate-slide-up delay-${Math.min((index + 2) * 100, 500)} ${isPerfect ? 'border-l-4 border-l-yellow-400' : ''}`}
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${isLow ? 'bg-red-100 text-red-600' : isPerfect ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                                            {item.subject.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-700">{item.subject}</h4>
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                {item.classesAttended} / {total} Classes
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-2xl font-bold ${isLow ? 'text-red-600' : isPerfect ? 'text-yellow-500' : 'text-green-600'}`}>
                                                            {percentage}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full h-3 bg-slate-200/50 rounded-full overflow-hidden mb-3 shadow-inner">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : isPerfect ? 'bg-yellow-400' : 'bg-green-500'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>

                                                {/* Warning & History Toggle */}
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        {isLow && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                                                                <FaExclamationTriangle /> Low Attendance
                                                            </span>
                                                        )}
                                                        {isPerfect && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                                                                🌟 Perfect Record!
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => toggleHistory(item.subject)}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                                                    >
                                                        {expandedSubject === item.subject ? "Hide History" : "View History"}
                                                        {expandedSubject === item.subject ? <FaChevronUp /> : <FaChevronDown />}
                                                    </button>
                                                </div>

                                                {/* Expanded History */}
                                                {expandedSubject === item.subject && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200 animate-fade-in">
                                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detailed Log</h5>
                                                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                            {item.history.map((dateStr, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100 shadow-sm">
                                                                    <FaHistory className="text-slate-300" />
                                                                    <span>{new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                                    <span className="text-slate-300">|</span>
                                                                    <span className="font-mono text-slate-500">{new Date(dateStr).toLocaleTimeString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center text-slate-400 py-10">
                                        No attendance records found yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
