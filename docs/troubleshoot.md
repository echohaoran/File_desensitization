# 故障排查

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

- 接口依赖 `pdf2docx==0.5.13`。在后端虚拟环境执行：

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
