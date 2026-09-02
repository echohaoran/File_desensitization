# 会话上下文

## 2026-09-02：检测联动锁定与敏感规则维护

- 发布版本提升至 `0.1.15`，对应标签 `v0.1.15` 用于触发桌面多平台 Release 打包；不得重用已指向旧提交的 `v0.1.14`。
- 默认敏感字段已精简为手机号、固定电话、身份证、银行卡、护照、港澳通行证和统一社会信用代码。旧版非高敏内置项会从本机缓存和后续导入中迁移清除，但自定义规则保留；脱敏页的快速检测基线同步移除邮箱、金额、地址和姓名等非高敏项。
- 压缩敏感字段页标题区及卡片间距，并将规则列表高度限制在可视工作区内；长列表继续在卡片内部滚动，避免窗口底部被截断。

- 脱敏复核中的检测卡片、原始预览和脱敏预览在 hover 时即时联动，不产生锁定；用户点击检测卡片后才锁定关联高亮与画面位置 2 秒，锁定期间其他 hover 不会抢占定位，便于用户移动到删除按钮。
- 敏感字段页新增规则表 JSON 导出与导入。导入使用应用内确认弹窗、严格校验规则结构和 JavaScript 正则格式，并以导入表替换当前本机规则与内置规则删除状态。
- 新增“正则转换”内联窗口：可按识别类型或逐项选择。仅在桌面版已安装并应用本地 GGUF 模型时启动隔离 Candle 推理；模型输出为正则候选，必须由用户逐项勾选后才写回本机规则。
- Vue 通过 `tauriBridge.js` 调用新增版本化 `ai_convert_rules_to_regex` command；Rust 在独立子进程执行推理，并验证返回项目、长度和结构，避免主进程被模型异常终止。
- 已本地生成并启动最新 ARM64 `.app` 用于人工验收；DMG 同时生成。更新器签名因当前环境缺少 `TAURI_SIGNING_PRIVATE_KEY` 未完成，未影响应用包启动。
- 正则转换现独立放置于“已配置字段”卡片上方的右侧操作区；转换、导出、导入均采用清晰的圆角矩形按钮，避免与字段数量和表头混排。
- 正则转换对关键词和姓名提供安全兜底：模型未返回可用候选或转换进程失败时，使用转义后的精确匹配正则作为“本地精确匹配候选”；用户仍须手动勾选保存，算法和 NLP 规则不伪造转换结果。
- 已登记 Qwen2.5 0.5B GGUF 的隔离实测未返回 JSON，而是输出无关训练语料；转换不会保存该输出。地址类关键词现降级为可验证的结构化正则候选，将门牌、楼栋、房间号等数字替换为受限数字模式并兼容空白变化；普通关键词仍保留精确匹配候选并要求人工确认。

## 2026-08-28：Vue/Tauri Bridge

- 新增 `src/api/tauriBridge.js`，统一封装 Tauri 运行时检测、健康检查、格式能力、脱敏和还原 command。
- Tauri 配置开启 `withGlobalTauri`，桌面 WebView 可通过统一 bridge 调用 command。
- 浏览器运行时仍走现有兼容链路，不伪造 Tauri command。

## 2026-08-28：桌面测试页面

- 新增 `/desktop-smoke` 路由和 `DesktopSmoke.vue`，用于测试 Tauri 健康检查、格式能力、已确认文本脱敏和还原。
- 测试页使用虚构文本，明确以 Rust UTF-8 字节偏移提交选区。
- 测试页不替换现有业务页面，浏览器模式下 bridge 会提示当前非 Tauri 环境。

## 2026-08-28：确认下一代架构与数据安全方案

- 用户确认目标架构为 Vue 3 + Rust + Tauri；本轮仅完成设计同步，未修改代码。
- 脱敏页面采用左右视图，右侧只允许选区操作；规则引擎和 AI 结果均需人工确认。
- 输出文件使用随机不可读文档 ID：DOCX/XLSX/PDF 在底部追加明文标记，JSON/TXT/CSV/Markdown 使用 `.desens-meta` 伴随文件。
- 跨设备还原需要脱敏文件和映射数据；完整脱敏库导出包含规则、标注、历史和映射表，使用 AES-256-GCM 加密，并通过 `.p12` + 密码解密。SHA-256 只用于校验。
- 第一阶段使用 JSON 存储，模型统一 GGUF，不随 Tauri 打包；AI 默认关闭，仅处理用户选区。
- 增加用户标注和本地 LoRA 训练设计；每个训练任务固定单个基础 GGUF，训练开始后不可更换。

## 2026-08-28：标记与加密导出协议设计

- 完成随机 `document_id`、随机 `marker`、映射表 JSON 和 `.desens-meta` 伴随文件的协议草案。
- DOCX/XLSX/PDF 采用末尾明文标记；JSON/TXT/CSV/Markdown 不修改正文，使用伴随元数据文件。
- 完成 `.dlib` 逻辑结构设计：包含规则、标注、历史、映射和训练元信息；采用 AES-256-GCM，使用 `.p12` + 密码解密，SHA-256 只做完整性校验。
- 本轮只更新设计文档，未修改源代码、配置或测试资产。

## 2026-08-28：Rust/Tauri 接口边界设计

- 确定 Vue 只负责 UI、左右预览、选区和人工审核；Rust 负责文件、文档、规则、历史、模型、加密和训练调度。
- 确定 Rust 按 `commands`、`domain`、`application`、`document`、`storage`、`crypto`、`inference`、`training` 分层。
- 确定长任务通过统一任务事件报告进度、日志、警告、完成和失败；command 使用版本化 DTO 和结构化错误。
- 本轮仍只更新设计文档，未实现 Tauri 或 Rust 代码。

## 2026-08-28：DTO、错误码与任务事件设计

- 完成 command 请求/响应 DTO 草案，统一使用 `schema_version`、`request_id` 和 `success`。
- 完成错误结构和稳定错误码草案；要求不暴露敏感路径、原文、映射值、证书密码或私钥。
- 完成 `task-event` 事件 payload 草案，覆盖 started、progress、log、warning、completed、failed、cancelled。
- 本轮仍只更新设计文档，未实现 Tauri 或 Rust 代码。

## 2026-08-28：JSON 存储设计

- 确定规则、历史、映射、标注、模型和训练任务分开保存为版本化 JSON envelope。
- 确定通过 `StorageProvider` 抽象隔离存储，第一阶段使用 `JsonStorageProvider`。
- 确定 JSON 写入使用临时文件、刷新和原子替换，并提供进程内写锁、schema 迁移和损坏文件隔离。
- 确定历史映射与证书材料和普通配置分离保存。
- 本轮仍只更新设计文档，未实现 Rust 代码。

## 2026-08-28：文档适配器设计

- 确定所有格式通过统一 `DocumentAdapter` 完成检查、解析、预览、脱敏输出、标记读取和还原。
- 确定 JSON、TXT、CSV、Markdown 使用 `.desens-meta`，不破坏业务正文；DOCX/XLSX/PDF 分别使用底部标记区、`_DESENS_META` 工作表和末尾标记页。
- 确定适配器必须报告结构损失、版式变化和部分还原 warning，不得静默降级。
- 本轮仍只更新设计文档，未实现 Rust 代码。

## 2026-08-28：加密导出与证书协议设计

- 确定每个 `.dlib` 使用独立随机 AES-256-GCM 数据密钥和 96 位随机 nonce。
- 确定使用 `.p12` 中 RSA 公钥和 RSA-OAEP-SHA-256 包装数据密钥；证书密码只用于保护 `.p12` 私钥。
- 确定 `.dlib` envelope、AAD、加密载荷、解密顺序、导入事务和证书轮换规则。
- 确定 SHA-256 只用于证书指纹和密文传输校验，真实性由 AES-GCM 认证保障。
- 本轮仍只更新设计文档，未实现加密代码。

## 2026-08-28：GGUF 模型管理与推理接口设计

- 确定魔搭社区、Hugging Face 和本地文件通过 `ModelProvider` 统一接入。
- 确定下载使用 `.part`、断点续传、大小/SHA-256 校验、GGUF 元数据探测和原子安装。
- 确定模型通过 `InferenceRuntime` 抽象加载；兼容性结果分为 compatible、limited、incompatible。
- 确定 AI 默认只接收用户选区，只返回结构化候选；Rust 校验区间和类型后进入人工审核。
- 本轮仍只更新设计文档，未下载模型或实现推理代码。

