const { app, BrowserWindow, dialog } = require('electron')
const { spawn } = require('node:child_process')
const net = require('node:net')
const fs = require('node:fs')
const path = require('node:path')

let backendProcess = null
let mainWindow = null

const isWindows = process.platform === 'win32'
const backendFileName = isWindows ? 'desens-backend.exe' : 'desens-backend'

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close((error) => error ? reject(error) : resolve(port))
    })
  })
}

function backendCommand() {
  if (app.isPackaged) {
    return {
      command: path.join(process.resourcesPath, 'backend', process.platform, backendFileName),
      args: [],
    }
  }

  const root = path.resolve(__dirname, '..')
  const python = isWindows
    ? path.join(root, 'backend', 'venv', 'Scripts', 'python.exe')
    : path.join(root, 'backend', 'venv', 'bin', 'python')
  return { command: python, args: [path.join(root, 'desktop', 'backend_entry.py')] }
}

async function waitForBackend(apiBaseUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`)
      if (response.ok) return
    } catch (_) {
      // 后端仍在加载 Python 依赖，继续等待。
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('本机服务启动超时，请检查应用日志。')
}

async function startBackend() {
  const port = await findFreePort()
  const apiBaseUrl = `http://127.0.0.1:${port}`
  const runtimeDir = path.join(app.getPath('userData'), 'runtime')
  const logDir = path.join(app.getPath('userData'), 'logs')
  fs.mkdirSync(runtimeDir, { recursive: true })
  fs.mkdirSync(logDir, { recursive: true })

  const { command, args } = backendCommand()
  if (!fs.existsSync(command)) {
    throw new Error(`未找到本机后端：${command}`)
  }
  const logStream = fs.openSync(path.join(logDir, 'backend.log'), 'a')
  backendProcess = spawn(command, [...args, '--port', String(port), '--data-dir', runtimeDir], {
    cwd: app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      UPLOAD_DIR: path.join(runtimeDir, 'uploads'),
      DESENS_APP_ROOT: app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..'),
    },
    stdio: ['ignore', logStream, logStream],
    windowsHide: true,
  })
  backendProcess.once('exit', (code) => { backendProcess = null; console.error(`后端已退出，退出码：${code}`) })
  await waitForBackend(apiBaseUrl)
  return apiBaseUrl
}

function createWindow(apiBaseUrl) {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 920,
    minWidth: 980,
    minHeight: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: [`--desens-api-base-url=${apiBaseUrl}`],
    },
  })
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) backendProcess.kill()
  backendProcess = null
}

app.whenReady().then(async () => {
  try {
    const apiBaseUrl = await startBackend()
    createWindow(apiBaseUrl)
  } catch (error) {
    await dialog.showMessageBox({ type: 'error', title: '文件脱敏与还原工具', message: '应用启动失败', detail: error.message })
    app.quit()
  }
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('before-quit', stopBackend)
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0 && mainWindow) mainWindow.show() })
