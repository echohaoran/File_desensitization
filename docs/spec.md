# 客制化脱敏系统规格

## Vue/Tauri Bridge

Vue 侧通过 `src/api/tauriBridge.js` 调用桌面 command；浏览器环境不伪造 Tauri command，继续使用现有兼容链路。

开发验证入口为 `/desktop-smoke`，只用于调用 Tauri health、capabilities、文本脱敏和还原 command；页面使用虚构样例，不代表完整业务页面已经迁移。

更新时间：2026-08-28

## 产品目标

提供本地优先的敏感信息脱敏、还原、规则管理、标注和本地模型能力。目标架构为 Vue 3 + Rust + Tauri；现有 Vue + FastAPI + Electron 实现作为迁移基线。所有规则和 AI 结果均需人工确认。

## 用户流程

1. 用户进入“脱敏”页，上传支持的文件。
2. 系统生成左右视图：左侧原始文件，右侧脱敏预览。
3. 规则引擎生成候选项；用户在右侧选区进行新增、取消或确认。
4. 用户可框选右侧内容并点击 AI 智能脱敏；AI 只返回候选结果，仍需人工确认。
5. 用户确认后生成脱敏文件、随机文档 ID、映射表和本机历史。
6. DOCX/XLSX/PDF 在底部追加明文标记区或标记页；JSON、TXT、CSV、Markdown 生成 `.desens-meta` 伴随文件。
7. 同机还原优先匹配本地历史；跨设备还原必须上传脱敏文件和映射表，完整脱敏库包还需 `.p12` 和证书密码。
8. 用户在规则库和标注页进行增删改，并可导入导出；标注数据可用于本地 LoRA 训练。

## 支持范围

- 文件：TXT、CSV、JSON、Markdown、PDF、DOCX、XLSX、XLS（XLS 的支持受运行环境依赖限制）。
- 内置识别：IPv4/IPv6、MAC、手机/固定电话、银行卡、身份证、地址、姓名、性别、民族、省份、车牌、军官证、邮箱、护照、港澳通行证、JDBC、日期、VIN、组织机构代码、营业执照号码、统一社会信用代码，以及可选英文 PII。
- 校验：银行卡使用 Luhn；身份证、组织机构代码、营业执照号码、统一社会信用代码和 VIN 使用校验码逻辑。地址、姓名和英文 PII 都必须人工复核。
- 规则管理：迁移后由 Rust 统一管理，第一阶段使用带 schema 版本的 JSON；支持规则实时增删改、版本化、导入导出。
- 历史记录：迁移后由 Rust 管理，保存文档标记、文件指纹、规则版本、映射和处理记录。
- 脱敏库导出：完整导出包含规则、标注、历史和映射表，使用 AES-256-GCM 加密，配套 `.p12` 证书和密码；SHA-256 仅用于完整性校验。
- AI 与训练：模型统一使用 GGUF，不随安装包发布；AI 默认关闭，仅处理右侧用户选区。LoRA 训练每次绑定一个经校验的基础 GGUF 模型。
- 设置页：用户可切换 AI 开关，选择魔搭社区/Hugging Face 下载来源，或登记本地 GGUF 路径；登记必须经过 Rust 校验。
- 标记协议：每次任务生成随机 `document_id` 和随机 `marker`；DOCX/XLSX/PDF 在末尾写入明文标记，JSON/TXT/CSV/Markdown 生成 `.desens-meta` 伴随文件。伴随文件不含敏感原文。
- 加密导出：`.dlib` 包含规则、标注、历史和映射表，使用 AES-256-GCM 加密，并通过 `.p12` + 密码解密；SHA-256 用于校验。
- PDF→DOCX：使用 `pdf2docx` 重建可编辑的文字、表格和图片；复杂 PDF 可能出现轻微位置、分页或表格边距差异，不会降级为图片型 DOCX。
- DOCX→PDF：使用 LibreOffice `soffice`，每次请求使用隔离用户配置避免并发配置锁冲突；运行环境需有中文字体。

## 非目标与约束

