#!/bin/bash
# 多步骤脱敏系统 - 仅启动前端脚本

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
echo -e "${BLUE}    多步骤脱敏系统 - 启动前端${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 创建 logs 目录
mkdir -p "$PROJECT_DIR/logs"

# 检查依赖
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo -e "${YELLOW}检测到前端依赖未安装，正在安装...${NC}"
    cd "$PROJECT_DIR" && npm install
    echo -e "${GREEN}前端依赖安装完成${NC}"
fi

# 停止已运行的前端服务
echo -e "${YELLOW}检查并停止已运行的前端服务...${NC}"
pkill -f "vite" 2>/dev/null || true
rm -f "$PROJECT_DIR/logs/frontend.pid"

echo ""
echo -e "${GREEN}启动前端服务...${NC}"
echo -e "${BLUE}前端地址: http://localhost:5173${NC}"

# 启动前端
cd "$PROJECT_DIR"

# 检查是否使用 --detach 参数
if [ "$1" = "--detach" ] || [ "$1" = "-d" ]; then
    # 后台运行
    nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_DIR/logs/frontend.pid"
    
    sleep 3
    
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ 前端服务启动成功 (PID: $FRONTEND_PID)${NC}"
        echo -e "${YELLOW}日志文件: $PROJECT_DIR/logs/frontend.log${NC}"
    else
        echo -e "${RED}✗ 前端服务启动失败，请查看日志${NC}"
        exit 1
    fi
else
    # 前台运行（用于开发调试）
    echo -e "${YELLOW}以前台模式运行，按 Ctrl+C 停止${NC}"
    echo ""
    npm run dev
fi
