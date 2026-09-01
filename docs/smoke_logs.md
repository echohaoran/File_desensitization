# 烟测日志

## 2026-08-17：扩展敏感信息 DOCX 渲染校验

- 环境：开发服务器 `192.168.10.203`，LibreOffice 与 `fonts-noto-cjk`。
- 输入：`output/test-documents/敏感信息全面回归测试样本_仅虚构数据.docx`。
- 操作：DOCX 转 PDF，使用 Poppler 将全部页面渲染为 PNG 后人工查看。
- 结果：通过。共 3 页 Letter 纸张；中文标题、表格、正文、页脚均正常，无缺字、重叠、裁切或溢出。
- 备注：样本仅含虚构数据，可用于敏感字段检测、人工复核、脱敏、历史记录和还原测试。

## 2026-08-17：Word 结构化预览烟测

- 环境：开发服务器 `http://192.168.10.203:8080/desensitize`，后端 `127.0.0.1:8000`。
- 输入：`output/test-documents/敏感信息全面回归测试样本_仅虚构数据.docx`。
- 操作：上传 Word 样本并检查接口返回的结构块、浏览器预览 DOM 和页面截图。
- 结果：通过。接口返回 31 个结构块（含 3 个表格）及 65 项后端检测；页面渲染 8 个标题、20 个段落、3 个表格和 78 个可点击脱敏标记。
- 结论：右侧预览不再将 Word 内容压平，能保留标题、段落、表格、常见字号/粗体/对齐和列表表现。

## 2026-08-17：保留格式脱敏文件烟测

- 环境：开发服务器 `192.168.10.203`，脱敏接口与浏览器页面 `http://192.168.10.203:8080/desensitize`。
- Word：扩展回归样本输出为 DOCX；28 个段落、3 个表格仍存在，65 个映射项处理后目标手机号不再出现，存在占位符。
- Excel：`excel_1_客户资料.xlsx` 输出为 XLSX；工作表 `敏感信息样本` 保留，5 个映射项处理后目标手机号不再出现，存在占位符。
- PDF：`pdf_1_客户资料.pdf` 输出为 DOCX；6 个段落保留，9 个映射项处理后目标手机号不再出现，存在占位符。
- 浏览器：Excel 上传显示 5 项检测/5 个标记；PDF 上传后自动转换为 Word，显示 9 项检测/9 个标记。
- 结果：通过。三种格式均未以纯文本替代输出，文档结构与敏感信息替换均符合预期。

## 2026-08-17：历史选择后上传还原烟测

- 环境：开发服务器 `http://192.168.10.203:8080/restore`。
- 操作：写入一条本机历史记录，选择历史记录后检查还原页面。
- 结果：通过。旧“从文件与映射表还原”入口不可见；页面提示“上传当前需要还原的脱敏文件”，并显示单一文件上传区。

## 2026-08-17：框选操作与企业证照识别修复

- 环境：开发服务器 `192.168.10.203`，前端构建通过，后端健康检查通过。
- 结果：企业统一社会信用代码格式命中时返回 `unified_social_credit_code` 候选；框选逻辑提供“脱敏”和“添加到敏感字段”两个操作，避免默认归类为普通区域。

## 2026-08-17：表格框选菜单烟测

- 操作：上传扩展 DOCX，模拟选中 `DEMO-2026-SEC-001` 文本并触发真实节点 mouseup。
- 结果：通过。选区保持，弹出“脱敏”和“添加到敏感字段”两个按钮；选择菜单前不会自动清除选区。

## 2026-08-17：开发服务器表格框选回归烟测

- 环境：`http://192.168.10.203:8080/desensitize`，ego-browser。
- 操作：上传扩展 DOCX，实际选中表格单元格中的 `fe80::1`，触发 mouseup 并等待界面渲染。
- 结果：通过。选区保持，浮窗显示“脱敏”和“添加到敏感字段”；未再出现选区被清除且无提示的问题。

## 2026-08-17：框选浮窗上方定位烟测

- 操作：在开发服务器上传扩展 DOCX，选中 `fe80::1`，检查浮窗与选区的几何位置。
- 结果：通过。浮窗显示在选区正上方（浮窗底部约距选区顶部 8px），并保持水平居中。

## 2026-08-17：浮窗可见性回归烟测

