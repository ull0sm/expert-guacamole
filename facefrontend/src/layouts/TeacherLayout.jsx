
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, LogOut, CheckSquare } from 'lucide-react';
import { supabase } from '../supabaseClient';

const TeacherLayout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/signin');
    };

    const navItems = [
        { path: '/teacher/dashboard', label: 'My Classes', icon: LayoutDashboard },
        { path: '/teacher/attendance', label: 'Attendance History', icon: CheckSquare },
        { path: '/teacher/timetable', label: 'My Timetable', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white flex font-sans selection:bg-teal-500 selection:text-white bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
            {/* Sidebar */}
            <aside className="w-64 backdrop-blur-xl bg-white/5 border-r border-white/10 flex flex-col fixed h-full z-20">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-green-500 bg-clip-text text-transparent">
                        Teacher Portal
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-gradient-to-r from-teal-600/20 to-green-600/20 text-teal-400 border border-teal-500/30'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} className="group-hover:scale-110 transition-transform duration-300" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto animate-slide-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;
