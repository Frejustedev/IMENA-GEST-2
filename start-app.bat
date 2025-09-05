@echo off
echo ========================================
echo     IMENA-GEST - APPLICATION START
echo ========================================
echo.

:: Kill any existing node processes
echo [1/4] Cleaning existing processes...
taskkill /f /im node.exe >nul 2>&1

:: Set environment variables
echo [2/4] Setting environment...
set CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000
set NODE_ENV=development

:: Start backend
echo [3/4] Starting backend...
start "IMENA Backend" cmd /c "node backend-simple.cjs"

:: Wait for backend
echo     Waiting for backend to start...
timeout /t 3 /nobreak >nul

:: Start frontend
echo [4/4] Starting frontend...
start "IMENA Frontend" cmd /c "npm run dev"

echo.
echo ========================================
echo     APPLICATION STARTED!
echo ========================================
echo.
echo Backend API: http://localhost:3001
echo Frontend: Will start on available port
echo.
echo Login credentials:
echo   Email: admin@imena-gest.com
echo   Password: ImenaGest2024!
echo.
echo Press any key to exit...
pause >nul
