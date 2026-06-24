# 多步骤脱敏系统 - 脚本说明

本目录包含用于管理多步骤脱敏系统的各种脚本。

## 脚本列表

### 1. `start.sh` - 一键启动

同时启动前端和后端服务。

```bash
bash scripts/start.sh
```

**功能**：
- 检查并安装依赖（如果未安装）
- 停止已运行的服务
- 启动后端服务（端口 8000）
- 启动前端服务（端口 5173）
- 显示启动状态和访问地址

### 2. `stop.sh` - 停止服务

停止所有运行中的服务。

```bash
bash scripts/stop.sh
```

**功能**：
- 停止后端服务
- 停止前端服务
- 清理残留进程

### 3. `restart.sh` - 重启服务

重启前端和后端服务。

```bash
bash scripts/restart.sh
```

**功能**：
- 调用 `stop.sh` 停止服务
- 调用 `start.sh` 启动服务

### 4. `start-backend.sh` - 仅启动后端

仅启动 Python 后端服务。

```bash
# 前台运行（用于开发调试）
bash scripts/start-backend.sh

# 后台运行
bash scripts/start-backend.sh --detach
# 或
bash scripts/start-backend.sh -d
```

**功能**：
- 检查并创建 Python 虚拟环境
- 安装 Python 依赖（如果未安装）
- 启动 uvicorn 服务

### 5. `start-frontend.sh` - 仅启动前端

仅启动 Vue 前端服务。

```bash
# 前台运行（用于开发调试）
bash scripts/start-frontend.sh

# 后台运行
bash scripts/start-frontend.sh --detach
# 或
bash scripts/start-frontend.sh -d
```

**功能**：
- 检查并安装 npm 依赖（如果未安装）
- 启动 Vite 开发服务器

### 6. `install.sh` - 安装依赖

安装前端和后端所有依赖。

```bash
bash scripts/install.sh
```

**功能**：
- 安装前端 npm 依赖
- 创建 Python 虚拟环境
- 安装 Python 依赖
- 可选下载 spacy 模型

### 7. `status.sh` - 查看状态

查看服务运行状态。

```bash
bash scripts/status.sh
```

**功能**：
- 检查后端服务状态
- 检查前端服务状态
- 显示 PID、端口、日志信息
- 检查依赖安装状态
- 显示可用命令

## 使用流程

### 首次使用

```bash
# 1. 安装所有依赖
bash scripts/install.sh

# 2. 启动服务
bash scripts/start.sh

# 3. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:8000
# API 文档: http://localhost:8000/docs
```

### 日常开发

```bash
# 启动服务
bash scripts/start.sh

# 查看状态
bash scripts/status.sh

# 重启服务（修改代码后）
bash scripts/restart.sh

# 停止服务
bash scripts/stop.sh
```

### 单独开发前端

```bash
# 启动前端（前台运行，可查看实时日志）
bash scripts/start-frontend.sh

# 或后台运行
bash scripts/start-frontend.sh -d
```

### 单独开发后端

```bash
# 启动后端（前台运行，可查看实时日志）
bash scripts/start-backend.sh

# 或后台运行
bash scripts/start-backend.sh -d
```

## 日志文件

所有服务的日志文件保存在 `logs/` 目录：

- `logs/frontend.log` - 前端服务日志
- `logs/backend.log` - 后端服务日志
- `logs/frontend.pid` - 前端服务 PID 文件
- `logs/backend.pid` - 后端服务 PID 文件

查看实时日志：

```bash
# 查看前端日志
tail -f logs/frontend.log

# 查看后端日志
tail -f logs/backend.log
```

## 故障排除

### 端口被占用

如果端口 8000 或 5173 被占用：

```bash
# 查看端口占用
lsof -i :8000
lsof -i :5173

# 停止占用进程
bash scripts/stop.sh
```

### 依赖安装失败

```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules
npm install

# 重新安装 Python 依赖
cd backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 服务启动失败

```bash
# 查看详细日志
cat logs/backend.log
cat logs/frontend.log

# 检查服务状态
bash scripts/status.sh
```
