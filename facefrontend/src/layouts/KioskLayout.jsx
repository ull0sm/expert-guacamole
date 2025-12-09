
import React from 'react';
import { Outlet } from 'react-router-dom';

const KioskLayout = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500 selection:text-white bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
            {/* Top Bar (Optional) */}
            <header className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Face Attendance
                </h1>
                <div className="text-sm font-mono text-cyan-400/80 animate-pulse">
                    KIOSK MODE
                </div>
            </header>

            <main className="h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

                <div className="z-10 w-full max-w-7xl animate-scale-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default KioskLayout;
