# 多步骤脱敏系统 / Multi-Step Desensitization System

面向企业内部投资人员与私募基金管理员的本地优先型敏感数据脱敏工具原型。提供「脱敏」与「还原」两个核心页面，支持自动识别 + 人工框选复核，并保证每个用户的数据完全隔离。

---

## 快速开始

### 一键启动（推荐）

```bash
# 1. 克隆或进入项目目录
cd /Users/echowang/git/File_desensitization

# 2. 首次使用：安装所有依赖
bash scripts/install.sh

# 3. 启动前后端服务
bash scripts/start.sh

# 4. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:8000
# API 文档: http://localhost:8000/docs
```

### 常用命令

```bash
bash scripts/start.sh      # 启动所有服务
bash scripts/stop.sh       # 停止所有服务
bash scripts/restart.sh    # 重启所有服务
bash scripts/status.sh     # 查看服务状态
```

---

## 项目结构

```
File_desensitization/
├── scripts/                    # 管理脚本
│   ├── start.sh               # 一键启动前后端
│   ├── stop.sh                # 停止所有服务
│   ├── restart.sh             # 重启所有服务
│   ├── start-backend.sh       # 仅启动后端
│   ├── start-frontend.sh      # 仅启动前端
│   ├── install.sh             # 安装所有依赖
│   ├── status.sh              # 查看服务状态
│   └── README.md              # 脚本说明文档
│
├── src/                        # Vue.js 前端源码
│   ├── App.vue                # 根组件
│   ├── main.js                # 入口文件
│   ├── api/
│   │   └── desensitization.js # API 服务
│   ├── assets/
│   │   └── css/styles.css     # 样式文件
│   ├── router/
│   │   └── index.js           # 路由配置
│   └── views/
│       ├── Home.vue           # 首页
│       ├── Login.vue          # 登录页
│       ├── Desensitize.vue    # 脱敏工作流
│       └── Restore.vue        # 还原工作流
│
├── backend/                    # Python 后端
│   ├── main.py                # FastAPI 主应用
│   ├── desensitization_service.py # 脱敏服务核心
│   ├── requirements.txt       # Python 依赖
│   └── README.md              # 后端文档
│
├── assets/                     # 原始静态资源（备份）
├── pages/                      # 原始 HTML 页面（备份）
├── tests/                      # 测试脚本
├── logs/                       # 日志文件（自动生成）
│   ├── frontend.log
│   ├── backend.log
│   └── *.pid
│
├── index.html                  # Vue 入口
├── index-legacy.html           # 原始入口备份
├── package.json                # 前端依赖配置
├── vite.config.js              # Vite 配置
└── README.md                   # 本文档
```

---

## 技术架构

### 前端

- **框架**: Vue.js 3 + Vue Router
- **构建工具**: Vite
- **PDF 处理**: pdfjs-dist
- **样式**: 自定义 CSS 设计系统

### 后端

- **框架**: FastAPI (Python)
- **PII 检测**:
  - Microsoft Presidio：英文 PII 检测
  - 中国百家姓库：中文姓名检测
  - 正则表达式：手机号、身份证、银行卡等
- **文件处理**: PyPDF2、python-docx、openpyxl

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          前端 (Vue.js)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  首页    │  │  登录    │  │  脱敏    │  │  还原    │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       └─────────────┼─────────────┼─────────────┘               │
│                     ▼                                           │
│            API 服务 (desensitization.js)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP / REST API
┌─────────────────────────────────────────────────────────────────┐
│                        后端 (FastAPI)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/detect    检测敏感信息                              │   │
│  │  /api/redact    执行脱敏                                  │   │
│  │  /api/restore   还原文件                                  │   │
│  │  /api/health    健康检查                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  脱敏服务 (desensitization_service.py)                    │   │
│  │  ├── Microsoft Presidio (英文 PII)                       │   │
│  │  ├── 中国百家姓库 (中文姓名)                              │   │
│  │  └── 正则表达式 (手机号/身份证/银行卡等)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据层 (Storage)                          │
│  uploads/{user_id}/                                             │
│  ├── {task_id}_original.{ext}   原始文件                        │
│  └── {task_id}_result.json      脱敏结果                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 功能特性

### 脱敏功能

| 功能 | 说明 |
|------|------|
| 自动检测 | 使用 Microsoft Presidio 和百家姓库自动识别 PII |
| 多格式支持 | TXT、CSV、JSON、MD、PDF、DOCX、XLSX、XLS |
| 人工复核 | 支持手动框选脱敏区域、取消误识别区域 |
| 实时预览 | 文本预览高亮显示敏感信息 |
| 映射表生成 | 自动生成脱敏映射表 JSON |

### 检测的敏感信息类型

| 类型 | 说明 | 检测方式 |
|------|------|----------|
| chinese_name | 中文姓名 | 百家姓库 + jieba 分词 |
| phone | 手机号 | 正则表达式 |
| id_card | 身份证号 | 正则表达式 |
| bank_card | 银行卡号 | 正则表达式 |
| email | 邮箱地址 | Presidio + 正则 |
| landline | 固定电话 | 正则表达式 |
| ip_address | IP 地址 | 正则表达式 |
| license_plate | 车牌号 | 正则表达式 |
| passport | 护照号 | 正则表达式 |
| unified_social_credit_code | 统一社会信用代码 | 正则表达式 |
| name | 英文姓名 | Presidio |
| ssn | 美国社会安全号 | Presidio |
| credit_card | 信用卡号 | Presidio |
| address | 地址 | Presidio |
| date_time | 日期时间 | Presidio |

---

## 详细使用说明

### 脱敏流程

