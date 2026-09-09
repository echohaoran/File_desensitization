import assert from 'node:assert/strict'
import { DEFAULT_RULES, detectWithRules, loadSensitiveRules, deleteSensitiveRules, saveSensitiveRules, replaceSensitiveRules, deleteSensitiveRule } from '../src/utils/sensitiveRules.js'
const store = new Map()
globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) }
const text = 'Fictional: 13800138000; TEST-123; 4111111111111111'
assert.equal(detectWithRules(text, []).length, 0)
assert.equal(detectWithRules(text, DEFAULT_RULES.map(rule => ({ ...rule, enabled: false }))).length, 0)
const phone = DEFAULT_RULES.find(rule => rule.id === 'phone')
assert.deepEqual(detectWithRules(text, [phone]).map(item => item.value), ['13800138000'])
const custom = { id: 'custom_test', name: 'test', enabled: true, kind: 'regex', value: 'TEST-\\d{3}' }
assert.deepEqual(detectWithRules(text, [custom]).map(item => item.value), ['TEST-123'])
const card = DEFAULT_RULES.find(rule => rule.id === 'bank_card')
assert.equal(detectWithRules('4111111111111111', [card]).length, 1)
assert.equal(detectWithRules('4111111111111112', [card]).length, 0)
const prefix = '11010120000101001', weights = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2]
const id = prefix + '10X98765432'[weights.reduce((sum,w,i) => sum + Number(prefix[i])*w, 0)%11]
assert.equal(detectWithRules(id, [DEFAULT_RULES.find(rule => rule.id === 'id_card')]).length, 1)
saveSensitiveRules([...DEFAULT_RULES, custom])
deleteSensitiveRules(loadSensitiveRules().map(rule => rule.id))
assert.equal(loadSensitiveRules().length, 3)
saveSensitiveRules(loadSensitiveRules().map(rule => ({ ...rule, enabled: false })))
assert.equal(detectWithRules(text, loadSensitiveRules()).length, 0)
saveSensitiveRules([custom])
assert.deepEqual(detectWithRules(text, loadSensitiveRules()).map(item => item.value), ['TEST-123'])
console.log('PASS: empty/disabled rules, enabled-only matching, custom rules, algorithm checks, delete-all and reload')
replaceSensitiveRules([], DEFAULT_RULES.map(rule => rule.id))
assert.deepEqual(loadSensitiveRules().map(rule => rule.id).sort(), ['bank_card', 'id_card', 'phone'])
assert.ok(loadSensitiveRules().every(rule => !rule.enabled))
deleteSensitiveRule(phone)
assert.ok(loadSensitiveRules().some(rule => rule.id === 'phone'))
store.set('desens_sensitive_rules', '[]')
store.set('desens_deleted_builtin_rules', JSON.stringify(DEFAULT_RULES.map(rule => rule.id)))
assert.deepEqual(loadSensitiveRules().map(rule => rule.id).sort(), ['bank_card', 'id_card', 'phone'])
console.log('PASS: fixed fields survive single/bulk deletion and import; old deleted fields restored; disabled state preserved')
