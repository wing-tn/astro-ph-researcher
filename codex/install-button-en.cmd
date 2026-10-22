@echo off
cd /d "%~dp0"
echo Enter the full path of the project you open in Codex.
node scripts/install-action.mjs --interactive --lang en
pause
