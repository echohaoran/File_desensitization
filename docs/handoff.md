# 开发交接记录

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
