#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/local.pid"
mkdir -p "$LOG_DIR"

if [ -f "$PID_FILE" ]; then
  pid="$(cat "$PID_FILE")"
  if kill -0 "$pid" 2>/dev/null; then
    echo "服务已运行：PID $pid，访问 http://localhost:5173"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if [ ! -d "$PROJECT_DIR/node_modules" ] || { [ ! -x "$PROJECT_DIR/backend/venv/bin/python" ] && [ ! -x "$PROJECT_DIR/backend/venv/Scripts/python.exe" ]; }; then
  cd "$PROJECT_DIR"
  npm install
  npm run setup:local
fi

cd "$PROJECT_DIR"
nohup npm run start:local > "$LOG_DIR/local.log" 2>&1 &
echo $! > "$PID_FILE"
sleep 2
pid="$(cat "$PID_FILE")"
if ! kill -0 "$pid" 2>/dev/null; then
  echo "启动失败，请查看日志：$LOG_DIR/local.log" >&2
  rm -f "$PID_FILE"
  exit 1
fi
echo "服务已启动：PID $pid"
echo "网页：http://localhost:5173"
echo "API：http://localhost:8000/docs"
echo "日志：$LOG_DIR/local.log"
