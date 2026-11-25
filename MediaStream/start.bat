@echo off
echo Starting MediaStream Backend (FastAPI on :8001) and Frontend (Next.js on :3001)...

start "MediaStream Backend" /D "%~dp0backend" cmd /k ".venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8001 --reload"
start "MediaStream Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo Both servers are starting in separate windows.
echo Open http://localhost:3001 in your browser.