## 2026-08-28：标注数据与 LoRA 训练协议设计

- 确定标注以稳定字符区间、标签、来源指纹和 dataset revision 保存，训练只使用 confirmed 标注。
- 确定训练通过 `TrainingBackend` 抽象；任意 GGUF 均可选择探测，但只有兼容模型可进入训练。
- 确定训练任务固定基础模型、数据集、配置和随机种子；暂停/恢复通过检查点实现。
- 确定训练先产出 LoRA adapter，评估通过后才允许合并 GGUF 或注册为候选推理模型。
- 本轮仍只更新设计文档，未实现训练代码。

## 2026-08-28：模型评估设计与 Coding 准入检查

- 确定训练/验证/测试数据按来源文件指纹隔离，避免数据泄漏。
- 确定实体级 precision、recall、F1、各标签指标、误报、漏报、延迟和内存指标。
- 确定规则与 AI 的区间合并和冲突处理，所有候选仍需人工确认。
- 确定模型从 evaluated 到 candidate，再由用户确认成为 active 的晋级流程。
- 核心设计已覆盖架构、协议、存储、适配器、加密、模型、训练和评估，项目具备开始 coding 的条件。
- 本轮仍只更新设计文档，未修改源代码。

## 2026-08-28：Tauri/Rust 骨架开始实现

- 新增 `src-tauri/` 最小 Tauri 2 骨架和 `tauri:dev`、`tauri:build` npm 脚本。
- 新增 Rust domain 基础 DTO、结构化 command 错误和健康检查 command。
- 采用增量迁移，现有 Vue/FastAPI/Electron 实现保持不变。
- 本次开始进入 coding，但尚未迁移文件、脱敏、加密或模型逻辑。

## 2026-08-28：JsonStorageProvider 开始实现

- 新增 `src-tauri/src/storage.rs`，实现版本化 `JsonEnvelope`、`StorageProvider` 接口和 `JsonStorageProvider`。
- 存储初始化创建 mappings、annotations、models、exports 和 temp 目录。
- 集合名称采用白名单校验；写入使用进程内 Mutex、临时文件、`sync_all` 和原子 rename。
- 新增读取/写入版本化 rules 集合的单元测试。
- 本轮未迁移现有浏览器 localStorage 或 FastAPI 存储，旧链路保持不变。

## 2026-08-28：Tauri 存储 State 与基础 Command 接入

- `AppState` 通过 Tauri managed state 持有 `JsonStorageProvider`。
- Tauri setup 根据应用数据目录初始化存储。
- 新增 `read_collection` 和 `write_collection` command，支持版本校验、结构化响应和存储错误转换。
- 当前仅提供通用集合读写，尚未实现规则/历史专用 CRUD。

## 2026-08-28：Rust 基础脱敏/还原闭环

- 新增 `src-tauri/src/redaction.rs`，实现已确认选区的 UTF-8 边界、范围和重叠校验。
- 脱敏生成随机文档 ID、随机 marker 和 mapping；还原支持多 marker 替换并返回缺失 marker 列表。
- 新增 `redact_approved_text` 和 `restore_mapped_text` command。
- 当前仍是文本核心，不负责规则检测、文件格式输出和历史持久化。

## 2026-08-28：脱敏映射与历史持久化

- `JsonStorageProvider` 新增受控 mapping 文件写入能力，mapping 保存到应用数据目录的 `mappings/`。
- 新增 `redact_and_persist_text` command：脱敏后先写 mapping，再以 revision 校验追加 history 摘要。
- 当前返回的 `RedactionResult` 仍是文本结果；文件输出、SHA-256、`.desens-meta` 和专用格式适配器尚未接入。

## 2026-08-28：文本文档适配器

- 新增 `src-tauri/src/document.rs`，提供 `DocumentAdapter`、`DocumentBlock`、`DocumentOutput` 和 `TextAdapter`。
- TextAdapter 支持 TXT、CSV、Markdown 文本读取，按行生成 block，并输出带 `_desensitized` 后缀的文件和 `.desens-meta`。
- 新增 `redact_text_file` command，文件输出路径由 Rust 根据输入文件生成，不覆盖原文件。
- 当前 mapping 尚未随文件输出持久化到历史记录，DOCX/XLSX/PDF 适配器仍待实现。

## 2026-08-28：文件指纹绑定

- `DocumentOutput` 和 `DocumentMarker` 增加源文件与脱敏文件 SHA-256。
- 文本输出的 `.desens-meta` 现在包含 source/redacted 指纹，用于跨设备校验文件关联关系。
- SHA-256 使用 Rust `sha2` crate 计算；Cargo 锁定和编译验证仍等待依赖网络恢复。

## 2026-08-28：模型与任务基础类型

- 新增 `src-tauri/src/model.rs`，定义 GGUF 模型来源、状态和模型记录。
- 新增 `src-tauri/src/task.rs`，定义文件、下载、推理和训练任务状态及统一事件结构。
- 新增 `list_models` command，复用版本化 models 集合读取。
- 本轮未实现具体下载、推理或训练后端。

## 2026-08-28：本地 GGUF 注册与校验

- `model.rs` 新增 GGUF 文件检查：读取文件、校验 `GGUF` magic、计算 SHA-256 和记录文件大小。
- 新增 `register_local_model` command，将通过校验的本地模型记录写入 `models` 集合。
- 当前未解析完整 GGUF metadata，也未加载模型或执行推理。

## 2026-08-28：文档格式能力注册

- `document.rs` 新增 `DocumentFormat`、`AdapterCapability` 和 capability 查询。
- 新增 `document_capabilities` command，明确 TXT/CSV/Markdown 已接入，JSON/DOCX/XLSX/PDF 当前状态和旧链路说明。
- 未实现的二进制适配器不会被伪装成可用，后续按能力状态逐个迁移。

## 2026-08-28：任务状态管理器

- `task.rs` 新增 `TaskManager`、`TaskSnapshot` 和统一任务状态存储。
- 新增 `create_task`、`get_task` command，支持文件、下载、推理、训练四类任务的基础生命周期。
- 当前任务状态为进程内存储，尚未持久化事件流或接入具体执行器。

## 2026-08-28：任务状态更新接口

- `TaskManager` 新增受控状态更新能力。
- 新增 `update_task` command，可更新任务状态、进度和非敏感消息。
- 当前未知任务返回空结果，任务状态仍为进程内存储，事件广播和持久化尚未接入。

## 2026-08-28：任务事件与持久化接入

- `create_task` 和 `update_task` 现在将任务快照写入 `tasks` 集合。
- 两个 command 通过 `task-event` 发送 started/progress 事件，事件只包含任务元数据和非敏感消息。
- 当前重启恢复、暂停检查点和真实长任务执行器仍未实现。

## 2026-08-28：任务启动恢复与终态约束

- `TaskManager` 新增快照恢复能力，Tauri setup 启动时从 `tasks.json` 加载任务。
- 终态任务不允许通过普通更新改回 queued、running 或 paused。
- 当前恢复的是任务元数据和状态，不会恢复真实下载/训练进程；检查点恢复仍待执行器接入。

## 2026-08-28：规则/历史/设置读取 Command

- 新增 `list_rules`、`list_history` 和 `list_settings` command，复用统一版本化集合响应。
- 当前 command 先提供安全读取能力；新增、编辑、删除和事务导入仍待实现。

## 2026-08-28：集合受控写入

- `write_collection` 支持可选 `expected_revision`；提供值时执行乐观并发校验，未提供时保持基础写入行为。
- 新增 `STORAGE_REVISION_CONFLICT` 错误映射，提示调用方刷新后重试。
- 当前仍未提供按 item ID 的专用 CRUD，避免在通用 Value 层提前固化规则、历史和设置的业务字段。

## 2026-08-28：骨架验证状态

