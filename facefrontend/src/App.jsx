
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import KioskLayout from './layouts/KioskLayout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageStudents from './pages/admin/ManageStudents';
import ManageClasses from './pages/admin/ManageClasses';
import ManageSubjects from './pages/admin/ManageSubjects';
import AdminTimetable from './pages/admin/AdminTimetable';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ClassAttendance from './pages/teacher/ClassAttendance';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import TeacherAttendanceHistory from './pages/teacher/TeacherAttendanceHistory';

// Kiosk Pages
import KioskLanding from './pages/kiosk/KioskLanding';
import AttendanceMode from './pages/kiosk/AttendanceMode';

// Common
import Signin from './signin';

const App = () => {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<Navigate to="/signin" replace />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="teachers" element={<ManageTeachers />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="classes" element={<ManageClasses />} />
          <Route path="subjects" element={<ManageSubjects />} />
          <Route path="timetable" element={<AdminTimetable />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="attendance" element={<TeacherAttendanceHistory />} />
          <Route path="timetable" element={<TeacherTimetable />} />
          <Route path="class/:classId/:subjectId" element={<ClassAttendance />} />
        </Route>

        {/* Kiosk Routes */}
        <Route path="/kiosk" element={<KioskLayout />}>
          <Route index element={<KioskLanding />} />
          <Route path="attendance/:classId" element={<AttendanceMode />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