- 当前没有登录、账号、多用户隔离、权限管理或云端同步。
- 桌面端目标为 Tauri + Rust；迁移期间保留 Electron 作为历史实现，不得将其作为新架构边界。
- CORS 目前允许所有来源；面向生产环境前必须收敛来源、增加认证、上传大小限制、恶意文件扫描、静态文件访问控制和结果加密。
- 规则与模型只能辅助识别，任何结果在分发前都必须由用户复核。
- Redis 暂不作为单机主存储；通过存储抽象为未来服务端数据库或缓存扩展预留接口。
- 训练模型、训练集和导出包属于敏感资产，必须支持路径校验、完整性校验和安全清理。

## 协议草案

### `.desens-meta`

```json
{
  "schema_version": 1,
  "document_id": "DESENS-DOC-7F3A91C2",
  "source_filename": "客户资料.csv",
  "format": "csv",
  "redaction_version": 1,
  "redacted_sha256": "..."
}
```

### 映射表 JSON

```json
{
  "schema_version": 1,
  "document_id": "DESENS-DOC-7F3A91C2",
  "source_filename": "客户资料.docx",
  "source_sha256": "...",
  "redacted_sha256": "...",
  "mappings": [
    {
      "mapping_id": "map_01HXYZ",
      "marker": "{A81C2E}",
      "type": "phone",
      "original": "13800138000",
      "start": 10,
      "end": 21,
      "source": "rule",
      "review_status": "approved"
    }
  ]
}
```

### `.dlib`

逻辑内容包含 `rules`、`annotations`、`history`、`mappings`、`training_metadata` 和 `integrity`。实际导出内容不得以明文保存；密码错误、证书不匹配或校验失败时必须拒绝导入。

## Tauri 调用契约

Vue 通过 Tauri command 调用 Rust，不直接读写本地文件或访问映射原文。核心 command 分为：

- 文件：`select_input_file`、`read_document_preview`、`save_redacted_file`。
- 脱敏：`create_redaction_task`、`detect_with_ai`、`review_detection`、`finalize_redaction`。
- 还原：`match_restore_source`、`import_mapping_json`、`import_encrypted_library`、`restore_file`。
- 规则与标注：规则 CRUD、标注 CRUD、数据集导入导出。
- 模型与训练：模型下载/校验/选择、训练任务启动/暂停/取消/查询。

所有输入输出 DTO 必须带 `schema_version` 或由 command API 版本保证兼容性。错误统一包含 `code`、用户可读 `message` 和可选 `details`。

## Rust 目录边界

```text
src-tauri/src/
├── commands/       # Tauri command，仅做参数校验和调用 application
├── domain/         # Document、Detection、Mapping、History、Annotation、TrainingJob
├── application/    # 脱敏、还原、导入导出、模型和训练用例
├── document/       # TXT/CSV/JSON/MD/DOCX/XLSX/PDF 适配器
├── storage/        # JsonStorageProvider 与未来存储实现
├── crypto/         # .dlib、AES-GCM、.p12、SHA-256
├── inference/      # GGUF 运行时抽象与模型调用
└── training/       # 数据集转换、LoRA 任务和产物管理
```

`commands` 不得直接实现文档替换、加密或训练逻辑；跨模块协议只能通过 `domain` 类型传递。

## Command DTO 草案

通用请求：

```json
{
  "schema_version": 1,
  "request_id": "req_01HXYZ"
}
```

文件预览请求：

```json
{
  "schema_version": 1,
  "file_path": "用户选择的文件引用",
  "preview_options": {"include_sensitive_value": false}
}
```

人工审核请求：

```json
{
  "schema_version": 1,
  "task_id": "task_01HXYZ",
  "detection_id": "det_01HXYZ",
  "action": "approve",
  "patch": null
}
```

AI 选区请求：

```json
{
  "schema_version": 1,
  "task_id": "task_01HXYZ",
  "model_id": "model_01HXYZ",
  "selection": {"block_id": "block_1", "start": 12, "end": 38}
}
```

训练请求：

```json
{
  "schema_version": 1,
  "base_model_id": "model_01HXYZ",
  "dataset_id": "dataset_01HXYZ",
  "config": {"epochs": 3, "learning_rate": 0.0002, "lora_rank": 8}
}
```

