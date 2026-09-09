<template>
  <div class="container rules-page" :dir="getLocale() === 'ar' ? 'rtl' : 'ltr'">
    <div class="page-heading"><span class="mono-label">{{ $t('management.rulesEyebrow') }}</span><h1>{{ $t('management.rulesTitle') }}</h1><p>{{ $t('management.rulesIntro') }}</p></div>
    <section class="rules-form" :aria-label="$t('management.addRuleAria')">
      <div class="rules-form__heading"><h2>{{ $t('management.addField') }}</h2></div>
      <div class="form-grid"><label>{{ $t('management.ruleName') }}<input dir="auto" v-model.trim="draft.name" :placeholder="$t('management.namePlaceholder')" /></label><label>{{ $t('management.recognition') }}<select v-model="draft.kind"><option value="name">{{ $t('management.name') }}</option><option value="keyword">{{ $t('management.keyword') }}</option><option value="regex">{{ $t('management.regex') }}</option><option value="algorithm">{{ $t('management.algorithm') }}</option><option value="nlp">{{ $t('management.nlp') }}</option></select></label><label class="form-grid__wide">{{ valueLabel }}<input :dir="draft.kind === 'regex' ? 'ltr' : 'auto'" v-model.trim="draft.value" :placeholder="placeholder" /></label></div>
      <p v-if="error && !editingId" class="rules-error">{{ error }}</p><button class="btn btn--primary" @click="saveRule">{{ $t('management.addRule') }}</button>
    </section>
    <div class="rules-list-wrap">
      <div class="rules-list-actions">
        <button class="rules-action-btn" type="button" :aria-pressed="batchEditing" @click="toggleBatchEditing">{{ batchEditing ? $t('batch.done') : $t('management.edit') }}</button>
        <AiFeatureButton button-class="rules-action-btn rules-action-btn--primary" type="button" @click="openRegexConverter">{{ $t('management.regexConversion') }}</AiFeatureButton>
      </div>
      <div v-if="batchEditing" class="batch-toolbar" role="group" :aria-label="$t('batch.label')">
        <label><input class="batch-select-all" type="checkbox" :checked="allBatchSelected" :indeterminate.prop="selectedBatchRules.length > 0 && !allBatchSelected" :disabled="!rules.length" @change="selectAllBatch($event.target.checked)" />{{ $t('batch.selectAll') }}</label>
        <span>{{ $t('batch.selected', { count: formatCount(selectedBatchRules.length) }) }}</span>
        <button class="rules-action-btn" type="button" :disabled="!selectedBatchRules.length" @click="setBatchEnabled(false)">{{ $t('batch.disable') }}</button>
        <button class="rules-action-btn" type="button" :disabled="!selectedBatchRules.length" @click="setBatchEnabled(true)">{{ $t('batch.enable') }}</button>
        <button class="rules-action-btn batch-delete" type="button" :disabled="!selectedBatchRules.length || batchDeleting" @click="requestBatchDelete">{{ $t('batch.delete') }}</button>
        <p v-if="batchError" class="rules-error" role="alert">{{ batchError }}</p>
      </div>
      <section class="rules-list" :aria-label="$t('management.rulesListAria')">
        <div class="rules-list__head"><strong>{{ $t('management.configuredFields') }}</strong><div class="rules-list__tools"><button class="rules-action-btn" type="button" @click="exportRules">{{ $t('management.export') }}</button><button class="rules-action-btn" type="button" @click="$refs.importInput.click()">{{ $t('management.import') }}</button><input ref="importInput" class="sr-only" :aria-label="$t('management.importTitle')" type="file" accept="application/json,.json" @change="importRules" /><span>{{ $t('management.itemCount', { count: formatCount(rules.length) }) }}</span></div></div>
        <div v-if="!rules.length" class="empty-state"><p>{{ $t('management.noRules') }}</p></div>
        <article v-for="rule in rules" :key="rule.id" class="rule-item" :class="{ 'is-disabled': !rule.enabled }">
          <input v-if="batchEditing" class="batch-select" type="checkbox" v-model="batchSelection" :value="rule.id" :aria-label="$t('batch.selectRule', { name: ruleDisplayName(rule) })" />
          <span class="rule-status" role="img" :aria-label="rule.enabled ? $t('management.enabled') : $t('management.disabled')" :title="rule.enabled ? $t('management.enabled') : $t('management.disabled')">{{ rule.enabled ? '🟢' : '🔴' }}</span>
          <div class="rule-item__content"><strong dir="auto">{{ ruleDisplayName(rule) }}</strong><span class="badge">{{ methodName(rule) }}</span><code :dir="rule.kind === 'regex' ? 'ltr' : 'auto'">{{ ruleDisplayValue(rule) }}</code></div>
          <div class="rule-item__actions"><button class="text-btn" @click="editRule(rule)">{{ $t('management.edit') }}</button><button class="icon-btn" @click="requestRemoveRule(rule)" :aria-label="$t('management.deleteAria', { name: ruleDisplayName(rule) })" :title="$t('management.delete')">×</button></div>
        </article>
      </section>
    </div>

    <div v-if="deleteCandidate" class="rules-confirm-overlay" @click.self="cancelRemoveRule"><section class="rules-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-rule-title" aria-describedby="delete-rule-message"><p class="mono-label">{{ $t('management.deleteEyebrow') }}</p><h2 id="delete-rule-title">{{ $t('management.deleteTitle') }}</h2><p id="delete-rule-message">{{ $t('management.deleteMessage', { name: ruleDisplayName(deleteCandidate) }) }}</p><div class="rules-confirm__actions"><button class="btn btn--secondary" @click="cancelRemoveRule">{{ $t('management.cancel') }}</button><button class="btn btn--danger" @click="confirmRemoveRule">{{ $t('management.deleteConfirm') }}</button></div></section></div>
    <div v-if="editingId" class="rules-confirm-overlay" @click.self="cancelEdit"><section class="rules-confirm rules-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-rule-title"><p class="mono-label">{{ $t('management.editEyebrow') }}</p><h2 id="edit-rule-title">{{ $t('management.editField') }}</h2><div class="form-grid"><label>{{ $t('management.ruleName') }}<input dir="auto" v-model.trim="draft.name" /></label><label>{{ $t('management.recognition') }}<select v-model="draft.kind"><option value="name">{{ $t('management.name') }}</option><option value="keyword">{{ $t('management.keyword') }}</option><option value="regex">{{ $t('management.regex') }}</option><option value="algorithm">{{ $t('management.algorithm') }}</option><option value="nlp">{{ $t('management.nlp') }}</option></select></label><label class="form-grid__wide">{{ valueLabel }}<input :dir="draft.kind === 'regex' ? 'ltr' : 'auto'" v-model.trim="draft.value" :placeholder="placeholder" /></label></div><p v-if="error" class="rules-error">{{ error }}</p><div class="rules-confirm__actions"><button class="btn btn--secondary" @click="cancelEdit">{{ $t('management.cancel') }}</button><button class="btn btn--primary" @click="saveRule">{{ $t('management.saveChanges') }}</button></div></section></div>

    <div v-if="showRegexConverter" class="rules-confirm-overlay" @click.self="closeRegexConverter"><section class="rules-confirm regex-converter" role="dialog" aria-modal="true" aria-labelledby="regex-convert-title"><button class="dialog-close" type="button" :aria-label="$t('management.closeConverter')" @click="closeRegexConverter">×</button><p class="mono-label">{{ $t('management.converterEyebrow') }}</p><h2 id="regex-convert-title">{{ $t('management.regexConversion') }}</h2><p class="dialog-copy">{{ $t('management.converterIntro') }}</p><p class="model-status" :class="{ 'is-ready': regexModelReady }">{{ regexModelMessage }}</p><div class="converter-controls"><label class="converter-check"><input type="checkbox" :checked="allConverterSelected" :indeterminate.prop="someConverterSelected && !allConverterSelected" @change="toggleAllConverterRules($event.target.checked)" /> {{ $t('management.selectAll') }}</label></div><div class="converter-groups"><section v-for="group in conversionGroups" :key="group.kind" class="converter-group"><label class="converter-check converter-check--group"><input type="checkbox" :checked="isGroupSelected(group)" :indeterminate.prop="isGroupPartiallySelected(group)" @change="toggleConverterGroup(group, $event.target.checked)" /> {{ group.label }} <span>{{ $t('management.itemCount', { count: formatCount(group.rules.length) }) }}</span></label><label v-for="rule in group.rules" :key="rule.id" class="converter-rule"><input type="checkbox" v-model="converterSelection[rule.id]" :disabled="rule.kind === 'regex'" /><span><strong dir="auto">{{ ruleDisplayName(rule) }}</strong><small>{{ rule.kind === 'regex' ? $t('management.alreadyRegex') : ruleDisplayValue(rule) }}</small></span></label></section></div><p v-if="conversionError" class="rules-error">{{ conversionError }}</p><p v-if="conversionNotice" class="model-status">{{ conversionNotice }}</p><div v-if="conversionCandidates.length" class="conversion-results"><strong>{{ $t('management.pendingCandidates') }}</strong><label v-for="candidate in conversionCandidates" :key="candidate.id" class="converter-rule converter-rule--candidate"><input type="checkbox" v-model="candidate.accepted" /><span><strong dir="auto">{{ candidateDisplayName(candidate) }}</strong><small v-if="candidate.source === 'local-exact'">{{ $t('management.localExact') }}</small><small v-else-if="candidate.source === 'local-structured'">{{ $t('management.localStructured') }}</small><code dir="ltr">{{ candidate.regex }}</code></span></label></div><div class="rules-confirm__actions"><button v-if="conversionCandidates.length" class="btn btn--secondary" type="button" @click="applyRegexCandidates">{{ $t('management.saveCandidates') }}</button><AiFeatureButton button-class="btn btn--primary" type="button" :disabled="converting || !selectedConvertibleRules.length" @click="startRegexConversion">{{ converting ? $t('management.converting') : conversionCandidates.length ? $t('management.reconvert') : $t('management.startConversion') }}</AiFeatureButton></div></section></div>
  </div>
