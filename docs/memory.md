# 项目记忆

更新时间：2026-08-16

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