- 操作：检查选中 `fe80::1` 后浮窗的 DOM 计算样式与实际尺寸。
- 结果：修复缺失 `is-visible` 类导致的 `opacity: 0`；当前 `opacity: 1`、`visibility: visible`、按钮正常显示。

## 2026-08-17：浮窗滚动跟随烟测

- 操作：在预览滚动容器内选中 `fe80::1`，记录浮窗与选区位置，再滚动预览区域。
- 结果：通过。浮窗使用内容坐标定位，随选中文本同步滚动，并保持选区上方约 4px 间距。

## 2026-08-17：跨换行框选脱敏烟测

- 操作：选中跨文本节点/换行的内容，点击“脱敏”，检查检测项起止偏移和预览占位符。
- 结果：修复空白压缩索引回映错误；选区现在按原文起止位置替换，不再出现点击后未脱敏或替换到其他位置。

## 2026-08-17：含已有占位符的银行卡选区烟测

- 操作：选中银行卡号及同一单元格内已有占位符/后缀，点击“脱敏”。
- 结果：通过。先将选区中的占位符还原为原值再计算原文偏移，整段准确替换为 `{MANUAL_078}`，未再漂移到后方文字。

## 2026-08-17：历史清空与版本检查烟测

- 操作：检查还原页历史面板的“全部清空”按钮；点击顶部版本号并请求 `/version.json`。
- 结果：通过。历史记录可一次清空；版本号可点击检查更新，版本不一致时通过红点提示。

## 2026-08-17：结构化敏感字段识别回归烟测

- 操作：使用虚构 DOCX 调用开发服务器脱敏接口，检查 IPv6、银行卡、组织机构代码、统一社会信用代码与地址。
- 结果：IPv6 压缩格式完整识别；`4242 4242 4242 4242` 识别为银行卡；`12345678-9` 和 `91350100M000100Y43` 完整识别；省市区路号地址命中。结构化字段优先于固定电话和中文姓名启发式。

## 2026-08-17：脱敏文件占位符保留规则烟测

- 操作：生成虚构 DOCX 脱敏输出并读取首段；代码审查 DOCX、XLSX、PDF 转 DOCX、TXT 和历史记录下载路径。
- 结果：DOCX 实测首段已写入 `{字段_编号}` 原样保留规则；XLSX 在每个工作表首行写入同一规则，TXT 与历史记录下载在正文前写入同一规则，PDF 因输出 DOCX 而继承该规则。

## 2026-08-17：CNB 优先更新源烟测

- 操作：调用开发服务器 `/api/version/check`，并在前端点击版本号。
- 结果：接口返回 CNB 仓库 `main` 分支的当前/最新提交；前端显示“已从 CNB 检查：当前已是最新版本”，未显示更新红点。

## 2026-08-17：CNB 版本更新窗口烟测

- 操作：在开发服务器还原页点击品牌下方 `v0.1.0`，等待 CNB 检查完成。
- 结果：通过。更新窗口可见，显示当前修订 `e83826d`、CNB / main 来源和最近 5 条提交；“检查更新”“更新版本”“前往仓库”均存在，仓库链接指向 `https://cnb.cool/echohaoran/File_desensitization`。当前版本与 CNB 一致，状态正确显示为已是最新版本。

## 2026-08-17：桌面后端与 LibreOffice 能力烟测

- 操作：使用 PyInstaller 在 macOS Apple Silicon 构建 `desens-backend`，以随机本机端口启动二进制并调用健康接口和运行环境能力接口；在开发服务器打开格式转换页。
- 结果：通过。生成 arm64 后端二进制（约 118 MB），`/api/health` 返回 healthy，`/api/runtime/capabilities` 正确返回 LibreOffice 可用。开发服务器格式转换页未显示“缺少 LibreOffice”警告，DOCX→PDF 保持可用。

## 2026-08-17：GitHub Actions 桌面发布工作流静态校验

- 操作：检查 `.github/workflows/desktop-release.yml` 的矩阵、标签版本校验、Actions artifacts、GitHub Release 和校验和步骤；执行 `npm run build` 与 `git diff --check`。
- 结果：通过。`main` 推送将构建 macOS ARM64 DMG 和 Windows x64 MSI artifacts；`vX.Y.Z` 标签将校验版本并发布 GitHub Release。前端生产构建通过，差异无空白错误。实际 Runner 构建将在首次推送至 GitHub 后执行。

