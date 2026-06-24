#!/bin/bash
# 多步骤脱敏系统 - 停止服务脚本
# 停止前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    多步骤脱敏系统 - 停止服务${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 创建 logs 目录（如果不存在）
mkdir -p "$PROJECT_DIR/logs"

# 停止后端服务
echo -e "${YELLOW}正在停止后端服务...${NC}"
if [ -f "$PROJECT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/logs/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✓ 后端服务已停止 (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}后端服务未运行${NC}"
    fi
    rm -f "$PROJECT_DIR/logs/backend.pid"
else
    echo -e "${YELLOW}未找到后端服务 PID 文件${NC}"
fi

# 停止前端服务
echo -e "${YELLOW}正在停止前端服务...${NC}"
if [ -f "$PROJECT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_DIR/logs/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✓ 前端服务已停止 (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}前端服务未运行${NC}"
    fi
    rm -f "$PROJECT_DIR/logs/frontend.pid"
else
    echo -e "${YELLOW}未找到前端服务 PID 文件${NC}"
fi

# 额外清理：杀死可能残留的进程
echo -e "${YELLOW}清理残留进程...${NC}"

# 杀死 uvicorn 进程
pkill -f "uvicorn main:app" 2>/dev/null && echo -e "${GREEN}✓ 清理 uvicorn 进程${NC}" || true

# 杀死 vite 进程
pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✓ 清理 vite 进程${NC}" || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    所有服务已停止${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