统一响应：

```json
{
  "schema_version": 1,
  "success": true,
  "request_id": "req_01HXYZ",
  "data": {}
}
```

## 错误码

```text
INVALID_REQUEST
FILE_NOT_FOUND
FILE_FORMAT_UNSUPPORTED
FILE_READ_FAILED
FILE_MARKER_MISSING
FILE_MARKER_MISMATCH
MAPPING_INVALID
MAPPING_NOT_FOUND
PARTIAL_RESTORE
CERTIFICATE_INVALID
CERTIFICATE_PASSWORD_INVALID
DECRYPTION_FAILED
INTEGRITY_CHECK_FAILED
MODEL_NOT_FOUND
MODEL_CHECKSUM_MISMATCH
MODEL_INCOMPATIBLE
MODEL_RUNTIME_UNAVAILABLE
TRAINING_RESOURCE_INSUFFICIENT
TASK_NOT_FOUND
TASK_ALREADY_FINISHED
TASK_CANCELLED
INTERNAL_ERROR
```

错误结构：

```json
{
  "success": false,
  "request_id": "req_01HXYZ",
  "error": {
    "code": "MODEL_INCOMPATIBLE",
    "message": "当前模型不满足训练运行时要求",
    "details": {},
    "retryable": false
  }
}
```

## 任务事件

事件名固定为 `task-event`，payload：

```json
{
  "schema_version": 1,
  "task_id": "task_01HXYZ",
  "kind": "progress",
  "stage": "reviewing",
  "progress": 42,
  "message": "正在处理候选结果",
  "error": null,
  "timestamp": "2026-08-28T12:00:00Z"
}
```

`kind` 取值：`started`、`progress`、`log`、`warning`、`completed`、`failed`、`cancelled`。事件消息不得包含敏感原文、映射原文、证书密码、私钥或完整本地路径。

## JSON 存储 Schema

所有数据文件使用统一 envelope：

```json
{
  "schema_version": 1,
  "collection": "rules",
  "revision": 4,
  "updated_at": "2026-08-28T12:00:00Z",
  "items": []
}
```

目录结构：

```text
app_data/
├── settings.json
├── rules.json
├── history.json
├── mappings/
│   └── history_*.json
├── annotations/
│   ├── datasets.json
│   └── dataset_*.json
├── models.json
├── training_jobs.json
├── exports/
└── temp/
```

集合约束：

- `rules.json`：敏感规则及启用状态，不保存历史原文。
- `history.json`：任务摘要、文档标记、文件指纹、规则版本和映射文件引用。
- `mappings/`：单次历史的完整映射，属于敏感数据，不能进入普通日志。
- `annotations/`：用户标注数据集及版本。
- `models.json`：模型路径、来源、格式、SHA-256 和用途，不保存模型内容。
- `training_jobs.json`：训练任务、固定基础模型指纹、数据集版本、参数和产物状态。

## StorageProvider 接口

应用层只依赖以下抽象能力：

```text
get_settings() / save_settings(settings)
list_rules() / create_rule(rule) / update_rule(id, patch) / delete_rule(id)
list_history() / get_history(id) / save_history(record)
read_mapping(history_id) / save_mapping(history_id, mapping)
list_datasets() / read_dataset(id) / save_dataset(dataset)
list_models() / save_model(model) / remove_model(id)
list_training_jobs() / save_training_job(job)
export_collection(name) / import_collection(payload, strategy)
```

`JsonStorageProvider` 必须提供：

1. 应用数据目录初始化。
2. schema 版本检查和向前迁移。
3. 进程内写锁，避免并发覆盖。
4. 临时文件写入后原子替换。
5. 损坏 JSON 的备份、隔离和明确错误。
6. 不返回不必要的敏感原文给 Vue。

导入策略固定为 `merge`、`replace`、`skip_conflicts` 三种，导入前由 UI 展示统计和冲突摘要。

## 文档适配器接口

Rust 通过统一适配器屏蔽格式差异：

