# Face Attendance System

A comprehensive Face Attendance System featuring an Admin Dashboard, Face Recognition API, and Student Identification/Attendance Tracking.

## Features
- **Admin Dashboard** (React + Vite): Manage teachers, students, classes, and view attendance records with a premium UI.
- **Face Recognition API** (Python + DeepFace): Handles face enrollment, synchronization, and real-time recognition using VGG-Face models.
- **Backend API** (Node.js + Express): Manages authentication, database operations, and syncs between the dashboard and database.
- **Database** (Supabase): Stores user profiles, classes, timetables, attendance logs, and face images.

## Technology Stack
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express
- **AI/ML**: Python 3.10+, DeepFace, OpenCV
- **Database**: Supabase (PostgreSQL)

---

## Prerequisites

Before running the project, ensure you have the following installed:
1.  **Node.js** (v18 or higher)
2.  **Python** (v3.10 or higher)
3.  **Supabase Account** (for database and storage)

---

## Installation & Setup

### 1. Database Setup (Supabase)

1.  Create a new project in [Supabase](https://supabase.com/).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Open the file `supabase/database_setup.sql` from this repository.
4.  Copy the content and run it in the Supabase SQL Editor. This will:
    *   Create all necessary tables (profiles, classes, attendance, etc.).
    *   Set up Row Level Security (RLS) policies.
    *   Create the `face-images` storage bucket.
5.  Go to **Project Settings > API** and copy:
    *   **Project URL** (`SUPABASE_URL`)
    *   **anon public key** (`SUPABASE_ANON_KEY`)
    *   **service_role secret** (`SUPABASE_SERVICE_ROLE_KEY`)

### 2. Configure Environment Variables

You need to create `.env` files in **three** locations.

#### A. Frontend (`facefrontend/.env`)
Create a file named `.env` in the `facefrontend` directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5001
VITE_PYTHON_API_URL=http://localhost:5006
```

#### B. Admin Backend (`server-20251120T131707Z-1-001/server/.env`)
Create a file named `.env` in the `server.../server` directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5001
```

#### C. Python API (`python-face-api-20251120T131704Z-1-001/python-face-api/.env`)
Create a file named `.env` in the `python-face-api.../python-face-api` directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

**Frontend:**
```bash
cd facefrontend
npm install
```

**Admin Backend:**
```bash
cd server-20251120T131707Z-1-001/server
npm install
```

**Python API:**
```bash
cd python-face-api-20251120T131704Z-1-001/python-face-api
pip install -r requirements.txt
```
*(If `requirements.txt` is missing, install: `pip install flask flask-cors opencv-python numpy deepface supabase python-dotenv tf-keras`)*

---

## Running the Application

To start all services (Frontend, Backend, and AI API) simultaneously:

1.  Double-click **`start_all.bat`** in the root directory.
2.  This will verify your setup and launch three separate terminal windows.
    *   **React Frontend**: Opens on `http://localhost:5173`
    *   **Admin API**: Runs on `http://localhost:5001`
    *   **Face Recognition API**: Runs on `http://localhost:5006`

### Stopping the System
To stop all running services:
1.  Go to the **Face Attendance Launcher** window (the first one that opened).
2.  Press **ANY KEY**.
3.  The script will automatically terminate all associated terminals and processes.

---

## Troubleshooting

-   **Database Errors**: Ensure you ran the `database_setup.sql` script completely.
-   **Face Recognition**: The first run might take time as `DeepFace` downloads model weights.
-   **Port Conflicts**: Ensure ports 5173, 5001, and 5006 are free.

---

## System Architecture & Control Flow

### High-Level Overview

The system operates as a distributed application with three distinct services communicating to provide face-based attendance.

```mermaid
graph TD
    User[User / Student] -->|Access| F[Frontend (React)]
    Admin[Admin / Teacher] -->|Access| F
    
    subgraph "Frontend Layer"
        F -->|Auth & Data| S[Supabase (Auth/DB)]
        F -->|Admin Actions| B[Admin Backend (Node.js)]
        F -->|Face Rec| P[Face Recognition API (Python)]
    end
    
    subgraph "Data Layer"
        S -->|Users/Attendance| DB[(PostgreSQL)]
        S -->|Images| ST[(Storage Bucket)]
    end

    subgraph "Service Layer"
        B -->|Manage Users| S
        P -->|Sync Faces| ST
        P -->|Match Faces| DeepFace[DeepFace Model]
    end
```

### 1. Authentication Flow
*   **Supabase Auth** is the primary identity provider.
*   **Admins (Teachers)** are created via the Admin Backend (`/api/admin/create-teacher`), which wraps Supabase methods to ensure `profiles` table consistency.
*   **Students** are similarly created via the Backend to generate standardized credentials (USN/Password).

### 2. Face Registration Flow
1.  **Capture**: Frontend captures an image via the webcam.
2.  **Upload**: Image is uploaded directly to Supabase Storage (`face-images` bucket) with a filename format `USN-TIMESTAMP.jpg`.
3.  **Sync**: Python API periodically (or on trigger) scans the storage bucket.
4.  **Embedding**: `DeepFace` generates a vector embedding for the face and caches it locally in `faces/.pkl`.

### 3. Attendance Marking Flow
1.  **Recognition**: Frontend sends a webcam frame to Python API (`/recognize`).
2.  **Matching**: Python API compares the frame against the local cache using VGG-Face.
3.  **Verification**: If a match is found (Distance < Threshold), the USN is returned.
4.  **Logging**: Frontend sends the recognized USN + Timestamp to the Admin Backend.
5.  **Record**: Admin Backend inserts a record into the `attendance` table in Supabase.

---

## Developer Guide

### How to Add a New API Endpoint

**Node.js Backend**:
1.  Open `server-2025.../server/server.js`.
2.  Add a new route:
    ```javascript
    app.get('/api/new-endpoint', async (req, res) => {
        // Your logic here
    });
    ```
3.  Restart the server (if not using nodemon).

**Python Face API**:
1.  Open `python-face-api.../python-face-api/recognize_api.py`.
2.  Add a new route:
    ```python
    @app.route("/new-action", methods=["POST"])
    def new_action():
        return jsonify({"status": "done"})
    ```

### Debugging Face Recognition
*   **Logs**: Check the Python terminal window for `Distance` values.
    *   `Distance < 0.4` usually implies a match.
    *   If valid faces are not matching, check lighting or try `Sync` again.
*   **Cache**: If strange errors occur, delete the `.pkl` files in the `faces/` directory and restart the Python API to rebuild the cache.

---

## Project Structure

```
expert-guacamole/
├── facefrontend/               # [React + Vite] User Interface
│   ├── src/
│   │   ├── pages/              # Dashboard, Login, Student Portal
│   │   ├── components/         # Reusable UI elements
│   │   └── supabaseClient.js   # Supabase Connection
│   └── .env                    # Frontend Config
│
├── server-2025.../server/      # [Node.js + Express] Admin Logic
│   ├── server.js               # Main Application Logic
│   └── .env                    # Backend Config (Service Role)
│
├── python-face-api.../         # [Flask + DeepFace] AI Engine
│   ├── recognize_api.py        # API Entry Point
│   ├── faces/                  # Local Face Cache (GitIgnored)
│   └── .env                    # AI Service Config
│
├── supabase/                   # Database Schema
│   └── database_setup.sql      # Run this to init DB
│
└── start_all.bat               # Master startup script
```

---

## API Documentation

### Admin Backend (Port 5001)
*   **Base URL**: `http://localhost:5001`
*   `GET /` - Health Check.
*   `POST /api/admin/create-student` - Register a new student User+Profile.
*   `POST /api/admin/create-teacher` - Register a new teacher User+Profile.
*   `GET /api/teacher/dashboard-stats` - Get aggregate attendance stats.
*   `GET /api/reports/custom` - Generate CSV reports (Summary/Detailed).

### Face Recognition API (Port 5006)
*   **Base URL**: `http://localhost:5006`
*   `POST /recognize` - Input: `{ image: "base64..." }` | Output: `[{ usn, confidence }]`
*   `POST /sync` - Triggers download of new face images from Supabase.
*   `GET /health` - Service status check.
