import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const platform = process.platform
if (!['darwin', 'win32'].includes(platform)) {
  throw new Error(`桌面后端仅支持在 macOS 或 Windows 本机构建，当前平台：${platform}`)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bundledVenvPython = platform === 'win32'
  ? resolve(root, 'backend', 'venv', 'Scripts', 'python.exe')
  : resolve(root, 'backend', 'venv', 'bin', 'python')
const executable = process.env.PYTHON || (existsSync(bundledVenvPython) ? bundledVenvPython : (platform === 'win32' ? 'python' : 'python3'))
const output = resolve(root, 'backend', 'dist', platform)
// 使用专用构建目录，避免清理项目中既有的 tmp/ 内容。
const workPath = resolve(root, '.build', 'desktop', 'pyinstaller', platform)
mkdirSync(output, { recursive: true })
mkdirSync(workPath, { recursive: true })

execFileSync(executable, [
  '-m', 'PyInstaller', '--noconfirm', '--clean', '--onefile',
  '--name', 'desens-backend', '--paths', resolve(root, 'backend'),
  '--distpath', output, '--workpath', resolve(workPath, 'work'), '--specpath', resolve(workPath, 'spec'),
  resolve(root, 'desktop', 'backend_entry.py'),
], {
  stdio: 'inherit',
  cwd: root,
  // 让 PyInstaller 的缓存也位于项目专用目录，避免读取或清理用户级缓存。
  env: { ...process.env, PYINSTALLER_CONFIG_DIR: resolve(root, '.build', 'desktop', 'pyinstaller-config') },
})
