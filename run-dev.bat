@echo off
echo ===================================
echo    Polyglot - Dev Mode Launcher
echo ===================================
echo.

REM Setup Visual Studio environment (needed for Rust MSVC build)
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1

cd /d "%~dp0"

echo [1/2] Starting Vite dev server...
start "Polyglot - Vite" cmd /k "npm run dev"

echo Waiting for Vite to start...
timeout /t 4 /nobreak > nul

echo [2/2] Starting Tauri app...
echo Press Ctrl+C to stop.
echo.

npm run tauri dev
pause
