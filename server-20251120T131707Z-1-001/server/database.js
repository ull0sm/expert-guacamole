const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Admins Table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    // Students Table
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        usn TEXT UNIQUE,
        age INTEGER,
        course TEXT,
        phone TEXT,
        image TEXT
    )`);

    // Attendance Logs Table
    db.run(`CREATE TABLE IF NOT EXISTS attendance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        usn TEXT,
        course TEXT,
        recognizedAt TEXT
    )`);

    // Timetable Table (for future feature)
    db.run(`CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        startTime TEXT,
        endTime TEXT,
        day TEXT
    )`);

    // Migration: Add day column if it doesn't exist (for existing databases)
    db.run("ALTER TABLE timetable ADD COLUMN day TEXT", (err) => {
        // Ignore error if column already exists
    });

    // Seed Default Admin if not exists
    const seedAdmin = "INSERT OR IGNORE INTO admins (username, email, password) VALUES (?, ?, ?)";
    db.run(seedAdmin, ["reddy", "reddy@gmail.com", "reddy"], (err) => {
        if (err) {
            console.error("Error seeding admin:", err.message);
        } else {
            // console.log("Seeded default admin (if not existed).");
        }
    });
});

module.exports = db;