- 已执行 Rust 格式化和 `git diff --check`，通过。
- `cargo check` 因当前环境无法连接 crates.io 代理失败；npm 锁文件更新因无法访问配置的 npm 镜像且本地缓存缺少 `@tauri-apps/cli` 失败。
- 未手工修改 `package-lock.json` 或伪造 Cargo 锁文件；待网络/依赖缓存恢复后补做依赖安装、锁定和构建验证。

## 2026-08-18：增加 npm 本机浏览器运行方式

- 新增 `npm run setup:local`，在项目内创建 `backend/venv/` 并安装 Python 后端依赖。
- 新增 `npm run start:local`，跨平台同时启动 FastAPI 和 Vite，用户通过 `http://localhost:5173` 使用。
- 保留 Electron + PyInstaller 桌面包配置，但未签名、公证的 macOS DMG 不再作为普通用户的推荐安装方式。
- 修复 `Desensitize.vue` 框选逻辑中的 `const` 重赋值错误，确保 Vite 本地开发服务器可以编译。
- 将 `pdf2docx` 固定版本调整为公开 PyPI 可安装的 `0.5.8`，修复新环境安装失败。

## 2026-08-18：切换源码安装交付方式

- 新增 `scripts/install-from-source.sh`，支持通过 curl 下载源码、安装依赖并输出 localhost 启动命令。
- 删除 `.github/workflows/desktop-release.yml`，停止 GitHub Actions 的 DMG/MSI 自动打包。
- Electron 桌面配置和历史发布文档保留为历史资料，不再作为普通用户安装入口。

## 2026-08-18：增加源码部署生命周期脚本

- `scripts/start.sh`、`scripts/restart.sh`、`scripts/stop.sh` 统一管理 `npm run start:local` 进程。
- `scripts/update.sh` 在源码无未提交改动时执行 fast-forward 更新、重新安装依赖并重启服务。
- 服务 PID 记录在 `logs/local.pid`，合并日志写入 `logs/local.log`。

## 2026-08-17：扩展敏感信息 DOCX 测试样本

- 新建 `output/test-documents/敏感信息全面回归测试样本_仅虚构数据.docx`。
- 样本覆盖网络地址、MAC、手机与固定电话、邮箱、JDBC、姓名、地址、身份证、银行卡、护照、港澳通行证、军官证、日期、车牌、VIN、组织机构代码、营业执照号码、统一社会信用代码和自定义关键词。
- 同一字段同时放入表格与混合正文，并包含重复值、标点边界和人工取消脱敏的普通文本，用于检测、脱敏、历史还原与规则管理回归。
- 使用开发服务器的 LibreOffice 与中文字体完成 3 页渲染校验，页面无缺字、裁切或表格溢出。

## 2026-08-17：Word 结构化预览与脱敏标记

- 将 DOCX 预览从纯文本输出改为结构化段落与表格渲染；保留原文顺序、标题/常见字号/粗体/对齐、编号清单和表格。
- 后端按 Word 正文元素顺序提取文本，将段落和表格单元格的字符偏移连同预览结构返回；前端以同一偏移渲染可点击的脱敏标记。
- 已在开发服务器上传扩展测试样本验证：31 个结构块、3 个表格、78 个预览脱敏标记均可显示。

## 2026-08-17：保留格式脱敏下载

- 修复文档类文件下载被错误导出为纯文本、造成段落与表格丢失的问题。
- 新增保留格式脱敏接口：DOCX 保留段落与表格，XLSX 保留工作表和单元格，PDF 转换后以 DOCX 输出。
- PDF 的二次转换可能改变内部字符切分，因此替换逻辑采用原始全局偏移优先、原始敏感值兜底，避免漏替换。

## 2026-08-17：历史驱动的还原流程

- 脱敏完成后取消下载脱敏文件和映射表入口，改为完成弹窗并自动保存本机历史记录。
- 取消“从文件与映射表还原”入口；用户必须先选择本机历史，再上传经 AI 或其他流程处理后的当前脱敏文件执行还原。
- 完成弹窗保留下载能力：主操作下载当前脱敏文件，次操作为“暂不下载”。
- 在还原页面选中历史记录后，提供该记录的对照表与脱敏后文件下载入口。
- 框选文本后不再立即创建“区域”脱敏项；改为弹出“脱敏”和“添加到敏感字段”两个操作，支持将选中内容保存为本机关键词规则。
- 企业证照类格式命中但校验位不通过时保留候选识别并降低置信度，避免测试数据只能变成普通区域。
- 修复表格/跨节点框选：保留选区，兼容空白折行文本定位，弹出脱敏操作菜单。
- 框选处理使用鼠标抬起冒泡阶段并增加全局 mouseup 兜底，避免捕获阶段过早读取空选区，确保表格单元格直接框选也能显示操作菜单。
- 框选浮窗以选区中点为锚点，直接显示在选中内容上方，并限制在预览区域可视范围内。
- 浮窗定位使用预览滚动容器的内容坐标，加入 `scrollTop/scrollLeft` 修正，确保滚动预览时与选中内容同步移动并保持 4px 间距。
- 修正跨节点/换行框选的原文偏移映射，按去空白后的索引回映原文起止位置，避免点击“脱敏”后替换到错误位置。
- 还原页历史面板增加“全部清空”；全局品牌区域增加可点击版本号，点击请求 `/version.json` 检查更新，有新版本时显示红点。
- 网页浏览器标签标题更新为“文件脱敏与还原工具”。
- 修正敏感识别重叠规则：IPv6 支持 `::` 压缩格式；银行卡支持空格/连字符；结构化企业代码、证件号码优先于固定电话和姓名启发式；地址增加省市区路号形式；姓名仅在明确姓名语境下识别。
- 脱敏下载文件顶部增加“处理与还原规则”，要求用户及其 Agent 在运算、编辑和排版中原样保留 `{字段_编号}` 占位符；DOCX、XLSX、PDF 转 DOCX、TXT 与历史记录下载均覆盖。
- 版本检查更新源调整为 CNB 仓库 `main` 分支优先，比较本地与 CNB 最新提交；CNB 不可用时才回退至本机 `/version.json`。
- 为兼容文件同步部署（开发服务器无 `.git`），`version.json` 记录已部署 `revision`，供 CNB 提交比较使用。
- 点击品牌下方版本号后弹出 CNB 更新窗口：展示检查状态、当前修订、最近 5 条提交，并提供“检查更新”“更新版本”“前往仓库”。开发环境仍采用受控部署流程，更新按钮不会直接覆盖服务器文件。
- 已确定 Electron + PyInstaller 的 macOS/Windows 打包路线，新增桌面壳、PyInstaller 入口、平台构建命令与桌面发布说明；LibreOffice 在界面与后端均以“仅 DOCX→PDF 必需”的外部组件处理。
- PyInstaller 已在 macOS Apple Silicon 本机生成并通过健康接口验证 `desens-backend`；构建脚本使用 `.build/desktop/` 专用缓存，避免清理项目既有临时文件。Electron 安装包仍待在具备可用 Electron 下载缓存的 macOS Runner 和 Windows Runner 分别生成。
- 新增 GitHub Actions 桌面发布工作流：推送 `main` 生成 DMG/MSI Actions artifacts；推送 `vX.Y.Z` 标签时自动发布 GitHub Release 和 SHA-256 校验和。
- 版本更新窗口的更新源改为可选且本机记忆：GitHub、Gitee、CNB。后端仅接受这三个预设仓库地址并返回所选来源的 `main` 提交，避免由前端传入任意 Git URL。
- 修复快速切换更新来源时旧检查请求覆盖新来源结果的问题；前端使用递增请求序号，仅接受当前选择对应的响应。

## 2026-08-17：Windows GitHub Actions 桌面构建修复