```text
trait DocumentAdapter {
    fn can_handle(format: DocumentFormat) -> bool;
    fn inspect(input: &DocumentInput) -> Result<DocumentInfo>;
    fn extract_blocks(input: &DocumentInput) -> Result<Vec<DocumentBlock>>;
    fn render_preview(blocks: &[DocumentBlock], detections: &[Detection]) -> Preview;
    fn write_redacted(input: &DocumentInput, mappings: &[Mapping]) -> Result<DocumentOutput>;
    fn read_marker(input: &DocumentInput) -> Result<DocumentMarkerStatus>;
    fn restore(input: &DocumentInput, mappings: &[Mapping]) -> Result<RestoreOutput>;
}
```

统一能力：

- `inspect`：确认格式、大小、可读性和文件指纹。
- `extract_blocks`：转换为段落、表格、单元格或文本块，并保留稳定 block ID 和原文区间。
- `render_preview`：为 Vue 提供原文/脱敏预览结构，不暴露不必要的敏感原文。
- `write_redacted`：根据人工确认的映射生成最终文件。
- `read_marker`：读取底部标记或 `.desens-meta`。
- `restore`：执行全部或部分还原并返回失败项。

格式策略：

| 格式 | 解析/输出 | 标记 | 约束 |
| --- | --- | --- | --- |
| TXT | UTF-8 文本块 | `.desens-meta` | 保留换行；检测编码异常并警告 |
| CSV | 行/列单元格 | `.desens-meta` | 保留分隔符、引号和列结构 |
| JSON | JSON 节点路径 | `.desens-meta` | 不在业务 JSON 中插入标记字段 |
| Markdown | 文本块 | `.desens-meta` | 保留 Markdown 结构和换行 |
| DOCX | 段落、表格、常见结构 | 正文底部标记区 | 尽量保留样式；复杂对象返回 warning |
| XLSX | 工作表、行、单元格 | `_DESENS_META` 工作表 | 不修改原工作表结构；标记表可被用户查看 |
| PDF | 页面文本块 | 专门末尾标记页 | 输出可能为新 PDF 或可编辑 DOCX，必须报告版式变化 |

`DocumentOutput` 至少包含：

```json
{
  "path": "应用内部文件引用",
  "format": "docx",
  "document_id": "DESENS-DOC-7F3A91C2",
  "sha256": "...",
  "warnings": [],
  "mapping_count": 12
}
```

适配器不得把绝对路径、原始敏感值或证书内容直接返回给 Vue。

## `.dlib` 安全协议

### 证书

- 首次创建完整脱敏库导出时，可由应用生成 RSA 3072 位密钥对和自签名证书，并导出为密码保护的 PKCS#12 `.p12` 文件。
- 用户也可选择现有兼容 `.p12`；导入时必须验证其中包含可用私钥、证书用途和支持的 RSA 密钥长度。
- 证书以 SHA-256 指纹标识。指纹可公开保存，但私钥和证书密码不得进入日志、历史或普通 JSON。

### 加密流程

```text
规范化导出载荷 JSON
  ↓
生成随机 32 字节 AES 数据密钥
  ↓
生成随机 12 字节 GCM nonce
  ↓
AES-256-GCM 加密载荷
  ↓
RSA-OAEP-SHA-256 包装 AES 数据密钥
  ↓
写入版本化 .dlib envelope
```

AES-GCM 的附加认证数据 AAD 包含：`format`、`schema_version`、`package_id`、`created_at`、`certificate_fingerprint` 和算法标识。任何头部变更都应导致认证失败。

### `.dlib` envelope

```json
{
  "format": "DESENS-DLIB",
  "schema_version": 1,
  "package_id": "pkg_01HXYZ",
  "created_at": "2026-08-28T12:00:00Z",
  "algorithms": {
    "content": "AES-256-GCM",
    "key_wrap": "RSA-OAEP-SHA-256",
    "fingerprint": "SHA-256"
  },
  "certificate_fingerprint": "...",
  "wrapped_key": "base64",
  "nonce": "base64",
  "ciphertext": "base64",
  "ciphertext_sha256": "..."
}
```

