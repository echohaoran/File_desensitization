const STORAGE_KEY = 'desens_sensitive_rules'
const DELETED_BUILT_INS_KEY = 'desens_deleted_builtin_rules'

export const DEFAULT_RULES = [
  ['ip_address', 'IPv4 地址', 'regex', '(?:\\d{1,3}\\.){3}\\d{1,3}', '正则表达式'], ['mac_address', 'MAC 地址', 'regex', '(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}', '正则表达式'], ['ipv6_address', 'IPv6 地址', 'regex', '(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{0,4}', '正则表达式'], ['phone', '手机号', 'regex', '1[3-9]\\d{9}', '正则表达式'],
  ['bank_card', '银行卡', 'algorithm', '16–19 位卡号（Luhn 校验）', '算法校验'], ['id_card', '身份证', 'algorithm', '18 位身份证（校验码与日期）', '算法校验'], ['address', '地址', 'nlp', '中文地址上下文识别', 'NLP / 上下文'], ['name', '姓名', 'nlp', '中文姓名上下文识别', 'NLP / 上下文'], ['gender', '性别', 'regex', '(?:性别[：:]?\\s*)?(?:男|女)', '正则表达式'], ['ethnicity', '民族', 'regex', '[\\u4e00-\\u9fa5]{1,6}族', '正则表达式'],
  ['province', '省份', 'regex', '(?:北京|天津|上海|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾)省?|(?:内蒙古|广西|西藏|宁夏|新疆)自治区', '正则表达式'], ['license_plate', '车牌号', 'regex', '[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤川青藏琼宁][A-Z][A-HJ-NP-Z0-9]{4,5}', '正则表达式'], ['landline', '固定电话', 'regex', '(?:0\\d{2,3}[-\\s]?)?\\d{7,8}', '正则表达式'], ['military_id', '军官证', 'regex', '(?:军官证|军人证)[：:\\s]*[A-Za-z0-9-]{6,20}', '正则表达式'],
  ['email', '邮箱', 'regex', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', '正则表达式'], ['passport', '护照号', 'regex', '[EGPDS][0-9]{8}|1[45][0-9]{7}', '正则表达式'], ['hong_kong_macao_permit', '港澳通行证', 'regex', '[CHM][0-9]{8,10}', '正则表达式'], ['jdbc_connection', 'JDBC 连接串', 'regex', "jdbc:[a-zA-Z0-9]+(?::[^\\s\"']+)+", '正则表达式'], ['date', '日期', 'regex', '(?:19|20)\\d{2}[-/.年](?:1[0-2]|0?[1-9])[-/.月](?:3[01]|[12]\\d|0?[1-9])(?:日)?', '正则表达式'],
  ['vehicle_identification_number', '车辆识别代码（VIN）', 'algorithm', '17 位 VIN（校验码）', '算法校验'], ['organization_code', '组织机构代码', 'algorithm', '9 位组织机构代码（校验码）', '算法校验'], ['business_license', '营业执照号码', 'algorithm', '15 / 18 位营业执照号码（校验码）', '算法校验'], ['unified_social_credit_code', '统一社会信用代码', 'algorithm', '18 位统一社会信用代码（校验码）', '算法校验']
].map(([id, name, kind, value, method]) => ({ id, name, kind, value, method, enabled: true, builtIn: true }))

function deletedBuiltIns() { try { return new Set(JSON.parse(localStorage.getItem(DELETED_BUILT_INS_KEY) || '[]')) } catch (_) { return new Set() } }

export function loadSensitiveRules() {
  try {
    const savedRules = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const saved = Array.isArray(savedRules) ? savedRules : []
    const byId = new Map(saved.map(rule => [rule.id, rule]))
    const removed = deletedBuiltIns()
    const catalog = DEFAULT_RULES.filter(rule => !removed.has(rule.id)).map(rule => ({ ...rule, ...(byId.get(rule.id) || {}) }))
    return [...catalog, ...saved.filter(rule => !DEFAULT_RULES.some(defaultRule => defaultRule.id === rule.id))]
  } catch (_) { return DEFAULT_RULES.map(rule => ({ ...rule })) }
}

export function saveSensitiveRules(rules) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)) }
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