- 使用 ego-browser 尝试查看 Actions 页面时 GitHub 连接被浏览器环境以 `ERR_CONNECTION_CLOSED` 中断，改用只读 GitHub CLI 日志定位失败步骤。
- Windows Runner 在“Build desktop frontend”执行 `spawnSync npm.cmd` 报 `EINVAL`；桌面前端构建脚本改为使用当前 Node 进程执行 `npm_execpath` 指向的 npm CLI，避免直接启动 `.cmd` 文件。
- 修复后 Windows 已越过前端构建，但 WiX 在 MSI 链接阶段因 Electron 默认图标缺失报 `LGHT0094`；新增多尺寸 Windows `.ico`，并在 electron-builder 的 `win.icon` 中显式配置。
- `v0.1.0` 标签的 DMG/MSI 均构建成功，但发布 job 未 checkout 仓库且 `gh release` 未指定仓库，导致 `.git` 缺失；改为始终传入 `$GITHUB_REPOSITORY`，无需在发布 job 重复检出源码。
- Release 安装包统一采用跨平台稳定命名 `desensitization_版本号.格式`；同一版本的 DMG 与 MSI 依靠不同扩展名区分，避免产品名称、平台与架构后缀造成下载链接不一致。
- 发布 `v0.1.1` 时，Electron 安装器启用最高压缩，PyInstaller 后端以优化字节码打包并排除测试、交互式与未使用科学计算模块；每个发布标签必须对应 `docs/releases/vX.Y.Z.md`，该文件作为 GitHub Release 的更新说明。
- 首次本机构建显示可选 Presidio/spaCy 生态仍被自动收集；该能力因模型不在生产依赖中始终回退，因此显式排除其 NLP/数据分析依赖，以保留当前功能并进一步压缩桌面后端。
# 2026-08-28：Tauri 骨架编译修复

- 为 `src-tauri` 补充 RGBA 图标资源，解决 Tauri 编译期默认图标校验失败。
- `cargo check --manifest-path src-tauri/Cargo.toml --quiet` 已通过；当前仅有未使用类型的警告。
- 新增 `src-tauri/target/` 忽略规则，避免 Rust 构建产物进入版本控制。

# 2026-08-28：首次开发服务启动

- 已通过 npm 锁定并安装 Tauri CLI，`package-lock.json` 已同步。
- `npm run build` 已通过；仅保留 PDF.js 的 eval 与大 chunk 提示，不影响启动。
- 已启动 Vite 开发服务 `http://127.0.0.1:5173/`，并启动 Tauri 桌面开发进程供人工测试。
- Rust 首次桌面构建通过；当前有未使用 DTO/适配器类型警告，待对应业务命令接入后消除。

# 2026-08-28：UTF-8 区间测试修正

- Rust 脱敏引擎继续严格使用 UTF-8 字节边界校验。
- 修正测试用例中电话号码的错误固定偏移，改为根据内容定位后验证脱敏与还原。

# 2026-08-28：前端桥接扩展

- Vue 桥接层新增模型列表、GGUF 本地注册、任务创建/查询/更新和任务事件监听函数。
- 这些函数仅在 Tauri 环境调用，浏览器模式保持安全空实现/明确运行环境错误。

# 2026-08-28：正式脱敏页接入 Rust

- 正式脱敏页确认文本类脱敏时，在 Tauri 环境调用 Rust `redact_approved_text`。
- Vue 选区位置先转换为 UTF-8 字节偏移，Rust 返回随机标记与映射后再进入既有确认、历史和下载流程。
- 非 Tauri 环境继续使用原 FastAPI/前端兼容路径。

# 2026-08-28：正式还原页接入 Rust

- 还原页在 Tauri 文本文件场景调用 Rust `restore_mapped_text`，要求同时提供脱敏文本和映射 JSON。
- 跨设备映射字段兼容 Rust 与旧前端命名，浏览器/复杂格式仍保留原适配链路。

# 2026-08-28：部分还原验证

- Rust 还原测试新增缺失映射场景：成功映射正常恢复，缺失标记通过 `missing_markers` 返回，未知标记保持不变。

# 2026-08-28：阶段验收

- Rust 测试通过，Vue 生产构建通过，Vite 开发服务返回 HTTP 200。
- 已核对目标范围：Tauri 基础脱敏/还原、版本化 JSON 存储、GGUF 模型登记接口、任务状态与事件接口均已存在并通过编译。
- 当前阶段保留旧 FastAPI/Electron 链路；复杂格式适配与实际模型推理属于后续功能，不影响本阶段接口交付。

# 2026-08-28：正式双栏预览修正

- 正式脱敏页文本预览改为“原始文件 / 脱敏文件”双栏。
- 原始栏只读；脱敏栏保留选区操作，脱敏结果按当前候选实时生成。
- 控制面板与旧链路继续保留，后续可再调整为顶部或抽屉布局。
- 选区逻辑兼容 Rust 随机不可读标记与旧版字段编号标记。

# 2026-08-28：空状态双栏修正

- 未上传文件时也显示“原始文件 / 脱敏文件”两个占位面板，避免界面回退成单预览。

# 2026-08-28：Tauri 本地检测修正

- Tauri 桌面端不再尝试调用未随包发布的 FastAPI 服务；TXT/CSV/JSON/Markdown 和 PDF 使用本地解析与规则候选检测。
- 浏览器/Electron 兼容端保留原后端调用；Tauri 页面不再显示“后端服务不可用”误导性提示。

# 2026-08-28：打包入口纠正

- 截图所示旧界面来自 Electron 兼容打包命令；已明确 Tauri 为新架构正式打包入口并开启 Tauri bundle。
- 旧 Electron 命令不删除，避免影响现有用户和迁移期间的回退能力。

# 2026-08-28：Tauri 双栏界面打包验收

- 正式脱敏页已改为原始文件/脱敏文件双栏预览，右栏承载选区操作。
- `npm run tauri:build` 成功生成 macOS `.app` 与 `.dmg`，新包不再使用截图中的旧 Electron 入口。

# 2026-08-28：历史运行数据归档

- 将项目中的历史上传文件、测试样本、旧构建产物、旧发布包和临时目录移动至 `trash/` 对应子目录，未执行删除。
- `trash/` 已加入 `.gitignore`，避免敏感历史数据进入版本控制；源码、`docs/*` 和旧兼容链路保留。

# 2026-08-28：打包前端资源修正

- 包级烟测发现 Tauri 打包没有自动刷新 `dist/`，会把旧前端资源封入新包。
- 已设置 `beforeBuildCommand: npm run build`，确保每次打包先生成最新 Vue 资源。

# 2026-08-28：Tauri 随机标记修正

- Tauri 本地候选结果改用随机不可读花括号标记，浏览器/Electron 兼容端保留旧占位格式。
# 2026-08-28：选区悬浮窗关闭行为

- 选区悬浮窗监听文档级鼠标按下事件；点击菜单外空白区域立即关闭并清除选区。
- 点击菜单内部不会触发关闭，原有按钮行为保持不变。

# 2026-08-28：设置页与本地 AI

- 新增 `/settings` 设置页：AI 默认关闭、来源选择、四个 GGUF 模型下载入口、本地 GGUF 路径登记和校验状态。
- Tauri 模式调用 Rust 模型清单/登记接口并监听任务事件；模型仍不进入安装包。
# 2026-08-28：推荐模型容量提示

- 设置页四个推荐 GGUF 模型后方增加预计占用大小，按常见量化文件估算。
- 已登记模型继续显示实际文件大小；界面同时提示最终容量取所选量化文件为准。
# 2026-08-28：重新打包供测试

- 执行 `npm run tauri:build`，确认先运行 Vue `beforeBuildCommand`，再完成 Rust release 编译和 macOS `.app/.dmg` 打包。
- 新生成的 `.app` 已启动并完成进程级启动烟测，供用户测试最新设置页与双栏脱敏界面。
# 2026-08-28：GitHub Actions 自动打包

- 新增 `.github/workflows/tauri-build.yml`，为 macOS ARM64、macOS Intel 和 Windows x64 分别打包 Tauri。
- 通过 `npm ci` 使用锁文件安装依赖，运行 `npm run tauri:build`，并上传 14 天可下载的构建产物。
## 2026-08-28 CI 修复

- GitHub Actions run `33136238637` 验证发现 macOS ARM 构建成功，Windows 在 MSI/WiX `light.exe` 阶段失败。
- Windows CI 改为只生成 NSIS 安装包，避免受 WiX 环境影响；macOS 继续生成 DMG 与 APP。
## 2026-08-28 模型下载反馈

- 设置页推荐模型卡片点击下载后显示对应卡片的准备/下载进度条与完成提示。
## 2026-08-28 多格式烟测样本