`ciphertext_sha256` 用于传输损坏的快速诊断；安全真实性由 AES-GCM tag 和 AAD 校验提供。实现可将 GCM tag 与 ciphertext 一同编码，但协议必须固定具体布局。

### 加密载荷

```json
{
  "schema_version": 1,
  "package_type": "desens_library",
  "rules": [],
  "annotations": [],
  "history": [],
  "mappings": [],
  "training_metadata": [],
  "manifest": {
    "rule_count": 0,
    "annotation_count": 0,
    "history_count": 0,
    "mapping_count": 0
  }
}
```

### 解密与导入

1. 读取并校验 `.dlib` envelope、版本、算法和密文 SHA-256。
2. 加载 `.p12`，使用密码解锁私钥。
3. 对比证书 SHA-256 指纹。
4. 使用 RSA 私钥解开 AES 数据密钥。
5. 使用 AES-GCM、nonce 和同一 AAD 解密并认证载荷。
6. 校验载荷 schema、manifest 数量和业务引用。
7. 展示导入预览，用户选择 `merge`、`replace` 或 `skip_conflicts` 后才写入。

任一步失败均不得产生部分写入。解密后的明文只保存在受控内存或受控临时目录，完成后立即清理。

### 证书生命周期

- `.p12` 丢失或密码遗忘时，既有 `.dlib` 无法解密，应用必须明确提示不可恢复。
- 证书轮换采用“旧证书解密、重新使用新证书导出”，不能只替换 `.p12` 文件。
- 应允许用户查看证书指纹、创建时间和用途，但不显示私钥。

## GGUF 模型管理

### 模型目录

```text
app_data/models/
├── catalog.json
├── downloads/
│   └── *.part
├── inference/
│   └── model_id/
│       ├── model.gguf
│       └── manifest.json
├── training/
└── adapters/
```

`catalog.json` 只记录模型元数据和受控文件引用，不保存令牌。模型记录至少包含：

```json
{
  "id": "model_01HXYZ",
  "name": "用户可读名称",
  "source": "huggingface",
  "repository": "owner/repository",
  "revision": "固定 revision",
  "filename": "model.gguf",
  "sha256": "...",
  "size_bytes": 0,
  "architecture": "qwen",
  "quantization": "Q4_K_M",
  "context_length": 4096,
  "purpose": ["inference"],
  "status": "ready"
}
```

### 下载 Provider

```text
trait ModelProvider {
    fn resolve(request) -> Result<ResolvedModel>;
    fn download(resolved, destination, resume) -> TaskId;
    fn fetch_manifest(resolved) -> Result<ModelManifest>;
}
```

第一阶段 Provider：

- `HuggingFaceProvider`
- `ModelScopeProvider`
- `LocalFileProvider`

Provider 必须把仓库、revision 和文件名解析为固定资源，不能在下载完成前把可变分支视为最终模型版本。访问令牌仅存入系统安全凭据存储，不进入 JSON、日志或事件。

### 下载状态机

```text
queued → resolving → downloading → verifying → installing → ready
                                      └→ failed
                     └→ paused/cancelled
```

下载要求：

1. 写入 `.part` 临时文件。
2. 支持 HTTP Range 时允许断点续传。
3. 校验预期大小和 SHA-256；缺少官方 SHA-256 时由首次完整下载计算并要求用户确认信任来源。
4. 校验 GGUF magic、元数据和架构。
5. 成功后原子移动并更新 `catalog.json`。
6. 校验失败时隔离临时文件，不加载、不覆盖已有模型。

### 运行时兼容性

```text
trait InferenceRuntime {
    fn probe(model) -> Result<RuntimeCapabilities>;
    fn load(model, options) -> Result<ModelSession>;
    fn detect(session, selection, schema) -> Result<Vec<DetectionCandidate>>;
    fn unload(session) -> Result<()>;
}
```

兼容性探测至少检查：

- GGUF 版本与 magic。
- 模型架构和 tokenizer 元数据。
- 量化类型。
- 上下文长度。
- CPU/GPU 后端能力。
- 预计内存需求。
- 是否允许推理、训练或仅作为外部产物保存。

模型校验结果分为 `compatible`、`limited`、`incompatible`。`limited` 必须向用户说明限制并由用户确认后使用。

