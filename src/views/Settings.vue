<template>
  <div class="container settings-page">
    <div class="settings-hero">
      <p class="mono-label">LOCAL AI / SETTINGS</p>
      <h1>设置</h1>
      <p>管理本地 AI、GGUF 模型和任务状态。模型不会随应用安装包发布。</p>
    </div>

    <section class="settings-card">
      <div class="settings-card__head"><div><h2>AI 脱敏</h2><p>AI 默认关闭；开启后仅对右侧用户框选区域生成待审核候选。</p></div><label class="switch"><input v-model="aiEnabled" type="checkbox" @change="saveAiSetting"><span></span></label></div>
      <div class="settings-notice" :class="aiEnabled ? 'is-on' : 'is-off'">{{ aiEnabled ? 'AI 已开启：结果仍需人工确认，不会自动修改文件。' : 'AI 当前关闭：脱敏仅使用规则和人工选区。' }}</div>
    </section>

    <section class="settings-card">
      <div class="settings-card__head"><div><h2>模型来源</h2><p>支持从魔搭社区或 Hugging Face 获取 GGUF，也可以登记本地已下载文件。</p></div><select v-model="provider" class="settings-select"><option value="modelscope">魔搭社区</option><option value="huggingface">Hugging Face</option></select></div>
      <div class="model-grid">
        <article v-for="model in recommendedModels" :key="model.id" class="model-item"><div class="model-item__body"><div class="model-item__top"><div><strong>{{ model.name }}</strong><span>{{ model.description }}</span><small>GGUF · {{ provider === 'modelscope' ? 'ModelScope' : 'Hugging Face 镜像' }} · 预计占用 {{ model.size }}</small></div><button class="btn btn--secondary btn--sm" :disabled="!downloadUrl(model) || downloadState[model.id] === 'downloading'" @click="startDownload(model)">{{ downloadState[model.id] === 'done' ? '已下载并登记' : downloadState[model.id] === 'downloading' ? '正在下载…' : '直接下载' }}</button></div><div v-if="downloadState[model.id] === 'downloading'" class="download-progress"><div class="download-progress__label"><span>正在下载到本地模型目录…</span><span>{{ downloadProgress[model.id] }}%</span></div><div class="download-progress__track"><div class="download-progress__bar" :style="{ width: `${downloadProgress[model.id]}%` }"></div></div></div><div v-else-if="downloadState[model.id] === 'done'" class="download-done">已下载并完成 GGUF 校验，已加入本地模型清单</div></div></article>
      </div>
      <p class="settings-hint">下载完成后，请将 `.gguf` 文件保存到本机，再在下方登记路径。未完成校验的文件不会加入模型清单。</p>
    </section>

    <section class="settings-card">
      <div class="settings-card__head"><div><h2>本地 GGUF 模型</h2><p>登记前执行 GGUF magic、可读性和 SHA-256 校验。</p></div><button class="btn btn--primary btn--sm" @click="refreshModels">刷新清单</button></div>
      <div class="local-model-form"><input v-model="modelPath" class="settings-input" placeholder="输入 .gguf 文件的本地路径" @keyup.enter="registerModel"><button class="btn btn--primary" :disabled="!isTauri || !modelPath || registering" @click="registerModel">{{ registering ? '校验中…' : '校验并登记' }}</button></div>
      <p v-if="!isTauri" class="settings-hint">当前为浏览器兼容模式；请在 Tauri 桌面应用中登记本地路径。</p>
      <p v-if="modelError" class="settings-error">{{ modelError }}</p>
      <div v-if="models.length" class="registered-models"><div v-for="model in models" :key="model.id" class="registered-model"><div class="registered-model__head"><div><strong>{{ model.name }}</strong><span>{{ model.status }} · {{ formatSize(model.size_bytes) }} · {{ model.sha256?.slice(0, 12) || '无校验值' }}…</span></div><button class="btn btn--secondary btn--sm" :class="{ 'is-active-model': activeModelId === model.id }" @click="applyModel(model)">{{ activeModelId === model.id ? '当前使用' : '应用模型' }}</button></div><code>{{ model.path }}</code></div></div><div v-else class="settings-empty">暂无已登记模型</div>
    </section>

    <section class="settings-card settings-card--task"><div class="settings-card__head"><div><h2>任务状态</h2><p>长任务通过事件报告进度，不轮询临时文件。</p></div><span class="task-badge">{{ lastTask ? `${lastTask.stage} · ${lastTask.progress}%` : '暂无任务' }}</span></div></section>
  </div>