- 创建 TXT、CSV、JSON、Markdown、PDF、DOCX、XLSX、PNG、JPG 虚构测试文件到 `trash/`。
- 完成 Rust 测试和 Vite 构建验证；未修改业务代码。
## 2026-08-28 版本操作按钮

- 版本弹窗的“检查更新”显示真实进行中状态；“更新版本”指向最新发布页面；“前往仓库”指向当前更新源仓库。
## 2026-08-28 文件拖拽与复杂格式兜底

- 上传区域补充 `dragenter` 处理，拖入时稳定进入高亮状态。
- Tauri 无后端时 DOCX/XLSX 不再因提示而 reset，文件会保留在当前流程并显示明确的结构化解析待恢复提示。
## 2026-08-28 本地重新打包

- 执行 `npm run tauri:build`，重新生成最新前端资源、Rust release 二进制、macOS `.app` 与 `.dmg`。
- 已启动新生成的应用，供用户验证拖拽上传行为。
## 2026-08-28 Word/Excel 提示修正

- 将 DOCX/XLSX 本地兼容模式提示从错误样式改为信息样式，明确表示文件已成功加入，不再造成上传失败误解。
## 2026-08-28 格式转换空文件修复

- 修复转换页面立即撤销 Blob URL 导致下载文件为空的问题。
- 增加转换响应 Blob 类型与非空校验；下载链接延迟释放 30 秒。
## 2026-08-28 转换修复版重新打包

- 使用提交 `8ea0a9c` 执行 `npm run tauri:build`，生成最新 macOS `.app` 与 `.dmg` 并启动应用。
## 2026-08-28 内置文档适配器依赖

- 为 Tauri Rust 核心加入 `zip`、`quick-xml`、`calamine`、`rust_xlsxwriter`、`pdf-extract` 依赖并更新 `Cargo.lock`。
- `cargo check` 通过；依赖已进入应用构建链，但 DOCX/XLSX/PDF 适配器业务接入仍需下一步实现，当前未宣称结构化脱敏已完成。
## 2026-08-28 协作流程调整

- 后续每次代码修改完成后，先本地测试、打包并启动应用交由用户验证；用户明确确认测试完成后，才允许推送仓库。
## 2026-08-28 DOCX 本地读取适配

- 接入 `jszip`，从 DOCX `word/document.xml` 提取段落文本并进入本地规则检测。
- 已完成 `npm run build`、Rust 测试和 Tauri 打包，最新应用已启动供用户验证。
## 2026-08-28 上传面板折叠

- 文件加入后自动折叠上传卡片，仅保留标题、文件状态和展开入口；重置后恢复展开。
## 2026-08-28 检测结果联动悬浮

- 检测结果卡片、原始文本敏感片段和脱敏标记共用 detection ID，悬浮时同步高亮。
## 2026-08-28 预览片段反向触发联动

- 原始文本、脱敏标记和 DOCX 结构预览片段均绑定 mouseenter/mouseleave，可从任意预览侧触发同一 detection ID 的联动高亮。
## 2026-08-28 Hugging Face 镜像源

- Hugging Face 选择项改用 `hf-mirror.com` 的已确认 GGUF 直链；Qwen 推荐模型显示已核实文件大小。
- Rizzo PII 当前无真实仓库，下载入口显示暂无地址。
## 2026-08-28 小于 1B 模型替换

- 通过 ego-browser 核验 HF/HF Mirror 模型页面后，将设置页四个推荐项替换为 Qwen1.5 0.5B Chat、Qwen2.5 0.5B Instruct、Qwen3 0.6B、SmolLM2 360M Instruct。
- 所有推荐模型均小于 1B，统一 GGUF；Qwen2.5 Q8 文件实际约 676 MB，SmolLM2 Q8 实际约 386 MB。
- Rizzo PII 因两个来源均未找到真实仓库，已移除，避免展示虚假下载地址。
## 2026-08-28 格式转换真实内容修复

- 修复 `backend/main.py` 中 PDF→DOCX 与新版 PyMuPDF 的兼容问题，补充 `Rect.get_area` 兼容层。
- 对复杂 PDF 增加真实文本提取回退，输出可打开的 DOCX，不再生成空文件或占位内容。
- 使用虚构 PDF/DOCX 完成接口烟测：PDF→DOCX 返回有效 OOXML 且包含原文；DOCX→PDF 返回有效 PDF。

## 2026-08-28 模型直接下载

- 设置页模型按钮改为 Tauri 本地下载命令，下载至应用数据目录 `models/`。
- 下载完成后执行 GGUF magic、可读性和 SHA-256 校验，并自动登记本地模型清单。
- 下载失败或校验失败不会加入清单。
- 修复同步网络请求阻塞 Tauri 界面的问题，改为异步请求；前端在请求期间显示下载进度。
## 2026-08-28 三面板滚动与 hover 联动

- 检测结果列表、原始文件预览、脱敏文件预览支持按滚动比例同步定位。
- 任一面板滚动不会改变人工选区能力；检测卡片或两侧内容 hover 时，关联内容会保持高亮并在需要时滚入可视区域。
- 调整为滚动独立：取消滚动事件联动，仅在 hover 时对关联内容执行可视定位。
## 2026-08-28 本地模型应用切换

- 本地 GGUF 模型清单增加“应用模型”按钮。
- 当前模型 ID 与路径持久化到本地设置，刷新页面后仍保留当前使用状态。

## 2026-08-28 llama.cpp 接入启动

- 已确认并开始接入 `llama_cpp` Rust 绑定，目标是让已应用 GGUF 模型实际参与用户选区推理。
- 已接通右侧选区菜单的 AI 检测入口：敏感库摘要与选区文本进入 Rust/llama.cpp，模型 JSON 候选回到人工审核列表。
## 2026-08-28 AI 脱敏稳定性修复

- AI 智能脱敏按钮保留在检测结果板块顶部，点击后对当前文档（前 12000 字符）整体生成候选。
- 增加 AI 检测进度条，结果仍必须人工确认。
- llama.cpp 推理改为由当前应用启动的隔离子进程执行；子进程异常退出只返回失败，不再让 Tauri 主进程随 native abort 一起退出。
- 针对 llama.cpp 在超出上下文时 native abort 的行为，推理会话固定 2048 context、256 batch，并限制单次规则/正文输入长度；后续应继续实现真正的分段合并。
- 地址脱敏调整为保留省份和城市，只生成区县、街道、道路及门牌号的脱敏候选。
- 已移除 llama.cpp 推理依赖并接入 Candle Qwen2 GGUF 推理路径：读取同目录 `tokenizer.json`、加载量化权重、执行有限长度生成并返回候选 JSON 文本。
- GitHub Actions Windows 构建产物已从 NSIS `.exe` 调整为 MSI `.msi`，以符合交付要求。
- CI 修复：移除 Candle 的强制 Metal feature，避免 Windows 编译引入 Apple 专属 `objc2`；当前使用跨平台 CPU 路径。
- Windows MSI 增加平台专用 ASCII 产品名 `DESENS`，规避 WiX light 对中文 MSI 产品元数据的兼容问题；窗口标题仍为中文。
- GitHub Actions 已调整为仅在 `v*` tag 推送时打包，并将 MSI/DMG 自动发布到同名 GitHub Release；普通 main 提交不再触发桌面发布构建，`.app` 仅保留在 Actions artifact 中。
- 本次未修改旧 Vue/FastAPI/Electron 兼容链路。
## 2026-08-28 README 更新

- 更新根目录 README，明确 Vue 3 + Rust + Tauri 2 为当前桌面架构。
- 补充 `v*` tag 触发 macOS DMG、Windows MSI 并发布到 GitHub Release 的说明。
- 补充 GGUF 模型登记、校验、应用和 AI 人工确认边界。
- 明确旧 Electron/FastAPI 链路仍为兼容入口，未删除。

## 2026-08-28 DOCX 下载修复

- 发现 Tauri 桌面版 DOCX 下载错误调用未打包的 FastAPI，导致复杂格式输出为空白小文件。
- 增加 Tauri 本地 DOCX ZIP 文档包写回：直接更新正文、页眉和页脚 XML，并在文档末尾追加脱敏标记。
- 下载前增加 Blob 非空和写入结果校验，失败时阻止生成占位文件。

