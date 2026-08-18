#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/logs/local.pid"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "服务运行中：PID $(cat "$PID_FILE")"
  echo "网页：http://localhost:5173"
  echo "API：http://localhost:8000/docs"
  curl -fsS http://127.0.0.1:8000/api/health 2>/dev/null || true
  echo
else
  echo "服务未运行"
fi

[ -d "$PROJECT_DIR/node_modules" ] && echo "npm 依赖：已安装" || echo "npm 依赖：未安装"
if [ -x "$PROJECT_DIR/backend/venv/bin/python" ] || [ -x "$PROJECT_DIR/backend/venv/Scripts/python.exe" ]; then
  echo "Python 环境：已安装"
else
  echo "Python 环境：未安装"
fi
