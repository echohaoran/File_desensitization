# 待办事项

## 2026-08-17

- [x] 选定 Electron + PyInstaller 桌面方案，并建立本地后端生命周期管理骨架。
- [x] 在 GitHub macOS Apple Silicon 与 Windows x64 Runner 构建并验证 DMG/MSI；`v0.1.0` 已发布。
- [ ] 发布 `v0.1.1` 精简桌面包，并在两类真实目标机完成安装、启动、脱敏与还原回归。
- [ ] 建立 CNB Release 产物、校验和与桌面应用更新清单。
- [ ] 配置 macOS Notarization 与 Windows 代码签名证书后再进行外部发布。
- [ ] 为远端 Vite/FastAPI 进程增加 systemd、日志轮转和受控重启。
- [ ] 补充格式转换、敏感规则、历史还原和校验算法的自动化回归测试。
- [ ] 收紧 CORS，并评估认证、上传限制、文件扫描、结果加密和访问控制。
- [ ] 优化 PDF.js worker 的按需加载，降低前端初始包体积。
