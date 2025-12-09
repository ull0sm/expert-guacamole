
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.use(cors());
app.use(express.json());

// --- Admin API ---

// Create Teacher
app.post('/api/admin/create-teacher', async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role: 'teacher', full_name: fullName }
    });
    if (authError) throw authError;

    // Ensure profile exists
    const { data: profileCheck } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
    if (!profileCheck) {
      await supabase.from('profiles').insert([{
        id: authData.user.id, email, role: 'teacher', full_name: fullName
      }]);
    } else {
      await supabase.from('profiles').update({ role: 'teacher', full_name: fullName }).eq('id', authData.user.id);
    }
    res.status(201).json({ message: 'Teacher created successfully', user: authData.user });
  } catch (err) {
    console.error('Error creating teacher:', err);
    res.status(500).json({ message: 'Error creating teacher', error: err.message });
  }
});

// Update Teacher
app.put('/api/admin/update-teacher/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, email, password } = req.body;
  try {
    const updates = { email, user_metadata: { full_name: fullName } };
    if (password) updates.password = password;
    const { error: authError } = await supabase.auth.admin.updateUserById(id, updates);
    if (authError) throw authError;
    await supabase.from('profiles').update({ full_name: fullName, email }).eq('id', id);
    res.json({ message: "Teacher updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating teacher", error: err.message });
  }
});

// Create Student
app.post('/api/admin/create-student', async (req, res) => {
  const { fullName, usn, course, image, classId } = req.body;
  const email = `${usn.toLowerCase()}@faceapp.local`;
  const password = usn;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role: 'student', full_name: fullName, usn, course, avatar_url: image, class_id: classId }
    });
    if (authError) throw authError;

    const { data: profileCheck } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
    if (!profileCheck) {
      await supabase.from('profiles').insert([{
        id: authData.user.id, email, role: 'student', full_name: fullName, usn, avatar_url: image, class_id: classId
      }]);
    } else {
      await supabase.from('profiles').update({ role: 'student', full_name: fullName, usn, avatar_url: image, class_id: classId }).eq('id', authData.user.id);
    }
    res.status(201).json({ message: 'Student created successfully', user: authData.user });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ message: 'Error creating student', error: err.message });
  }
});

// Update Student
app.put('/api/admin/update-student/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, usn, course, image, classId } = req.body;
  try {
    const updates = { user_metadata: { full_name: fullName, usn, course, avatar_url: image, class_id: classId } };
    const { error: authError } = await supabase.auth.admin.updateUserById(id, updates);
    if (authError) throw authError;
    await supabase.from('profiles').update({ full_name: fullName, usn, avatar_url: image, class_id: classId }).eq('id', id);
    res.json({ message: "Student updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating student", error: err.message });
  }
});

// --- General API (Supabase) ---