## 2026-08-17：可选更新来源与切换竞态烟测

- 操作：开发服务器分别请求 GitHub、Gitee、CNB 更新检查；打开版本窗口后，在 GitHub 初始请求未完成时立即切换到 Gitee。
- 结果：通过。三个来源均能返回预设 `main` 提交；GitHub 显示新提交 `66ac112`，Gitee/CNB 显示已是最新。切换后仅接受 Gitee 响应，页面显示 `GITEE UPDATE`、正确仓库链接及“已从 Gitee 检查：当前已是最新版本”。

## 2026-08-17：Windows 桌面前端构建故障定位与回归

- 操作：读取 GitHub Actions 失败运行 `31998112005` 的日志，随后执行 `npm run build:desktop:frontend`。
- 结果：定位到 Windows PowerShell Runner 不能由 Node 直接启动 `npm.cmd`（`spawnSync npm.cmd EINVAL`）。脚本改为 `process.execPath + npm_execpath` 后，本地桌面前端构建通过；修复将由下一次 GitHub Actions Windows Runner 构建验证。

## 2026-08-17：Windows MSI 图标链接故障修复

- 操作：读取修复后的 GitHub Actions 运行 `31998768430` 失败日志，检查 electron-builder 配置与图标资源。
- 结果：Windows 已通过桌面前端构建；MSI 的 WiX 链接因默认 Electron 图标不存在而报 `LGHT0094`。从项目盾牌 PNG 生成包含 16–256px 尺寸的 `desktop/resources/icon.ico`，并显式配置 `win.icon`；下一次 Windows Runner 将验证 MSI 产物上传。

## 2026-08-17：标签发布工作流故障定位

- 操作：推送 `v0.1.0` 标签，读取发布 job 的失败日志。
- 结果：DMG 与 MSI 均构建完成；`gh release view` 因发布 job 无 `.git` 且未指定远程仓库而失败。工作流已改为对 `view`、`upload`、`create` 全部显式传入 `$GITHUB_REPOSITORY`，修复后将重新运行该标签工作流验证 Release 资产。

## 2026-08-17：Release 资产命名规范

- 操作：调整 electron-builder 的安装包文件名模板，并核对现有 `v0.1.0` 的发布资产。
- 结果：后续构建将生成 `desensitization_版本号.dmg` 与 `desensitization_版本号.msi`；当前 Release 将同步替换为同一命名规范并重写校验和文件。

## 2026-08-17：v0.1.1 桌面包压缩与发布说明准备

- 操作：启用 electron-builder 最高压缩，调整 PyInstaller 优化与排除项，执行 `npm run build` 和差异空白检查。
- 结果：前端生产构建通过；PDF.js 大 chunk 警告保持不阻塞。排除可选 Presidio/spaCy 依赖后，本机 macOS ARM64 后端由约 115 MB 降至约 93 MB；临时启动二进制并调用 `/api/health` 通过。已为 `v0.1.1` 准备 Release 更新说明，标签构建会校验该说明文件并写入 GitHub Release 页面。
# 2026-08-18：npm 本机浏览器运行方式烟测

- 环境：macOS，本机 Node.js 与 Python 3.9；执行 `npm run setup:local` 后启动 `npm run start:local`。
- 结果：Vite 在 `http://127.0.0.1:5173/` 返回 200；FastAPI `http://127.0.0.1:8000/api/health` 返回 `status: healthy`；Ctrl+C 可同时停止服务。
- 备注：未安装 spaCy 时后端按设计回退到正则表达式和百家姓库检测；不影响基础启动。

# 2026-08-28：Vue + Rust + Tauri 基础链路烟测

- 环境：macOS；执行 `cargo test --manifest-path src-tauri/Cargo.toml --quiet` 与 `npm run build`。
- 结果：Rust 脱敏/还原、UTF-8 边界及重叠区间测试 3/3 通过；Vue 生产构建通过。
- 启动：Vite `http://127.0.0.1:5173/` 与 Tauri 开发进程均已启动，桌面测试页为 `/desktop-smoke`。
- 备注：保留 PDF.js eval 和大 chunk 非阻塞提示；未使用领域类型警告待后续命令接线。

# 2026-08-28：部分还原单元测试

