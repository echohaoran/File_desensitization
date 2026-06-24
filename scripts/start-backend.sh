#!/bin/bash
# 多步骤脱敏系统 - 仅启动后端脚本

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
echo -e "${BLUE}    多步骤脱敏系统 - 启动后端${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 创建 logs 目录
mkdir -p "$PROJECT_DIR/logs"

# 检查虚拟环境
if [ ! -d "$PROJECT_DIR/backend/venv" ]; then
    echo -e "${YELLOW}检测到 Python 虚拟环境未创建，正在创建...${NC}"
    cd "$PROJECT_DIR/backend"
    python3 -m venv venv
    source "$PROJECT_DIR/backend/venv/bin/activate"
    pip install -r requirements.txt
    echo -e "${GREEN}Python 依赖安装完成${NC}"
fi

# 停止已运行的后端服务
echo -e "${YELLOW}检查并停止已运行的后端服务...${NC}"
pkill -f "uvicorn main:app" 2>/dev/null || true
rm -f "$PROJECT_DIR/logs/backend.pid"

echo ""
echo -e "${GREEN}启动后端服务...${NC}"
echo -e "${BLUE}后端地址: http://localhost:8000${NC}"
echo -e "${BLUE}API 文档: http://localhost:8000/docs${NC}"

# 启动后端
cd "$PROJECT_DIR/backend"
source "$PROJECT_DIR/backend/venv/bin/activate"

# 检查是否使用 --detach 参数
if [ "$1" = "--detach" ] || [ "$1" = "-d" ]; then
    # 后台运行
    nohup "$PROJECT_DIR/backend/venv/bin/python" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > "$PROJECT_DIR/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_DIR/logs/backend.pid"
    
    sleep 2
    
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ 后端服务启动成功 (PID: $BACKEND_PID)${NC}"
        echo -e "${YELLOW}日志文件: $PROJECT_DIR/logs/backend.log${NC}"
    else
        echo -e "${RED}✗ 后端服务启动失败，请查看日志${NC}"
        exit 1
    fi
else
    # 前台运行（用于开发调试）
    echo -e "${YELLOW}以前台模式运行，按 Ctrl+C 停止${NC}"
    echo ""
    "$PROJECT_DIR/backend/venv/bin/python" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
fi
