# 项目记忆

- Vue 通过 `src/api/tauriBridge.js` 统一调用 Tauri，浏览器兼容模式不会调用桌面 command。
- `/desktop-smoke` 是新 Tauri command 的虚构数据测试入口，不是完整脱敏业务页。

更新时间：2026-08-28

- 下一代目标架构为 Vue 3 + Rust + Tauri，现有 Vue + FastAPI + Electron 仅作为迁移基线。
- 脱敏必须经过人工确认；AI 默认关闭，只处理右侧用户选区，不能直接修改最终文件。
- 文件使用随机不可读文档 ID；DOCX/XLSX/PDF 在底部追加标记，JSON/TXT/CSV/Markdown 使用 `.desens-meta` 伴随文件。
- 跨设备还原依赖用户携带映射数据；完整脱敏库导出包含历史映射，必须使用 AES-256-GCM、`.p12` 和密码保护。
- 第一阶段使用版本化 JSON，不以 Redis 作为单机主库。规则、标注和历史需要 Rust 统一管理并支持导入导出。
- 模型统一 GGUF，不进入安装包；LoRA 训练每次固定一个基础模型，训练后不可在任务内切换。
- 标记协议使用随机 `document_id` 和随机 `marker`；格式文件在末尾写明文标记，JSON/TXT/CSV/Markdown 使用 `.desens-meta` 伴随文件。
- 完整脱敏库使用 `.dlib` 加密包，包含规则、标注、历史和映射表；AES-256-GCM 负责加密，`.p12` + 密码负责解密，SHA-256 负责校验。
- Tauri 边界：Vue 不直接访问本地文件或映射原文，Rust 通过版本化 command DTO 提供能力；长任务使用统一事件流。
- Command 协议要求 schema_version、request_id、结构化错误和统一 task-event；事件/日志不得包含敏感原文、映射值、密码或私钥。
- 第一阶段 JSON 存储按规则、历史、映射、标注、模型和训练任务分文件保存，使用版本化 envelope、原子写入和 StorageProvider 抽象。
- 所有文件格式通过统一 DocumentAdapter 处理；适配器负责解析、结构化预览、标记、脱敏输出和部分还原，并报告结构/版式警告。
- `.dlib` 每包使用随机 AES-256-GCM 密钥和 nonce，数据密钥由 `.p12` 中 RSA 公钥以 OAEP-SHA-256 包装；证书密码只保护私钥。
- GGUF 模型通过魔搭/Hugging Face/本地 Provider 安装，必须完成断点下载、SHA-256、格式和运行时兼容性校验；AI 只处理用户选区并返回待审核候选。
- LoRA 训练固定基础模型 SHA-256、数据集 revision、配置和随机种子；暂停依赖检查点，产物先注册为 adapter，评估通过后才能晋级为推理模型。
- 模型评估按来源文件隔离测试集，报告 precision/recall/F1、误报漏报和资源指标；规则与 AI 冲突统一进入人工审核。
- 2026-08-28 核心架构设计已完成，项目可开始 Tauri/Rust 骨架和 domain DTO 的 coding。
- 2026-08-28 已建立 `src-tauri` Tauri 2 骨架、domain DTO 和健康检查 command；迁移采用增量方式，旧链路保留。
- 2026-08-28 已新增第一版 JsonStorageProvider，支持版本化 envelope、集合白名单、目录初始化、进程内写锁和原子写入。
- `AppState` 已通过 Tauri setup 持有 JsonStorageProvider，并提供通用 read/write collection command；业务 CRUD 尚未接入。
- 已新增 settings/rules/history 只读 command；业务写入仍需通过专用 CRUD 和事务校验。
- 通用集合写入支持 `expected_revision` 乐观并发校验，冲突返回 `STORAGE_REVISION_CONFLICT`。
- 基础 Rust 脱敏核心只处理已确认 spans，生成随机 document ID/marker，支持部分还原并报告缺失 marker。
- `redact_and_persist_text` 已按 mapping 先写、history 后写的顺序持久化基础文本任务，并使用 history revision 保护追加。
- TextAdapter 已支持 TXT/CSV/Markdown 的按行 block 和 `_desensitized` + `.desens-meta` 输出；不覆盖原文件。
- 文本 `.desens-meta` 已记录源文件和脱敏文件 SHA-256；SHA-256 仅用于关联/校验。
- `document_capabilities` 已登记各格式新链路能力；未迁移的二进制格式继续走旧 FastAPI 兼容路径。
- Rust 已建立 ModelRecord、TaskStatus、TaskEvent 基础类型，并提供 models 集合只读 command。
- 本地模型注册已检查 GGUF magic、大小和 SHA-256，并写入 models 集合；完整 metadata 探测尚未实现。
- TaskManager 已提供进程内任务快照和 create/get command；任务执行器和事件持久化尚未接入。
- TaskManager 已支持 update_task 更新状态、进度和消息；未知任务不自动创建。
- create/update task 已持久化 tasks 快照并发送基础 task-event；任务执行器和检查点恢复尚未接入。
- Tauri 启动会从 tasks 集合恢复任务快照；终态任务不可由普通更新回退，真实进程恢复仍未实现。

