# 开发交接记录

## 2026-08-31：GitHub 发布命名更新

- 计划发布 tag：`v0.1.3`；源码版本统一更新为 `0.1.3`。
- 发布矩阵：macOS ARM64 DMG、macOS Intel DMG、Windows x64 MSI、Linux x64 DEB。
- Release 文件使用 `local_desens_系统_架构_<平台>.<格式>`，保留双 macOS 架构后缀以避免资产同名覆盖。
- 用户明确授权本轮提交、打 tag 与推送；推送后必须用 ego-browser 监控构建与 Release 状态。


## 2026-08-31 10:5x：还原下载本地化交接快照

### 本轮完成

- 还原结果下载全部改为前端本地生成：新增 `src/utils/formatExport.js`，TXT/CSV/Markdown 用 Blob，DOCX/XLSX 用 JSZip 生成真实 OOXML，输出前做 ZIP 签名、非空与内容抽样校验；Tauri 页面不再调用未打包的 FastAPI `/api/text-to-*`，消除占位示例文件根因（SPA 回退返回 index.html）。
- 下载栏新增「表格 CSV」；Excel 源还原后提取真实单元格文本供文本导出与预览；图片还原改为「图片 PNG」出口。
- 脱敏历史面板新增搜索（文件名/时间）与时间排序切换，默认最新在前。
- 按用户指令删除独立「格式转换」页面：路由 `/convert`、导航入口移除；`Convert.vue`（含未提交改动）归档 `trash/removed-2026-08-31/`；脱敏页内 PDF→Word 兼容流程与后端接口保留。

### 验证与产物

- `npm run build` 通过；Node 直测 formatExport 输出为真实 PK 签名文档包。
- ego-browser 烟测（Vite 5173、虚构 CSV 样本）：搜索/排序/还原流程/5 个下载按钮全通过，落盘文件逐一校验为真实内容。
- `npm run tauri:build` 生成最新 `.app`；DMG 因本机 hdiutil 容量估算误报失败，按 `docs/troubleshoot.md` 新规则用 `bundle_dmg.sh --skip-jenkins --disk-image-size 128` 手动生成 17MB DMG。
- 产物：`src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`（10:30 构建；曾启动供用户验收，交接核对时进程已退出）、`bundle/dmg/文件脱敏与还原工具_0.1.1_aarch64.dmg`（10:41）。

### Git 状态

- 分支 `main`，HEAD `9af66b7`；工作区未提交改动约 24 个文件（+994/-284，含本轮），`Convert.vue` 删除与 `App.vue`/`router` 修改已暂存。
- 未跟踪源码：`src/utils/appConfirm.js`、`src/utils/historyFiles.js`、`src/utils/formatExport.js`（均为正式源码，待提交）。
- `dpcs/smoke_logs.md` 保持既有删除状态；发布推送必须显式使用 `git@github.com:echohaoran/File_desensitization.git`。
- 未执行 commit/push，等待用户验收。

### 待用户验收

1. 桌面 `.app`：还原页 5 个格式下载（可用 `~/Downloads/restored_脱敏测试数据.*` 复核）、图片还原 PNG 出口。
2. 脱敏历史搜索与排序。
3. 顶部导航已无「格式转换」。

### 尚未完成（不得虚报）

- PDF 保格式 Rust 适配器、图片 OCR、LoRA 后训练、Candle 全文推理未达交付标准。
- 版本号未对齐：源码/Tauri 配置 0.1.1，tag 已到 v0.1.2。

### 下一步

1. 用户在 `.app` 上验收；有问题修复后重新打包复测。
2. 用户明确「测试完成/可以推送」后整理工作区提交并推送。

## 2026-08-31 09:4x：接手快照

### 接手背景

- 收到「接手」指令，本轮仅完成状态核验与交接记录，未改动源码、未执行 commit/push。

### 当前项目状态

