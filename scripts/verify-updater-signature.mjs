import { readFileSync } from 'node:fs'
import { createHash, createPublicKey, verify } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifact = process.argv[2]
if (!artifact) throw new Error('Usage: node scripts/verify-updater-signature.mjs <updater artifact>')
const configured = JSON.parse(readFileSync(resolve(root, 'src-tauri/tauri.conf.json'), 'utf8')).plugins.updater.pubkey
const publicText = Buffer.from(configured, 'base64').toString('utf8').trim().split(/\r?\n/)
const publicBytes = Buffer.from(publicText[1], 'base64')
const signatureText = Buffer.from(readFileSync(`${artifact}.sig`, 'utf8').trim(), 'base64').toString('utf8').trim().split(/\r?\n/)
const signature = Buffer.from(signatureText[1], 'base64')
if (publicBytes.length !== 42 || signature.length !== 74 || !publicBytes.subarray(2, 10).equals(signature.subarray(2, 10))) {
  throw new Error('Updater key identifier or signature format mismatch')
}
const publicKey = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), publicBytes.subarray(10)]), type: 'spki', format: 'der' })
const algorithm = signature.subarray(0, 2).toString('ascii')
const bytes = readFileSync(artifact)
if (!['ED', 'Ed'].includes(algorithm)) throw new Error('Unsupported updater signature algorithm')
const data = algorithm === 'ED' ? createHash('blake2b512').update(bytes).digest() : bytes
if (!verify(null, data, publicKey, signature.subarray(10))) throw new Error('Updater signature verification failed')
if (!signatureText[2]?.startsWith('trusted comment: ')) throw new Error('Missing trusted signature comment')
const comment = Buffer.from(signatureText[2].slice('trusted comment: '.length))
if (!verify(null, Buffer.concat([signature.subarray(10), comment]), publicKey, Buffer.from(signatureText[3] || '', 'base64'))) {
  throw new Error('Updater trusted comment verification failed')
}
console.log('Updater signature verified against the application public key.')
