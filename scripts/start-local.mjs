import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const venvDir = path.join(root, 'backend', 'venv')
const python = process.platform === 'win32'
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python')

if (!existsSync(python)) {
  console.error('Python environment not found. Run "npm run setup:local" first.')
  process.exit(1)
}

const processes = [
  spawn(python, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: path.join(root, 'backend'), stdio: 'inherit', windowsHide: true,
  }),
  spawn(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', '5173'], {
    cwd: root, stdio: 'inherit', windowsHide: true,
  }),
]

let stopping = false
function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const child of processes) if (!child.killed) child.kill()
  setTimeout(() => process.exit(exitCode), 250)
}

for (const child of processes) {
  child.once('error', (error) => { console.error(error.message); stop(1) })
  child.once('exit', (code, signal) => {
    if (!stopping && (code ?? 0) !== 0) {
      console.error(`A local service exited (${code ?? signal}).`)
      stop(code ?? 1)
    }
  })
}

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
console.log('Web app: http://localhost:5173')
console.log('API docs: http://localhost:8000/docs')
