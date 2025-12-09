@echo off
echo Starting Face Attendance System...

start "React Frontend" cmd /k "cd facefrontend && npm run dev"
start "Admin API" cmd /k "cd server-20251120T131707Z-1-001\server && node server.js"
start "Face Recognition API" cmd /k "cd python-face-api-20251120T131704Z-1-001\python-face-api && python recognize_api.py"

echo All services are starting...
