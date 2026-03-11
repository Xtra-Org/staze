@echo off
setlocal

cd /D "%~dp0staze"

echo Installing backend dependencies...
pushd backend
call npm install
if errorlevel 1 goto :fail
popd

echo Installing frontend dependencies...
pushd frontend
call npm install
if errorlevel 1 goto :fail
echo Building frontend...
call npm run build
if errorlevel 1 goto :fail
popd

echo.
echo STAZE dependencies are installed and the frontend build passed.
echo Backend:  C:\Users\Administrator\Desktop\THE XIBIT\FirstAid-AI\staze\backend
echo Frontend: C:\Users\Administrator\Desktop\THE XIBIT\FirstAid-AI\staze\frontend
goto :end

:fail
popd > nul 2>&1
echo.
echo Setup failed. Review the npm output above.
exit /b 1

:end
endlocal
