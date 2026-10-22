@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 请输入在 Codex 中使用的项目目录完整路径。
node scripts/install-action.mjs --interactive --lang zh
pause