- 主架构：Vue 3 + Rust + Tauri 2；旧 Vue + FastAPI + Electron 保留为兼容链路，未经确认不得删除。
- 分支 `main`，HEAD `9af66b7 ci(release): publish desktop packages on version tags`。
- 版本：源码与 Tauri 配置均为 `0.1.1`；Git tag 已到 `v0.1.2`，发布前必须对齐三者。
- 最新构建产物（2026-08-31 09:34/09:35）：
  - `.app`：`src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`
  - `.dmg`：`src-tauri/target/release/bundle/dmg/文件脱敏与还原工具_0.1.1_aarch64.dmg`（约 8.3 MB）
- 桌面 `.app` 当前未运行；本机仅有多个 Vite 开发服务进程（127.0.0.1 与 5174 端口）。

### 待用户验收的最近改动

- 全局应用内二次确认（`src/utils/appConfirm.js` + 根组件 alertdialog）：文件上传、拖拽上传、脱敏/AI 检测/还原/格式转换开始、两个主流程“重新开始”均在读取/执行前要求确认；取消保留状态。
- 历史真实文件持久化：IndexedDB `desens_history_files` 保存真实 Blob，`localStorage` 仅存索引；删除/清空同步清理 IndexedDB。
- 全链路真实性与交互：DOCX/XLSX 本地 OOXML ZIP 写回、统一下载成功/失败弹窗、普通按钮即时 Toast。
- 以上均已通过 `npm run build`、`cargo test`（4 passed）、ego-browser 二次确认烟测、`npm run tauri:build`；等待用户在最新 `.app` 上人工验收。

### Git 工作区

- 未提交修改 18 个文件（+920/-290）：`AGENTS.md`、`README.md`、`src/App.vue`、`src/utils/sensitiveRules.js`、五个视图页、`docs/*` 等。
- 未跟踪：`.workbuddy/`、`src/utils/appConfirm.js`、`src/utils/historyFiles.js`（后两者为正式源码，待提交）。
- `dpcs/smoke_logs.md` 处于既有删除状态（历史遗留路径），不要恢复、删除或提交，除非用户明确指定。
- `uploads/`、`trash/`、`src-tauri/target/` 已忽略，不进入版本控制。
- 远端 `origin` 配置多个 push URL；发布/推送必须显式使用 `git@github.com:echohaoran/File_desensitization.git`。

### 尚未完成（不得虚报）

- PDF 保格式 Rust 适配器、图片 OCR、LoRA 后训练、Candle 全文推理未达交付标准。
- 发布前版本号（源码 0.1.1 / tag v0.1.2）尚未统一。

### 下一步

1. 等用户对二次确认体验与最近回归给出验收结论。
2. 用户反馈问题则修复并重新 `npm run tauri:build` 后交给用户复测。
3. 用户明确“测试完成/可以推送”后再整理工作区改动并提交推送。

## 2026-08-31：二次确认交接快照

### 本轮完成

- 新增 `src/utils/appConfirm.js` 与根组件应用内确认框；不依赖 WebView 原生 `window.confirm`。
- 脱敏、还原、格式转换的文件选择与拖拽上传均在读取前要求二次确认。
- 确认脱敏、AI 全文检测、开始还原、开始格式转换和两个主流程的“重新开始”均要求二次确认；取消保持当前数据与流程状态。
- 所有变更已同步记录到 `AGENTS.md`、`docs/context.md`、`docs/decisions.md`、`docs/todo.md`、`docs/troubleshoot.md` 和 `docs/smoke_logs.md`。

### 验证与产物

- `npm run build`：通过；仅保留 PDF.js 体积告警。
- `cargo test`：4 passed / 0 failed；仍有既有未使用类型警告。
- ego-browser 交互烟测：使用 `trash/` 中虚构 TXT/PDF/DOCX，验证上传取消/确认、脱敏开始、还原开始、转换开始与重新开始确认；通过。
- `npm run tauri:build`：通过并生成最新 `.app` 和 ARM64 `.dmg`；最新应用已启动。
- 当前可测试应用：`src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`。
- 当前可测试安装包：`src-tauri/target/release/bundle/dmg/文件脱敏与还原工具_0.1.1_aarch64.dmg`。

