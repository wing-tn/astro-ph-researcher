@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22 or newer, then try again.
  pause
  exit /b 1
)
echo Astro literature workbench: http://127.0.0.1:4317
echo Keep this window open while using the workbench. Press Ctrl+C to stop.
node ui/server.mjs %*
pause
