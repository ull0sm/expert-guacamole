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
