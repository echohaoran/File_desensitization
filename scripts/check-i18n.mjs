import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { baseCompile } from '@intlify/message-compiler'
import { parse, compileTemplate } from '@vue/compiler-sfc'
import { languages, resolveLocale } from '../src/i18n/locales.js'

const locales = ['zh', 'en', 'fr', 'ja', 'de', 'ko']
assert.deepEqual(languages.map(item => item.code), locales)
assert.ok(languages.every(item => item.dir === 'ltr'))
assert.equal(resolveLocale('ar', ['zh-CN']), 'zh')
assert.equal(resolveLocale('ru', ['ru-RU']), 'en')
assert.equal(resolveLocale('ar', ['ja-JP']), 'ja')
assert.equal(resolveLocale('ko', ['en-US']), 'ko')
assert.equal(resolveLocale(null, ['de-DE']), 'de')
assert.equal(resolveLocale(null, ['ko-KR']), 'ko')
const flattened = Object.fromEntries(locales.map(locale => [locale, {}]))
function flatten(value, prefix = '', result = {}) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof child === 'string') result[path] = child
    else flatten(child, path, result)
  }
  return result
}
for (const filename of await readdir(new URL('../src/i18n/modules/', import.meta.url))) {
  if (!filename.endsWith('.js')) continue
  const { default: module } = await import(new URL(`../src/i18n/modules/${filename}`, import.meta.url))
  assert.deepEqual(Object.keys(module).sort(), [...locales].sort(), `${filename}: unexpected locale set`)
  for (const locale of locales) Object.assign(flattened[locale], flatten(module[locale]))
}
const keys = Object.keys(flattened.zh).sort()
for (const locale of locales) {
  assert.deepEqual(Object.keys(flattened[locale]).sort(), keys, `${locale}: missing or extra keys`)
  for (const key of keys) {
    const message = flattened[locale][key]
    assert.ok(message.trim(), `${locale}.${key}: empty translation`)
    const errors = []
    baseCompile(message, { onError: error => errors.push(error.message) })
    assert.deepEqual(errors, [], `${locale}.${key}: invalid message syntax`)
    const params = text => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort()
    assert.deepEqual(params(message), params(flattened.zh[key]), `${locale}.${key}: mismatched interpolation`)
  }
}
const files = ['src/App.vue']
for (const directory of ['views', 'components']) {
  for (const file of await readdir(new URL(`../src/${directory}/`, import.meta.url))) {
    if (file.endsWith('.vue')) files.push(`src/${directory}/${file}`)
  }
}
for (const file of files) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
  const { descriptor, errors } = parse(source)
  assert.equal(errors.length, 0, `${file}: SFC parse errors`)
  const compiled = compileTemplate({ source: descriptor.template.content, filename: file, id: file })
  assert.equal(compiled.errors.length, 0, `${file}: template errors`)
  for (const match of source.matchAll(/\b(?:\$t|t)\(\s*['"]([a-z]+\.[\w]+)['"]\s*[,)]/g)) {
    assert.ok(flattened.zh[match[1]], `${file}: unknown key ${match[1]}`)
  }
}
console.log(`i18n checks passed: ${keys.length} keys × ${locales.length} locales; ${files.length} Vue components`)
