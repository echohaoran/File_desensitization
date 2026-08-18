#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/logs/local.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "服务未运行（未找到 PID 文件）"
  exit 0
fi
pid="$(cat "$PID_FILE")"
if kill -0 "$pid" 2>/dev/null; then
  kill "$pid"
  for _ in 1 2 3 4 5; do
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done
  echo "服务已停止：PID $pid"
else
  echo "服务进程已不存在：PID $pid"
fi
rm -f "$PID_FILE"
