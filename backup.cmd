@echo off
rem Arig Akademi - one-click Supabase backup. See scripts\backup.ps1
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\backup.ps1"
echo.
pause
