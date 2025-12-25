@echo off
cd /d "%~dp0"
echo Starting DataFlow Backend Server...
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
