# 开发交接记录

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
