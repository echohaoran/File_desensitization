#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_URL="${DESENS_REPOSITORY_URL:-https://github.com/echohaoran/File_desensitization.git}"
BRANCH="${DESENS_BRANCH:-main}"
INSTALL_DIR="${DESENS_INSTALL_DIR:-${HOME}/file-desensitization}"

for command_name in curl git npm; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "错误：需要先安装 $command_name。" >&2
    exit 1
  fi
done
if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
  echo "错误：需要先安装 Python 3.10+。" >&2
  exit 1
fi

if [ -e "$INSTALL_DIR/.git" ]; then
  echo "更新源码：$INSTALL_DIR"
  if [ -n "$(git -C "$INSTALL_DIR" status --porcelain)" ]; then
    echo "错误：安装目录存在未提交改动，请先处理后再更新：$INSTALL_DIR" >&2
    exit 1
  fi
  git -C "$INSTALL_DIR" fetch --depth=1 origin "$BRANCH"
  git -C "$INSTALL_DIR" checkout -B "$BRANCH" "origin/$BRANCH"
else
  if [ -e "$INSTALL_DIR" ]; then
    echo "错误：安装目录已存在但不是本项目 Git 仓库：$INSTALL_DIR" >&2
    exit 1
  fi
  echo "下载源码到：$INSTALL_DIR"
  git clone --depth=1 --branch "$BRANCH" "$REPOSITORY_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm install
npm run setup:local

echo
echo "安装完成。启动命令："
echo "  cd \"$INSTALL_DIR\" && npm run start:local"
echo "浏览器地址："
echo "  http://localhost:5173"