// Get all students
app.get("/api/students", async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'student');
    if (error) throw error;
    // Map to simple structure if needed by frontend, but usually frontend adapts.
    // server_test.js returned: {id, name, usn, course, image, class_id}
    // Profiles has: {id, full_name, usn, avatar_url...}
    const mapped = data.map(s => ({
      id: s.id,
      name: s.full_name,
      usn: s.usn,
      course: 'Course', // Profiles schema missing course column? Metadata has it.
      image: s.avatar_url,
      classId: s.class_id
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
});

// Get Attendance (Filtered by Teacher optionally)
app.get("/api/attendance", async (req, res) => {
  const { teacherId } = req.query;
  try {
    let query = supabase.from('attendance').select(`
      *,
      profiles:student_id (full_name, usn, avatar_url),
      subjects (name, code)
    `).order('timestamp', { ascending: false });

    // If teacherId provided, filter by subjects assigned to teacher? 
    // Or filter by class_id managed by teacher?
    // Current schema assumption: Timetable links Class+Subject to Teacher.
    // Complex to join. Simpler: Filter by specific subjectIds if passed, or just fetch all for now and let Frontend filter?
    // Better: Fetch teacher's timetable, get distinct subject/class IDs, then filter attendance.
    
    if (teacherId) {
       const { data: timetable } = await supabase.from('timetable').select('subject_id, class_id').eq('teacher_id', teacherId);
       if (timetable && timetable.length > 0) {
           const subjectIds = timetable.map(t => t.subject_id);
           const classIds = timetable.map(t => t.class_id);
           // OR filter
           // query = query.in('subject_id', subjectIds); // This restricts too much if same subject taught by others?
           // Ideally: Only attendance for (class_id, subject_id) pairs in teacher's timetable.
           // Supabase doesn't support tuple IN ( (a,b), (c,d) ).
           // We will implementing a broader filter: class_id IN (...)
           query = query.in('class_id', classIds);
       } else {
           // Teacher has no classes, return empty
           return res.json([]);
       }
    }

    const { data, error } = await query;
    if (error) throw error;

    // Flatten for frontend
    const flattened = data.map(log => ({
      id: log.id,
      name: log.profiles?.full_name || 'Unknown',
      usn: log.profiles?.usn || 'Unknown',
      course: log.subjects?.name || 'Unknown',
      recognizedAt: log.timestamp || log.date, // support both
      status: log.status,
      avatar_url: log.profiles?.avatar_url
    }));

    res.json(flattened);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
});

// Get Timetable
app.get("/api/timetable", async (req, res) => {
  const { teacherId } = req.query;
  try {
    let query = supabase.from('timetable').select(`
      *,
      classes (name, section),
      subjects (name, code)
    `).order('start_time', { ascending: true });

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Map to frontend structure
    const mapped = data.map(t => ({
      id: t.id,
      subject: t.subjects?.name || 'Subject',
      startTime: t.start_time,
      endTime: t.end_time,
      day: t.day,
      className: t.classes?.name,
      section: t.classes?.section
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: "Error fetching timetable", error: err.message });
  }
});

// --- TEACHER ANALYTICS & REPORTS ---

// Dashboard Stats
app.get("/api/teacher/dashboard-stats", async (req, res) => {
    const { teacherId } = req.query;
    if (!teacherId) return res.status(400).json({ error: "Teacher ID required" });

    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        // 1. Get Today's Classes for this Teacher
        const { data: todaysClasses, error: timetableError } = await supabase
            .from('timetable')
            .select(`
                *,
                classes (name, section),
                subjects (name)
            `)
            .eq('teacher_id', teacherId)
            .eq('day', dayName)
            .order('start_time', { ascending: true });

        if (timetableError) throw timetableError;

        // 2. Calculate Stats (Present/Absent) for EACH class today
        const classesWithStats = await Promise.all(todaysClasses.map(async (cls) => {
            // A. Count Students in this Class
            const { count: totalStudents } = await supabase.from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', cls.class_id)
                .eq('role', 'student');
            
            // B. Count Present Logs for this specific Class+Subject+Date
            const { count: presentCount } = await supabase.from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', cls.class_id)
                .eq('subject_id', cls.subject_id)
                .eq('date', today)
                .eq('status', 'present');

            const p = presentCount || 0;
            const t = totalStudents || 0;
            const a = Math.max(0, t - p);

            return {
                ...cls,
                stats: {
                    total: t,
                    present: p,
                    absent: a
                }
            };
        }));

        // 3. Overall "Present Today" (Sum of present in all classes)
        const totalPresent = classesWithStats.reduce((sum, cls) => sum + cls.stats.present, 0);

        // 4. Return Data (At Risk removed as requested)
        res.json({
            todayPresent: totalPresent,
            upcoming: classesWithStats,
            atRisk: [] // Empty to effectively remove it from UI if logic persists
        });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Breakdown of Classes (For Dropdowns & filtering)
app.get("/api/teacher/my-classes", async (req, res) => {
    const { teacherId } = req.query;
    if (!teacherId) return res.status(400).json({ error: "Teacher ID required" });

    try {
        const { data: timetable, error } = await supabase.from('timetable')
            .select(`
                class_id, subject_id,
                classes (name, section), 
                subjects (name)
            `)
            .eq('teacher_id', teacherId);

        if (error) throw error;

        // Unique Map
        const uniqueSet = new Set();
        const result = [];

        timetable.forEach(t => {
            const key = `${t.class_id}-${t.subject_id}`;
            if (!uniqueSet.has(key)) {
                uniqueSet.add(key);
                result.push({
                    classId: t.class_id,
                    className: t.classes?.name,
                    section: t.classes?.section,
                    subjectId: t.subject_id,
                    subjectName: t.subjects?.name
                });
            }
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Error fetching classes", error: err.message });
    }
});

function classIdsVerified(ids) {
    return ids.filter(i => i !== null);
}

// Robust Reporting Endpoint
app.get("/api/reports/custom", async (req, res) => {
    const { teacherId, startDate, endDate, subjectId, classId, type } = req.query;

    if (!teacherId || !subjectId || !classId) {
        return res.status(400).send("Missing required filters: Teacher, Class, and Subject must be selected.");
    }

    try {
        // 1. SECURITY: Verify this class/subject belongs to this teacher
        const { data: verify } = await supabase.from('timetable')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('class_id', classId)
            .eq('subject_id', subjectId)
            .limit(1);
        
        if (!verify || verify.length === 0) {
            return res.status(403).send("Unauthorized: You are not assigned to this Class and Subject.");
        }

        // 2. FETCH DATA
        let query = supabase.from('attendance')
            .select(`
                date, timestamp, status,
                profiles:student_id (full_name, usn),
                subjects (name),
                classes (name, section)
            `)
            .eq('class_id', classId)
            .eq('subject_id', subjectId)
            .order('timestamp', { ascending: false });

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) throw error;

        let csv = "";
        
        if (type === 'summary') {
            // --- SUMMARY REPORT (Student Stats) ---
            
            // A. Calculate Total Sessions (Unique Dates in this range)
            const uniqueDates = new Set(data.map(d => d.date));
            const totalSessions = uniqueDates.size;

            // B. Stats per Student
            // Fetch ALL students in this class (even if 0 attendance)
            const { data: students } = await supabase.from('profiles')
                .select('id, full_name, usn')
                .eq('class_id', classId)
                .eq('role', 'student');

            const headers = ["Student Name", "USN", "Class", "Subject", "Sessions Held", "Attended", "Missed", "Percentage"];
            
            const rows = students.map(student => {
                // Count presence for this student in the fetched logs
                const presentCount = data.filter(d => d.profiles?.usn === student.usn && d.status === 'present').length;
                const missed = totalSessions - presentCount;
                const percentage = totalSessions === 0 ? 0 : Math.round((presentCount / totalSessions) * 100);

                // Safe access to names (from logs or profile?)
                // Use profile data since logs might be empty for absentees (though logs query above only gets existing presence usually)
                // Wait, query above gets ALL logs. If they are absent, is a log created?
                // Logic: Attendance system usually only logs PRESENCE (Face Rec). 
                // So absent students have 0 logs.
                
                // Get Class/Subject Name from first log or lookup (Hack: use first log or placeholders if empty)
                const className = data[0]?.classes?.name || "Class";
                const subjectName = data[0]?.subjects?.name || "Subject"; 

                return `"${student.full_name}","${student.usn}","${className}","${subjectName}","${totalSessions}","${presentCount}","${missed}","${percentage}%"`;
            });

            csv = [headers.join(','), ...rows].join('\n');
            res.setHeader("Content-Disposition", "attachment; filename=Summary_Report.csv");

        } else {
            // --- DETAILED REPORT (Log Dump) ---
            const headers = ["Date", "Day", "Time", "Class", "Subject", "Student Name", "USN", "Status"];
            const rows = data.map(l => {
                const d = new Date(l.timestamp);
                const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                const dayName = days[d.getDay()];
                const time = d.toLocaleTimeString();
                
                return `"${l.date}","${dayName}","${time}","${l.classes?.name}-${l.classes?.section}","${l.subjects?.name}","${l.profiles?.full_name}","${l.profiles?.usn}","${l.status}"`;
            });

            csv = [headers.join(','), ...rows].join('\n');
            res.setHeader("Content-Disposition", "attachment; filename=Detailed_Report.csv");
        }

        res.setHeader("Content-Type", "text/csv");
        res.send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).send("Report Generation Failed");
    }
});

// Manual Attendance (Supabase)
app.post("/api/attendance", async (req, res) => {
    // This needs student_id, not USN. Client must send or we look up.
    // Client currently sends { name, usn, course, recognizedAt }
    // We need to fetch student ID from USN first.
    const { usn, recognizedAt, status } = req.body;
    try {
        const { data: student } = await supabase.from('profiles').select('id, class_id').eq('usn', usn).single();
        if(!student) return res.status(404).json({error: "Student not found"});

        const { error } = await supabase.from('attendance').insert([{
            student_id: student.id,
            class_id: student.class_id,
            date: new Date(recognizedAt).toISOString().split('T')[0],
            timestamp: new Date(recognizedAt).toISOString(),
            status: status || 'present',
            method: 'manual'
        }]);

        if(error) throw error;
        res.json({message: "Marked"});
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Supabase-only API running on http://localhost:${PORT}`);
});
