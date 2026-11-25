#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting MediaVault Backend (FastAPI on :8000)..."
cd "$ROOT_DIR/backend"
if [ -d ".venv" ]; then
  source .venv/bin/activate
fi
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting MediaVault Frontend (Next.js on :3000)..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo "MediaVault is running at http://localhost:3000"
wait
