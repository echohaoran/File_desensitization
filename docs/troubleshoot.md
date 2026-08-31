# 故障排查

- 浏览器中出现“当前不是 Tauri 桌面运行环境”是预期行为；使用 Tauri 时再调用 bridge。
- 新链路测试从 `/desktop-smoke` 进入；若脱敏报区间无效，检查输入是否使用 Rust UTF-8 字节偏移。

## 跨设备还原失败

- 确认脱敏文件、映射数据或 `.dlib` 导出包均来自同一份脱敏任务。
- 使用 `.dlib` 时必须同时提供对应 `.p12` 证书和证书密码。
- SHA-256 不可用于解密，只能用于检查文件完整性。
- 文档标记不匹配时，应停止自动还原并让用户选择正确的映射数据。
- 映射缺失时允许部分还原，并展示未还原标记，不得静默删除。
- JSON、TXT、CSV、Markdown 需要同时提供对应的 `.desens-meta` 伴随文件；缺失时不能可靠匹配文档 ID。
- `.dlib` 导入失败时依次检查证书文件、证书密码、导出包完整性和文档标记，不要尝试使用 SHA-256 作为解密密码。

## 模型或 LoRA 训练失败

- 确认模型是完整且可读取的 GGUF 文件，并通过 SHA-256 校验。
- 检查模型架构、tokenizer、量化方式和本机内存/显存是否满足训练运行时要求。
- 每个训练任务只能绑定一个基础模型；训练启动后替换模型路径不会改变任务绑定。
- AI 默认关闭；只有用户在右侧选区后主动点击 AI 智能脱敏，才会发起推理。

## Tauri command 或任务进度异常

- 先检查 command 的输入 DTO 版本和必填字段，不要直接把底层 Rust 异常展示给用户。
- 长任务应监听统一任务事件；不要依赖轮询临时目录判断进度。
- 若任务已失败，优先查看结构化错误码、任务日志和输入文件校验值。
- 若前后端字段不兼容，先检查 `schema_version` 和 `request_id`，不要通过复用旧字段绕过版本检查。
- 遇到 `INTEGRITY_CHECK_FAILED`、`CERTIFICATE_PASSWORD_INVALID` 或 `DECRYPTION_FAILED` 时，不要重写或覆盖原导出包。

## JSON 存储损坏或导入冲突

- 先保留损坏文件，不要直接删除；检查同目录临时文件和最近一次有效备份。
- 不要手工修改历史映射 JSON 后覆盖原文件；优先通过导入流程生成新 revision。
- 导入规则、标注或历史时先选择 `merge`、`replace` 或 `skip_conflicts`，并确认冲突统计。
- 若出现并发写入覆盖，检查是否绕过 `StorageProvider` 直接写入数据目录。

## 文档结构或格式异常

- 先查看适配器返回的 warnings，不要把结构变化当作静默成功。
- JSON 脱敏后必须仍能被标准 JSON 解析器读取；若失败，应停止输出并保留原文件。
- CSV 重点检查分隔符、引号、换行和列数是否变化。
- DOCX/XLSX/PDF 重点检查底部标记、表格结构、页数、字体和版式；PDF 标记应位于专门末尾页。
- TXT、CSV、JSON、Markdown 跨设备还原时必须同时提供 `.desens-meta` 伴随文件。

## `.dlib` 或 `.p12` 无法解密

- 先检查 `.dlib` 格式版本、密文 SHA-256 和证书指纹，再检查 `.p12` 密码。
- `CERTIFICATE_PASSWORD_INVALID` 表示无法解锁 `.p12`；`CERTIFICATE_INVALID` 表示证书不含兼容私钥或用途不符。
- `INTEGRITY_CHECK_FAILED` 表示密文、AAD 或 GCM tag 校验失败，不得继续导入。
- 更换 `.p12` 文件不能解密旧包；证书轮换必须先用旧证书解密，再使用新证书重新导出。
- 不要把证书密码当作 AES 密钥，也不要修改 nonce、wrapped_key 或 ciphertext 后重试。