### AI 选区推理

AI 请求只包含用户选中的文本和必要上下文，不默认处理整份文件。模型输出必须解析为：

```json
{
  "detections": [
    {
      "start": 3,
      "end": 11,
      "type": "address",
      "confidence": 0.86
    }
  ]
}
```

Rust 必须校验区间、类型和重叠关系。解析失败或越界结果不得进入审核列表；所有有效结果仍为 `pending`，必须由用户确认。

## 标注数据集

用户标注记录：

```json
{
  "id": "ann_01HXYZ",
  "dataset_id": "dataset_01HXYZ",
  "dataset_revision": 3,
  "source_file_sha256": "...",
  "text": "张三的联系电话是13800138000",
  "spans": [
    {"start": 0, "end": 2, "label": "person"},
    {"start": 9, "end": 20, "label": "phone"}
  ],
  "status": "confirmed",
  "created_at": "2026-08-28T12:00:00Z"
}
```

约束：

- 训练只接受 `confirmed` 标注。
- 字符区间必须基于统一 Unicode 字符索引，并在保存时验证边界和重叠。
- 原始文件可删除，但标注记录必须保留来源 SHA-256 和数据集授权状态。
- 数据集每次修改生成新 revision；已启动训练继续使用其固定 revision。
- 导出训练集前显示样本数、标签分布、重复率和敏感数据警告。

训练数据由适配层转换为后端需要的格式，例如结构化抽取 JSONL 或指令微调 JSONL；原始标注格式保持稳定，不与某个训练框架绑定。

## LoRA 训练接口

```text
trait TrainingBackend {
    fn probe(base_model, dataset, config) -> Result<TrainingPlan>;
    fn prepare(plan) -> TaskId;
    fn start(plan) -> TaskId;
    fn checkpoint(job_id) -> Result<Checkpoint>;
    fn resume(job_id, checkpoint) -> TaskId;
    fn cancel(job_id) -> Result<()>;
    fn evaluate(job_id) -> Result<EvaluationReport>;
    fn export_adapter(job_id) -> Result<ModelArtifact>;
    fn merge_to_gguf(job_id, options) -> Result<ModelArtifact>;
}
```

### 兼容性说明

“支持所有 GGUF”表示允许用户选择任意 GGUF 并执行探测，不表示所有 GGUF 都能直接训练。训练前至少检查：

- 架构是否被训练后端支持。
- 是否具备 tokenizer 和必要模型元数据。
- 量化权重是否可训练或可转换。
- 是否存在可验证的配套基础权重。
- 模型许可证是否允许微调和再分发。

不能训练的 GGUF 可以保留为推理模型，但训练按钮必须禁用并说明原因。

### 训练任务

```json
{
  "id": "train_01HXYZ",
  "base_model_id": "model_01HXYZ",
  "base_model_sha256": "...",
  "dataset_id": "dataset_01HXYZ",
  "dataset_revision": 3,
  "dataset_sha256": "...",
  "random_seed": 42,
  "status": "running",
  "config": {
    "epochs": 3,
    "learning_rate": 0.0002,
    "lora_rank": 8,
    "lora_alpha": 16,
    "batch_size": 1,
    "gradient_accumulation": 8,
    "max_sequence_length": 2048
  },
  "checkpoint_path": null,
  "output_artifact_id": null
}
```

状态机：

```text
created → validating → preparing → queued → running
                                      ├→ checkpointing → paused → resuming → running
                                      ├→ evaluating → completed
                                      ├→ failed
                                      └→ cancelled
```

### 资源预检

启动前返回：

- CPU、GPU/加速后端和可用内存。
- 预计内存/显存需求。
- 预计磁盘空间。
- 训练配置风险。
- 是否支持检查点和恢复。

资源不足时默认禁止启动；允许用户降低序列长度、batch、LoRA rank 或改用更小模型后重新预检。

### 训练产物

训练完成首先生成 LoRA adapter，并记录：

```json
{
  "artifact_id": "artifact_01HXYZ",
  "kind": "lora_adapter",
  "sha256": "...",
  "base_model_sha256": "...",
  "dataset_sha256": "...",
  "training_config_sha256": "...",
  "evaluation_status": "pending",
  "created_at": "..."
}
```

