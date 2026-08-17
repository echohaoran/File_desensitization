import { execFileSync } from 'node:child_process'

// `npm.cmd` cannot be spawned directly by Node on GitHub's Windows PowerShell
// runner (it fails with EINVAL). Reuse the npm CLI script from the current
// `npm run` invocation so the same Node executable launches it on every OS.
const npmCli = process.env.npm_execpath

if (!npmCli) {
  throw new Error('Unable to locate the npm CLI (npm_execpath is not set).')
}

execFileSync(process.execPath, [npmCli, 'run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, DESKTOP_BUILD: '1' },
})