- 项目由 Vue 3/Vite 前端和 FastAPI 后端组成，当前交付形态是浏览器应用，不是已打包的原生桌面客户端。
- 产品不含登录、访客模式、账号或多用户隔离；页头不显示运行模式状态。
- 浏览器本地存储保存敏感字段规则和最多 20 条脱敏历史；这些数据不会自动跨设备同步。
- 前端默认使用同源 `/api`；`vite.config.js` 将其代理至 `127.0.0.1:8000`，避免远端浏览器错误访问自身 localhost。
- 当前开发服务器为 `192.168.10.203:8080`，服务目录为 `/home/echowang/git/File_desensitization`；前端 Vite 对外监听 8080，后端 Uvicorn 仅监听 8000 回环地址。
- 当前远端进程是 nohup 方式启动，不会自动随机器重启恢复。
- 后端基础依赖见 `backend/requirements.txt`：FastAPI、jieba、PyPDF2、python-docx、openpyxl、pdf2docx。不要删除 `pdf2docx`，否则 PDF→DOCX 会失去可编辑转换能力。
- DOCX→PDF 依赖 LibreOffice 和 `fonts-noto-cjk`；PDF→DOCX 使用 pdf2docx。远端还装有 `poppler-utils` 供渲染校验使用。
- `backend/main.py` 中的 `_run_soffice()` 对每次请求创建独立配置目录，目的是避免 LibreOffice 并发锁；必须保留此行为。
- 敏感字段覆盖网络、电话、证件、地址/姓名、人口属性、车辆、JDBC、日期和企业标识。算法型字段会先做校验码检查。
- 品牌资源为 `public/assets/desens-shield.png` 和 `public/favicon.png`。
- `npm run build` 生成 `dist/`。2026-08-16 构建已成功；PDF.js worker 是主要体积来源。
- 测试资产只使用虚构数据；真实上传文件可能存在于 `backend/uploads/`，不得纳入版本控制或清理。
- 扩展测试样本为 `output/test-documents/敏感信息全面回归测试样本_仅虚构数据.docx`，涵盖表格、正文、重复和边界场景；2026-08-17 已在开发服务器完成 3 页中文渲染校验。
- 每次代码更新完成后必须更新 `docs/*`；浏览器冒烟优先使用 ego-browser。
# 2026-08-17：桌面发布与包体优化增量

- GitHub Actions 已成功构建并发布 `v0.1.0` 的 DMG 与 MSI；发布 job 需显式传入 `--repo "$GITHUB_REPOSITORY"`，因为 release job 默认没有 `.git`。
- Release 安装包命名统一为 `desensitization_版本号.格式`，并已修正 `v0.1.0` Release 的资产名称和校验和。
- 保留现有文档处理能力的前提下，排除了因可选 Presidio/spaCy 导入被 PyInstaller 收集的无用依赖；macOS ARM64 后端从约 115 MB 降至约 93 MB。
- `v0.1.1` 已提交至 `main`，带独立更新说明文件；尚未推送版本标签，等待发布动作。

# 2026-08-28：交互反馈与下载可靠性增量

- 下载结果统一由 `desens:download-result` 自定义事件驱动，根组件集中弹窗；页面不再各自实现下载提示。
- 下载前必须校验 Blob 非空，Download 后延迟释放 Object URL；失败不生成占位文件。
- 桌面版 DOCX 下载与还原直接改写原始 DOCX ZIP 的 `word/document.xml`、页眉和页脚 XML，不调用未打包的 FastAPI。
- 复杂格式能力未接入时必须给出信息提示，明确区分「文件已加入」与「结构化检测不可用」，不得用错误样式制造歧义。
- 版本现状：源码与 Tauri 配置均为 `0.1.1`，Git tag 已到 `v0.1.2`；发布前三者必须对齐。
- 烟测记录统一在 `docs/smoke_logs.md`；`dpcs/smoke_logs.md` 已废弃。
- 发布推送必须显式指定 `git@github.com:echohaoran/File_desensitization.git`，因为 `origin` 配置了多个 push URL。
- 用户未明确确认测试完成前，不执行 commit/push。

## 2026-08-31 增量

- 还原结果导出（Word/Excel/CSV/TXT/Markdown）统一由 `src/utils/formatExport.js` 前端本地生成；Tauri 内调用 `/api/text-to-*` 会被 SPA 回退成 index.html 占位文件，此链路已废弃。
- 本地 OOXML 导出必须通过 ZIP 签名、非空与内容抽样校验后才允许触发下载。
- 脱敏历史面板支持文件名/时间搜索与时间双向排序（默认最新在前）。
- 独立「格式转换」页面已按用户指令删除，`Convert.vue` 归档于 `trash/removed-2026-08-31/`；脱敏页内 PDF→Word 兼容流程保留。
- 本机 `bundle_dmg.sh` DMG 打包失败为 hdiutil 容量估算误报，绕行规则已固定到 `docs/troubleshoot.md`。
