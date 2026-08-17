# Electron + PyInstaller 桌面打包

更新时间：2026-08-17

## 目标产物

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

## 发布流程

GitHub Actions 工作流位于 `.github/workflows/desktop-release.yml`：

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
