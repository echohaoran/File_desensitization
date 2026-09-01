<template>
  <div class="container rules-page">
    <div class="page-heading"><span class="mono-label">LOCAL RULES</span><h1>敏感字段管理</h1><p>所有内置和自定义敏感字段集中管理在本机。修改、停用或删除后，后续脱敏将使用最新规则。</p></div>
    <section class="rules-form" aria-label="新增或编辑敏感字段规则">
      <div class="rules-form__heading"><h2>{{ editingId ? '编辑敏感字段' : '新增敏感字段' }}</h2><button v-if="editingId" class="text-btn" @click="cancelEdit">取消编辑</button></div>
      <div class="form-grid"><label>规则名称<input v-model.trim="draft.name" placeholder="例如：项目联系人" /></label><label>识别方式<select v-model="draft.kind"><option value="name">姓名</option><option value="keyword">关键词</option><option value="regex">正则表达式</option><option value="algorithm">算法校验</option><option value="nlp">NLP / 上下文</option></select></label><label class="form-grid__wide">{{ valueLabel }}<input v-model.trim="draft.value" :placeholder="placeholder" /></label></div>
      <p v-if="error" class="rules-error">{{ error }}</p><button class="btn btn--primary" @click="saveRule">{{ editingId ? '保存修改' : '添加规则' }}</button>
    </section>
    <section class="rules-list" aria-label="敏感字段规则列表"><div class="rules-list__head"><strong>已配置字段</strong><span>{{ rules.length }} 项</span></div><div v-if="!rules.length" class="empty-state"><p>尚未创建规则。</p></div><article v-for="rule in rules" :key="rule.id" class="rule-item" :class="{ 'is-disabled': !rule.enabled }"><label class="rule-toggle"><input type="checkbox" v-model="rule.enabled" @change="persist" /><span>{{ rule.enabled ? '已启用' : '已停用' }}</span></label><div class="rule-item__content"><strong>{{ rule.name }}</strong><span class="badge">{{ methodName(rule) }}</span><code>{{ rule.value }}</code></div><div class="rule-item__actions"><button class="text-btn" @click="editRule(rule)">编辑</button><button class="icon-btn" @click="requestRemoveRule(rule)" :aria-label="`删除 ${rule.name}`" title="删除">×</button></div></article></section>
    <div v-if="deleteCandidate" class="rules-confirm-overlay" @click.self="cancelRemoveRule">
      <section class="rules-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-rule-title" aria-describedby="delete-rule-message">
        <p class="mono-label">REMOVE RULE</p><h2 id="delete-rule-title">删除敏感字段？</h2><p id="delete-rule-message">“{{ deleteCandidate.name }}”将从当前列表和本机规则配置中移除，后续检测不再使用该规则。</p>
        <div class="rules-confirm__actions"><button class="btn btn--secondary" @click="cancelRemoveRule">取消</button><button class="btn btn--danger" @click="confirmRemoveRule">确认删除</button></div>
      </section>
    </div>
  </div>
</template>

<script>
import { deleteSensitiveRule, loadSensitiveRules, saveSensitiveRules } from '@/utils/sensitiveRules'

const emptyDraft = () => ({ name: '', kind: 'regex', value: '' })

