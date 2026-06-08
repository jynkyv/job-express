@echo off
setlocal
cd /d "%~dp0"

set "LOG=%~dp0jobexpress-start.log"
echo [%date% %time%] Starting Job Express > "%LOG%"
echo Project: %cd% >> "%LOG%"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
  set "NODE_EXE=node"
)

echo Starting Job Express...
echo Project: %cd%
echo URL: http://127.0.0.1:3000/
echo.
echo Node: %NODE_EXE% >> "%LOG%"
echo Command: "%NODE_EXE%" ".\jobexpress-guardian.cjs" >> "%LOG%"

"%NODE_EXE%" ".\jobexpress-guardian.cjs" >> "%LOG%" 2>&1

echo.
echo Job Express stopped. Press any key to close this window.
echo [%date% %time%] Job Express stopped with exit code %ERRORLEVEL% >> "%LOG%"
pause >nul