## 2026-08-28 按钮交互反馈

- 根组件增加统一 Toast 反馈和无障碍状态播报。
- 普通按钮点击后提供即时触发提示；已有下载、转换、脱敏、还原和模型操作继续使用各自的加载状态与结果提示。

## 2026-08-28 还原链路修复与冒烟测试

- 修复 Tauri 还原页 DOCX 不再依赖 FastAPI：本地解压 DOCX ZIP 并替换正文、页眉、页脚中的映射标记。
- 修复还原按钮无反馈：执行期间显示“正在还原…”，完成或失败显示状态信息。
- 下载前增加空 Blob 校验，禁止生成空白占位文件。
- 使用 `trash/output/smoke-fixtures/input/word_1_customer-record.docx` 完成桌面 UI 脱敏测试，生成 `/Users/echowang/Downloads/redacted_word_1_customer-record.docx`，实测大小 829241 bytes，已确认不是 666 字节空文件。
- 本次 Tauri 构建和启动通过；还原 UI 已补齐本地 DOCX 处理，待用户继续验证还原后的文件内容。

## 2026-08-28 下载结果弹窗

- 所有文件下载入口统一发送下载结果事件。
- 成功弹窗显示文件名、文件大小，并说明已提交到系统下载目录。
- 空文件、转换失败和模型下载失败显示失败弹窗及原因。

## 2026-08-28 转交文档更新

- 收到转交指令，重新记录项目、Git 状态与开发进度，并同步全部文档。
- 复核验收：`npm run build` 通过；`cargo check` 通过（5 条未使用类型警告）；`cargo test` 4 passed / 0 failed。
- `docs/handoff.md`：新增 16:10 交接快照，旧快照归档为「2026-08-28 15:59：DOCX 下载与交互反馈交接」。
- `docs/readme.md`：修正烟测记录路径引用，由已删除的 `dpcs/smoke_logs.md` 改为 `docs/smoke_logs.md`。
- `docs/decisions.md`：补充统一下载结果弹窗与全局按钮反馈的 UI 决策。
- `docs/smoke_logs.md`：补记交接前的构建、测试与打包产物路径。
- `docs/todo.md`：补记带时间戳的待验证项。
- `docs/memory.md`：补记本阶段稳定事实增量。
- 本次仅更新文档，未改动源码；未执行 commit/push。
# 2026-08-28 历史下载真实性与反馈修复

- 修复还原页“下载脱敏后文件”引用未定义 Blob 并误报成功的问题。
- 对未保存真实文件字节的 DOCX/XLSX/PDF 历史记录停止生成占位文件，改为全局失败弹窗说明必须使用脱敏时下载的真实文件。
- 文本历史仍可下载真实脱敏正文，成功与失败均通过统一下载结果弹窗反馈。

## 2026-08-31 全链路真实性与交互回归

- DOCX 与 XLSX 的脱敏下载统一改为本地 OOXML ZIP 写回，不再调用旧 FastAPI 输出链路。
- 修复 Rust 确认后随机标记与文件写回仍读取旧检测标记不一致的问题；输出改用最终 mapping。
- 修复 XLSX `t="str"` 单元格文本无法提取，现可检测并写回工作表字符串值。
- DOCX/XLSX 还原直接修改原始文档包；DOCX 预览从还原后的 XML 提取，未知标记原样保留以支持部分还原。
- 修复异步文本与图片还原提前结束加载状态，以及日期 `2026-08-14` 被截断的问题。
- 文本、JSON、CSV、Markdown 输出不再向正文插入提示，改为同时生成 `.desens-meta` 伴随文件。
- 所有按钮提供即时 Toast；下载统一成功/失败弹窗；删除规则、删除历史及清空历史增加二次确认。
- 未执行 commit 或 push，等待用户本地验收。

## 2026-08-31 历史真实文件持久化

- 新增 IndexedDB `desens_history_files`，保存脱敏完成时生成的真实 Blob、文件名、MIME、大小和时间。
- `localStorage` 历史记录新增 `redacted_file_key` 索引，不再承载大型二进制内容。
- 历史页可直接下载新记录的真实 DOCX/XLSX/文本/图片脱敏文件；成功和失败继续使用统一弹窗。
- 删除单条或清空历史时同步清理 IndexedDB 文件。
- 旧记录因为没有保存真实字节，标注为“旧记录”，提示重新脱敏一次，不伪造文件。
- 浏览器烟测：新 DOCX 历史保存 829261 bytes，并从历史页成功触发同大小真实下载。

## 2026-08-31 历史清空修复

- 根因：Tauri WebView 未可靠展示 `window.confirm()`，点击“全部清空”只触发了全局按钮 Toast，实际删除分支被取消。
- 历史单条删除和全部清空改用应用内 `alertdialog`，显示影响范围并提供取消/确认按钮。
- 确认清空后同步移除页面状态、`localStorage` 历史元数据和 IndexedDB 真实文件。
- 隔离烟测以 2 条虚构记录和 1 个测试 Blob 验证：清空后页面记录 0、localStorage 记录 0、IndexedDB 文件 0。
## 2026-08-31 上传与任务执行二次确认

- 新增全局异步应用确认组件，统一承接脱敏、还原和格式转换页面的确认请求。
- 文件选择和拖拽上传在用户确认前不读取、不解析；取消后清空文件输入并保留当前页面状态。
- 脱敏、AI 全文检测、还原、格式转换和重新开始均增加二次确认；重新开始使用警示样式。
- 浏览器烟测覆盖上传取消/确认、开始执行、还原历史上传、格式转换和重新开始状态保留。
- `npm run tauri:build` 已生成并启动本次最新 macOS 应用和 ARM64 DMG，等待用户人工验收。
## 2026-08-31 接手记录

- 收到「接手」指令，完成项目状态核验并记录交接，未改动源码。
- 核实：分支 `main`、HEAD `9af66b7`；版本源码/Tauri 配置 0.1.1、tag v0.1.2；最新 `.app` 与 `.dmg` 存在（09:35 产物）；桌面应用未运行，仅 Vite 开发服务在跑。
- 工作区：18 个未提交修改文件（+920/-290），未跟踪 `.workbuddy/`、`src/utils/appConfirm.js`、`src/utils/historyFiles.js`；`dpcs/smoke_logs.md` 保持既有删除状态。
- `docs/handoff.md`：新增「2026-08-31 接手快照」，归档二次确认交接快照为上一节。
- 未执行 commit/push，等待用户对二次确认体验与最近回归的验收结论。

## 2026-08-31 还原下载本地化、历史检索与格式转换页移除

- 新增 `src/utils/formatExport.js`：本地生成 TXT/CSV/Markdown Blob 与 JSZip 真实 DOCX/XLSX，输出前做 ZIP 签名、非空与内容抽样校验。
- `Restore.vue`：还原完成下载栏新增「表格 CSV」按钮；Word/Excel/TXT/Markdown 全部改为本地生成，不再调用 FastAPI `/api/text-to-*`；Excel 还原后提取真实单元格文本供文本类导出与预览；图片还原提供 PNG 下载出口，不再对图片显示文档格式按钮。
- `Restore.vue` 脱敏历史：新增搜索框（按文件名/时间过滤）、时间排序切换（默认最新在前）、匹配计数与无匹配提示。
- 删除格式转换页面：`router/index.js` 移除 `/convert`，`App.vue` 移除导航入口，`src/views/Convert.vue` 归档到 `trash/removed-2026-08-31/`（含未提交的二次确认改动，可恢复）。
- 浏览器烟测：Vite 5173 + ego-browser 隔离任务空间，虚构 CSV 数据端到端还原，5 个下载按钮全部成功且落盘文件校验为真实内容（docx/xlsx 含还原值、csv 带 BOM、无 index.html 占位内容）。
- 未执行 commit/push，等待用户在最新 `.app` 上验收。

## 2026-08-31 Tauri 打包与 DMG 绕行

- 第二次 `npm run tauri:build` 重新生成 `dist/` 并打包最新 `.app`；DMG 步骤因本机 hdiutil 容量估算失败中断，已按 `docs/troubleshoot.md` 新规则用 `bundle_dmg.sh --skip-jenkins --disk-image-size 128` 手动生成 17MB DMG。
- 已启动 `src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`（pid 59188）等待用户人工验收；未执行 commit/push。