## GGUF 下载或加载失败

- 检查下载任务是否停留在 resolving、downloading、verifying 或 installing 阶段。
- 校验失败的 `.part` 文件不得改名为 `.gguf` 或手动加入模型目录。
- 检查仓库、固定 revision、文件名、预期大小和 SHA-256 是否一致。
- `MODEL_INCOMPATIBLE` 表示 GGUF 架构、tokenizer、量化或运行时后端不支持，不代表文件一定损坏。
- `MODEL_CHECKSUM_MISMATCH` 表示下载内容与可信校验值不同，应隔离并重新下载。
- 模型内存需求超过本机能力时，降低上下文或选择更小量化模型，不要绕过兼容性检查强制加载。
- 当前 `list_models` 只读取模型清单，不会自动下载或加载模型；具体 Provider 和运行时尚未接入。
- `MODEL_INVALID_FORMAT` 表示文件头不是 `GGUF` 或文件无法读取；请确认选择的是完整 GGUF 文件而非压缩包、adapter 或分片文件。
- `TASK_STORE_ERROR` 表示任务状态读写不可用；任务快照已写入 `tasks.json`，但当前版本不保证训练/下载重启恢复。
- `update_task` 返回空任务时，检查 task ID 是否来自当前进程的 `create_task` 或已加载的任务记录；当前版本尚未自动恢复内存中的任务索引。
- 当前任务快照已持久化；若事件未到达 UI，先检查监听注册时机，再检查 tasks 写入是否成功。不要以事件缺失判断快照未保存。
- 应用重启后只能恢复任务快照，不能自动恢复未实现的下载/训练进程；若任务为终态，普通 update command 不应将其重新置为运行态。

## LoRA 训练无法启动或恢复

- 先检查基础模型 SHA-256、数据集 revision 和训练配置是否与任务记录一致。
- 任意 GGUF 可以被选择探测，但缺少训练后端支持、tokenizer 或可训练权重时不能启动训练。
- 资源不足时降低最大序列长度、batch、梯度累积或 LoRA rank，再重新执行资源预检。
- 暂停任务必须先生成有效检查点；进程被异常终止且无检查点时不能保证恢复。
- 已完成 adapter 不得自动替换当前推理模型；先查看评估报告和基础模型绑定。

## 模型评估异常

- 检查训练、验证、测试集合是否按来源文件 SHA-256 隔离，避免同源样本泄漏。
- 不要只查看训练 loss；同时检查实体级 precision、recall、F1、各标签误报和漏报。
- 规则和 AI 部分重叠时不得自动裁剪，检查候选是否被正确标记为 conflict。
- 模型评估通过但未成为 active 时，确认用户是否完成了明确的启用操作。

## Tauri 骨架无法构建

- 确认 Rust、Cargo、Node.js 版本满足项目要求，并在项目根目录执行依赖安装。
- 确认前端先生成 `dist/`，且 `src-tauri/tauri.conf.json` 的 `frontendDist` 指向正确目录。
- 若缺少平台图标或系统开发库，先记录具体平台错误；不要删除 Tauri 配置来绕过构建。
- 骨架阶段只包含健康检查 command，完整文件处理能力尚未迁移。
- 当前 provider 已注册到 managed state；若出现 `STORAGE_NOT_READY`，检查 Tauri setup 是否完成以及应用数据目录权限。
- `list_rules`、`list_history` 或 `list_settings` 返回空集合时，先确认对应 JSON 文件是否尚未初始化；空集合是正常初始状态。
- 写入遇到 `STORAGE_REVISION_CONFLICT` 时先重新读取集合并合并用户修改，不要强制覆盖最新文件。

## 基础文本脱敏失败