- Rust 脱敏/还原测试扩展至 4 项，包含部分映射恢复与缺失标记报告，全部通过。

# 2026-08-28：阶段目标验收

- Rust 测试通过；Vue 构建通过；Vite 开发服务 HTTP 200；Tauri 开发进程持续运行。

# 2026-08-28：新架构打包验收

- 执行：`npm run tauri:build`。
- 结果：macOS `.app` 与 `.dmg` 均成功生成；双栏脱敏界面已包含在生产前端资源中。

# 2026-08-28：包窗口界面检查

- 启动正式 `.app` 后进入 `tauri://localhost/desensitize`，确认页面使用新 Tauri 入口；空状态双栏修正随后重新构建。

# 2026-08-28：无后端本地脱敏烟测

- 使用 `trash/smoke-ui/sensitive-demo.txt` 验证 Tauri 包本地识别和双栏人工确认；发现旧兼容占位符泄漏，已改为随机不可读标记。
# 2026-08-28：悬浮窗交互修复

- 菜单外 `mousedown` 关闭悬浮窗；菜单内点击保留原操作。

# 2026-08-28：设置页与模型入口烟测

- 正式 Tauri `.app` 进入 `/settings` 成功。
- 页面可见 AI 默认关闭提示、魔搭社区/Hugging Face 来源选择、四个 GGUF 模型下载入口、本地路径校验登记和任务状态区域。
# 2026-08-28：最新安装包启动烟测

- `npm run tauri:build` 成功；macOS `.app` 与 `.dmg` 均生成。
- 新 `.app` 已启动，进程正常运行；构建包含最新模型大小显示与设置页。
### GitHub Actions run 33136238637

- macOS Apple Silicon：成功，已产出 `tauri-macos-arm64`。
- Windows x64：失败，原因是 MSI/WiX `light.exe` 打包失败；已将工作流修复为 NSIS-only，等待新 run 验证。
- macOS Intel：当时仍在排队/执行中。
### 2026-08-28 多格式样本烟测

- 已生成虚构样本：`txt / csv / json / md / pdf / docx / xlsx / png / jpg`，均位于 `trash/`，未进入版本库。
- 样本包含虚构姓名、手机号、邮箱、身份证、地址和电话等候选敏感信息。
- `cargo test --manifest-path src-tauri/Cargo.toml --quiet`：4 passed。
- `npm run build`：通过。
- 当前 Tauri 本地引擎已验证文本与 PDF 基础检测路径；DOCX/XLSX/PDF 结构化输出、图片 OCR 仍需在适配器/兼容后端可用时完成端到端验证。
### 2026-08-28 本地 Tauri 打包

- `npm run tauri:build`：通过。
- `.app`：`src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`
- `.dmg`：`src-tauri/target/release/bundle/dmg/文件脱敏与还原工具_0.1.1_aarch64.dmg`
- 已启动最新 `.app`，待人工验证。
### 2026-08-28 转换修复版本地包

- Tauri 构建：通过。
- 已启动最新 `.app`，可测试 PDF↔Word 转换下载是否仍为空。
### 2026-08-28 DOCX 读取修复包

- DOCX 适配：读取正文 XML 并生成检测候选。
- Tauri `.app` / `.dmg`：打包成功，已启动等待人工测试。
## 2026-08-28：格式转换真实内容烟测

- 样本：`trash/smoke-convert/` 下虚构 PDF 与 DOCX。
- PDF→DOCX：HTTP 200，输出为 Microsoft OOXML，解压后包含虚构电话号码文本。
- DOCX→PDF：HTTP 200，输出为 PDF 文档，页数与文本转换链路正常。
- 结论：通过；修复 PyMuPDF/pdfs2docx 兼容问题，并保留复杂版式的真实文本回退。

## 2026-08-28：模型下载非阻塞烟测

- 修复同步网络请求导致界面卡死的问题，Tauri 下载命令改为异步。
- 下载按钮进入下载状态后立即显示进度条；完成后进入 GGUF 校验和登记。
- 镜像不可达或返回错误时显示失败状态，不阻塞窗口。
## 2026-08-28 AI 崩溃修复（待构建验证）

- 范围：AI 全文检测入口、进度状态、隔离推理进程。
- 已完成：源码静态检查与前端逻辑更新。
- 待完成：`cargo check`、前端构建、Tauri macOS 打包及应用启动验证。

