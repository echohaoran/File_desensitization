#!/bin/bash
# 多步骤脱敏系统 - 服务状态检查脚本

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
echo -e "${BLUE}    多步骤脱敏系统 - 服务状态${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查后端服务
echo -e "${YELLOW}后端服务:${NC}"
if [ -f "$PROJECT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/logs/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "  ${GREEN}✓ 运行中${NC} (PID: $BACKEND_PID)"
        echo -e "  ${BLUE}地址:${NC} http://localhost:8000"
        echo -e "  ${BLUE}日志:${NC} $PROJECT_DIR/logs/backend.log"
        
        # 检查端口是否监听
        if lsof -i :8000 -sTCP:LISTEN >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓ 端口 8000 已监听${NC}"
        else
            echo -e "  ${YELLOW}⚠ 端口 8000 未监听${NC}"
        fi
    else
        echo -e "  ${RED}✗ 未运行${NC} (PID 文件存在但进程不存在)"
        rm -f "$PROJECT_DIR/logs/backend.pid"
    fi
else
    # 检查是否有其他 uvicorn 进程
    UVICORN_PID=$(pgrep -f "uvicorn main:app" 2>/dev/null || true)
    if [ -n "$UVICORN_PID" ]; then
        echo -e "  ${GREEN}✓ 运行中${NC} (PID: $UVICORN_PID, 无 PID 文件)"
        echo -e "  ${BLUE}地址:${NC} http://localhost:8000"
    else
        echo -e "  ${RED}✗ 未运行${NC}"
    fi
fi

echo ""

# 检查前端服务
echo -e "${YELLOW}前端服务:${NC}"
if [ -f "$PROJECT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_DIR/logs/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "  ${GREEN}✓ 运行中${NC} (PID: $FRONTEND_PID)"
        echo -e "  ${BLUE}地址:${NC} http://localhost:5173"
        echo -e "  ${BLUE}日志:${NC} $PROJECT_DIR/logs/frontend.log"
        
        # 检查端口是否监听
        if lsof -i :5173 -sTCP:LISTEN >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓ 端口 5173 已监听${NC}"
        else
            echo -e "  ${YELLOW}⚠ 端口 5173 未监听${NC}"
        fi
    else
        echo -e "  ${RED}✗ 未运行${NC} (PID 文件存在但进程不存在)"
        rm -f "$PROJECT_DIR/logs/frontend.pid"
    fi
else
    # 检查是否有其他 vite 进程
    VITE_PID=$(pgrep -f "vite" 2>/dev/null || true)
    if [ -n "$VITE_PID" ]; then
        echo -e "  ${GREEN}✓ 运行中${NC} (PID: $VITE_PID, 无 PID 文件)"
        echo -e "  ${BLUE}地址:${NC} http://localhost:5173"
    else
        echo -e "  ${RED}✗ 未运行${NC}"
    fi
fi

echo ""

# 检查依赖状态
echo -e "${YELLOW}依赖状态:${NC}"
if [ -d "$PROJECT_DIR/node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} 前端依赖已安装"
else
    echo -e "  ${RED}✗${NC} 前端依赖未安装"
fi

if [ -d "$PROJECT_DIR/backend/venv" ]; then
    echo -e "  ${GREEN}✓${NC} Python 虚拟环境已创建"
else
    echo -e "  ${RED}✗${NC} Python 虚拟环境未创建"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}可用命令:${NC}"
echo -e "  启动所有服务:  ${BLUE}bash scripts/start.sh${NC}"
echo -e "  停止所有服务:  ${BLUE}bash scripts/stop.sh${NC}"
echo -e "  重启所有服务:  ${BLUE}bash scripts/restart.sh${NC}"
echo -e "  仅启动后端:    ${BLUE}bash scripts/start-backend.sh${NC}"
echo -e "  仅启动前端:    ${BLUE}bash scripts/start-frontend.sh${NC}"
echo -e "  安装依赖:      ${BLUE}bash scripts/install.sh${NC}"
echo ""
