@echo off
chcp 65001 >nul
title TU-144 Capsule Display - Kiosk Mode

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo.
echo ============================================================
echo    TU-144 IN POPULAR CULTURE - KIOSK SYSTEM
echo ============================================================
echo.

:: 1. Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found
echo.

:: 2. Check and install dependencies
echo [2/5] Checking dependencies...
if not exist "node_modules\" (
    echo [!] Installing dependencies... (first run may take a few minutes)
    call npm install --silent
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)
echo [OK] Dependencies ready
echo.

:: 3. Build project
echo [3/5] Building project...
if exist "dist\" (
    echo [!] Cleaning old build...
    rmdir /s /q dist 2>nul
)

call npm run build --silent
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Project built
echo.

:: 4. Cleanup old processes
echo [4/5] Cleaning up ports and processes...

:: Kill node processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

:: Kill all node processes
taskkill /F /IM node.exe 2>nul

:: Kill Microsoft Edge
taskkill /F /IM msedge.exe 2>nul

timeout /t 2 /nobreak >nul
echo [OK] Cleanup complete
echo.

:: 5. Start server and Edge in kiosk mode
echo [5/5] Starting server and Edge in FULLSCREEN kiosk mode...
echo.

:: Start server
start /b cmd /c "node server/index.js"

:: Wait for server to start
echo [!] Waiting for server...
set /a attempts=0
:wait_loop
timeout /t 1 /nobreak >nul
set /a attempts+=1

netstat -an | find ":3000" | find "LISTENING" >nul
if %errorlevel% equ 0 goto server_started

if %attempts% lss 30 goto wait_loop

echo [ERROR] Server failed to start within 30 seconds
pause
exit /b 1

:server_started
echo [OK] Server running on http://localhost:3000
echo.

:: Find Microsoft Edge
set "EDGE_PATH="

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if "%EDGE_PATH%"=="" (
    echo [ERROR] Microsoft Edge not found!
    echo Please install Microsoft Edge
    pause
    exit /b 1
)

echo [OK] Microsoft Edge found
echo.

:: Launch Edge in fullscreen kiosk mode
echo [!] Launching Microsoft Edge in FULLSCREEN KIOSK mode...
start "" "%EDGE_PATH%" ^
    --kiosk ^
    --fullscreen ^
    --start-fullscreen ^
    --edge-kiosk-type=fullscreen ^
    --no-first-run ^
    --disable-pinch ^
    --disable-features=msEdgeSidebarV2,msEdgeChromiumReadAloud,msEdgeChromiumTranslate,EdgeShoppingAssistant,EdgeCollections,msEdgePDFViewer ^
    --incognito ^
    --disable-session-crashed-bubble ^
    --disable-default-apps ^
    --disable-extensions ^
    --disable-web-security ^
    --allow-running-insecure-content ^
    --disable-notifications ^
    http://localhost:3000

echo.
echo ============================================================
echo    SYSTEM STARTED SUCCESSFULLY!
echo ============================================================
echo    Mode:       FULLSCREEN KIOSK (Microsoft Edge)
echo    Server:     http://localhost:3000
echo    WebSocket:  ws://localhost:3000
echo    COM Port:   COM5 @ 115200 baud
echo ============================================================
echo.
echo [INFO] Edge is running in FULLSCREEN KIOSK mode
echo [INFO] To exit Edge press: Alt+F4
echo [INFO] To stop the kiosk, close this window
echo.

:: Monitor and auto-restart if needed
:monitor_loop
timeout /t 10 /nobreak >nul

:: Check if server is running
netstat -an | find ":3000" | find "LISTENING" >nul
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Server died, restarting...
    taskkill /F /IM node.exe 2>nul
    timeout /t 2 /nobreak >nul
    start /b cmd /c "node server/index.js"
    timeout /t 5 /nobreak >nul
)

:: Check if Edge is running
tasklist /fi "imagename eq msedge.exe" 2>nul | find /i "msedge.exe" >nul
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Edge closed, restarting...
    start "" "%EDGE_PATH%" --kiosk --fullscreen --start-fullscreen --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --incognito http://localhost:3000
)

goto :monitor_loop