## 2026-08-28：交接前验收复核

- 范围：前端生产构建、Rust 编译检查、Rust 单元测试、桌面包产物核对。
- `npm run build`：通过，2.8s，仅有 jszip chunk 500 kB 体积警告。
- `cargo check --manifest-path src-tauri/Cargo.toml`：通过，5 条未使用类型警告。
- `cargo test --manifest-path src-tauri/Cargo.toml --quiet`：4 passed / 0 failed。
- 产物：`src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`；`src-tauri/target/release/bundle/dmg/文件脱敏与还原工具_0.1.1_aarch64.dmg`（8674419 bytes）。
- 环境：macOS Apple Silicon，Node 22，Rust stable；本轮未重新执行 `tauri:build`，产物时间与最新源码一致。
- 结论：构建与测试通过；DOCX 端到端还原、XLSX/PDF 结构化链路仍需人工在最新 `.app` 上验证。

## 2026-08-28：下载反馈与 DOCX 脱敏回归

- 虚构样本：`trash/output/smoke-fixtures/input/word_1_customer-record.docx`。
- 本地页面成功读取 DOCX 并识别手机号、身份证、邮箱、银行卡、IPv4、MAC、日期共 7 项；确认脱敏弹窗正常出现。
- 所有生成类下载失败分支已统一改为“下载失败”弹窗；成功分支显示文件名和实际 Blob 大小。
- 历史记录未保存真实复杂格式字节时，不再生成占位 DOCX/XLSX/PDF，改为失败弹窗。
- `npm run build` 与 `npm run tauri:build`：通过；最新 `.app`、DMG 已生成。
- computer-use 能读取桌面应用状态，但本机点击通道反复断开；浏览器回退完成上传、检测和确认验证。最终桌面下载目录落盘及还原按钮仍交由用户在最新 `.app` 复核。

## 2026-08-31：全量交付回归

- 环境：macOS Apple Silicon、Vite 浏览器兼容模式、Tauri release 包；样本全部位于 `trash/output/smoke-fixtures/`，内容为虚构数据。
- DOCX：识别手机号、身份证、邮箱、银行卡、IPv4、MAC、完整日期 7 项；脱敏下载 829261 bytes；映射还原成功；还原下载 829158 bytes；成功弹窗与真实下载事件均通过。
- XLSX：修复 `t="str"` 单元格读取后识别 5 类敏感项；脱敏工作簿下载 11128 bytes；真实下载事件通过。
- 历史：复杂格式无真实字节时下载显示失败弹窗，不生成占位文件；映射表下载显示成功弹窗。
- 设置与交互：AI 开关、来源选择、模型登记/应用状态可见；普通按钮即时 Toast、下载结果弹窗、删除二次确认已接入。
- 转换：适配器不可用时显示失败弹窗且不生成文件。
- 自动验证：`npm run build` 通过；`cargo check` 通过（仅 5 条未使用类型警告）；`cargo test` 4 passed / 0 failed。
- 桌面构建：`npm run tauri:build` 通过；最新 `.app` 已启动并通过截图确认加载 Vue 3 新界面。
- 已知边界：PDF 保格式输出、图片 OCR、LoRA 和 Candle 全文推理未完成，不纳入“已通过”范围。

## 2026-08-31：历史文件再次下载

- 新建 DOCX 脱敏历史，IndexedDB 记录键为随机历史 ID，保存文件名 `redacted_word_1_customer-record.docx`。
- 历史元数据读取到真实文件大小 829261 bytes。
- 从还原页点击“下载脱敏后文件”成功，浏览器下载事件完成，接收字节 829261，成功弹窗显示 809.8 KB。
- 旧历史未保存文件索引时继续阻止伪造下载，并提示重新脱敏生成新记录。

## 2026-08-31：全部清空回归

- 使用独立端口和隔离任务空间写入 2 条虚构历史及 1 个 IndexedDB 测试 Blob。
- 点击“全部清空”后应用内确认弹窗正确显示记录数量、不可撤销提示、取消和确认操作。
- 点击“确认清空”后：页面显示暂无记录；localStorage 历史数量为 0；IndexedDB 文件数量为 0；确认弹窗关闭。
## 2026-08-31 二次确认交互烟测