- 检查 span 是否使用 Rust 字符串的 UTF-8 字节偏移，而不是 JavaScript UTF-16 偏移。
- 检查 start/end 是否越界或落在多字节字符中间。
- 重叠 span 必须回到审核阶段解决，Rust 不会自动裁剪或覆盖。
- 还原出现 missing markers 时属于部分还原结果，不能通过清理未知占位符掩盖问题。
- 若 mapping 已写入但 history 未写入，不要重复覆盖 mapping；先检查 history revision，再由恢复流程补写摘要。

## 文本文件输出异常

- `redact_text_file` 只支持 TXT、CSV、Markdown；JSON 尚未接入此适配器。
- 输出文件应为源文件同目录的 `_desensitized` 后缀，原文件不应被覆盖。
- 跨设备使用文本文件时必须同时携带对应 `.desens-meta`；该文件不包含 mapping 原文。
- `.desens-meta` 指纹不匹配时，说明文件被修改或元数据对应了错误文件，应停止自动还原并重新匹配。
- 若新 Tauri 适配器返回某格式不可用，先查看 `document_capabilities`；不要将 DOCX/XLSX/PDF 强制送入文本适配器。
- 若 `cargo check` 或 npm 锁定失败并提示无法连接代理/镜像，先恢复网络或准备依赖缓存；不要手工填写锁文件中的版本、integrity 或 resolved 字段。

## 前端或后端不可访问

1. 本地执行 `bash scripts/status.sh`，检查 `logs/frontend.log` 和 `logs/backend.log`。
2. 使用 `bash scripts/restart.sh` 重启本地服务。
3. 访问 `http://localhost:8000/api/health`；成功时应返回 `status: healthy`。
4. 远端环境检查 `curl http://127.0.0.1:8000/api/health`，再检查 Vite 是否监听 8080。
5. 若端口被占用，先识别准确 PID，再有针对性地停止对应 Vite 或 Uvicorn 进程；不要使用广泛的进程清理命令。

## 前端调用 API 失败

- 确认 `src/api/desensitization.js` 默认 API 基址为空字符串（同源路径），并确认 `vite.config.js` 中 `/api` 代理的目标为 `http://127.0.0.1:8000`。
- 若部署到非 Vite 服务器，需要由反向代理转发 `/api`，或显式设置 `VITE_API_BASE_URL`。
- 生产环境不要保留 `allow_origins=["*"]`，应配置受信任来源。

## PDF→DOCX 失败或不可编辑

- 接口依赖公开 PyPI 可安装的 `pdf2docx==0.5.8`。在后端虚拟环境执行：

```bash
backend/venv/bin/pip install -r backend/requirements.txt -i https://repo.huaweicloud.com/repository/pypi/simple
```

- 重启 Uvicorn 后重试。输出应包含 Word 文字、表格和图片对象；若只得到整页图片，说明代码被错误回退，应检查 `backend/main.py` 的 `/api/pdf-to-word` 是否仍调用 `pdf2docx.Converter`。
- 复杂、扫描型或字体异常的 PDF 无法保证完全还原排版，需人工复核；不要以“改后缀”或图片嵌入作为可编辑转换的替代方案。

## DOCX→PDF 缺字、乱码或失败

- 安装 LibreOffice 与中文字体：

```bash
sudo apt-get install -y libreoffice-writer fonts-noto-cjk
fc-cache -f
```

- 确认 `soffice` 在 PATH 中，并保留 `_run_soffice()` 的独立用户配置目录。
- 同名的下载文件可能是历史转换产物。2026-08-14 的 36 KB 工作联系函 DOCX 与对应 PDF 已含乱码/缺字；验证应使用公司目录中 1.2 MB 的原始 DOCX。

## 敏感字段未命中

- 银行卡、身份证、组织机构代码、营业执照号码、统一社会信用代码和 VIN 会先做校验码验证；格式正确但校验码错误的样例会被跳过。
- 地址和姓名依赖中文分词与上下文规则，属于辅助识别能力；使用 `敏感字段` 页面添加自定义姓名、关键词或正则，并在预览中人工确认。
- 使用 `output/test-documents/敏感信息综合测试样本_仅虚构数据.docx` 可快速覆盖主要规则类型。