### 当前 Git 与注意事项

- 分支：`main`；HEAD：`9af66b7 ci(release): publish desktop packages on version tags`。
- 工作区包含本轮与前序未提交改动，且有未跟踪 `.workbuddy/`、`src/utils/appConfirm.js`、`src/utils/historyFiles.js`。
- `dpcs/smoke_logs.md` 处于既有删除状态；不要擅自恢复、删除或提交，除非用户明确指定。
- 用户尚在本地测试阶段，未获得“测试完成/允许推送”授权：不得提交或推送。

### 下一步

1. 等待用户验证最新应用中的二次确认体验。
2. 若用户反馈问题，优先在统一确认组件或对应流程入口修复并重新打包。
3. 用户明确确认后，审查工作区中前序改动与既有删除项，按用户授权范围提交并推送。

## 2026-08-28 16:10：当前交接快照

### 当前目标与状态

- 主架构：Vue 3 + Rust + Tauri 2；旧 Vue + FastAPI + Electron 仅保留兼容链路，未经确认不得删除。
- 版本状态：`package.json` 与 `src-tauri/tauri.conf.json` 仍为 `0.1.1`，Git 已有 tag `v0.1.2`；版本号尚未统一升级，发布前必须对齐三者。
- 本轮主题：交互反馈与下载可靠性——全局 Toast、统一“下载已完成/下载失败”弹窗、DOCX 本地 ZIP 写回、空 Blob 校验。

### 本轮未提交改动

- `src/App.vue`：新增全局 Toast 提示、统一“下载已完成/下载失败”弹窗（监听 `desens:download-result`，显示文件名与大小）、普通按钮点击即时反馈。
- `src/views/Desensitize.vue`、`Restore.vue`、`Convert.vue`、`Settings.vue`：接入下载结果事件、加载态与失败提示。
- `docs/*`：同步 `README.md`（根）、`context.md`、`handoff.md`、`readme.md`、`troubleshoot.md`。
- 删除遗留的 `dpcs/smoke_logs.md`；烟测记录统一落在 `docs/smoke_logs.md`，不要恢复旧路径。

### 已完成验证（2026-08-28 16:08）

- `npm run build`：通过，耗时约 2.8 秒；仅有 jszip chunk 超过 500 kB 的体积警告，不影响产物。
- `cargo check --manifest-path src-tauri/Cargo.toml`：通过，仅有 5 条未使用类型警告。
- `cargo test --manifest-path src-tauri/Cargo.toml --quiet`：4 passed / 0 failed。
- `npm run tauri:build`：本轮产物时间与最新源码一致，未重新打包。
- 最新应用：`src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`。
- 最新 DMG：`src-tauri/target/release/bundle/dmg/文件脱敏与还原工具_0.1.1_aarch64.dmg`（约 8.7 MB）。
- 虚构样本 `trash/output/smoke-fixtures/input/word_1_customer-record.docx` 经桌面 UI 完成检测与下载，输出 `/Users/echowang/Downloads/redacted_word_1_customer-record.docx` 829241 bytes，不再是 666 字节空白容器。

### 需要继续验证

- DOCX 完整闭环：脱敏下载 → 还原页选择对应历史 → 上传脱敏 DOCX → 还原 → 下载 → 解压检查 `word/document.xml`，确认原值恢复且占位符清零。
- 在最新 `.app` 中验证统一“下载已完成/下载失败”弹窗的实际表现。
- XLSX/PDF 的 Tauri 原生结构化脱敏与还原尚未达到 DOCX 同等完整度；不得宣称全部复杂格式已完成。
- 历史记录只保存映射和 `redacted_text`，不能凭历史重建原格式 DOCX；真实 DOCX 还原必须上传脱敏后的 DOCX。

### Git 状态