## 2026-08-31 转交文档更新

- 收到「转交」指令，新增 `docs/handoff.md`「还原下载本地化交接快照」，记录本轮改动、验证、Git 状态、待验收项与下一步。
- 同步更新：`README.md`（页面列表移除「格式转换」，还原流程改为本地多格式导出与历史搜索排序）、`docs/memory.md`（增量稳定事实）、`docs/troubleshoot.md`（DMG hdiutil 绕行规则）、`docs/smoke_logs.md`、`docs/decisions.md`、`docs/todo.md`、`AGENTS.md`。
- 本次仅更新文档，未改动源码；交接核对时 `.app` 进程已退出（此前 10:30 启动、供用户验收），最新产物路径不变；未执行 commit/push。
## 2026-08-31 GitHub Actions 发布规范

- 扩展 Tauri 发布矩阵为 macOS ARM64、macOS Intel、Windows x64 和 Linux x64。
- 每个作业在构建后复制并重命名真实产物，再上传 artifact 和 GitHub Release；发布文件以 `local_desens_系统_架构_<平台>.<格式>` 命名。
- 初次 `v0.1.3` Linux DEB 作业因缺少 `gdk-3.0` 开发库失败；工作流改用 Ubuntu 24.04 并在构建前安装 Linux 桌面依赖。
- 同步 package、Tauri、Cargo 版本为 `0.1.4`，计划创建并推送 `v0.1.4`。

# 2026-08-31 检测片段双波浪线

- 原始与脱敏预览的对应检测片段均增加红色双波浪线；文档段落、表格与纯文本预览共用 `detection-mark` 样式。
- 保持既有检测 ID、hover 联动和点击复核行为不变。

## 2026-08-31 README 贡献与许可证说明

- README 新增贡献流程，明确 Issue/PR、验证、文档同步及虚构测试数据与敏感信息边界。
- README 许可证标题统一为「许可证 / License」，继续明确项目采用 Apache License 2.0 并链接根目录 `LICENSE`。
# 2026-08-31：清理发布包名模板字样

- GitHub Release 包名已移除实际文件名中的 `系统_架构` 占位字样。
- 新命名为 `local_desens_macos_arm64.dmg`、`local_desens_macos_x64.dmg`、`local_desens_windows_x64.msi`、`local_desens_linux_amd64.deb`。
- 本轮版本推进至 v0.1.5，待提交并触发新的 tag 发布。
# 2026-08-31：更换应用图标

- 已将用户提供的蓝紫盾牌锁图标接入前端 Logo 与 Tauri 安装包。
- Tauri bundle 改用 `src-tauri/icons/icon.png`，保留 RGBA 透明通道；前端使用 `public/assets/desens-shield.png`。
- 顶部版本号改为读取 `package.json`，与 tag 发布版本同步显示。

## 2026-08-31 固定视口布局

- 为应用根节点、主内容区和页面根节点建立固定视口弹性约束，隐藏全局页面溢出。
- 脱敏工作区、预览区和检测面板继续由自身面板承载滚动；窄屏工作流保留页面内可访问滚动，避免内容被截断。
- 还原页与敏感字段页增加桌面左右分栏，设置页预留紧凑卡片网格样式。
- ego-browser 烟测改用不等待本地页面 load 事件、短暂稳定后读取状态；四个主要路由均访问成功且文档无全局溢出。
- 本轮逐页核对概览、脱敏、还原、敏感字段、设置五个页面的卡片尺寸与溢出；桌面端分栏和设置紧凑卡片均生效。

## 2026-08-31 AI 全文脱敏反馈

- AI 全文检测继续使用模拟进度条，任务结束前保持处理中状态，结束时再平滑收起。
- 无论实际推理成功或失败，均显示应用内结果弹窗；成功时报告新增敏感项、拒绝的无效/重复候选和当前总数。
- 前端构建、Rust cargo check、ego-browser 五路由烟测均通过；已重新生成并启动最新 Tauri `.app`，并生成 Apple Silicon DMG。

## 2026-08-31 模型登记与本地 AI 验证

- 设置页仅保留 Qwen1.5 0.5B Chat 与 Qwen3 0.6B 两个真实下载入口。
- 已登记模型支持取消登记；取消登记只移除本地清单记录，不删除模型文件，应用中的模型会同步解除。
- 使用本机已应用的 Qwen1.5 GGUF 做隔离 Candle 烟测，确认失败原因是模型目录缺少配套 `tokenizer.json`，已保留结构化失败提示，不会导致主进程崩溃。
- 变更后的前端、Rust 检查和 ego-browser 五页面烟测通过，已重新生成最新 Tauri `.app` 与 Apple Silicon DMG。

## 2026-08-31 模型入口收敛

- 清除当前本地模型清单配置，保留原始 GGUF 文件以便用户自行重新登记。
- 设置页仅展示一个小于 1B 且匹配 Candle `quantized_qwen2` 的 Qwen2.5 0.5B Instruct GGUF 下载入口。
- 已核验 `hf-mirror.cn` 不可访问，`hf-mirror.com` 会发生地区跳转；魔搭社区 Qwen2.5 0.5B Instruct `qwen2.5-0.5b-instruct-q4_0.gguf` 返回 200，设置页已按来源使用魔搭直链。
- 刷新清单时若应用模型已不存在，会同步清理失效的应用配置。
# 2026-08-31 模型推理依赖修复

- 定位到“下载、登记成功但 AI 不可用”的直接原因：Candle 推理从 GGUF 同目录读取 `tokenizer.json`，原下载流程只保存 GGUF。
- 设置页推荐模型已绑定 ModelScope 基础模型的真实 tokenizer 地址；Rust 下载命令在登记前下载并校验 tokenizer JSON，手工登记也拒绝缺少 tokenizer 的模型。
- 已为当前 Qwen2.5 0.5B 模型目录补齐 tokenizer，并通过前端构建与 Rust `cargo check`。
- 针对小模型非严格 JSON 输出，检测页增加了 JSON 清理、对象/数组提取及本地规则候选兜底；已重新生成并启动最新 Tauri 应用包验证入口不再使用旧前端资源。
- 发布准备：前端与 Tauri 版本标记统一更新为 `0.1.6`，对应 tag 为 `v0.1.6`。
- Windows Actions #18 失败原因为 Tauri 编译阶段缺少 `src-tauri/icons/icon.ico`，已从当前 PNG 图标生成 ICO 并加入打包配置。
- 发布版本更新为 `0.1.7`，将通过 `v0.1.7` tag 触发桌面包构建。
- 敏感字段页右侧“已配置字段”列表改为固定最大高度并始终保留独立纵向滚动条，避免父级 `overflow:hidden` 覆盖列表滚动。

## 2026-09-01 GitHub Release 应用内更新

- 更新入口不再比较 `main` 提交；桌面端通过 Tauri Updater 读取 GitHub Release 的已签名 `latest.json`，仅将版本化 Release 识别为可更新版本。
- 点击“更新版本”开始真实下载，并按插件报告的已接收字节显示进度；下载和签名校验成功后才显示“立即重启”，确认后调用安装并重启流程。
- 添加 `@tauri-apps/plugin-updater`、`@tauri-apps/plugin-process` 及对应 Rust 插件；版本统一推进至 `0.1.8`，等待用户确认后再提交、打 tag 与推送。
- GitHub Actions 已改为构建并上传签名 updater 工件、签名文件及跨平台 `latest.json`，普通 DMG/MSI/DEB 发布资产继续保留。
- 本地 Tauri release 打包已验证 macOS updater 归档和 `.sig` 均非空；应用启动正常。签名私钥未进入工作区或 Git 变更。
- 修复已安装但尚未发布 `latest.json` 时被插件笼统报告为网络错误的问题：桌面端失败后读取 GitHub Release API；若远端版本不高于本机则正常显示“当前已是最新版本”，若有新版本但清单未发布则明确提示等待签名清单。

## 2026-09-01 macOS Release 更新工件修复

