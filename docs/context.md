# 会话上下文

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