- 当前分支：`main`，与 `origin/main` 同步于 `9af66b7 ci(release): publish desktop packages on version tags`。
- 未提交修改：`README.md`、`docs/context.md`、`docs/handoff.md`、`docs/readme.md`、`docs/troubleshoot.md`、`src/App.vue`、`src/views/Convert.vue`、`src/views/Desensitize.vue`、`src/views/Restore.vue`、`src/views/Settings.vue`。
- 未提交删除：`dpcs/smoke_logs.md`（遗留路径，不要恢复）。
- 无未跟踪文件；`uploads/`、`trash/`、`src-tauri/target/` 已被忽略，不进入版本控制。
- 远端：`origin` 配置了多个 push URL。发布时显式使用 `git@github.com:echohaoran/File_desensitization.git`，避免误推镜像。
- 未收到用户明确“测试完成/可以推送”确认前，不执行 commit/push。

### 下一步建议

1. 先用最新 `.app` 完成 DOCX 端到端还原验证，并检查生成文件内部 XML。
2. 根据验证结果修复残余占位符或映射字段兼容问题。
3. 补齐 XLSX/PDF 本地适配器及可重复自动化测试。
4. 用户确认后再整理提交并推送；发布时统一更新 `package.json`、Tauri 配置和 tag 版本。

## 2026-08-28 15:59：DOCX 下载与交互反馈交接

### 上一轮目标与状态

- 主架构：Vue 3 + Rust + Tauri 2；旧 Electron/FastAPI 仅保留兼容链路。
- 当前版本：源码配置仍为 `0.1.1`，Git tag 已存在 `v0.1.2`；版本号尚未统一升级。
- 本轮重点修复了 Tauri DOCX 脱敏下载、DOCX 本地还原、按钮交互反馈和统一下载结果弹窗。
- 所有 Blob 文件下载入口会显示成功/失败弹窗；成功弹窗显示文件名和大小，模型下载也会显示校验结果。

### 已完成验证

- `npm run build`：通过。
- `cargo check --manifest-path src-tauri/Cargo.toml`：通过，仅有未使用类型警告。
- `npm run tauri:build`：通过。
- 最新应用：`src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`。
- 最新 DMG：`src-tauri/target/release/bundle/dmg/文件脱敏与还原工具_0.1.1_aarch64.dmg`。
- 使用虚构样本 `trash/output/smoke-fixtures/input/word_1_customer-record.docx` 经桌面 UI 完成检测、确认和下载。
- 下载结果 `/Users/echowang/Downloads/redacted_word_1_customer-record.docx` 大小为 829241 bytes，不再是 666 字节空白容器。

### 需要继续验证

- 在最新构建中再次验证统一“下载已完成/下载失败”弹窗。
- 完成完整 DOCX 闭环：脱敏下载 → 还原页选择对应历史 → 上传脱敏 DOCX → 开始还原 → 下载还原 DOCX → 解压检查 `word/document.xml`，确认原值恢复且占位符清零。
- XLSX/PDF 的 Tauri 原生结构化脱敏与还原尚未达到 DOCX 同等完整度；不得宣称全部复杂格式已完成。
- 历史记录当前主要保存映射和 `redacted_text`，不能仅凭历史重建原格式 DOCX；真实 DOCX 还原必须上传脱敏后的 DOCX。

### Git 状态

- 当前分支：`main`。
- HEAD：`9af66b7 ci(release): publish desktop packages on version tags`。
- 未提交修改：`README.md`、`docs/context.md`、`docs/readme.md`、`docs/troubleshoot.md`、`docs/handoff.md`、`src/App.vue`、`src/views/Convert.vue`、`src/views/Desensitize.vue`、`src/views/Restore.vue`、`src/views/Settings.vue`。
- `dpcs/smoke_logs.md` 为此前遗留删除状态，不要擅自恢复或提交。
- 未收到用户明确测试完成/允许推送前，不执行 commit/push。

### 下一步建议

1. 先用最新 `.app` 完成 DOCX 端到端还原验证，并检查生成文件内部 XML。
2. 根据验证结果修复残余占位符或映射字段兼容问题。
3. 补齐 XLSX/PDF 本地适配器及可重复自动化测试。
4. 用户确认后再整理提交并推送；发布时统一更新 `package.json`、Tauri 配置和 tag 版本。

