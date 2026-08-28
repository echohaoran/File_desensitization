# Electron + PyInstaller 桌面打包（历史方案）

更新时间：2026-08-17

> 该文档仅记录历史 Electron + PyInstaller 方案。新功能开发目标为 Vue 3 + Rust + Tauri；不得将本文件中的 Electron 流程视为新架构实施方案。

## 当前交付方式

项目当前不再通过 GitHub Actions 构建 DMG/MSI。普通用户使用源码安装脚本：

```bash
curl -fsSL https://raw.githubusercontent.com/echohaoran/File_desensitization/main/scripts/install-from-source.sh | bash
```

脚本下载源码、安装 npm 依赖、创建 Python 虚拟环境并安装后端依赖。启动后通过 `http://localhost:5173` 使用。

## 历史目标产物

- macOS Apple Silicon：DMG。
- Windows x64：MSI 安装包。
- 每个平台必须在对应操作系统的 CI Runner 或实体机器上构建；PyInstaller 不支持可靠的跨平台二进制交叉构建。

## 运行模型

Electron 以 `file://` 加载 Vue 生产包，启动由 PyInstaller 生成的 FastAPI 后端。后端仅监听 `127.0.0.1` 的随机端口，端口通过 Electron preload 注入前端，不对局域网暴露。

应用数据写入 Electron 的 `userData/runtime/`，包括运行期上传文件和后端日志；敏感规则与历史记录继续由桌面 WebView 的本地存储维护。

## 构建前置条件

1. Node.js 20 LTS 或更高。
2. Python 3.10+，并在目标系统执行：

   ```bash
   python -m pip install -r backend/requirements-desktop.txt
   npm ci
   ```

3. 仅需 DOCX→PDF 时安装 LibreOffice。PDF→DOCX、脱敏、还原不依赖 LibreOffice。
4. Windows 推荐安装 64 位 LibreOffice；macOS 推荐将 LibreOffice 放在 `/Applications`。也可使用环境变量 `SOFFICE_PATH` 指定可执行文件。

## 构建命令

```bash
# 仅生成可由 Electron 加载的前端和目标平台 Python 后端
npm run build:desktop:frontend
npm run build:desktop:backend

# 仅验证应用目录，不生成安装包
npm run desktop:pack

# 生成安装包到 release/
npm run desktop:dist
```

`desktop:dev` 会先构建桌面前端，再以本机 Python 虚拟环境启动桌面壳：

```bash
npm run desktop:dev
```

## 浏览器版安装方式

如果 macOS 未配置 Developer ID 签名与 Notarization，不应向普通用户分发 DMG。推荐改用本机浏览器版：

```bash
npm install
npm run setup:local
npm run start:local
```

用户通过 `http://localhost:5173` 使用，后端仅监听 `127.0.0.1:8000`。该方式仍需要 Node.js 20+ 和 Python 3.10+，但不需要安装 Electron、DMG 或 macOS 安全例外。

桌面包仍可作为已完成签名、公证后的可选发行方式保留。

## 历史桌面发布流程

旧版 GitHub Actions 工作流已移除；以下内容仅作为历史记录，不再执行：

1. 推送到 `main`：自动构建 macOS DMG 和 Windows MSI，并保留 14 天 Actions artifacts。
2. 推送 `vX.Y.Z` 标签：先校验标签与 `package.json` 版本一致，再构建 DMG/MSI、生成 `SHA256SUMS.txt`，并创建或更新 GitHub Release。
3. 仓库 Settings → Actions → General 中须将 Workflow permissions 设为 **Read and write permissions**，否则无法写入 Release。
4. macOS 正式分发前配置 Developer ID 签名与 Notarization；Windows 配置代码签名证书。未签名产物仅限内部测试。
5. 运行工作流的 GitHub 仓库应为可发布的上游仓库；CNB 可继续作为开发同步或更新信息来源，但不是该工作流的执行环境。

## LibreOffice 处理策略

- LibreOffice 是可选外部组件。
- 应用通过 `/api/runtime/capabilities` 检测可用性；缺失时禁用 DOCX→PDF 并给出安装提示。
- 后端在实际调用时再次检查，缺失时返回 HTTP 503 和中文可执行提示。
- 首版不随安装包捆绑 LibreOffice，以避免大体积、许可证、系统签名与升级维护成本；后续如需要离线一体化安装，再单独评估分发许可与平台测试矩阵。
# 2026-08-28：Tauri 正式打包入口

- 新架构桌面包使用 `npm run tauri:build`，产物来自 Vue + Rust + Tauri。
- `npm run desktop:dist` 继续保留为旧 Electron/FastAPI 兼容链路，不代表新架构桌面包。
- Tauri 打包开关已开启；开发测试使用 `npm run tauri:dev`。

## GitHub Actions 自动打包

- 工作流：`.github/workflows/tauri-build.yml`。
- 触发条件：手动触发、推送 `main`、推送 `v*` 标签。
- 构建矩阵：macOS Apple Silicon、macOS Intel、Windows x64。
- 产物：macOS DMG/应用包，Windows MSI/NSIS（若配置生成）。Actions artifact 保留 14 天。
- 工作流只构建 Tauri 新架构；旧 Electron/FastAPI 兼容包仍由本地旧命令维护。

## 本次产物

- `src-tauri/target/release/bundle/macos/文件脱敏与还原工具.app`
- `src-tauri/target/release/bundle/dmg/文件脱敏与还原工具_0.1.1_aarch64.dmg`
