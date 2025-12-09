@echo off

:: ==============================
:: AUTO-ADMIN CHECK
:: ==============================
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: ==============================
:: SET WORKING DIRECTORY
:: ==============================
cd /d "%~dp0"
title Face Attendance Launcher
echo Starting Face Attendance System...
echo.

:: ==============================
:: CLEANUP PREVIOUS PROCESSES
:: ==============================
echo Killing any conflicting Node/Python processes...
taskkill /IM node.exe /F 2>nul
taskkill /IM python.exe /F 2>nul
taskkill /IM pythonw.exe /F 2>nul
:: Wait a moment for files to unlock
timeout /t 2 /nobreak >nul

:: ==============================
:: CLEAR LOCKED CACHE FILES
:: ==============================
echo Removing locked pickle files...
if exist "python-face-api-20251120T131704Z-1-001\python-face-api\faces\*.pkl" (
    del /f /q "python-face-api-20251120T131704Z-1-001\python-face-api\faces\*.pkl"
)

:: ==============================
:: FORCE UNLOCK FACE FOLDER (CRITICAL FIX)
:: ==============================
echo Applying full permissions to face model folder...
icacls "python-face-api-20251120T131704Z-1-001\python-face-api\faces" /grant Everyone:F /T /C /Q

:: ==============================
:: START SERVICES
:: ==============================
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

:: ==============================
:: STOP SERVICES
:: ==============================
echo Stopping services...
taskkill /FI "WINDOWTITLE eq React Frontend*" /T /F
taskkill /FI "WINDOWTITLE eq Admin API*" /T /F
taskkill /FI "WINDOWTITLE eq Face Recognition API*" /T /F

echo Done.
pause
