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
const excludedModules = [
  // 开发、测试与交互式工具不会在本机 API 服务中执行。
  'pytest', 'unittest', 'doctest', 'IPython', 'tkinter',
  'matplotlib', 'scipy',
  // Presidio / spaCy 仅是缺少模型时自动回退的可选增强能力，
  // 不在生产依赖清单中；排除其生态避免无用的 NLP/数据分析运行时。
  'presidio_analyzer', 'presidio_anonymizer',
  'spacy', 'thinc', 'srsly', 'cymem', 'preshed', 'murmurhash', 'wasabi', 'langcodes',
  'pandas', 'tensorflow', 'phonenumbers', 'Crypto',
]
mkdirSync(output, { recursive: true })
mkdirSync(workPath, { recursive: true })

const pyInstallerArgs = [
  '-m', 'PyInstaller', '--noconfirm', '--clean', '--onefile',
  '--optimize', '2',
  '--name', 'desens-backend', '--paths', resolve(root, 'backend'),
  '--distpath', output, '--workpath', resolve(workPath, 'work'), '--specpath', resolve(workPath, 'spec'),
  ...excludedModules.flatMap((moduleName) => ['--exclude-module', moduleName]),
  resolve(root, 'desktop', 'backend_entry.py'),
]

execFileSync(executable, pyInstallerArgs, {
  stdio: 'inherit',
  cwd: root,
  // 让 PyInstaller 的缓存也位于项目专用目录，避免读取或清理用户级缓存。
  env: { ...process.env, PYINSTALLER_CONFIG_DIR: resolve(root, '.build', 'desktop', 'pyinstaller-config') },
})