</template>

<script>
import { t, getLocale } from '@/i18n'
import { deleteSensitiveRules } from '@/utils/sensitiveRules'
import { localizeManagementError } from '@/i18n/modules/management'
import { aiConvertRulesToRegex, isTauriRuntime } from '@/api/tauriBridge'
import { DEFAULT_RULES, SENSITIVE_RULES_EXPORT_SCHEMA_VERSION, deleteSensitiveRule, escapeRegExp, getDeletedBuiltInRuleIds, isRetiredBuiltInRule, loadSensitiveRules, replaceSensitiveRules, saveSensitiveRules } from '@/utils/sensitiveRules'
import { requestAppConfirm } from '@/utils/appConfirm'
import AiFeatureButton from '@/components/AiFeatureButton.vue'
import { AI_AVAILABILITY_EVENT, readAiAvailability } from '@/utils/aiAvailability'

// Mark our translated validation errors so native diagnostics cannot leak untranslated UI.
const localizedError = message => Object.assign(new Error(message), { managementLocalized: true })
const emptyDraft = () => ({ name: '', kind: 'regex', value: '' })
const RULE_KINDS = ['name', 'keyword', 'regex', 'algorithm', 'nlp']
const TYPE_LABELS = { name: '姓名', keyword: '关键词', regex: '正则表达式', algorithm: '算法校验', nlp: 'NLP / 上下文' }
const localRegexCandidates = (rules) => rules.filter(rule => ['name', 'keyword'].includes(rule.kind) && rule.value?.trim()).map(rule => {
  const value = rule.value.trim()
  const hasAddressStructure = /(?:\d\s*(?:号院|号楼|号|弄|室|层)|[A-Za-z]\d+\s*(?:栋|座))/.test(value)
  if (!hasAddressStructure) return { id: rule.id, name: rule.name, regex: escapeRegExp(value), confidence: 1, source: 'local-exact' }
  const regex = escapeRegExp(value)
    .replace(/\s+/g, '\\s*')
    .replace(/\d+/g, '\\d{1,4}')
  return { id: rule.id, name: rule.name, regex, confidence: .82, source: 'local-structured' }
})

