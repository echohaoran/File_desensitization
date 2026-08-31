# 待办事项

- [x] 增加 Vue/Tauri bridge 和桌面运行时检测。
- [x] 增加独立桌面 smoke 页面，验证基础 command。

## 2026-08-28：Tauri 架构迁移与本地 AI

- [x] 确认 Vue 3 + Rust + Tauri 目标架构。
- [x] 确认左右预览、右侧选区操作和人工确认流程。
- [x] 确认随机文档 ID、格式文件底部标记、纯文本伴随标记文件。
- [x] 确认跨设备还原、`.p12` 证书、密码和 AES-256-GCM 加密导出包。
- [x] 确认第一阶段 JSON 存储、GGUF 模型和本地 LoRA 训练方向。
- [ ] 设计统一 Detection、Mapping、DocumentMarker、History、Annotation、TrainingJob 数据模型。
- [ ] 设计 Tauri commands、事件和 Vue 状态边界。
- [x] 设计随机文档 ID、随机 marker、`.desens-meta`、映射表 JSON 和 `.dlib` 协议草案。
- [ ] 评审并冻结标记协议、映射表 Schema 和 `.dlib` 文件格式。
- [x] 设计 Rust/Tauri 模块边界、command 分类和统一任务事件方向。
- [ ] 冻结 Tauri command DTO、错误码和事件 payload。
- [x] 完成 Tauri command DTO、错误码和任务事件 payload 草案。
- [ ] 评审 DTO 字段、错误码和事件命名，并冻结 schema v1。
- [x] 设计 JSON 存储 envelope、目录结构和 `StorageProvider` 接口。
- [ ] 冻结各集合字段、迁移规则、原子写入和导入冲突策略。
- [x] 设计统一 `DocumentAdapter` 接口和各文件格式策略。
- [ ] 冻结 DocumentBlock、Preview、DocumentOutput 和 RestoreOutput DTO。
- [x] 设计 `.dlib`、`.p12`、AES-256-GCM、RSA-OAEP-SHA-256 和证书生命周期协议。
- [ ] 冻结 `.dlib` 二进制/JSON envelope 布局、GCM tag 编码和证书兼容范围。
- [x] 设计 GGUF 模型目录、下载 Provider、校验流程和推理运行时接口。
- [x] 建立模型记录、任务状态和统一任务事件 Rust 类型。
- [x] 接入 `list_models` 基础 command。
- [x] 实现本地 GGUF magic、大小、SHA-256 校验和注册 command。
- [x] 实现进程内 TaskManager、TaskSnapshot 以及 create/get task command。
- [x] 增加 update_task 状态更新 command。
- [ ] 接入 task-event 事件广播、取消、暂停和持久化。
- [x] 接入 create/update task 的任务快照持久化和基础 task-event。
- [x] 实现任务快照的应用启动恢复。
- [ ] 实现任务取消、暂停/恢复检查点和真实进程恢复。
- [ ] 选定 Rust GGUF 推理后端并冻结支持的架构、平台和量化范围。
- [ ] 明确魔搭/Hugging Face 模型清单、固定 revision 和可信 SHA-256 来源。
- [x] 设计标注数据集、LoRA 训练任务、资源预检、检查点和训练产物协议。
- [ ] 选定 TrainingBackend，并验证目标 GGUF 架构的训练/转换链路。
- [x] 定义训练评估集、指标阈值策略和模型晋级规则。
- [x] 设计测试集隔离、PII 指标、规则/AI 合并和模型晋级流程。
- [x] 完成进入 coding 前的核心架构设计。
- [x] 开始 coding：建立 Tauri/Rust 项目骨架和 domain DTO。
- [ ] 为 Tauri 骨架补充平台图标、权限配置和最小启动烟测。
- [x] 实现 JsonStorageProvider 与数据目录初始化基础能力。
- [x] 将 JsonStorageProvider 注册为 Tauri managed state，并接入通用集合读写 command。
- [x] 接入 settings/rules/history 只读 command。
- [x] 为通用集合写入增加可选 revision 并发校验。
- [ ] 接入 settings/rules/history 专用新增、编辑、删除 command。
- [x] 实现基础文本脱敏/还原核心和审核后 span 校验。
- [x] 将基础文本脱敏 mapping 持久化到 history/mappings。
- [x] 增加文本输出的源文件/脱敏文件 SHA-256。
- [x] 接入文本文档适配器和 `.desens-meta` 基础输出。
- [x] 增加格式能力查询，明确未迁移格式状态。
- [ ] 将文件适配器输出的 mapping 接入 history/mappings。
- [ ] 增加 schema 迁移、备份保留、跨进程锁和导入冲突处理。
- [ ] 网络或依赖缓存恢复后更新 `package-lock.json`，执行 npm 安装、`cargo check` 和 Tauri 构建验证。
- [ ] 实现 Rust JSON StorageProvider 与 schema 迁移机制。
- [ ] 实现文档标记协议和 DOCX/XLSX/PDF/伴随文件输出。
- [ ] 实现完整脱敏库 `.dlib` 加密导入导出和 `.p12` 密钥流程。
- [ ] 实现规则库、标注库和历史记录的 CRUD 与版本管理。
- [ ] 评估并接入 GGUF 本地推理运行时。
- [ ] 实现 AI 选区检测和人工审核闭环。
- [ ] 实现单基础模型 LoRA 训练任务、进度和产物管理。
- [ ] 为加密、标记、部分还原、导入导出和训练流程增加自动化测试。

