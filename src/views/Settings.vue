<template>
  <div class="container settings-page" :dir="getLocale() === 'ar' ? 'rtl' : 'ltr'">
    <div class="settings-hero">
      <p class="mono-label">{{ $t('management.settingsEyebrow') }}</p>
      <h1>{{ $t('management.settingsTitle') }}</h1>
      <p>{{ $t('management.settingsIntro') }}</p>
    </div>

    <section class="settings-card">
      <div class="settings-card__head"><div><h2>{{ $t('management.aiRedaction') }}</h2><p>{{ $t('management.aiDescription') }}</p></div><label class="switch"><input :aria-label="$t('management.aiRedaction')" v-model="aiEnabled" type="checkbox" @change="saveAiSetting"><span></span></label></div>
      <div class="settings-notice" :class="aiEnabled ? 'is-on' : 'is-off'">{{ aiEnabled ? $t('management.aiOnNotice') : $t('management.aiOffNotice') }}</div>
    </section>

    <section class="settings-card">
      <div class="settings-card__head"><div><h2>{{ $t('management.modelSource') }}</h2><p>{{ $t('management.sourceDescription') }}</p></div><select :aria-label="$t('management.modelSource')" v-model="provider" class="settings-select"><option value="modelscope">{{ $t('management.modelscope') }}</option><option value="huggingface">Hugging Face</option></select></div>
      <div class="model-grid">
        <article v-for="model in recommendedModels" :key="model.id" class="model-item"><div class="model-item__body"><div class="model-item__top"><div><strong dir="auto">{{ model.name }}</strong><span>{{ $t('management.modelDescription') }}</span><small>{{ $t('management.modelSummary', { provider: provider === 'modelscope' ? $t('management.modelscope') : $t('management.hfMirror'), size: $t('management.modelSize') }) }}</small></div><button class="btn btn--secondary btn--sm" :disabled="!downloadUrl(model) || downloadState[model.id] === 'downloading'" @click="startDownload(model)">{{ downloadState[model.id] === 'done' ? $t('management.downloaded') : downloadState[model.id] === 'downloading' ? $t('management.downloading') : $t('management.download') }}</button></div><div v-if="downloadState[model.id] === 'downloading'" class="download-progress"><div class="download-progress__label"><span>{{ $t('management.downloadDirectory') }}</span><span>{{ formatPercent(downloadProgress[model.id]) }}</span></div><div class="download-progress__track"><div class="download-progress__bar" :style="{ width: `${downloadProgress[model.id]}%` }"></div></div></div><div v-else-if="downloadState[model.id] === 'done'" class="download-done">{{ $t('management.downloadVerified') }}</div></div></article>
      </div>
      <p class="settings-hint">{{ $t('management.downloadHint') }}</p>
    </section>

    <section class="settings-card">
      <div class="settings-card__head"><div><h2>{{ $t('management.localModels') }}</h2><p>{{ $t('management.validationDescription') }}</p></div><button class="btn btn--primary btn--sm" @click="refreshModels">{{ $t('management.refresh') }}</button></div>
      <div class="local-model-form"><input dir="ltr" :aria-label="$t('management.pathPlaceholder')" v-model="modelPath" class="settings-input" :placeholder="$t('management.pathPlaceholder')" @keyup.enter="registerModel"><button class="btn btn--primary" :disabled="!isTauri || !modelPath || registering" @click="registerModel">{{ registering ? $t('management.verifying') : $t('management.register') }}</button></div>
      <p v-if="!isTauri" class="settings-hint">{{ $t('management.browserHint') }}</p>
      <p v-if="modelError" class="settings-error">{{ modelError }}</p>
      <div v-if="models.length" class="registered-models"><div v-for="model in models" :key="model.id" class="registered-model"><div class="registered-model__head"><div><strong dir="auto">{{ model.name }}</strong><span>{{ statusLabel(model.status) }} · {{ formatSize(model.size_bytes) }} · {{ model.sha256?.slice(0, 12) || $t('management.noHash') }}…</span></div><div class="registered-model__actions"><button class="btn btn--secondary btn--sm" :class="{ 'is-active-model': activeModelId === model.id }" @click="applyModel(model)">{{ activeModelId === model.id ? $t('management.activeModel') : $t('management.applyModel') }}</button><button class="btn btn--ghost btn--sm" @click="removeModel(model)">{{ $t('management.unregister') }}</button></div></div><code dir="ltr">{{ model.path }}</code></div></div><div v-else class="settings-empty">{{ $t('management.noModels') }}</div>
    </section>

    <section class="settings-card settings-card--task"><div class="settings-card__head"><div><h2>{{ $t('management.tasks') }}</h2><p>{{ $t('management.tasksDescription') }}</p></div><span class="task-badge">{{ lastTask ? $t('management.taskProgress', { stage: statusLabel(lastTask.stage, lastTask.status), progress: formatPercent(lastTask.progress) }) : $t('management.noTasks') }}</span></div></section>
  </div>
</template>

