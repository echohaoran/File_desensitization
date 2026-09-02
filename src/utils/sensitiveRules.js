const STORAGE_KEY = 'desens_sensitive_rules'
const DELETED_BUILT_INS_KEY = 'desens_deleted_builtin_rules'
export const SENSITIVE_RULES_EXPORT_SCHEMA_VERSION = 1

export const DEFAULT_RULES = [
  ['phone', '手机号', 'regex', '1[3-9]\\d{9}', '正则表达式'],
  ['landline', '固定电话', 'regex', '(?:0\\d{2,3}[-\\s]?)?\\d{7,8}', '正则表达式'],
  ['id_card', '身份证', 'algorithm', '18 位身份证（校验码与日期）', '算法校验'],
  ['bank_card', '银行卡', 'algorithm', '16–19 位卡号（Luhn 校验）', '算法校验'],
  ['passport', '护照号', 'regex', '[EGPDS][0-9]{8}|1[45][0-9]{7}', '正则表达式'],
  ['hong_kong_macao_permit', '港澳通行证', 'regex', '[CHM][0-9]{8,10}', '正则表达式'],
  ['unified_social_credit_code', '统一社会信用代码', 'algorithm', '18 位统一社会信用代码（校验码）', '算法校验']
].map(([id, name, kind, value, method]) => ({ id, name, kind, value, method, enabled: true, builtIn: true }))

const RETIRED_BUILT_IN_RULE_IDS = new Set([
  'ip_address', 'mac_address', 'ipv6_address', 'address', 'name', 'gender', 'ethnicity', 'province', 'license_plate', 'military_id', 'email', 'jdbc_connection', 'date', 'vehicle_identification_number', 'organization_code', 'business_license'
])

export function isRetiredBuiltInRule(rule) { return Boolean(rule?.builtIn && RETIRED_BUILT_IN_RULE_IDS.has(rule.id)) }

function deletedBuiltIns() { try { return new Set(JSON.parse(localStorage.getItem(DELETED_BUILT_INS_KEY) || '[]')) } catch (_) { return new Set() } }

export function getDeletedBuiltInRuleIds() { return [...deletedBuiltIns()] }

export function loadSensitiveRules() {
  try {
    const savedRules = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const saved = Array.isArray(savedRules) ? savedRules.filter(rule => !isRetiredBuiltInRule(rule)) : []
    if (Array.isArray(savedRules) && saved.length !== savedRules.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    const byId = new Map(saved.map(rule => [rule.id, rule]))
    const removed = deletedBuiltIns()
    const catalog = DEFAULT_RULES.filter(rule => !removed.has(rule.id)).map(rule => ({ ...rule, ...(byId.get(rule.id) || {}) }))
    return [...catalog, ...saved.filter(rule => !DEFAULT_RULES.some(defaultRule => defaultRule.id === rule.id))]
  } catch (_) { return DEFAULT_RULES.map(rule => ({ ...rule })) }
}

export function saveSensitiveRules(rules) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)) }
export function replaceSensitiveRules(rules, deletedBuiltinIds = []) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  localStorage.setItem(DELETED_BUILT_INS_KEY, JSON.stringify([...new Set(deletedBuiltinIds)]))
}
export function deleteSensitiveRule(rule) { if (rule.builtIn) { const removed = deletedBuiltIns(); removed.add(rule.id); localStorage.setItem(DELETED_BUILT_INS_KEY, JSON.stringify([...removed])) } }
export function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

export function detectWithRules(text, rules) {
  const results = []
  rules.filter(rule => rule.enabled && rule.value && ['regex', 'name', 'keyword'].includes(rule.kind)).forEach(rule => {
    try {
      const regex = new RegExp(rule.kind === 'regex' ? rule.value : escapeRegExp(rule.value), 'g')
      let match
      while ((match = regex.exec(text)) !== null) { if (!match[0]) break; results.push({ type: rule.id, label: rule.name, value: match[0], start: match.index, end: match.index + match[0].length, source: 'local_rule' }) }
    } catch (_) { /* 管理面板会阻止保存无效正则 */ }
  })
  return results
}
