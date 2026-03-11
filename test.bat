@echo off
setlocal

cd /D "%~dp0staze"
set "STAZE_ROOT=%CD%"

if not exist "%STAZE_ROOT%\backend\node_modules" (
  echo Backend dependencies missing. Running fix.bat first...
  call "%~dp0fix.bat"
  if errorlevel 1 exit /b 1
)

if not exist "%STAZE_ROOT%\frontend\node_modules" (
  echo Frontend dependencies missing. Running fix.bat first...
  call "%~dp0fix.bat"
  if errorlevel 1 exit /b 1
)

echo Starting STAZE backend...
start "STAZE Backend" /D "%STAZE_ROOT%\backend" cmd /k npm run dev

echo Starting STAZE frontend...
start "STAZE Frontend" /D "%STAZE_ROOT%\frontend" cmd /k npx vite --host localhost

echo.
echo STAZE is starting.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:3001

endlocal