- 前端进度：已新增 `tauriBridge.js` 和 Tauri runtime 检测；现有页面尚未整体切换，浏览器兼容链路保持不变。
- 前端进度更新：新增 `/desktop-smoke` 测试页，覆盖新 command 的基础调用；只使用虚构文本，未替换现有生产工作流。

## 2026-08-28：Tauri 架构设计交接

- 已确认下一代架构为 Vue 3 + Rust + Tauri；当前代码尚未迁移，本轮仅同步设计文档。
- 交互要求：脱敏页左原右脱敏，右侧只允许选区操作；规则、Rust 和 AI 检测均必须人工确认。
- 标记要求：DOCX/XLSX/PDF 底部追加明文标记页/标记区；JSON/TXT/CSV/Markdown 输出 `.desens-meta` 伴随标记文件。
- 还原要求：跨设备使用脱敏文件 + 映射数据；完整脱敏库包使用 AES-256-GCM 加密，需 `.p12` 和密码，SHA-256 仅校验。
- 数据要求：第一阶段版本化 JSON；规则、标注、历史和映射可完整导出导入；暂不使用 Redis 作为单机主存储。
- AI 要求：模型统一 GGUF，不打入安装包；AI 默认关闭，仅处理用户选区；LoRA 训练任务固定一个基础模型。
- 协议草案：格式文件末尾写入明文随机文档标记，纯文本/结构化文本使用 `.desens-meta`；完整脱敏库为 AES-256-GCM 加密的 `.dlib`，使用 `.p12` + 密码解密。
- 接口设计：Vue 通过版本化 Tauri command DTO 调用 Rust；Rust 按 commands/domain/application/document/storage/crypto/inference/training 分层，长任务通过统一事件报告状态。
- DTO 设计：command 统一使用 `schema_version`、`request_id`、`success`；错误含稳定 code/message/details/retryable；长任务使用 `task-event` 事件，禁止输出敏感原文和密钥。
- 存储设计：规则、历史、映射、标注、模型和训练任务分文件保存为 JSON envelope；通过 `StorageProvider` 抽象实现原子写入、schema 迁移、写锁和导入冲突策略。
- 文档设计：所有格式通过 `DocumentAdapter` 统一处理；纯文本/结构化文本使用 `.desens-meta`，DOCX/XLSX/PDF 分别使用底部标记区、元数据工作表和末尾标记页。
- 安全协议：`.dlib` 每包使用随机 AES-256-GCM 密钥和 nonce，AES 密钥由 `.p12` 中 RSA 公钥以 OAEP-SHA-256 包装；证书密码只保护 `.p12` 私钥，SHA-256 只做指纹和传输校验。
- 模型设计：魔搭/Hugging Face/本地文件通过 `ModelProvider` 安装 GGUF；下载需断点续传、SHA-256 和兼容性校验，AI 通过 `InferenceRuntime` 仅处理用户选区并返回待审核候选。
- 训练设计：标注数据使用不可变 dataset revision；LoRA 任务固定基础模型/数据集/配置，暂停依赖检查点，产物先注册为 adapter，评估通过后才允许合并 GGUF 或设为候选推理模型。
- 评估设计：测试集按来源文件指纹隔离，报告 PII 实体指标与资源指标；规则/AI 冲突不自动覆盖，模型需评估并由用户确认后才能 active。
- 开工状态：核心架构设计已完成，可以开始 Tauri/Rust 项目骨架与 domain DTO 实现；具体 crate 和运行时后端在实现阶段通过技术验证确定。
- 当前实现：已新增 `src-tauri/` Tauri 2 骨架、基础 domain DTO、结构化错误和 health command；现有 Electron/FastAPI 链路保持不变。
- 当前存储：已新增第一版 `JsonStorageProvider`，可初始化数据目录并对允许集合执行版本化 JSON 原子读写。
- 当前存储进度：provider 已接入 Tauri managed state，并提供通用集合读写 command；下一步实现 settings/rules/history 专用 CRUD。
- 当前 command 进度：已增加 `list_settings`、`list_rules`、`list_history` 只读 command；写入和删除仍未开放。
- 通用写入 command 已增加可选 `expected_revision`，用于乐观并发校验；专用 CRUD 仍待实现。
- 脱敏进度：已实现审核后文本 span 的 Rust 脱敏/还原核心和对应 command；尚未持久化映射或接入真实文件格式。
- 脱敏进度更新：基础文本 mapping 已写入 `mappings/`，history 摘要按 revision 追加；真实文件输出和适配器仍待实现。
- 脱敏进度更新：已增加 TXT/CSV/Markdown 文本适配器和 `redact_text_file`，可生成 `_desensitized` 文件及 `.desens-meta`；mapping 与 SHA-256 尚未绑定到文件输出。
- 脱敏进度更新：文本 `.desens-meta` 已绑定 source/redacted SHA-256；mapping 仍需后续接入文件输出与历史记录。
- 模型/任务进度：已建立模型记录、任务状态/事件类型和 `list_models` command；具体模型 Provider、推理和训练实现仍待接入。
- 模型/任务进度更新：已增加本地 GGUF magic/大小/SHA-256 校验和 `register_local_model`，成功记录进入 models 集合。
- 格式进度：已增加 `document_capabilities`，新 Rust 链路明确区分已接入文本格式和待迁移 JSON/DOCX/XLSX/PDF；旧 FastAPI 格式链路保持可用。
- 任务进度更新：已增加进程内 TaskManager、TaskSnapshot 和 create/get task command；事件广播、长任务执行和恢复仍待实现。
- 任务进度更新：已增加 `update_task`，可更新任务状态、进度和消息；事件广播、长任务执行、暂停/恢复和持久化仍待实现。
- 任务进度更新：create/update 已持久化 tasks 快照并发送基础 `task-event`；长任务执行、取消、检查点和重启恢复仍待实现。
- 任务进度更新：Tauri 启动已加载 tasks 快照，终态任务不可回退；真实执行进程和检查点恢复仍待实现。
- 验证状态：Rust 格式化和差异检查通过；因当前环境无法访问 crates.io/npm 镜像，`cargo check` 与 `package-lock.json` 更新待依赖网络恢复后完成。

