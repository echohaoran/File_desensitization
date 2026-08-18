import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const backendDir = path.join(root, 'backend')
const venvDir = path.join(backendDir, 'venv')
const pythonCommand = process.platform === 'win32' ? 'python' : 'python3'
const pythonBin = process.platform === 'win32'
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python')

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!existsSync(pythonBin)) {
  console.log(`Creating Python virtual environment with ${pythonCommand}...`)
  run(pythonCommand, ['-m', 'venv', '--clear', venvDir])
}

console.log('Installing Python dependencies...')
run(pythonBin, ['-m', 'pip', 'install', '-r', path.join(backendDir, 'requirements.txt')])
console.log('Local setup complete. Run: npm run start:local')
