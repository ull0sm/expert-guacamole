
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

// Create Teacher (Standard)
app.post('/api/admin/create-teacher', async (req, res) => {
  const { email, password, fullName } = req.body;

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'teacher', full_name: fullName }
    });

    if (authError) throw authError;

    // Check profile
    const { data: profileCheck } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();

    if (!profileCheck) {
      await supabase.from('profiles').insert([{
        id: authData.user.id,
        email,
        role: 'teacher',
        full_name: fullName
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

    await supabase.from('profiles').update({ full_name: fullName, email: email }).eq('id', id);

    res.json({ message: "Teacher updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating teacher", error: err.message });
  }
});

// Create Student (Simplified)
app.post('/api/admin/create-student', async (req, res) => {
  const { fullName, usn, course, image, classId } = req.body;

  // Auto-generate credentials
  const email = `${usn.toLowerCase()}@faceapp.local`;
  const password = usn;

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'student', full_name: fullName, usn, course, avatar_url: image, class_id: classId }
    });

    if (authError) throw authError;

    const { data: profileCheck } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();

    if (!profileCheck) {
      await supabase.from('profiles').insert([{
        id: authData.user.id,
        email: email,
        role: 'student',
        full_name: fullName,
        usn: usn,
        avatar_url: image,
        class_id: classId
      }]);
    } else {
      await supabase.from('profiles').update({
        role: 'student',
        full_name: fullName,
        usn,
        avatar_url: image,
        class_id: classId
      }).eq('id', authData.user.id);
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
    const updates = {
      user_metadata: { full_name: fullName, usn, course, avatar_url: image, class_id: classId }
    };

    const { error: authError } = await supabase.auth.admin.updateUserById(id, updates);
    if (authError) throw authError;

    await supabase.from('profiles').update({
      full_name: fullName,
      usn,
      avatar_url: image,
      class_id: classId
    }).eq('id', id);

    res.json({ message: "Student updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating student", error: err.message });
  }
});


// Delete User (Enhanced with Storage Cleanup)
app.delete('/api/admin/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get user profile to find their image URL
    const { data: profile } = await supabase.from('profiles').select('avatar_url, usn').eq('id', id).single();

    // 2. Delete from Auth (Cascdes to Profiles due to FK usually, but Auth is separate)
    // Actually Supabase Auth delete cascades to nothing by default unless triggered.
    // But our app logic mainly relies on Auth.

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    // 3. Delete from Storage if image exists
    if (profile && profile.avatar_url) {
      // Extract filename from URL
      // URL: .../storage/v1/object/public/face-images/FILENAME.jpg
      const urlParts = profile.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      if (fileName) {
        console.log(`Deleting image for user ${id}: ${fileName}`);
        const { error: storageError } = await supabase.storage.from('face-images').remove([fileName]);
        if (storageError) console.error("Failed to delete image:", storageError);
      }
    }

    // 4. Manually delete profile if not cascaded (safeguard)
    await supabase.from('profiles').delete().eq('id', id);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Admin API server running on http://localhost:${PORT}`);
});
