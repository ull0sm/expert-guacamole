import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Front from './frontpage';
import Dashboard from './dashboard';
import Addstudent from './Addstudent';
import Enrolled from './Enrolled';
import Signin from './signin';
import Timetable from './Timetable';
import StudentPortal from './StudentPortal';
import StudentDashboard from './StudentDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Front />} />
        <Route path="/Signin" element={<Signin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Addstudent" element={<Addstudent />} />
        <Route path="/Enrolled" element={<Enrolled />} />
        <Route path="/student-portal" element={<StudentPortal />} />
        <Route path="/student-dashboard/:usn" element={<StudentDashboard />} />
        <Route path="/timetable-manage" element={<Timetable />} />
      </Routes>
    </Router>
  );
};

export default App;