评估通过后，用户可以选择：

- 保留 adapter 并与基础模型组合推理。
- 合并并量化为新的 GGUF。
- 注册为候选推理模型。

训练完成不得自动覆盖当前推理模型。

## 模型评估与晋级

### 数据集隔离

- 训练集、验证集和测试集按 `source_file_sha256` 分组切分，同一来源文件不得跨集合。
- 测试集 revision 在训练任务启动前固定，训练过程不可读取测试标签。
- 用户新增标注后生成新 revision，不回写既有评估结果。

### 指标

评估报告至少包含：

```json
{
  "entity_precision": 0.0,
  "entity_recall": 0.0,
  "entity_f1": 0.0,
  "false_positive_count": 0,
  "false_negative_count": 0,
  "per_label": {},
  "latency_ms_p50": 0,
  "latency_ms_p95": 0,
  "peak_memory_bytes": 0
}
```

实体级指标要求类型和字符区间均匹配；同时保留“区间重叠但边界不完全一致”的诊断统计。PII 场景优先关注 recall，但不能以不可控误报换取召回率。

第一版默认晋级门槛作为可配置策略保存，不硬编码为永久产品规则。建议初始基线：

- 总体 entity recall 不低于基线模型。
- 总体 entity F1 不低于基线模型。
- 高风险标签（身份证、银行卡、联系方式等）不得出现显著回退。
- 推理资源不超过设备能力上限。
- 用户查看评估摘要后明确确认启用。

### 规则与 AI 合并

候选结果统一按原文区间处理：

1. 完全相同区间和类型：合并来源，保留最高置信度。
2. 相同区间、类型不同：标记为冲突，交给用户选择。
3. 区间包含：优先展示更完整的结构化字段，同时保留另一候选证据。
4. 部分重叠：标记为冲突，不自动裁剪或覆盖。
5. 无重叠：分别进入审核列表。

候选结构增加：

```json
{
  "sources": ["rule", "ai"],
  "evidence": [],
  "conflict": false,
  "status": "pending"
}
```

无论候选来自规则、AI 或二者合并，最终状态都必须由用户从 `pending` 改为 `approved` 或 `rejected`。

### 模型状态

```text
downloaded → compatible → training → trained → evaluated
                                              ├→ candidate
                                              └→ rejected
candidate → active（用户明确确认）
```

切换当前模型只更新模型设置，不修改历史任务、既有映射或训练产物。

## Coding 准入条件

进入实现前已具备：

- 目标架构和模块边界。
- 文档标记、映射表和跨设备还原协议。
- `.dlib` 与 `.p12` 加密协议。
- Tauri command、错误和任务事件草案。
- JSON 存储和文档适配器抽象。
- GGUF 下载、推理、标注、LoRA 训练和评估流程。

实现阶段仍需通过技术验证确定具体 Rust crate、Tauri 版本、GGUF 推理后端和训练后端；这些属于实施选型，不阻塞项目骨架开始 coding。

## 第一阶段代码落点

当前新增 `src-tauri/` 最小骨架：

- `src-tauri/src/domain.rs`：schema 版本、统一响应、Detection 和审核状态。
- `src-tauri/src/commands.rs`：结构化 command 错误和 `health` command。
- `src-tauri/src/lib.rs`、`src-tauri/src/main.rs`：Tauri 运行入口。
- `src-tauri/tauri.conf.json`：桌面窗口、前端构建目录和 bundle 配置。

此阶段只验证桌面运行时边界，不包含完整脱敏、文件适配器、加密或模型能力。

当前实现验证受依赖网络限制：Rust crate 和 `@tauri-apps/cli` 尚未在本机缓存，构建验证需要在网络或依赖缓存恢复后完成。

`src-tauri/src/storage.rs` 已实现第一版 `JsonStorageProvider`：支持版本化 envelope、集合白名单、目录初始化、进程内写锁和原子写入。

