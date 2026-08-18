#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "错误：当前目录不是 Git 源码安装目录。" >&2
  exit 1
fi
if [ -n "$(git -C "$PROJECT_DIR" status --porcelain)" ]; then
  echo "错误：源码目录存在未提交改动，请先处理后再更新。" >&2
  git -C "$PROJECT_DIR" status --short
  exit 1
fi

git -C "$PROJECT_DIR" pull --ff-only
cd "$PROJECT_DIR"
npm install
npm run setup:local
bash "$SCRIPT_DIR/restart.sh"
