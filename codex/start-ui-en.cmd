@echo off
cd /d "%~dp0"
node scripts/open-ui.mjs --lang en
if errorlevel 1 pause
