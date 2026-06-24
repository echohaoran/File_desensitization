#!/bin/bash
# 多步骤脱敏系统 - 一键启动脚本
# 同时启动前端和后端服务

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
echo -e "${BLUE}    多步骤脱敏系统 - 一键启动${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否已安装依赖
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo -e "${YELLOW}检测到前端依赖未安装，正在安装...${NC}"
    cd "$PROJECT_DIR" && npm install
fi

if [ ! -d "$PROJECT_DIR/backend/venv" ]; then
    echo -e "${YELLOW}检测到 Python 虚拟环境未创建，正在创建...${NC}"
    cd "$PROJECT_DIR/backend" && python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    echo -e "${GREEN}Python 依赖安装完成${NC}"
fi

# 停止已运行的服务
echo -e "${YELLOW}检查并停止已运行的服务...${NC}"
bash "$SCRIPT_DIR/stop.sh" 2>/dev/null || true

echo ""
echo -e "${GREEN}启动后端服务...${NC}"
echo -e "${BLUE}后端地址: http://localhost:8000${NC}"
echo -e "${BLUE}API 文档: http://localhost:8000/docs${NC}"

# 启动后端（后台运行）
cd "$PROJECT_DIR/backend"
source "$PROJECT_DIR/backend/venv/bin/activate"
nohup "$PROJECT_DIR/backend/venv/bin/python" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > "$PROJECT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_DIR/logs/backend.pid"

# 等待后端启动
sleep 2

# 检查后端是否启动成功
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ 后端服务启动成功 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ 后端服务启动失败，请查看日志: $PROJECT_DIR/logs/backend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}启动前端服务...${NC}"
echo -e "${BLUE}前端地址: http://localhost:5173${NC}"

# 启动前端（后台运行）
cd "$PROJECT_DIR"
nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_DIR/logs/frontend.pid"

# 等待前端启动
sleep 3

# 检查前端是否启动成功
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ 前端服务启动成功 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ 前端服务启动失败，请查看日志: $PROJECT_DIR/logs/frontend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    所有服务启动成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}前端地址:${NC} http://localhost:5173"
echo -e "${BLUE}后端地址:${NC} http://localhost:8000"
echo -e "${BLUE}API 文档:${NC} http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}日志文件:${NC}"
echo -e "  前端: $PROJECT_DIR/logs/frontend.log"
echo -e "  后端: $PROJECT_DIR/logs/backend.log"
echo ""
echo -e "${YELLOW}停止服务:${NC} bash scripts/stop.sh"
echo -e "${YELLOW}重启服务:${NC} bash scripts/restart.sh"
echo ""