<script>
import { t, getLocale } from '@/i18n'
import { localizeManagementError } from '@/i18n/modules/management'
import { isTauriRuntime, listModels, registerLocalModel, unregisterModel, downloadModel, onTaskEvent } from '@/api/tauriBridge'
import { requestAppConfirm } from '@/utils/appConfirm'
import { announceAiAvailabilityChange } from '@/utils/aiAvailability'

export default {
  name: 'Settings',
  data() {
    return { aiEnabled: localStorage.getItem('desens_ai_enabled') === 'true', provider: localStorage.getItem('desens_model_provider') || 'modelscope', modelPath: '', models: [], activeModelId: localStorage.getItem('desens_active_model_id') || '', registering: false, modelError: '', lastTask: null, stopTaskListener: null, isTauri: isTauriRuntime(), downloadProgress: {}, downloadState: {}, downloadTimers: {}, recommendedModels: [
      { id: 'qwen2.5-0.5b', name: 'Qwen2.5 0.5B Instruct', hf: 'Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_0.gguf?download=true', ms: 'https://modelscope.cn/models/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/master/qwen2.5-0.5b-instruct-q4_0.gguf', tokenizer: 'https://modelscope.cn/models/Qwen/Qwen2.5-0.5B-Instruct/resolve/master/tokenizer.json' },
    ] }
  },
  watch: { provider(value) { localStorage.setItem('desens_model_provider', value); this.notify(t('management.sourceChanged', { provider: value === 'modelscope' ? t('management.modelscope') : t('management.hfMirror') })) } },
  mounted() { this.refreshModels(); this.stopTaskListener = onTaskEvent(event => { this.lastTask = event }) },
  beforeUnmount() { this.stopTaskListener?.(); Object.values(this.downloadTimers).forEach(clearInterval) },
  methods: {
    getLocale,
    formatCount(value) { return new Intl.NumberFormat(getLocale()).format(value) },
    notify(message) { window.dispatchEvent(new CustomEvent('desens:status', { detail: { message } })) },
    saveAiSetting() { localStorage.setItem('desens_ai_enabled', String(this.aiEnabled)); announceAiAvailabilityChange(); this.notify(this.aiEnabled ? t('management.aiEnabled') : t('management.aiDisabled')) },
    async startDownload(model) { if (!this.isTauri || this.downloadState[model.id] === 'downloading') return; const url = this.downloadUrl(model); if (!url) return; this.modelError = ''; this.downloadState[model.id] = 'downloading'; this.downloadProgress[model.id] = 1; clearInterval(this.downloadTimers[model.id]); this.downloadTimers[model.id] = setInterval(() => { if (this.downloadState[model.id] === 'downloading') this.downloadProgress[model.id] = Math.min(92, (this.downloadProgress[model.id] || 1) + 3) }, 500); try { const filename = model.hf.split('/').pop().split('?')[0]; const result = await downloadModel({ schema_version: 1, url, filename }); clearInterval(this.downloadTimers[model.id]); this.downloadProgress[model.id] = 100; this.downloadState[model.id] = 'done'; this.models = [...this.models, result.data]; window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: true, message: t('management.downloadSuccess'), filename, size: result.data?.size_bytes } })) } catch (error) { clearInterval(this.downloadTimers[model.id]); this.downloadState[model.id] = 'error'; this.downloadProgress[model.id] = 0; this.modelError = localizeManagementError(error, t, 'downloadFailed'); window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: this.modelError, filename: model.name } })) } },
    downloadUrl(model) { if (this.provider === 'modelscope') return model.ms || ''; return model.hf ? `https://hf-mirror.com/${model.hf}` : '' },
    async refreshModels() { if (!this.isTauri) { this.notify(t('management.refreshDesktop')); return }; try { const response = await listModels(); this.models = response.data?.items || []; if (!this.models.some(model => model.id === this.activeModelId)) { this.activeModelId = ''; localStorage.removeItem('desens_active_model_id'); localStorage.removeItem('desens_active_model_path'); announceAiAvailabilityChange() } this.notify(t('management.modelsRefreshed', { count: this.formatCount(this.models.length) })) } catch (error) { this.modelError = localizeManagementError(error, t, 'unknownError'); this.notify(t('management.refreshFailed', { error: this.modelError })) } },
    async registerModel() { if (!this.isTauri || !this.modelPath) return; this.registering = true; this.modelError = ''; try { await registerLocalModel({ schema_version: 1, path: this.modelPath }); this.modelPath = ''; await this.refreshModels(); this.notify(t('management.registrationSuccess')) } catch (error) { this.modelError = localizeManagementError(error, t, 'validationFailed'); this.notify(t('management.registrationFailed', { error: this.modelError })) } finally { this.registering = false } },
    applyModel(model) { this.activeModelId = model.id; localStorage.setItem('desens_active_model_id', model.id); localStorage.setItem('desens_active_model_path', model.path); announceAiAvailabilityChange(); this.modelError = ''; this.notify(t('management.modelApplied', { name: model.name })) },
    async removeModel(model) { if (!this.isTauri) return; const accepted = await requestAppConfirm({ title: t('management.unregisterTitle'), message: t('management.unregisterMessage', { name: model.name }), confirmText: t('management.unregisterConfirm'), tone: 'warning' }); if (!accepted) return; try { await unregisterModel({ schema_version: 1, model_id: model.id }); this.models = this.models.filter(item => item.id !== model.id); if (this.activeModelId === model.id) { this.activeModelId = ''; localStorage.removeItem('desens_active_model_id'); localStorage.removeItem('desens_active_model_path'); announceAiAvailabilityChange() } this.notify(t('management.unregistered', { name: model.name })) } catch (error) { this.modelError = localizeManagementError(error, t, 'unregisterFailed'); this.notify(t('management.unregisterError', { error: this.modelError })) } },
    formatPercent(value) { return value == null ? t('management.unknownProgress') : new Intl.NumberFormat(getLocale(), { style: 'percent', maximumFractionDigits: 0 }).format(value / 100) },
    statusLabel(value, fallback) {
      const statuses = ['discovered', 'downloading', 'verifying', 'ready', 'incompatible', 'failed', 'queued', 'running', 'paused', 'completed', 'cancelled', 'updated']
      const status = statuses.includes(value) ? value : statuses.includes(fallback) ? fallback : 'unknown'
      return t('management.status_' + status)
    },
    formatSize(bytes) {
      if (bytes == null) return t('management.unknownSize')
      const isSmall = bytes < 1024 * 1024
      return new Intl.NumberFormat(getLocale(), { style: 'unit', unit: isSmall ? 'kilobyte' : 'megabyte', maximumFractionDigits: isSmall ? 0 : 1 }).format(bytes / (isSmall ? 1024 : 1024 * 1024))
    }
  }
}
</script>