## 2026-08-18：当前交付方式

- 普通用户改用 `scripts/install-from-source.sh`，通过 curl 下载源码，再执行 npm 与 Python 本机安装。
- 启动命令为 `npm run start:local`，浏览器入口为 `http://localhost:5173`，后端仅监听 `127.0.0.1:8000`。
- `.github/workflows/desktop-release.yml` 已删除，停止 GitHub Actions 的 DMG/MSI 自动打包流程。
- Electron + PyInstaller 文件和旧版 Release 记录保留为历史资料；未签名公证的 macOS DMG 不再作为推荐交付物。

更新时间：2026-08-16

## 当前可运行状态

- 前端：Vue 3 + Vite，页面包括概览、脱敏、还原、敏感字段、格式转换。
- 后端：FastAPI，主路由在 `backend/main.py`，识别与文件处理核心在 `backend/desensitization_service.py`。
- 当前开发服务器：`http://192.168.10.203:8080/`。
- 远端目录：`/home/echowang/git/File_desensitization`。
- 远端前端：Vite 监听 `0.0.0.0:8080`；后端：Uvicorn 监听 `127.0.0.1:8000`，由 Vite 将 `/api` 代理到后端。
- 2026-08-16 已检查远端 `/api/health` 为 200，前后端进程均在运行。

## 关键文件与入口

