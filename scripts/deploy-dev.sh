#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

REMOTE_HOST="${DEV_SERVER_HOST:-192.168.1.223}"
REMOTE_USER="${DEV_SERVER_USER:-root}"
REMOTE_PATH="${DEV_SERVER_PATH:-/opt/File_desensitization}"
SSH_PORT="${DEV_SERVER_PORT:-22}"
REMOTE_TARGET="${REMOTE_USER}@${REMOTE_HOST}"

echo "==> 本地构建前端静态文件"
(cd "${SCRIPT_DIR}/.." && npm run build)

"${SCRIPT_DIR}/sync-dev.sh"

echo "==> 在开发环境服务器上执行 compose 部署"
ssh -p "${SSH_PORT}" "${REMOTE_TARGET}" "cd '${REMOTE_PATH}' && if command -v docker >/dev/null 2>&1; then docker compose up -d --build; else docker-compose up -d --build; fi"

echo "==> 部署完成"
echo "前端: http://${REMOTE_HOST}:8080"
echo "后端: http://${REMOTE_HOST}:8000"
