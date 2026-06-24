#!/bin/bash
# 多步骤脱敏系统 - 安装依赖脚本
# 安装前端和后端所有依赖

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
echo -e "${BLUE}    多步骤脱敏系统 - 安装依赖${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 创建 logs 目录
mkdir -p "$PROJECT_DIR/logs"

# 安装前端依赖
echo -e "${YELLOW}步骤 1/3: 安装前端依赖${NC}"
cd "$PROJECT_DIR"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
else
    echo -e "${RED}✗ 未找到 package.json${NC}"
    exit 1
fi

echo ""

# 创建 Python 虚拟环境
echo -e "${YELLOW}步骤 2/3: 创建 Python 虚拟环境${NC}"
cd "$PROJECT_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ 虚拟环境创建完成${NC}"
else
    echo -e "${GREEN}✓ 虚拟环境已存在${NC}"
fi

echo ""

# 安装 Python 依赖
echo -e "${YELLOW}步骤 3/3: 安装 Python 依赖${NC}"
source venv/bin/activate
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Python 依赖安装完成${NC}"
else
    echo -e "${RED}✗ 未找到 requirements.txt${NC}"
    exit 1
fi

# 下载 spacy 模型（可选）
echo ""
echo -e "${YELLOW}是否下载 spacy 模型（用于 Presidio PII 检测）？(y/n)${NC}"
echo -e "${YELLOW}注意：模型较大（约 500MB），下载时间较长${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}下载 spacy 模型 (en_core_web_sm)...${NC}"
    source venv/bin/activate
    python -m spacy download en_core_web_sm
    echo -e "${GREEN}✓ spacy 模型下载完成${NC}"
else
    echo -e "${YELLOW}跳过 spacy 模型下载${NC}"
    echo -e "${YELLOW}系统将仅使用正则表达式和百家姓库进行检测${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    所有依赖安装完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}启动服务:${NC} bash scripts/start.sh"
echo -e "${YELLOW}仅启动后端:${NC} bash scripts/start-backend.sh"
echo -e "${YELLOW}仅启动前端:${NC} bash scripts/start-frontend.sh"
echo ""