## 构建失败或产物过大

- 执行 `npm install` 后运行 `npm run build`。成功产物为 `dist/`。
- PDF.js worker 会产生大于 500 KB 的构建警告，当前不阻塞打包。若需优化，改为按需加载或单独托管 worker。
- 当前没有 Electron/Tauri 打包脚本。需要原生 `.dmg`、`.app`、`.exe`、`.msi` 或 `.deb` 时，先新增桌面运行时和打包配置；Vite `dist/` 不能直接视为安装包。

## Windows GitHub Actions 提示 `spawnSync npm.cmd EINVAL`

- 不要在 Node 的 `execFileSync` 中直接执行 `npm.cmd`。GitHub Windows PowerShell Runner 会拒绝该调用。
- 桌面前端构建脚本应使用 `process.execPath` 执行 `process.env.npm_execpath`，以当前 npm 调用链启动 `npm run build`；修改后同时在本机运行 `npm run build:desktop:frontend` 和 GitHub Actions Windows 任务验证。
# 2026-08-28：开发启动提示

- Tauri 首次启动会编译约 341 个 Rust 依赖，后续增量启动会明显更快。
- 当前编译器提示未使用的领域 DTO 和文档适配器，这是功能尚未接线的提示，不是运行错误。
- 历史样本与上传数据统一位于项目 `trash/`，如需恢复请从对应子目录移回原路径；不要将其提交到 Git。

# 2026-08-28：安装包显示旧界面

- 重新打包前必须执行最新版 Vue 构建；当前 Tauri 已配置 `beforeBuildCommand` 自动完成此步骤。
- Tauri 包没有 FastAPI 子进程；文本/PDF 应走本地检测，不应再出现后端不可用提示。DOCX/XLSX 的完整结构解析仍需对应 Rust 适配器或兼容链路。
- 前端构建提示 PDF.js 使用 eval 以及个别 chunk 较大；后续处理 PDF 适配器和代码分包时再专项优化。

# 2026-08-28：文本区间

- Rust 接口的 `start/end` 是 UTF-8 字节偏移，不是 JavaScript 字符数；前端正式接入时必须统一转换或由 Rust 接受字符区间后转换。
# 2026-08-28：CI 自动打包

- Actions 使用 runner 默认目标架构，不手工交叉编译；macOS ARM64、macOS Intel 和 Windows x64 分别在对应 runner 上构建。
- 若某平台没有生成预期文件，工作流的 `if-no-files-found: error` 会直接失败，避免产生空的成功构建。
### 拖入 DOCX/XLSX 后文件消失

原因：旧的 Tauri 前端兜底分支提示后调用 `reset()`，导致已加入文件被移除。现改为保留文件并提示后端/适配器待恢复；文本、PDF、图片继续走本地路径。
### Word/Excel 显示“报错”

该信息实际是后端不可用时的能力提示，不代表文件拖入失败。现已改为蓝色信息提示，并保留文件；结构化检测仍需对应服务/适配器。
### 转换完成但下载文件为空

如果转换接口实际返回了内容，而前端在 `link.click()` 后立即调用 `URL.revokeObjectURL`，桌面 WebView 可能尚未读取 Blob。现改为延迟释放并在空响应时明确报错。
## 2026-08-28 llama.cpp native abort

崩溃栈位于 `llama_decode -> LlamaSession::advance_context`，触发线程为隔离推理子进程。初步判断为输入超过模型默认上下文或 batch 限制。当前已限制会话为 2048 context、256 batch，并限制单次输入；若仍失败，应禁用该模型并记录错误，不得继续直接加载。

## Candle 迁移状态

已移除 llama.cpp。Candle 当前支持 Qwen2 GGUF 推理；模型目录必须同时提供匹配的 `tokenizer.json`。不匹配架构或缺少 tokenizer 时返回明确错误，不会伪造候选结果。

Windows CI 曾因强制启用 Candle Metal 引入 `objc2` 而失败，已改为不启用平台专属 feature 的 CPU 默认构建。

