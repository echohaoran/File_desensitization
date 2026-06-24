# 多步骤脱敏系统 - Python 后端

## 功能特性

- **多格式支持**：TXT、CSV、JSON、MD、PDF、DOCX、XLSX、XLS
- **智能检测**：
  - Microsoft Presidio：检测英文 PII（姓名、邮箱、电话、SSN、信用卡等）
  - 中国百家姓库：检测中文姓名
  - 正则表达式：检测手机号、身份证、银行卡、车牌号等
- **用户隔离**：每个用户独立存储空间
- **映射表管理**：支持脱敏和还原操作

## 安装步骤

### 1. 创建虚拟环境（推荐）

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 下载 Presidio 模型（首次运行需要）

```bash
python -m spacy download en_core_web_lg
```

## 启动服务

```bash
# 开发模式（自动重载）
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 或直接运行
python main.py
```

服务启动后访问：
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/api/health

## API 接口

### 1. 检测敏感信息

```bash
curl -X POST "http://localhost:8000/api/detect" \
  -F "file=@test.txt"
```

### 2. 执行脱敏

```bash
curl -X POST "http://localhost:8000/api/redact" \
  -F "file=@test.txt" \
  -F "user_id=user123"
```

### 3. 还原文件

```bash
curl -X POST "http://localhost:8000/api/restore" \
  -F "redacted_file=@redacted.txt" \
  -F "mapping_file=@mapping.json" \
  -F "user_id=user123"
```

## 前端集成

前端 Vue 应用会在用户上传文件时自动调用后端 API 进行初步脱敏，然后再进行人工复核。

### 配置前端 API 地址

在前端项目根目录创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 目录结构

```
backend/
├── main.py                    # FastAPI 主应用
├── desensitization_service.py # 脱敏服务核心逻辑
├── requirements.txt           # Python 依赖
├── README.md                  # 本文件
└── uploads/                   # 用户上传文件存储（自动创建）
    └── {user_id}/
        ├── {task_id}_original.{ext}
        └── {task_id}_result.json
```

## 敏感信息类型

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

## 注意事项

1. **首次运行**：需要下载 spacy 模型（约 500MB）
2. **PDF 处理**：仅支持文本型 PDF，不支持扫描件
3. **性能考虑**：大文件处理可能需要较长时间
4. **安全建议**：生产环境应限制 CORS 来源、添加认证机制
