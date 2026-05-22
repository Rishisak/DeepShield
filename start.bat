@echo off
setlocal enabledelayedexpansion
title DeepFake Detector - Starting Servers

echo ============================================
echo   Starting DeepFake Detection App...
echo ============================================
echo.

:: Get the directory where the script is located (no trailing backslash)
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

cd /d "%PROJECT_DIR%"

:: Check for dependencies (optional but helpful)
if not exist "node_modules\" (
    echo [NOTICE] node_modules not found. Installing frontend dependencies...
    call npm install
)

:: Start Flask backend in a new window
echo [1/2] Starting Python backend (app.py) on port 5000...
start "DeepFake Backend" /D "%PROJECT_DIR%" cmd /k "python app.py"

:: Small delay to let backend start first
echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

:: Start Vite frontend in a new window
echo [2/2] Starting Frontend (vite) on port 5173...
start "DeepFake Frontend" /D "%PROJECT_DIR%" cmd /k "npm run dev"

echo.
echo ============================================
echo   Both servers are running!
echo.
echo   Flask backend: http://localhost:5000
echo   Vite frontend: http://localhost:5173
echo.
echo   Close the server windows to stop them.
echo ============================================
echo.
pause

