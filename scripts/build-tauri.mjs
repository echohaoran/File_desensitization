import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...process.env }
// CI supplies the key explicitly. Only local builds use the existing per-user key.
if (!env.TAURI_SIGNING_PRIVATE_KEY && !env.TAURI_SIGNING_PRIVATE_KEY_PATH) {
  const keyPath = resolve(homedir(), '.tauri', 'desens-updater.key')
  if (!existsSync(keyPath)) {
    console.error('Updater signing key missing. Set TAURI_SIGNING_PRIVATE_KEY or TAURI_SIGNING_PRIVATE_KEY_PATH; see docs/desktop-packaging.md.')
    process.exit(1)
  }
  if (process.platform !== 'win32' && (statSync(keyPath).mode & 0o077)) {
    console.error('The local updater private key must only be accessible to its owner (mode 600).')
    process.exit(1)
  }
  const publicPath = `${keyPath}.pub`
  const configured = JSON.parse(readFileSync(resolve(root, 'src-tauri/tauri.conf.json'), 'utf8')).plugins.updater.pubkey
  if (!existsSync(publicPath) || readFileSync(publicPath, 'utf8').trim() !== configured.trim()) {
    console.error('Local updater public key does not match the application. Restore the matching key pair; do not replace the application public key.')
    process.exit(1)
  }
  env.TAURI_SIGNING_PRIVATE_KEY = readFileSync(keyPath, 'utf8').trim()
  // The existing local key may have an empty password. Never print key/password values.
  env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD ??= ''
  console.log('Using the existing local updater signing key; configured public key matches.')
}
if (!env.TAURI_SIGNING_PRIVATE_KEY && env.TAURI_SIGNING_PRIVATE_KEY_PATH) {
  env.TAURI_SIGNING_PRIVATE_KEY = readFileSync(env.TAURI_SIGNING_PRIVATE_KEY_PATH, 'utf8').trim()
}
const result = spawnSync(process.execPath, [resolve(root, 'node_modules/@tauri-apps/cli/tauri.js'), 'build', ...process.argv.slice(2)], { cwd: root, env, stdio: 'inherit' })
if (result.error) console.error('Failed to start the Tauri build process.')
process.exit(result.status ?? 1)