| 位置 | 说明 |
| --- | --- |
| `src/App.vue` | 页头与全局布局。 |
| `src/router/index.js` | 路由定义。 |
| `src/api/desensitization.js` | 前端 API 契约；默认同源 `/api`。 |
| `src/views/Desensitize.vue` | 脱敏工作流与人工复核。 |
| `src/views/Restore.vue` | 映射表/历史记录还原。 |
| `src/views/SensitiveRules.vue` | 内置与自定义敏感字段管理。 |
| `src/views/Convert.vue` | PDF/Word 转换页面。 |
| `src/utils/sensitiveRules.js` | 内置规则、合并、编辑和本机存储逻辑。 |
| `backend/main.py` | FastAPI 路由、转换接口和 LibreOffice 调用。 |
| `backend/desensitization_service.py` | 识别、脱敏、映射和文件解析逻辑。 |
| `scripts/start.sh` | 本地前后端启动入口。 |

## 本机存储键

- `desens_sensitive_rules`：自定义规则和内置规则状态。
- `desens_deleted_builtin_rules`：被用户删除的内置规则 ID。
- `desens_history`：最多 20 条脱敏历史。

## 格式转换实现与依赖

- PDF→DOCX：`/api/pdf-to-word`，依赖公开 PyPI 可安装的 `pdf2docx==0.5.8` 及其 PyMuPDF、OpenCV 等依赖；输出应包含可编辑文字、表格和图片。
- DOCX→PDF：`/api/word-to-pdf`，依赖系统 `soffice`；`_run_soffice()` 使用临时 LibreOffice 用户配置，勿改回共享默认配置。
- 远端已安装 `libreoffice-writer`、`fonts-noto-cjk`、`poppler-utils`；Python 依赖安装使用华为镜像可避免默认索引超时。
- 2026-08-14 已用公司目录中的 1.2 MB 原始工作联系函 DOCX 验证 DOCX→PDF：输出 2 页 A4，中文、表格、图片正常。
- 2026-08-14 已用同名 PDF 验证 PDF→DOCX：输出包含可编辑 XML 文本、表格和图片对象；复杂版式可能轻微偏移。

## 构建与部署

```bash
# 本地前端生产构建
npm run build

# 本地开发启动
bash scripts/start.sh

# 健康检查
curl http://localhost:8000/api/health
```

- `npm run build` 已于 2026-08-16 成功，产物位于 `dist/`，约 3.5 MB。
- Vite 会提示 PDF.js worker 包较大；这是性能优化项，不影响构建结果。
- 远端服务当前以 `nohup` 进程运行，未配置 systemd 或开机自启。若需长期运行，应补充受管服务单元或原生桌面打包方案。
- 项目已移除 Docker/Compose、容器脚本和旧测试脚本；不要恢复或依赖这些文件。

## 测试资产

- `output/smoke-fixtures/`：PDF、Word、Excel 各 3 份虚构样本及对应脱敏、还原、映射结果。
- `output/test-documents/敏感信息综合测试样本_仅虚构数据.docx`：覆盖网络、联系方式、证件、银行卡、地址、车辆、企业标识、JDBC 和日期等字段；全部内容为虚构测试数据。
- `output/test-documents/敏感信息全面回归测试样本_仅虚构数据.docx`：扩展为 3 页，增加多场景正文、重复命中、边界标点和自定义关键词测试；2026-08-17 已在开发服务器完成中文渲染校验。
- 调试、部署或提交时不得移动、删除或提交 `backend/uploads/` 中的真实上传内容。

## 后续开发优先项

1. 若目标是“桌面客户端”，先选定 Electron、Tauri 或等价框架，并设计本地后端进程生命周期；当前只有浏览器前端生产包。
2. 为远端服务新增 systemd/守护配置、日志轮转和受控重启方案。
3. 收紧 CORS，并增加认证、上传限制、恶意文件扫描、结果加密和访问控制。
4. 将 PDF.js worker 拆分或按需加载，降低首屏构建警告和下载体积。
5. 为转换、规则管理、历史还原和敏感字段校验增加可重复自动化测试。
# 2026-08-17：GitHub Actions 桌面发布交接