Windows MSI 后续在 WiX `light.exe` 阶段失败，改用 `tauri.windows.conf.json` 提供 ASCII 产品名，避免中文 MSI 元数据触发无详细信息的 WiX 退出码 1。
## DOCX 下载后为空白

现象：脱敏完成后下载得到数百字节的空白 DOCX。

原因：Tauri 桌面版不应调用未打包的 FastAPI 结构化输出接口；仅有预览文本不能代表原始 DOCX 已被写回。

处理：桌面版 DOCX 下载直接读取原始 DOCX ZIP，改写 `word/document.xml`、页眉和页脚 XML，并校验输出 Blob 大小与实际替换结果。若没有写入任何内容，直接报错，不生成下载文件。
# 历史记录生成空白复杂格式文件

- 原因：历史记录只持久化映射和预览文本，没有保存原始 DOCX/XLSX/PDF 的 ZIP/二进制结构，无法从文本可靠重建原格式。
- 规则：复杂格式历史下载不得调用文本转格式接口伪造文件；若没有真实文件字节，应明确失败并提示使用脱敏阶段下载的文件。
- 验证：失败弹窗可见、无下载文件产生；文本类历史仍能生成非空正文文件。

## Rust 标记与 OOXML 输出不一致

- 现象：预览已显示脱敏，但下载时报告“未能写入”，或还原找不到标记。
- 原因：Tauri 确认阶段会生成新的随机标记，检测列表中的预览标记不是最终 mapping 标记。
- 处理：DOCX/XLSX 写回必须只读取确认后 mapping 的 `original/placeholder`，还原使用同一 mapping 反向替换。

## XLSX 检测结果为空

- 原因：部分 XLSX 将字符串直接存入 `<v>` 且单元格类型为 `t="str"`，并不使用 `<t>` 或共享字符串表。
- 处理：同时提取命名空间下的 `<t>` 和 `t="str"` 单元格 `<v>`；输出仍原位改写对应 XML。

## 历史记录无法下载复杂格式

- 旧记录只保存 mapping 和预览文本，不可能还原 DOCX/XLSX/PDF 的完整二进制结构。
- 新记录在确认脱敏后立即将真实输出 Blob 写入 IndexedDB，并在历史元数据保存索引。
- 如果浏览器清理了站点数据或 IndexedDB 写入失败，历史下载必须提示文件内容已丢失，不能生成占位文件。

## “全部清空”只有 Toast、记录未删除

- 原因：Tauri WebView 中原生 `window.confirm()` 可能不弹出并直接返回取消，后续清理逻辑不会执行。
- 处理：使用应用内 `role="alertdialog"` 二次确认；用户点击确认后再清理 localStorage 与 IndexedDB。
- 验证必须同时检查页面历史数量、localStorage 数组长度和 IndexedDB object store 数量，不能只看 Toast。
## WebView 原生确认框不稳定

- 现象：点击按钮后 `window.confirm` 可能不显示、被系统窗口拦截，或无法稳定自动化验证。
- 规则：上传、开始和重置动作使用 `desens:confirm-request` 应用内确认协议；确认结果通过独立事件返回。
- 验证：取消上传后页面不得出现文件元数据；取消重置后检测和文件状态必须仍然存在。

## Tauri macOS DMG 打包失败：设备上无剩余空间

- 现象：`npm run tauri:build` 在 `bundle_dmg.sh` 阶段失败，手动 `hdiutil create` 报“设备上无剩余空间”，但磁盘空间充足。
- 根因：macOS 新版 hdiutil 对 `-srcfolder` 自动容量估算失败（deprecated 调用路径）。
- 处理：`.app` 打包不受影响；DMG 可进入 `src-tauri/target/release/bundle/dmg` 手动执行 `bash bundle_dmg.sh --volname "..." --volicon "..." --skip-jenkins --disk-image-size 128 <输出.dmg> ../macos` 生成。发布 DMG 仍以 GitHub Actions 产物为准。