export default {
  name: 'SensitiveRules',
  components: { AiFeatureButton },
  data: () => ({ batchDeleting: false, batchEditing: false, batchSelection: [], batchError: '', rules: loadSensitiveRules(), draft: emptyDraft(), editingId: '', error: '', deleteCandidate: null, showRegexConverter: false, converterSelection: {}, conversionCandidates: [], conversionError: '', conversionNotice: '', converting: false, aiEnabled: false, activeModelPath: '' }),
  computed: {
    selectedBatchRules() { return this.rules.filter(rule => this.batchSelection.includes(rule.id)) },
    allBatchSelected() { return this.rules.length > 0 && this.selectedBatchRules.length === this.rules.length },
    valueLabel() { return this.draft.kind === 'regex' ? t('management.regex') : this.draft.kind === 'name' ? t('management.name') : this.draft.kind === 'keyword' ? t('management.keyword') : t('management.matchingDescription') },
    placeholder() { return this.draft.kind === 'regex' ? t('management.regexPlaceholder', { pattern: 'CONTRACT[-:\\s]*[A-Z]{2}\\d{6}' }) : this.draft.kind === 'name' ? t('management.personPlaceholder') : this.draft.kind === 'keyword' ? t('management.keywordPlaceholder') : t('management.algorithmPlaceholder') },
    conversionGroups() { return RULE_KINDS.map(kind => ({ kind, label: t('management.' + kind), rules: this.rules.filter(rule => rule.kind === kind) })).filter(group => group.rules.length) },
    selectedConvertibleRules() { return this.rules.filter(rule => rule.kind !== 'regex' && this.converterSelection[rule.id]) },
    allConverterSelected() { const items = this.rules.filter(rule => rule.kind !== 'regex'); return items.length > 0 && items.every(rule => this.converterSelection[rule.id]) },
    someConverterSelected() { return this.rules.some(rule => rule.kind !== 'regex' && this.converterSelection[rule.id]) },
    regexModelReady() { return this.aiEnabled && isTauriRuntime() && Boolean(this.activeModelPath) },
    regexModelMessage() { if (!this.aiEnabled) return t('management.aiOff'); if (!this.activeModelPath) return t('management.modelMissing'); return this.regexModelReady ? t('management.modelReady') : t('management.desktopOnly') }
  },
  mounted() { this.aiAvailabilityListener = () => this.syncAiAvailability(); window.addEventListener(AI_AVAILABILITY_EVENT, this.aiAvailabilityListener); window.addEventListener('storage', this.aiAvailabilityListener); this.syncAiAvailability() },
  beforeUnmount() { window.removeEventListener(AI_AVAILABILITY_EVENT, this.aiAvailabilityListener); window.removeEventListener('storage', this.aiAvailabilityListener) },
  methods: {
    async requestBatchDelete() {
      if (!this.batchEditing || !this.selectedBatchRules.length || this.batchDeleting) return
      const ids = this.selectedBatchRules.map(rule => rule.id)
      this.batchDeleting = true
      this.batchError = ''
      try {
        const accepted = await requestAppConfirm({ title: t('batch.deleteTitle'), message: t('batch.deleteMessage', { count: this.formatCount(ids.length) }), confirmText: t('batch.deleteConfirm'), tone: 'warning' })
        if (!accepted) return
        const result = deleteSensitiveRules(ids)
        this.rules = result.rules
        this.batchSelection = []
        if (ids.includes(this.editingId)) this.cancelEdit()
        this.notify(t('batch.deleted', { count: this.formatCount(result.removedCount) }))
      } catch { this.batchError = t('batch.deleteFailed') }
      finally { this.batchDeleting = false }
    },
    toggleBatchEditing() { this.batchEditing = !this.batchEditing; this.batchSelection = []; this.batchError = '' },
    selectAllBatch(checked) { this.batchSelection = checked ? this.rules.map(rule => rule.id) : [] },
    setBatchEnabled(enabled) {
      if (!this.batchEditing || !this.selectedBatchRules.length) return
      const ids = new Set(this.selectedBatchRules.map(rule => rule.id))
      const next = this.rules.map(rule => ids.has(rule.id) ? { ...rule, enabled } : rule)
      this.batchError = ''
      try {
        saveSensitiveRules(next)
        this.rules = next
        this.notify(t(enabled ? 'batch.enabled' : 'batch.disabled', { count: this.formatCount(ids.size) }))
      } catch { this.batchError = t('batch.failed') }
    },
    getLocale,
    formatCount(value) { return new Intl.NumberFormat(getLocale()).format(value) },
    // Translate only known built-in display labels; persisted values remain unchanged.
    ruleDisplayName(rule) {
      const original = DEFAULT_RULES.find(item => item.id === rule.id)
      return original && rule.builtIn && rule.name === original.name
        ? t('management.builtin_' + rule.id)
        : rule.name
    },
    ruleDisplayValue(rule) {
      const original = DEFAULT_RULES.find(item => item.id === rule.id)
      const keys = {
        id_card: 'management.builtinValueIdCard',
        bank_card: 'management.builtinValueBankCard',
        unified_social_credit_code: 'management.builtinValueCreditCode'
      }
      return original && rule.builtIn && rule.kind === original.kind && rule.value === original.value && keys[rule.id]
        ? t(keys[rule.id])
        : rule.value
    },
    candidateDisplayName(candidate) {
      const rule = this.rules.find(item => item.id === candidate.id)
      return rule ? this.ruleDisplayName(rule) : candidate.name
    },
    methodName(rule) {
      if (rule.method === '正则表达式（AI 候选）') return t('management.aiCandidateMethod')
      const kind = Object.keys(TYPE_LABELS).find(key => TYPE_LABELS[key] === rule.method)
      if (kind) return t('management.' + kind)
      return rule.method || (RULE_KINDS.includes(rule.kind) ? t('management.' + rule.kind) : t('management.rule'))
    },
    notify(message) { window.dispatchEvent(new CustomEvent('desens:status', { detail: { message } })) },
    persist() { saveSensitiveRules(this.rules); this.notify(t('management.stateSaved')) },
    editRule(rule) { this.error = ''; this.editingId = rule.id; this.draft = { name: rule.name, kind: rule.kind, value: rule.value } },
    cancelEdit() { this.editingId = ''; this.error = ''; this.draft = emptyDraft() },
    saveRule() { this.error = ''; if (!this.draft.name || !this.draft.value) { this.error = t('management.requiredFields'); return } if (this.draft.kind === 'regex') { try { new RegExp(this.draft.value) } catch (_) { this.error = t('management.invalidRegex'); return } } if (this.editingId) Object.assign(this.rules.find(item => item.id === this.editingId), this.draft, { method: undefined }); else this.rules.push({ id: `custom_${Date.now().toString(36)}`, ...this.draft, enabled: true, builtIn: false }); const message = this.editingId ? t('management.ruleSaved') : t('management.ruleAdded'); saveSensitiveRules(this.rules); this.cancelEdit(); this.notify(message) },
    requestRemoveRule(rule) { this.deleteCandidate = rule },
    cancelRemoveRule() { this.deleteCandidate = null },
    confirmRemoveRule() { const rule = this.deleteCandidate; if (!rule) return; deleteSensitiveRule(rule); saveSensitiveRules(this.rules.filter(item => item !== rule)); this.rules = loadSensitiveRules(); this.deleteCandidate = null; if (this.editingId === rule.id) this.cancelEdit(); this.notify(t('management.ruleDeleted', { name: this.ruleDisplayName(rule) })) },
    syncAiAvailability() { const availability = readAiAvailability({ requireDesktop: false }); this.aiEnabled = availability.enabled; this.activeModelPath = availability.modelPath },
    openRegexConverter() { this.syncAiAvailability(); if (!this.regexModelReady) return; this.showRegexConverter = true; this.conversionError = ''; this.conversionNotice = ''; this.conversionCandidates = []; this.converterSelection = Object.fromEntries(this.rules.map(rule => [rule.id, false])) },
    closeRegexConverter() { if (!this.converting) { this.showRegexConverter = false; this.conversionError = ''; this.conversionNotice = ''; this.conversionCandidates = [] } },
    toggleAllConverterRules(checked) { this.rules.filter(rule => rule.kind !== 'regex').forEach(rule => { this.converterSelection[rule.id] = checked }) },
    isGroupSelected(group) { const eligible = group.rules.filter(rule => rule.kind !== 'regex'); return eligible.length > 0 && eligible.every(rule => this.converterSelection[rule.id]) },
    isGroupPartiallySelected(group) { const eligible = group.rules.filter(rule => rule.kind !== 'regex'); return eligible.some(rule => this.converterSelection[rule.id]) && !eligible.every(rule => this.converterSelection[rule.id]) },
    toggleConverterGroup(group, checked) { group.rules.filter(rule => rule.kind !== 'regex').forEach(rule => { this.converterSelection[rule.id] = checked }) },
    async startRegexConversion() { this.conversionError = ''; this.conversionNotice = ''; this.conversionCandidates = []; this.syncAiAvailability(); if (!this.regexModelReady) { this.conversionError = !this.aiEnabled ? t('management.enableAiFirst') : t('management.applyModelFirst'); return } const sourceRules = this.selectedConvertibleRules; if (!sourceRules.length) { this.conversionError = t('management.selectNonRegex'); return } const fallback = localRegexCandidates(sourceRules).map(candidate => ({ ...candidate, accepted: false })); this.converting = true; try { const response = await aiConvertRulesToRegex({ schema_version: 1, model_path: this.activeModelPath, rules: sourceRules.map(({ id, name, kind, value }) => ({ id, name, kind, value })) }); const byId = new Map(sourceRules.map(rule => [rule.id, rule])); const candidates = (response.data || []).map(candidate => ({ ...candidate, name: byId.get(candidate.id)?.name || candidate.id, accepted: false, source: 'model' })).filter(candidate => { if (!byId.has(candidate.id)) return false; try { new RegExp(candidate.regex); return true } catch (_) { return false } }); if (candidates.length) this.conversionCandidates = candidates; else if (fallback.length) { this.conversionCandidates = fallback; this.conversionNotice = t('management.fallbackEmpty') } else throw localizedError(t('management.noModelCandidates')) } catch (error) { if (fallback.length) { this.conversionCandidates = fallback; this.conversionNotice = t('management.fallbackFailed') } else this.conversionError = localizeManagementError(error, t, 'conversionFailed') } finally { this.converting = false } },
    applyRegexCandidates() { const approved = this.conversionCandidates.filter(candidate => candidate.accepted); if (!approved.length) { this.conversionError = t('management.selectCandidates'); return } approved.forEach(candidate => { const rule = this.rules.find(item => item.id === candidate.id); if (rule) Object.assign(rule, { kind: 'regex', value: candidate.regex, method: '正则表达式（AI 候选）' }) }); saveSensitiveRules(this.rules); this.rules = loadSensitiveRules(); this.notify(t('management.candidatesSaved', { count: this.formatCount(approved.length) })); this.closeRegexConverter() },
    exportRules() { const payload = { schema_version: SENSITIVE_RULES_EXPORT_SCHEMA_VERSION, exported_at: new Date().toISOString(), rules: this.rules, deleted_builtin_rule_ids: getDeletedBuiltInRuleIds() }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }); const href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; link.download = `desens-sensitive-rules-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(href), 1500); this.notify(t('management.rulesExported')) },
    async importRules(event) { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; const accepted = await requestAppConfirm({ title: t('management.importTitle'), message: t('management.importMessage', { name: file.name }), confirmText: t('management.importConfirm'), tone: 'warning' }); if (!accepted) return; try { const payload = JSON.parse(await file.text()); const source = Array.isArray(payload) ? payload : payload?.rules; if (!Array.isArray(source)) throw localizedError(t('management.missingRules')); const seen = new Set(); const imported = source.filter(rule => !isRetiredBuiltInRule(rule)).map(rule => { if (!rule || typeof rule !== 'object' || typeof rule.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(rule.id) || seen.has(rule.id)) throw localizedError(t('management.invalidId')); if (typeof rule.name !== 'string' || !rule.name.trim() || rule.name.length > 120 || !RULE_KINDS.includes(rule.kind) || typeof rule.value !== 'string' || !rule.value.trim() || rule.value.length > 1200) throw localizedError(t('management.invalidRule', { name: rule.id })); if (rule.kind === 'regex') { try { new RegExp(rule.value) } catch (_) { throw localizedError(t('management.invalidRuleRegex', { name: this.ruleDisplayName(rule) })) } } seen.add(rule.id); return { id: rule.id, name: rule.name.trim(), kind: rule.kind, value: rule.value, method: typeof rule.method === 'string' ? rule.method.slice(0, 80) : undefined, enabled: rule.enabled !== false, builtIn: DEFAULT_RULES.some(item => item.id === rule.id) } }); const importedDefaults = new Set(imported.filter(rule => rule.builtIn).map(rule => rule.id)); const declaredDeleted = Array.isArray(payload?.deleted_builtin_rule_ids) ? payload.deleted_builtin_rule_ids.filter(id => typeof id === 'string') : []; const deletedBuiltinIds = DEFAULT_RULES.filter(rule => declaredDeleted.includes(rule.id) || !importedDefaults.has(rule.id)).map(rule => rule.id); replaceSensitiveRules(imported, deletedBuiltinIds); this.rules = loadSensitiveRules(); this.notify(t('management.rulesImported', { count: this.formatCount(this.rules.length) })) } catch (error) { this.error = error instanceof SyntaxError ? t('management.invalidJson') : localizeManagementError(error, t, 'importFailed') } }
  }
}
</script>

<style scoped>
.batch-toolbar .batch-delete { color: #b42318; border-color: #f3b4ae; }
.rules-list-actions { gap: 10px; align-items: center; }
.batch-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px; margin-bottom: 10px; border: 1px solid var(--border); border-radius: 10px; background: #f8fafc; font-size: 13px; }
.batch-toolbar label { display: flex; align-items: center; gap: 8px; }
.batch-select, .batch-select-all { width: 16px; height: 16px; padding: 0; flex-shrink: 0; }
.batch-toolbar .rules-error { flex-basis: 100%; margin: 0; }
.rules-action-btn:disabled { opacity: .5; cursor: not-allowed; }
.rule-status { flex-shrink: 0; line-height: 1; }
.rules-list .rule-item.is-disabled { opacity: 1; }
.rule-item.is-disabled .rule-item__content { opacity: .55; }
.rules-page{max-width:1720px;padding-top:clamp(18px,2.5vh,32px);padding-bottom:28px}.page-heading{margin-bottom:2px}.page-heading h1{margin:6px 0 8px;font-size:clamp(30px,4vw,46px);line-height:1.12}.page-heading p{margin:0;color:var(--muted);max-width:720px;line-height:1.45}.rules-form,.rules-list{margin-top:0;border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;background:#fff}.rules-form__heading,.rules-list__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.rules-form__heading h2{font-size:var(--text-lg);margin:0}.rules-list__head{padding:16px 20px;margin:0;border-bottom:1px solid var(--border-soft);color:var(--muted)}.rules-list__head strong{color:var(--fg)}.rules-list-wrap{min-width:0}.rules-list-actions{display:flex;justify-content:flex-end;margin:0 0 10px}.rules-list-wrap .rules-list{margin-top:0}.rules-list__tools{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}.rules-action-btn{min-height:34px;padding:7px 14px;border:1px solid var(--border);border-radius:9px;background:#fff;color:var(--fg);font:600 13px/1 inherit;cursor:pointer;box-shadow:0 1px 2px rgba(15,23,42,.04)}.rules-action-btn:hover{border-color:#94a3b8;background:#f8fafc}.rules-action-btn--primary{border-color:#111827;background:#111827;color:#fff;padding-inline:16px;box-shadow:0 5px 14px rgba(15,23,42,.15)}.rules-action-btn--primary:hover{background:#334155;border-color:#334155}.form-grid{display:grid;grid-template-columns:1fr 180px;gap:16px}.form-grid__wide{grid-column:1/-1}label{display:grid;gap:7px;font-size:var(--text-sm);font-weight:600}input,select{padding:11px 12px;border:1px solid var(--border);border-radius:8px;font:inherit;background:#fff}.rules-form .btn{margin-top:16px}.rules-error{color:#b42318;margin:12px 0 0}.rules-list{padding:0;max-height:min(54vh,650px);overflow-y:scroll;overflow-x:hidden;scrollbar-gutter:stable}.rule-item{display:flex;align-items:center;gap:16px;padding:16px 20px;border-bottom:1px solid var(--border-soft)}.rule-item:last-child{border-bottom:0}.rule-item.is-disabled{opacity:.55}.rule-toggle{min-width:66px;font-size:12px;font-weight:500;display:flex;align-items:center;gap:6px}.rule-item__content{display:flex;align-items:center;gap:10px;flex:1;min-width:0}.rule-item__content code{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.badge{font-size:11px;padding:3px 6px;background:#f1f5f9;border-radius:4px;white-space:nowrap}.rule-item__actions{display:flex;align-items:center;gap:8px}.text-btn{padding:4px 6px;border:0;background:transparent;color:var(--muted);font:inherit;font-size:13px;cursor:pointer}.text-btn:hover{color:var(--fg);text-decoration:underline}.icon-btn{font-size:24px;line-height:1;border:0;background:transparent;cursor:pointer;color:var(--muted)}.rules-confirm-overlay{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.45)}.rules-confirm{position:relative;width:min(100%,460px);padding:28px;border-radius:16px;background:#fff;box-shadow:0 24px 64px rgba(15,23,42,.24)}.rules-edit-dialog{width:min(100%,620px)}.rules-model-required{border:1px solid #fecaca}.rules-confirm h2{margin:8px 0 12px;font-size:24px}.rules-confirm p:not(.mono-label){margin:0;color:var(--muted);line-height:1.65}.rules-confirm__actions{display:flex;justify-content:flex-end;gap:12px;margin-top:24px}.rules-confirm__actions .btn{margin:0}.btn--danger{background:#b42318;color:#fff;border-color:#b42318}.dialog-close{position:absolute;top:14px;inset-inline-end:16px;border:0;background:transparent;color:var(--muted);font-size:26px;line-height:1;cursor:pointer}.regex-converter{width:min(100%,780px);max-height:min(86vh,820px);overflow:auto}.dialog-copy{max-width:620px}.model-status{margin-top:12px!important;padding:10px 12px;border-radius:8px;background:#fff7ed;color:#9a3412!important;font-size:13px}.model-status.is-ready{background:#ecfdf3;color:#166534!important}.converter-controls{margin-top:18px}.converter-groups{display:grid;gap:12px;margin-top:12px;max-height:360px;overflow:auto;padding-inline-end:4px}.converter-group{border:1px solid var(--border-soft);border-radius:10px;padding:12px}.converter-check{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}.converter-check input,.converter-rule input{padding:0;width:16px;height:16px}.converter-check--group span{font-weight:400;color:var(--muted)}.converter-rule{display:flex;grid-template-columns:none;align-items:flex-start;gap:10px;margin-top:10px;padding:9px;border-radius:8px;background:#f8fafc;font-size:13px}.converter-rule>span{display:grid;gap:3px;min-width:0}.converter-rule small,.converter-rule code{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:12px}.conversion-results{display:grid;gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid var(--border-soft)}.converter-rule--candidate{margin-top:0;background:#fffbeb}.converter-rule--candidate code{font-family:var(--font-mono,monospace);white-space:normal;overflow-wrap:anywhere}.btn:disabled{cursor:not-allowed;opacity:.55}@media(max-width:600px){.form-grid{grid-template-columns:1fr}.form-grid__wide{grid-column:auto}.rule-item__content{flex-wrap:wrap}.rule-item{align-items:flex-start}.rule-toggle{min-width:auto}.rule-item__actions{margin-inline-start:auto}.rules-list__head{align-items:flex-start}.rules-list__tools{justify-content:flex-start}.rules-list-actions{margin-top:20px}.regex-converter{padding:22px 18px}.rules-confirm__actions{flex-wrap:wrap}}
</style>