- 已建立 Electron + PyInstaller 桌面端骨架；后端仅监听本机回环地址，LibreOffice 为仅 DOCX→PDF 所需的外部可选组件。
- 新增 `.github/workflows/desktop-release.yml`：推送 `main` 构建 macOS ARM64 DMG 与 Windows x64 MSI Actions artifacts；推送与 `package.json` 一致的 `vX.Y.Z` 标签时，自动创建 GitHub Release 并上传安装包和 `SHA256SUMS.txt`。
- 已在 macOS Apple Silicon 本机构建并运行 PyInstaller 后端健康检查；Windows MSI 由 GitHub Windows Runner 首次执行时验证。
- GitHub 推送地址为 `git@github.com:echohaoran/File_desensitization.git`。由于 `origin` 配置了多个 push URL，发布时必须使用该完整地址，避免同时推送到其他镜像。
- 本次提交不包含 `tmp/` 下的真实上传文件、渲染缓存或本地构建缓存；测试样本仅保留虚构数据。

# 2026-08-17：v0.1.1 精简发行包交接

## Git 状态

- 当前 `main`：`77bdcf5 release: 准备 v0.1.1 精简桌面包`。
- `v0.1.0` 已发布：Release 资产已更正为 `desensitization_0.1.0.dmg`、`desensitization_0.1.0.msi` 与 `SHA256SUMS.txt`。
- `tmp/` 为未跟踪的真实上传/渲染临时文件，严禁提交、同步或删除。

## v0.1.1 已完成内容

- `package.json` / `package-lock.json` 已升级到 `0.1.1`；桌面安装包命名模板为 `desensitization_${version}.${ext}`。
- electron-builder 使用 `compression: maximum`；PyInstaller 使用 `--optimize 2`，并排除未在生产功能中启用的 Presidio/spaCy、测试、交互式和数据分析依赖。
- 保留 `jieba`、`pdf2docx`、OpenCV、DOCX、XLSX 等实际功能依赖；DOCX→PDF 仍需用户自行安装 LibreOffice。
- 本机 macOS ARM64 后端从约 115 MB 降至约 93 MB；二进制启动后 `/api/health` 烟测通过。前端 `npm run build` 通过（PDF.js worker 大 chunk 警告未阻塞）。
- 新增 `docs/releases/v0.1.1.md`。工作流在标签发布时要求对应更新说明文件，并将其写入 GitHub Release 页面。

## 待完成发布步骤

```bash
git tag -a v0.1.1 -m "文件脱敏与还原工具 v0.1.1"
git push git@github.com:echohaoran/File_desensitization.git v0.1.1
```

- 标签工作流会构建 `desensitization_0.1.1.dmg`、`desensitization_0.1.1.msi` 并创建带版本更新说明的 GitHub Release。
- 发布后应下载两份安装包，在 macOS Apple Silicon 与 Windows x64 真机完成安装、启动、脱敏和还原回归；代码签名与 macOS Notarization 尚未配置。
### 当前交付约定

- 代码修改后的构建产物先交给用户本地测试。
- 未收到“测试完成/可以推送”等明确确认前，不执行 `git push`。
- CI 交付：Windows 使用 MSI，macOS 生成 Apple Silicon/Intel DMG；推送后需在 GitHub Actions 核验三项任务和 artifacts。
# 2026-08-28 下载反馈修复补充

- 复杂格式历史记录不再伪造可下载文件；只有脱敏阶段基于原始 ZIP/二进制生成的文件可作为真实脱敏文件。
- DOCX 本地样本已验证上传、7 项检测与人工确认流程；成功/失败下载均使用全局结果弹窗。
- 最新 macOS `.app` 与 DMG 已重新打包，尚未提交或推送，等待用户人工测试反馈。

## 2026-08-31 交付回归快照

- DOCX 脱敏/还原真实文件闭环与 XLSX 结构化脱敏下载已通过。
- 所有下载入口已统一结果弹窗，普通按钮有即时反馈，破坏性操作有确认。
- 最终源码重新执行 Tauri 打包并启动后交由用户测试，用户确认前不得 push。
- 尚未完成且不得虚报：PDF 保格式 Rust 适配器、图片 OCR、LoRA 后训练、Candle 全文推理。
