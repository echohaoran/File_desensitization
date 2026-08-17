import { execFileSync } from 'node:child_process'

execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, DESKTOP_BUILD: '1' },
})
