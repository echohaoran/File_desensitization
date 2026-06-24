#!/bin/bash
# 多步骤脱敏系统 - 重启服务脚本
# 重启前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    多步骤脱敏系统 - 重启服务${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 停止服务
echo -e "${YELLOW}步骤 1/2: 停止现有服务${NC}"
bash "$SCRIPT_DIR/stop.sh"

echo ""
echo -e "${YELLOW}步骤 2/2: 启动服务${NC}"
bash "$SCRIPT_DIR/start.sh"