```
1. 上传原始文件
        │
        ▼
2. 后端初步脱敏（Python）
   ├── Microsoft Presidio 检测英文 PII
   ├── 百家姓库检测中文姓名
   └── 正则表达式检测手机号、身份证等
        │
        ▼
3. 前端预览 + 人工复核
   ├── 查看自动检测结果
   ├── 手动框选新增脱敏区域
   ├── 取消误识别的脱敏区域
   └── 实时预览脱敏效果
        │
        ▼
4. 确认脱敏
   ├── 下载脱敏文件
   ├── 下载映射表 JSON
   └── 映射表存入本地存储
```

### 还原流程

```
1. 上传已脱敏文件
2. 上传对应映射表 JSON
3. 系统校验用户归属
4. 执行还原（替换占位符为原始值）
5. 下载还原后的文件
```

---

## 脚本详细说明

### `scripts/start.sh` - 一键启动

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

### `scripts/stop.sh` - 停止服务

停止所有运行中的服务。

```bash
bash scripts/stop.sh
```

### `scripts/restart.sh` - 重启服务

重启前端和后端服务。

```bash
bash scripts/restart.sh
```

### `scripts/start-backend.sh` - 仅启动后端

仅启动 Python 后端服务。

```bash
# 前台运行（用于开发调试）
bash scripts/start-backend.sh

# 后台运行
bash scripts/start-backend.sh --detach
# 或
bash scripts/start-backend.sh -d
```

### `scripts/start-frontend.sh` - 仅启动前端

仅启动 Vue 前端服务。

```bash
# 前台运行（用于开发调试）
bash scripts/start-frontend.sh

# 后台运行
bash scripts/start-frontend.sh --detach
# 或
bash scripts/start-frontend.sh -d
```

### `scripts/install.sh` - 安装依赖

安装前端和后端所有依赖。

```bash
bash scripts/install.sh
```

**功能**：
- 安装前端 npm 依赖
- 创建 Python 虚拟环境
- 安装 Python 依赖
- 可选下载 spacy 模型

### `scripts/status.sh` - 查看状态

查看服务运行状态。

```bash
bash scripts/status.sh
```

**输出示例**：
```
========================================
    多步骤脱敏系统 - 服务状态
========================================

后端服务:
  ✓ 运行中 (PID: 12345)
  地址: http://localhost:8000
  日志: logs/backend.log

前端服务:
  ✓ 运行中 (PID: 12346)
  地址: http://localhost:5173
  日志: logs/frontend.log

依赖状态:
  ✓ 前端依赖已安装
  ✓ Python 虚拟环境已创建
```

---

## 日志文件

所有服务的日志文件保存在 `logs/` 目录：

| 文件 | 说明 |
|------|------|
| `logs/frontend.log` | 前端服务日志 |
| `logs/backend.log` | 后端服务日志 |
| `logs/frontend.pid` | 前端服务 PID 文件 |
| `logs/backend.pid` | 后端服务 PID 文件 |

查看实时日志：

```bash
# 查看前端日志
tail -f logs/frontend.log

# 查看后端日志
tail -f logs/backend.log
```

---

## 开发指南

### 前端开发

```bash
# 启动前端开发服务器
bash scripts/start-frontend.sh

# 或直接使用 npm
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 后端开发

```bash
# 启动后端开发服务器（前台运行）
bash scripts/start-backend.sh

# 或直接使用 uvicorn
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API 文档

启动后端服务后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 用户数据隔离设计

| 层级 | 隔离机制 |
|------|----------|
| 身份 | 登录后下发 `user_id`，所有 API 请求携带该标识 |
| 存储 | 文件按 `uploads/{user_id}/...` 目录树存放 |
| 会话 | 临时任务 ID 与 `user_id` 绑定 |

---

## 故障排除

### 端口被占用

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
rm -rf node_modules package-lock.json
npm install

# 重新安装 Python 依赖
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
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

### PDF 解析失败

确保已安装 spacy 模型：

```bash
cd backend
source venv/bin/activate
python -m spacy download en_core_web_lg
```

---

## 安全与合规提示

- 本原型前端使用浏览器本地处理模拟核心交互；生产环境必须将实际文件与映射表交由后端处理。
- 映射表属于高度敏感数据，数据库需启用加密-at-rest。
- 下载接口需校验用户身份，禁止通过 `file_id` 遍历他人文件。
- 建议对映射表增加短期签名（signed URL / HMAC），防止长期外泄。
- 生产环境应限制 CORS 来源、添加认证机制。

---

## 环境变量

创建 `.env` 文件配置环境变量：

```env
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:8000

# 后端配置
HOST=0.0.0.0
PORT=8000
```

---

## 依赖说明

### 前端依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| vue | ^3.4.0 | Vue.js 框架 |
| vue-router | ^4.3.0 | Vue 路由 |
| pdfjs-dist | ^3.11.174 | PDF 解析库 |
| vite | ^5.4.0 | 构建工具 |

### 后端依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| fastapi | ^0.109.0 | Web 框架 |
| uvicorn | ^0.27.0 | ASGI 服务器 |
| presidio-analyzer | ^2.2.354 | PII 检测（需要 spacy 模型） |
| presidio-anonymizer | ^2.2.354 | PII 匿名化（需要 spacy 模型） |
| jieba | ^0.42.1 | 中文分词 |
| PyPDF2 | ^3.0.1 | PDF 处理 |
| python-docx | ^1.1.0 | Word 文档处理 |
| openpyxl | ^3.1.2 | Excel 处理 |

**注意**：Presidio 功能需要下载 spacy 模型。如果未安装 spacy 模型，系统将仅使用正则表达式和百家姓库进行检测。

安装 spacy 模型（可选）：
```bash
cd backend
source venv/bin/activate
python -m spacy download en_core_web_sm
```

---

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 许可证。

Copyright 2024 EchoWang

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
