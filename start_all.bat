@echo off
title Face Attendance Launcher
echo Starting Face Attendance System...
echo.

:: Start services in separate windows with specific titles
start "React Frontend" cmd /k "cd facefrontend && npm run dev"
start "Admin API" cmd /k "cd server-20251120T131707Z-1-001\server && node server.js"
start "Face Recognition API" cmd /k "cd python-face-api-20251120T131704Z-1-001\python-face-api && python recognize_api.py"

echo.
echo ========================================================
echo   Services are running in separate terminal windows.
echo   Press ANY KEY in this window to STOP all services.
echo ========================================================
echo.
pause >nul

echo Stopping services...
taskkill /FI "WINDOWTITLE eq React Frontend*" /T /F
taskkill /FI "WINDOWTITLE eq Admin API*" /T /F
taskkill /FI "WINDOWTITLE eq Face Recognition API*" /T /F

echo Done.
pause