export default {
  name: 'SensitiveRules',
  data: () => ({ rules: loadSensitiveRules(), draft: emptyDraft(), editingId: '', error: '', deleteCandidate: null }),
  computed: {
    valueLabel() {
      if (this.draft.kind === 'regex') return '正则表达式'
      if (this.draft.kind === 'name') return '姓名'
      if (this.draft.kind === 'keyword') return '关键词'
      return '识别说明或匹配规则'
    },
    placeholder() {
      if (this.draft.kind === 'regex') return '例如：合同编号[-：\\s]*[A-Z]{2}\\d{6}'
      if (this.draft.kind === 'name') return '例如：张三'
      if (this.draft.kind === 'keyword') return '例如：星河资本'
      return '例如：使用校验码识别'
    }
  },
  methods: {
    methodName(rule) { return rule.method || ({ name: '姓名', keyword: '关键词', regex: '正则表达式', algorithm: '算法校验', nlp: 'NLP / 上下文' })[rule.kind] || '规则' },
    notify(message) { window.dispatchEvent(new CustomEvent('desens:status', { detail: { message } })) },
    persist() { saveSensitiveRules(this.rules); this.notify('敏感字段状态已保存') },
    editRule(rule) { this.error = ''; this.editingId = rule.id; this.draft = { name: rule.name, kind: rule.kind, value: rule.value }; window.scrollTo({ top: 0, behavior: 'smooth' }) },
    cancelEdit() { this.editingId = ''; this.error = ''; this.draft = emptyDraft() },
    saveRule() {
      this.error = ''
      if (!this.draft.name || !this.draft.value) { this.error = '请填写规则名称和匹配内容。'; return }
      if (this.draft.kind === 'regex') { try { new RegExp(this.draft.value) } catch (_) { this.error = '正则表达式格式无效。'; return } }
      if (this.editingId) Object.assign(this.rules.find(item => item.id === this.editingId), this.draft, { method: undefined })
      else this.rules.push({ id: `custom_${Date.now().toString(36)}`, ...this.draft, enabled: true, builtIn: false })
      const message = this.editingId ? '敏感字段修改已保存' : '敏感字段已添加'
      saveSensitiveRules(this.rules); this.cancelEdit(); this.notify(message)
    },
    requestRemoveRule(rule) { this.deleteCandidate = rule },
    cancelRemoveRule() { this.deleteCandidate = null },
    confirmRemoveRule() {
      const rule = this.deleteCandidate
      if (!rule) return
      deleteSensitiveRule(rule)
      saveSensitiveRules(this.rules.filter(item => item !== rule))
      this.rules = loadSensitiveRules()
      this.deleteCandidate = null
      if (this.editingId === rule.id) this.cancelEdit()
      this.notify(`已删除敏感字段：${rule.name}`)
    }
  }
}
</script>

<style scoped>
.rules-page{max-width:920px;padding-top:64px;padding-bottom:72px}.page-heading h1{margin:10px 0;font-size:clamp(32px,5vw,52px)}.page-heading p{color:var(--muted);max-width:720px}.rules-form,.rules-list{margin-top:32px;border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;background:#fff}.rules-form__heading,.rules-list__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.rules-form__heading h2{font-size:var(--text-lg);margin:0}.rules-list__head{padding:16px 20px;margin:0;border-bottom:1px solid var(--border-soft);color:var(--muted)}.rules-list__head strong{color:var(--fg)}.form-grid{display:grid;grid-template-columns:1fr 180px;gap:16px}.form-grid__wide{grid-column:1/-1}label{display:grid;gap:7px;font-size:var(--text-sm);font-weight:600}input,select{padding:11px 12px;border:1px solid var(--border);border-radius:8px;font:inherit;background:#fff}.rules-form .btn{margin-top:16px}.rules-error{color:#b42318;margin:12px 0 0}.rules-list{padding:0;max-height:58vh;overflow-y:scroll;overflow-x:hidden;scrollbar-gutter:stable}.rule-item{display:flex;align-items:center;gap:16px;padding:16px 20px;border-bottom:1px solid var(--border-soft)}.rule-item:last-child{border-bottom:0}.rule-item.is-disabled{opacity:.55}.rule-toggle{min-width:66px;font-size:12px;font-weight:500;display:flex;align-items:center;gap:6px}.rule-item__content{display:flex;align-items:center;gap:10px;flex:1;min-width:0}.rule-item__content code{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.badge{font-size:11px;padding:3px 6px;background:#f1f5f9;border-radius:4px;white-space:nowrap}.rule-item__actions{display:flex;align-items:center;gap:8px}.text-btn{padding:4px 6px;border:0;background:transparent;color:var(--muted);font:inherit;font-size:13px;cursor:pointer}.text-btn:hover{color:var(--fg);text-decoration:underline}.icon-btn{font-size:24px;line-height:1;border:0;background:transparent;cursor:pointer;color:var(--muted)}.rules-confirm-overlay{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.45)}.rules-confirm{width:min(100%,460px);padding:28px;border-radius:16px;background:#fff;box-shadow:0 24px 64px rgba(15,23,42,.24)}.rules-confirm h2{margin:8px 0 12px;font-size:24px}.rules-confirm p:not(.mono-label){margin:0;color:var(--muted);line-height:1.65}.rules-confirm__actions{display:flex;justify-content:flex-end;gap:12px;margin-top:24px}.rules-confirm__actions .btn{margin:0}.btn--danger{background:#b42318;color:#fff;border-color:#b42318}@media(max-width:600px){.form-grid{grid-template-columns:1fr}.form-grid__wide{grid-column:auto}.rule-item__content{flex-wrap:wrap}.rule-item{align-items:flex-start}.rule-toggle{min-width:auto}.rule-item__actions{margin-left:auto}}
</style>
