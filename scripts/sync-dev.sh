#!/usr/bin/env bash

set -euo pipefail

REMOTE_HOST="${DEV_SERVER_HOST:-192.168.1.223}"
REMOTE_USER="${DEV_SERVER_USER:-root}"
REMOTE_PATH="${DEV_SERVER_PATH:-/opt/File_desensitization}"
SSH_PORT="${DEV_SERVER_PORT:-22}"
REMOTE_TARGET="${REMOTE_USER}@${REMOTE_HOST}"
REMOTE_REPO_URL="${DEV_SERVER_REPO_URL:-$(git config --get remote.origin.url)}"

REMOTE_PARENT="$(dirname "${REMOTE_PATH}")"

echo "==> 同步到 ${REMOTE_TARGET}:${REMOTE_PATH}"
ssh -p "${SSH_PORT}" "${REMOTE_TARGET}" "
  set -e
  mkdir -p '${REMOTE_PARENT}'
  if [ ! -d '${REMOTE_PATH}/.git' ]; then
    if [ -d '${REMOTE_PATH}' ] && [ \"\$(ls -A '${REMOTE_PATH}' 2>/dev/null)\" ]; then
      echo '远端目录已存在且不是 git 仓库，请先清理：${REMOTE_PATH}' >&2
      exit 1
    fi
    rm -rf '${REMOTE_PATH}'
    git clone '${REMOTE_REPO_URL}' '${REMOTE_PATH}'
  fi
"

rsync -az --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "logs" \
  --exclude "backend/uploads" \
  --exclude "backend/venv" \
  --exclude "__pycache__" \
  -e "ssh -p ${SSH_PORT}" \
  ./ "${REMOTE_TARGET}:${REMOTE_PATH}/"

echo "==> 同步完成"