- 环境：Vite `http://127.0.0.1:5175`，ego-browser 隔离任务空间。
- 脱敏：上传虚构 TXT 后弹出文件名和大小；取消后无文件/检测项，确认后得到 5 项检测；开始脱敏与重新开始均弹出确认；取消重置保留 5 项，确认重置清空。
- 还原：注入虚构本地历史，上传虚构 DOCX；取消后不接收文件，确认后文件就绪；开始还原显示映射数量确认；重新开始显示状态清理确认。
- 格式转换：上传虚构 PDF 前确认，开始 PDF 转 Word 前再次确认。
- 结果：通过。未使用真实用户文件，未执行仓库推送。
- 构建验证：Vue 生产构建通过；Rust 4 项测试通过；Tauri release 构建完成并生成 `.app` 与 `文件脱敏与还原工具_0.1.1_aarch64.dmg`；最新 `.app` 已启动。

## 2026-08-31 还原下载本地化与历史检索烟测

- 环境：Vite `http://localhost:5173`，ego-browser 隔离任务空间，虚构 CSV 样本（4 项占位映射）。
- 历史面板：搜索 `csv` 命中 1/2；无关键词显示专属空提示；排序切换“最新在前/最早在前”列表顺序正确。
- 还原流程：选择历史 → 上传确认 → 校验就绪 → 开始还原确认 → 预览显示全部还原值。
- 下载栏 5 个按钮（Word/Excel/CSV/TXT/Markdown）全部成功弹窗；落盘校验：docx/xlsx 为 PK 签名真实 OOXML 且含还原值、无残留占位符，csv 带 UTF-8 BOM，txt/md 为真实正文，均非 index.html 占位内容。
- Tauri 打包：`npm run tauri:build` 生成最新 `.app`（bundle/macos）；DMG 因本机 hdiutil 自动容量估算失败，改用 `bundle_dmg.sh --skip-jenkins --disk-image-size 128` 手动生成 17MB DMG（bundle/dmg）。
- 待用户验证：桌面 `.app` 内各格式下载、历史搜索/排序、导航已无格式转换入口、图片还原 PNG 出口。

## 2026-09-01 GitHub Release 更新入口烟测

- 环境：Vite `http://127.0.0.1:5173`，ego-browser 隔离任务空间。
- 打开顶部版本标记后，应用内版本弹窗可正常显示；浏览器兼容模式从 GitHub Releases API 获取真实最新版本，并在当前 `v0.1.7` 与远端相同时显示“当前已是最新版本”，更新按钮保持禁用。
- 构建验证：`npm run build`、`cargo check`、工作流 YAML 解析和 `git diff --check` 均通过。
- 待发布验证：需要在 `v0.1.8` tag 的 GitHub Actions 完成跨平台签名构建并发布 `latest.json` 后，再由已安装的 `v0.1.8` 应用检查下一版本的真实下载与重启流程。
- 本地签名打包：显式提供受限私钥和空密码变量后，`npm run tauri:build` 成功生成 `bundle/macos/文件脱敏与还原工具.app.tar.gz` 及同名 `.sig`；最新 `v0.1.8` `.app` 已启动。
- 回退验证：线上 `releases/latest/download/latest.json` 当前重定向到无清单的 `v0.1.7` Release；修复后使用 ego-browser 打开版本窗口，真实 Release API 返回 `v0.1.7`，本机 `v0.1.8` 显示“当前已是最新版本”，不再显示网络错误。

## 2026-09-01 macOS updater 工件发布修复烟测

- 范围：GitHub Actions macOS 发布参数、最新本地 Tauri macOS 包、版本更新入口。
- 结果：通过。按 CI 同样的 `npm run tauri:build -- --bundles dmg,app` 重新打包，生成非空 ARM64 DMG、`.app.tar.gz` 及对应 `.sig`。启动该 `.app` 后，ego-browser 打开本地页面并检查版本弹窗，显示 `v0.1.8`、GitHub Release 签名验证来源和“当前已是最新版本”。
- 发布状态：`v0.1.8` 的既有 GitHub Actions run 已因旧工作流失败；修复尚待用户确认提交后使用新 tag 重新触发跨平台发布。

## 2026-09-01 v0.1.9 发布前复验

