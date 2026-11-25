@echo off
echo Starting MediaVault Backend (FastAPI on :8000) and Frontend (Next.js on :3000)...

start "MediaVault Backend" /D "%~dp0backend" cmd /k ".venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload"
start "MediaVault Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo Both servers are starting in separate windows.
echo Open http://localhost:3000 in your browser.