## 2026-08-17

- [x] 选定 Electron + PyInstaller 桌面方案，并建立本地后端生命周期管理骨架。
- [x] 改用源码安装脚本，通过 npm + Python 本机启动 localhost 浏览器版。
- [x] 停止 GitHub Actions DMG/MSI 自动打包流程。
- [x] 在 GitHub macOS Apple Silicon 与 Windows x64 Runner 构建并验证 DMG/MSI；`v0.1.0` 已发布。
- [ ] 发布 `v0.1.1` 精简桌面包，并在两类真实目标机完成安装、启动、脱敏与还原回归。
- [ ] 建立 CNB Release 产物、校验和与桌面应用更新清单。
- [ ] 配置 macOS Notarization 与 Windows 代码签名证书后再进行外部发布。
- [ ] 为远端 Vite/FastAPI 进程增加 systemd、日志轮转和受控重启。
- [ ] 补充格式转换、敏感规则、历史还原和校验算法的自动化回归测试。
- [ ] 收紧 CORS，并评估认证、上传限制、文件扫描、结果加密和访问控制。
- [ ] 优化 PDF.js worker 的按需加载，降低前端初始包体积。
# 2026-08-28：实现进度

- [x] Tauri Rust 骨架通过编译并补齐图标资源。
- [x] 安装并锁定 Tauri CLI，启动 Vue + Tauri 开发服务。
- [ ] 接入真实脱敏页面的双栏选区交互与人工确认流程。
- [x] 增加设置页 AI 开关、模型来源入口和本地 GGUF 登记。

## 阶段验收

- [x] Vue + Rust + Tauri 可构建并启动
- [x] 基础文本脱敏/还原与部分还原
- [x] 版本化 JSON 存储
- [x] GGUF 模型登记接口
- [x] 任务状态与事件接口
## 2026-08-28 内置适配器后续

- [ ] 接入 DOCX OOXML 段落/表格解析、脱敏替换和底部标记区写入。
- [ ] 接入 XLSX 工作表/单元格处理和 `_DESENS_META` 标记工作表。
- [ ] 接入 PDF 文本块处理和末尾标记页写入。
- [ ] 为三类适配器增加格式保真、还原和打包烟测。

## 2026-08-28 16:10 待验证

- [ ] 在最新 `.app` 上完成 DOCX 端到端闭环：脱敏下载 → 还原页上传 → 还原 → 下载 → 解压核对 `word/document.xml`。
- [ ] 验证统一「下载已完成/下载失败」弹窗与文件名、大小显示。
- [ ] 验证 XLSX/PDF 的结构化检测边界提示，如实标注能力状态。
- [ ] 补齐 XLSX/PDF 适配器及可重复自动化测试。
- [ ] 发布前统一 `package.json`、`src-tauri/tauri.conf.json` 与 Git tag 版本（当前源码 0.1.1，tag 已到 v0.1.2）。

## 2026-08-31 交付前状态

- [x] DOCX 脱敏下载、历史映射还原、还原文件下载端到端验证。
- [x] XLSX 文本提取、脱敏写回和非空结构化下载验证。
- [x] 下载成功/失败弹窗与普通按钮即时反馈。
- [ ] PDF 保格式脱敏输出仍需独立 Rust 适配器；当前失败时明确提示，不生成占位文件。
- [ ] 图片自动 OCR、LoRA 后训练和 Candle 全文推理尚未达到可交付标准，不得标记为完成。
- [x] 新生成历史记录保存真实脱敏文件并支持再次下载；旧记录明确标注不可回填。
- [x] 历史“全部清空”使用应用内确认弹窗，并同步清理元数据和 IndexedDB 文件。
## 2026-08-31

- [x] 所有主流程文件上传增加读取前二次确认。
- [x] 脱敏、AI 检测、还原和格式转换开始按钮增加二次确认。
- [x] 脱敏与还原重新开始按钮增加二次确认并验证取消保留状态。

## 2026-08-31 还原下载与历史检索验收

- [x] 还原页 5 个格式下载改为本地生成并通过浏览器烟测（DOCX/XLSX 真实 OOXML、CSV 带 BOM）。
- [ ] 用户在最新 `.app` 验证：还原下载各格式、历史搜索/排序、导航无格式转换入口。
- [ ] 图片还原的 PNG 下载出口需在 Tauri 内人工确认。
## 2026-08-31

- [x] GitHub Actions 增加 Linux x64 DEB 发布作业。
- [x] GitHub Release 文件统一为 local_desens_系统_架构 平台命名。
- [x] 推送 `v0.1.3` 后使用 ego-browser 监控四个平台发布状态；Linux 因缺少 GDK 开发依赖失败。
- [ ] 推送 `v0.1.4` 后使用 ego-browser 监控四个平台发布状态。
# 2026-08-31 验证项

- [ ] 下次 tag 发布时确认 Release 资产不再出现 `系统_架构` 字样。

- [ ] 在本地 Tauri 包中确认长文本、DOCX 段落及表格的对应检测片段均显示红色双波浪线。