<style scoped>
.settings-page { max-width: 1040px; padding-top: 44px; padding-bottom: 72px; }
.settings-hero { margin-bottom: 28px; } .settings-hero h1 { margin: 8px 0; font-size: 36px; } .settings-hero p:last-child { color: #64748b; }
.settings-card { padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; } .settings-card__head { display: flex; justify-content: space-between; gap: 20px; align-items: center; } h2 { margin: 0 0 6px; font-size: 18px; } .settings-card p { margin: 0; color: #64748b; font-size: 13px; }
.settings-notice { margin-top: 20px; padding: 12px 14px; border-radius: 8px; font-size: 13px; } .settings-notice.is-on { color: #166534; background: #f0fdf4; } .settings-notice.is-off { color: #475569; background: #f8fafc; }
.switch input { display: none; } .switch span { display: block; position: relative; width: 46px; height: 26px; border-radius: 99px; background: #cbd5e1; cursor: pointer; transition: .2s; } .switch span:after { content: ''; position: absolute; top: 3px; inset-inline-start: 3px; width: 20px; height: 20px; border-radius: 50%; background: white; transition: .2s; } .switch input:checked + span { background: #111827; } .switch input:checked + span:after { inset-inline-start: 23px; }
.settings-select, .settings-input { min-height: 38px; padding: 0 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; color: #0f172a; } .settings-input { flex: 1; }
.model-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; } .model-item, .registered-model { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; } .model-item__body { width: 100%; } .model-item__top { display: flex; justify-content: space-between; gap: 12px; align-items: center; } .model-item strong, .model-item span, .model-item small, .registered-model strong, .registered-model span { display: block; } .model-item span, .model-item small, .registered-model span { margin-top: 5px; color: #64748b; font-size: 12px; } .download-progress { margin-top: 12px; } .download-progress__label { display: flex; justify-content: space-between; color: #64748b; font-size: 12px; margin-bottom: 6px; } .download-progress__track { height: 6px; overflow: hidden; border-radius: 99px; background: #e2e8f0; } .download-progress__bar { height: 100%; border-radius: inherit; background: #111827; transition: width .3s ease; } .download-done { margin-top: 10px; color: #166534; font-size: 12px; } .settings-hint { margin-top: 14px !important; font-size: 12px !important; } .local-model-form { display: flex; gap: 10px; margin-top: 20px; } .settings-error { margin-top: 12px !important; color: #b91c1c !important; } .registered-models { display: grid; gap: 8px; margin-top: 16px; } .registered-model { align-items: flex-start; flex-direction: column; } .registered-model__head { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 12px; } .is-active-model { color: #166534; border-color: #86efac; background: #f0fdf4; } .registered-model code { color: #64748b; font-size: 11px; word-break: break-all; } .settings-empty { margin-top: 16px; padding: 24px; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 8px; } .task-badge { padding: 6px 10px; border-radius: 99px; color: #475569; background: #f1f5f9; font-size: 12px; }
@media (max-width: 760px) { .model-grid { grid-template-columns: 1fr; } .settings-card__head { align-items: flex-start; flex-direction: column; } .local-model-form { flex-direction: column; width: 100%; } }
</style>