</template>

<script>
import { isTauriRuntime, listModels, registerLocalModel, downloadModel, onTaskEvent } from '@/api/tauriBridge'

export default {
  name: 'Settings',
  data() {
    return { aiEnabled: localStorage.getItem('desens_ai_enabled') === 'true', provider: localStorage.getItem('desens_model_provider') || 'modelscope', modelPath: '', models: [], activeModelId: localStorage.getItem('desens_active_model_id') || '', registering: false, modelError: '', lastTask: null, stopTaskListener: null, isTauri: isTauriRuntime(), downloadProgress: {}, downloadState: {}, downloadTimers: {}, recommendedModels: [
      { id: 'qwen1.5-0.5b', name: 'Qwen1.5 0.5B Chat', size: '约 459 MB', description: '轻量规则辅助与本地候选检测', hf: 'Qwen/Qwen1.5-0.5B-Chat-GGUF/resolve/main/qwen1_5-0_5b-chat-q5_k_m.gguf?download=true', ms: 'Qwen/Qwen1.5-0.5B-Chat-GGUF' },
      { id: 'qwen2.5-0.5b', name: 'Qwen2.5 0.5B Instruct', size: '约 676 MB（Q8）', description: '小体积指令模型，适合本地初筛', hf: 'Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q8_0.gguf?download=true', ms: 'Qwen/Qwen2.5-0.5B-Instruct-GGUF' },
      { id: 'qwen3-0.6b', name: 'Qwen3 0.6B', size: '约 639 MB', description: '轻量本地候选检测模型', hf: 'Qwen/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf?download=true', ms: 'Qwen/Qwen3-0.6B-GGUF' },
      { id: 'smollm2-360m', name: 'SmolLM2 360M Instruct', size: '约 386 MB（Q8）', description: '超轻量本地文本分类辅助', hf: 'HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q8_0.gguf?download=true', ms: 'HuggingFaceTB/SmolLM2-360M-Instruct-GGUF' }
    ] }
  },
  watch: { provider(value) { localStorage.setItem('desens_model_provider', value); this.notify(`模型来源已切换为${value === 'modelscope' ? '魔搭社区' : 'Hugging Face 镜像'}`) } },
  mounted() { this.refreshModels(); this.stopTaskListener = onTaskEvent(event => { this.lastTask = event }) },
  beforeUnmount() { this.stopTaskListener?.(); Object.values(this.downloadTimers).forEach(clearInterval) },
  methods: {
    notify(message) { window.dispatchEvent(new CustomEvent('desens:status', { detail: { message } })) },
    saveAiSetting() { localStorage.setItem('desens_ai_enabled', String(this.aiEnabled)); this.notify(this.aiEnabled ? 'AI 脱敏已开启' : 'AI 脱敏已关闭') },
    async startDownload(model) { if (!this.isTauri || this.downloadState[model.id] === 'downloading') return; const url = this.downloadUrl(model); if (!url) return; this.modelError = ''; this.downloadState[model.id] = 'downloading'; this.downloadProgress[model.id] = 1; clearInterval(this.downloadTimers[model.id]); this.downloadTimers[model.id] = setInterval(() => { if (this.downloadState[model.id] === 'downloading') this.downloadProgress[model.id] = Math.min(92, (this.downloadProgress[model.id] || 1) + 3) }, 500); try { const filename = model.hf.split('/').pop().split('?')[0]; const result = await downloadModel({ schema_version: 1, url, filename }); clearInterval(this.downloadTimers[model.id]); this.downloadProgress[model.id] = 100; this.downloadState[model.id] = 'done'; this.models = [...this.models, result.data]; window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: true, message: '模型已下载、校验并登记到本地模型目录。', filename, size: result.data?.size_bytes } })) } catch (error) { clearInterval(this.downloadTimers[model.id]); this.downloadState[model.id] = 'error'; this.downloadProgress[model.id] = 0; this.modelError = error.message || '模型下载失败'; window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: this.modelError, filename: model.name } })) } },
    downloadUrl(model) { return model.hf ? `https://hf-mirror.com/${model.hf}` : '' },
    async refreshModels() { if (!this.isTauri) { this.notify('请在桌面应用中刷新本地模型'); return }; try { const response = await listModels(); this.models = response.data?.items || []; this.notify(`模型清单已刷新，共 ${this.models.length} 个`) } catch (error) { this.modelError = error.message; this.notify(`刷新失败：${this.modelError}`) } },
    async registerModel() { if (!this.isTauri || !this.modelPath) return; this.registering = true; this.modelError = ''; try { await registerLocalModel({ schema_version: 1, path: this.modelPath }); this.modelPath = ''; await this.refreshModels(); this.notify('GGUF 模型校验并登记完成') } catch (error) { this.modelError = error.message || '模型校验失败'; this.notify(`登记失败：${this.modelError}`) } finally { this.registering = false } },
    applyModel(model) { this.activeModelId = model.id; localStorage.setItem('desens_active_model_id', model.id); localStorage.setItem('desens_active_model_path', model.path); this.modelError = ''; this.notify(`已应用模型：${model.name}`) },
    formatSize(bytes) { if (!bytes) return '未知大小'; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB` }
  }
}
</script>

<style scoped>
.settings-page { max-width: 1040px; padding-top: 44px; padding-bottom: 72px; }
.settings-hero { margin-bottom: 28px; } .settings-hero h1 { margin: 8px 0; font-size: 36px; } .settings-hero p:last-child { color: #64748b; }
.settings-card { padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; } .settings-card__head { display: flex; justify-content: space-between; gap: 20px; align-items: center; } h2 { margin: 0 0 6px; font-size: 18px; } .settings-card p { margin: 0; color: #64748b; font-size: 13px; }
.settings-notice { margin-top: 20px; padding: 12px 14px; border-radius: 8px; font-size: 13px; } .settings-notice.is-on { color: #166534; background: #f0fdf4; } .settings-notice.is-off { color: #475569; background: #f8fafc; }
.switch input { display: none; } .switch span { display: block; position: relative; width: 46px; height: 26px; border-radius: 99px; background: #cbd5e1; cursor: pointer; transition: .2s; } .switch span:after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: white; transition: .2s; } .switch input:checked + span { background: #111827; } .switch input:checked + span:after { left: 23px; }
.settings-select, .settings-input { min-height: 38px; padding: 0 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; color: #0f172a; } .settings-input { flex: 1; }
.model-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; } .model-item, .registered-model { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; } .model-item__body { width: 100%; } .model-item__top { display: flex; justify-content: space-between; gap: 12px; align-items: center; } .model-item strong, .model-item span, .model-item small, .registered-model strong, .registered-model span { display: block; } .model-item span, .model-item small, .registered-model span { margin-top: 5px; color: #64748b; font-size: 12px; } .download-progress { margin-top: 12px; } .download-progress__label { display: flex; justify-content: space-between; color: #64748b; font-size: 12px; margin-bottom: 6px; } .download-progress__track { height: 6px; overflow: hidden; border-radius: 99px; background: #e2e8f0; } .download-progress__bar { height: 100%; border-radius: inherit; background: #111827; transition: width .3s ease; } .download-done { margin-top: 10px; color: #166534; font-size: 12px; } .settings-hint { margin-top: 14px !important; font-size: 12px !important; } .local-model-form { display: flex; gap: 10px; margin-top: 20px; } .settings-error { margin-top: 12px !important; color: #b91c1c !important; } .registered-models { display: grid; gap: 8px; margin-top: 16px; } .registered-model { align-items: flex-start; flex-direction: column; } .registered-model__head { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 12px; } .is-active-model { color: #166534; border-color: #86efac; background: #f0fdf4; } .registered-model code { color: #64748b; font-size: 11px; word-break: break-all; } .settings-empty { margin-top: 16px; padding: 24px; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 8px; } .task-badge { padding: 6px 10px; border-radius: 99px; color: #475569; background: #f1f5f9; font-size: 12px; }
@media (max-width: 760px) { .model-grid { grid-template-columns: 1fr; } .settings-card__head { align-items: flex-start; flex-direction: column; } .local-model-form { flex-direction: column; width: 100%; } }
</style>