- GitHub Actions `v0.1.8` 的 Apple Silicon 作业确认 Tauri 与 DMG 均构建成功；失败原因是作业仅请求 `dmg` bundle，Tauri 不会因此产生 updater 所需的 `.app.tar.gz`。
- macOS ARM64/Intel 矩阵均改为 `--bundles dmg,app`，确保每次发布同时有可手动安装的 DMG 与签名更新归档。
- 用户确认后将发布版本推进至 `0.1.9`，以新的 `v0.1.9` tag 重新触发完整跨平台构建；失败的 `v0.1.8` tag 保留为历史记录。
- 本地 `0.1.9` 打包后同步更新 `Cargo.lock` 中根 Rust 包版本，作为独立锁文件一致性提交保留在 `main`；不移动已触发发布构建的 `v0.1.9` 标签。

## 2026-09-01 Beta 发布标识

- 前端左上角版本标记固定追加 `Beta`，明确当前分发渠道为测试版；程序更新比较仍读取不带标识的语义版本号。
- GitHub Release 的 DMG、MSI、DEB 及更新归档统一使用 `local_desens_beta_<平台>_<架构>` 前缀，避免测试包与未来正式包混淆。

## 2026-09-01 发布矩阵移除 macOS Intel

- 用户确认不需要 macOS Intel DMG。GitHub Actions 从构建矩阵和 updater manifest 中移除 Intel 条目，Release 只等待 macOS ARM64、Windows x64 和 Linux x64。
- 已有 `v0.1.8`、`v0.1.9` 工作流仍使用旧提交，无法因本次配置修改自动解除排队；用户确认后版本推进至 `0.1.10`，将以 `v0.1.10` tag 采用三平台发布矩阵。

## 2026-09-01 v0.1.10 Release 创建失败修复

- 已定位到 `Publish signed release` 的 Linux updater 清单命名不一致：构建上传 `local_desens_beta_linux_amd64.AppImage`，`latest.json` 生成步骤却读取并发布 `linux_x64` 文件名，导致签名文件不存在。
- 统一 Release 清单的 Linux 签名路径和下载 URL 为 `local_desens_beta_linux_amd64.AppImage`，与构建产物完全一致。
- 发布版本推进至 `0.1.11`，待完成本地签名包和浏览器烟测后使用 `v0.1.11` tag 触发新的三平台 Release。

## 2026-09-01 还原页桌面调用兼容修复

- 修复文本还原在 Tauri 调用失败时仅显示 `undefined`、无法继续的缺陷。
- 发送给 Rust 的映射条目统一转换为字符串 ID、标记、类型和原文，并过滤无效历史记录；兼容旧版映射中的数字 ID。
- 原生调用未返回有效正文时，文本还原使用同一映射表进行受控本地回退；若无任何标记可替换，保留真实桌面错误原因，不再显示 `undefined`。
- 已执行本地签名 `dmg,app` 打包并启动最新应用，供用户验证桌面还原流程；在用户确认前不推送该修复提交。

## 2026-09-01 还原上传卡片布局修复

- 已选择历史后，待还原文件元数据改为替换右侧上传区，而非追加在上传区之后。
- 文件名和移除按钮始终受右侧上传卡片的弹性高度约束，不再越出卡片并遮挡“已选择历史记录”横幅。

## 2026-09-01 还原完成结果弹窗

- 还原完成后的预览和多格式下载入口改为应用内模态弹窗，避免在固定视口工作区底部撑开页面。
- 关闭结果弹窗仅收起结果视图，不会清除已选历史、上传文件或映射；用户可继续在当前流程中操作。

## 2026-09-01 敏感字段删除列表同步

- 敏感字段删除改为应用内确认弹窗，移除对 Tauri WebView 原生 `window.confirm()` 的依赖。
- 确认删除后先更新内置规则删除标记或自定义规则存储，再从持久化配置重新加载列表，确保列表计数和行内容同步移除。
- 已重新执行签名 `dmg,app` 打包并启动最新 macOS 应用，等待用户验证后再推送。

## 2026-09-01 敏感字段工作区铺满

- 敏感字段页桌面内容区从 1200px 扩展至 1720px；新增规则与已配置字段使用更宽的左右双栏比例。
- 右侧规则列表卡片提高可用高度，并继续仅在卡片自身滚动，避免全页滚动或空白占据主要工作区。

## 2026-09-01 敏感字段编辑模态窗口

- 点击规则列表的“编辑”后在应用内模态窗口中编辑；左侧卡片固定为新增规则，避免编辑状态挤占工作区。
- 编辑窗口提供取消与保存修改：取消不写入规则，保存后才同步更新列表与本地规则配置。
- 已重新执行签名 `dmg,app` 打包并启动最新 macOS 应用，待用户验证后再推送。

## 2026-09-01 还原页自动历史匹配

- 还原页从首次进入起固定显示左右工作区：左侧为本地脱敏历史，右侧为待还原文件上传卡片；不再因是否已选择历史而切换布局。
- 上传待还原文件后，系统会读取文本、DOCX、XLSX 或 PDF 中的脱敏标记，并结合文件名在本机历史中查找唯一匹配项；唯一匹配时自动选中并加载映射。
- 无匹配或多条记录同分时保留已上传文件并显示明确提示；用户点击左侧历史记录即可手动指定映射，不会再清空已上传文件。
- 已执行签名 `dmg,app` 打包并启动最新 macOS 应用。`文件脱敏与还原工具.app` 内的可执行文件、ARM64 DMG、更新归档及签名文件均已验证非空，等待用户测试后再推送。

## 2026-09-01 v0.1.12 Beta 发布

- 用户确认还原页自动匹配功能测试通过。前端、Tauri 和 Rust 包版本统一推进至 `0.1.12`，将创建并推送 `v0.1.12` tag 触发三平台 Beta Release。

## 2026-09-01 Windows WiX 打包网络修复

- `v0.1.12` 的 Windows x64 作业在应用编译完成后，Tauri 临时下载 WiX 3.14 时遭遇 GitHub 远端连接重置（`os error 10054`），因此没有产生 MSI，发布作业被跳过。
- Windows 作业新增 WiX 3.14 预置步骤：复用已存在的 Tauri WiX 缓存，否则最多五次下载、验证归档大小并解压校验 `candle.exe`/`light.exe` 后才开始 Tauri MSI 打包，避免 Tauri 内置单次下载成为发布阻断点。
- 发布版本推进至 `0.1.13`，将使用 `v0.1.13` tag 重新触发 Windows MSI 和完整三平台 Release。

## 2026-09-01 Windows 自动更新资源代理修复

- Windows `v0.1.11 Beta` 已能读取 GitHub Release，但点击更新时触发 `Cannot read private member from an object whose class did not declare it`。
- 根因是 Vue 将 Tauri updater 的 `Update` Resource 存入响应式 `data` 后生成 Proxy；该 Resource 的 `download()` / `install()` 依赖 JavaScript 私有字段，Proxy 作为调用方会失去私有字段槽。
- 使用 Vue `markRaw()` 保存 `Update` 实例，保持资源对象原样，再调用下载、签名校验和安装流程；版本推进至 `0.1.14`，将以 `v0.1.14` 发布供旧 Windows 安装包更新。
- `v0.1.14` GitHub Actions 已成功构建 macOS ARM64、Windows x64 与 Linux x64；发布已上传 `local_desens_beta_windows_x64.msi`、对应 `.sig` 和版本为 `0.1.14` 的 `latest.json`。更新清单的 Windows URL 和签名字段已重新拉取校验。

## 2026-09-02 正则转换模型缺失引导

- 正则转换按钮移除常驻“需大模型”标记；未检测到已应用本地模型时，点击后显示应用内错误弹窗，而不是打开转换选择窗口。
- 弹窗明确说明需要下载、登记并应用本地模型，并提供“前往设置”操作以直接跳转至模型下载和应用页面。

## 2026-09-02 README 产品定位更新

- README 的产品定位从特定投资与私募人群调整为任意行业的本地脱敏工具，明确金融、医疗、政务、制造、教育、零售和互联网等场景均可通过自定义规则适配。
- README 增补本地脱敏数据集、GGUF 模型管理及面向 LoRA 自训练的版本化基础说明；同时注明当前训练执行和产物启用仍需用户明确确认，避免将规划能力表述为自动执行。