- 环境：macOS Apple Silicon、本地签名密钥、Tauri release 包、ego-browser。
- 结果：通过。`npm run tauri:build -- --bundles dmg,app` 生成非空 `0.1.9` ARM64 DMG、`.app.tar.gz` 与 `.sig`；启动新应用后，浏览器确认标题版本为 `v0.1.9`，版本弹窗显示 GitHub Release 签名验证来源及“当前已是最新版本”。

## 2026-09-01 Beta 标识烟测

- 范围：前端版本标记、GitHub Release 包命名、macOS 签名打包。
- 结果：通过。ego-browser 打开首页确认左上角显示 `v0.1.9 Beta`；前端构建和工作流 YAML 校验通过。重新执行签名 `dmg,app` 打包后，DMG、`.app.tar.gz` 与 `.sig` 均为非空。CI 发布名与 updater manifest 已统一改为 `local_desens_beta_<平台>_<架构>`。

## 2026-09-01 三平台 Release 矩阵烟测

- 范围：GitHub Actions 发布矩阵、签名更新清单、首页可访问性。
- 结果：通过。工作流 YAML 解析成功；矩阵与 `latest.json` 仅包含 macOS ARM64、Windows x64、Linux x64，未残留 macOS Intel 或 `darwin-x86_64` 条目。ego-browser 确认首页、五个导航入口与 `v0.1.9 Beta` 版本标记正常。随后完成本地签名 `dmg,app` 打包并启动最新应用，DMG、更新归档和签名文件均非空。

## 2026-09-01 v0.1.10 三平台发布前烟测

- 环境：macOS Apple Silicon、本地签名密钥、Tauri release 包、ego-browser。
- 结果：通过。前端构建、工作流 YAML 和三平台清单校验通过；签名 `dmg,app` 打包生成非空 `0.1.10` ARM64 DMG、`.app.tar.gz` 与 `.sig`。启动新应用后，ego-browser 确认左上角显示 `v0.1.10 Beta`，五项主导航均存在。

## 2026-09-01 v0.1.11 Release 清单修复烟测

- 环境：macOS Apple Silicon、本地签名密钥、Vite `http://127.0.0.1:5174`、ego-browser。
- 范围：GitHub Actions Release 清单、前端版本标记、五项主导航、本地更新包。
- 结果：通过。工作流 YAML 可解析；Linux `updater_name`、签名读取路径和 `linux-x86_64` 下载 URL 均为 `local_desens_beta_linux_amd64.AppImage`，不再残留错误的 `linux_x64` AppImage 名称。`npm run build` 与 `cargo check` 均通过。
- 打包：执行签名 `npm run tauri:build -- --bundles dmg,app`，生成非空 `0.1.11` ARM64 DMG、`.app.tar.gz` 与 `.sig`，并启动最新 `.app`。
- 浏览器：ego-browser 确认首页显示 `v0.1.11 Beta`；概览、脱敏、还原、敏感字段、设置五个路由均可进入且存在主内容区域。

## 2026-09-01 还原历史映射兼容烟测

- 环境：Vite `http://127.0.0.1:5174`、ego-browser；样本位于 `trash/smoke-ui/restore-v011-fake.md`，仅含虚构手机号和占位符。
- 范围：还原页历史选择、上传二次确认、开始还原二次确认、旧映射数字 ID 兼容与文本恢复。
- 结果：通过。注入含数字 ID 的虚构历史映射后，上传 `{SMOKE_PHONE}` 文本并确认还原，页面显示恢复后的 `13800138000`、完成反馈和下载入口；页面未出现 `Rust 还原失败：undefined`。
- 同步验证：`npm run build`、`cargo test --manifest-path src-tauri/Cargo.toml`（4 passed）和 `git diff --check` 均通过。
- 测试包：签名 `dmg,app` 打包通过；`bundle/macos/文件脱敏与还原工具.app`、`bundle/dmg/文件脱敏与还原工具_0.1.11_aarch64.dmg`、`.app.tar.gz` 与 `.sig` 均为非空，最新 `.app` 已启动。

## 2026-09-01 还原上传卡片布局烟测

- 环境：Vite `http://127.0.0.1:5174`、ego-browser；虚构历史和 `trash/smoke-ui/restore-v011-fake.md`。
- 结果：通过。确认上传后，上传区已从 DOM 移除并由文件卡片替换；文件卡片边界完全位于右侧“上传待还原的脱敏文件”卡片内，且与“已选择历史记录”横幅的边界无重叠。
