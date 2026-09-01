@echo off
echo ===================================
echo    Polyglot - Release Build
echo ===================================
echo.

REM Setup Visual Studio environment (needed for Rust MSVC build)
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" > nul 2>&1

echo Building Polyglot for release (Windows)...
echo This may take several minutes on first build.
echo.

cd /d "%~dp0"
npm run tauri build

echo.
echo Build complete! Check src-tauri\target\release\bundle\
pause