`document_capabilities` 返回各格式能力状态。当前新 Rust 适配器仅覆盖 TXT、CSV、Markdown；JSON、DOCX、XLSX、PDF 继续使用旧 FastAPI 链路，直到对应适配器完成。

当前状态已推进：`AppState` 在 Tauri setup 中初始化 provider，并注册 `read_collection`/`write_collection` 两个基础 command。业务专用 CRUD 尚未实现。

已新增只读 command：`list_settings`、`list_rules`、`list_history`。它们只返回对应 envelope，不返回绝对路径或映射原文以外的不必要敏感信息。

`write_collection` 支持可选 `expected_revision`；提供时执行乐观并发校验，冲突返回 `STORAGE_REVISION_CONFLICT`，不覆盖最新数据。

当前已增加 `list_models`，读取版本化 `models` 集合；模型记录和任务事件类型已在 Rust 中建立，但下载、推理和训练后端尚未接入。

当前已增加 `register_local_model`：选择本地文件后校验 GGUF magic、文件大小和 SHA-256，成功后写入 models 集合。完整 GGUF metadata、架构探测和运行时兼容性仍待接入。

当前已增加 `create_task` 和 `get_task`，任务快照由进程内 `TaskManager` 管理，支持 file、download、inference、training 类型；实际任务执行、事件广播和持久化仍待接入。

当前已增加 `update_task`，统一更新已创建任务的状态、进度和消息；具体执行器仍需负责事件广播、取消、暂停、恢复和持久化。

当前实现已将 create/update task 接入 `tasks` 集合，并发送 `task-event`；重启恢复、检查点和真实执行器仍待实现。

当前实现已在 Tauri setup 加载 `tasks` 集合并恢复任务快照；终态任务不可被普通更新回退。真实下载/训练进程和检查点恢复仍未实现。

基础文本 command：

- `redact_approved_text`：输入版本、原文和已确认 spans，输出随机 `document_id`、替换后的文本和 mappings。
- `restore_mapped_text`：输入脱敏文本和 mappings，输出还原文本及 `missing_markers`。

Rust 必须以 UTF-8 字节偏移验证 span 边界；无效或重叠 span 返回 `INVALID_REDACTION_SPAN`。该核心不接受“自动检测结果已确认”的隐式状态，调用方必须在审核阶段显式确认后再提交。

`redact_and_persist_text` 在同一应用数据目录中写入 `mappings/history_<id>.json` 和 `history.json` 摘要。mapping 先写入，history 使用 `expected_revision` 追加；任一步失败都返回错误，不报告完成。

当前已提供 `redact_text_file`：支持 TXT、CSV、Markdown，使用文本适配器生成脱敏文件和 `.desens-meta`。输出文件自动使用 `_desensitized` 后缀，不覆盖源文件；`.desens-meta` 包含 source_sha256 和 redacted_sha256，完整 mapping 持久化仍由历史流程负责。

## 验收标准

- 应用可在无登录状态下进入概览、脱敏、还原、敏感字段和格式转换页面。
- 检测、脱敏、下载和还原 API 主流程可用；`GET /api/health` 返回 200。
- 自定义敏感字段对文本、Word、Excel 和 PDF 脱敏请求生效。
- PDF→DOCX 的输出包含可编辑 Word 对象；DOCX→PDF 在中文、图片和表格场景下可正常渲染。
- `output/smoke-fixtures/input/` 含 PDF、Word、Excel 各 3 份虚构样本；`output/test-documents/敏感信息综合测试样本_仅虚构数据.docx` 用于覆盖更广泛的敏感字段。
# 2026-08-28：桥接 API

- `src/api/tauriBridge.js` 对外提供模型与任务接口，统一使用 Rust 已冻结的 command DTO。
- 长任务通过 `task-event` 事件接收进度；Vue 不轮询临时文件。
- 正式脱敏页只将已人工确认的选区发送给 Rust；AI/规则候选不会绕过确认。
- 正式还原页在文本场景将脱敏正文与映射数组一并发送 Rust，不依赖目标设备历史记录。
# 2026-08-28：模型容量展示

- 推荐模型列表展示预计磁盘占用；实际登记模型展示 Rust 校验得到的 `size_bytes`。
