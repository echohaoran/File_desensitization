<template>
  <main class="container desktop-smoke">
    <div class="index-eyebrow"><span class="index-eyebrow__line"></span><span class="mono-label">TAURI / SMOKE</span></div>
    <h1>桌面核心测试</h1>
    <p class="desktop-smoke__hint">此页面仅用于验证新 Rust/Tauri 链路，浏览器模式下不会伪造桌面结果。</p>
    <div class="desktop-smoke__actions">
      <button class="btn btn--primary" @click="checkHealth">检查健康状态</button>
      <button class="btn btn--secondary" @click="checkCapabilities">查看格式能力</button>
    </div>
    <label class="desktop-smoke__label" for="smoke-text">虚构测试文本</label>
    <textarea id="smoke-text" v-model="text" rows="5" />
    <div class="desktop-smoke__row">
      <label>起点 <input v-model.number="start" type="number" min="0" /></label>
      <label>终点 <input v-model.number="end" type="number" min="0" /></label>
      <input v-model="kind" aria-label="敏感字段类型" placeholder="字段类型" />
      <button class="btn btn--primary" @click="redact">执行已确认脱敏</button>
      <button class="btn btn--secondary" @click="restore">还原</button>
    </div>
    <pre v-if="output">{{ output }}</pre>
  </main>
</template>

<script>
import { desktopHealth, documentCapabilities, isTauriRuntime, redactApprovedText, restoreMappedText } from '@/api/tauriBridge'

export default {
  name: 'DesktopSmoke',
  data: () => ({ text: '虚构联系人：张三，电话：13800138000', start: 12, end: 23, kind: 'phone', output: '' , lastMappings: [] }),
  methods: {
    async checkHealth() { this.output = JSON.stringify({ tauri: isTauriRuntime(), result: await desktopHealth() }, null, 2) },
    async checkCapabilities() { this.output = JSON.stringify(await documentCapabilities(), null, 2) },
    async redact() {
      const result = await redactApprovedText({ schema_version: 1, text: this.text, spans: [{ start: this.start, end: this.end, kind: this.kind }] })
      this.lastMappings = result.data.mappings
      this.text = result.data.redacted_text
      this.output = JSON.stringify(result, null, 2)
    },
    async restore() {
      const result = await restoreMappedText(this.text, this.lastMappings)
      this.text = result.data.restored_text
      this.output = JSON.stringify(result, null, 2)
    }
  }
}
</script>

<style scoped>
.desktop-smoke { max-width: 960px; padding: 48px 24px; }
.desktop-smoke__hint { color: #6b7280; }
.desktop-smoke__actions, .desktop-smoke__row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 20px 0; }
.desktop-smoke textarea, .desktop-smoke input { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; font: inherit; }
.desktop-smoke textarea { width: 100%; margin-top: 8px; }
.desktop-smoke__label { display: block; margin-top: 28px; font-weight: 600; }
.desktop-smoke__row input[type='number'] { width: 82px; }
.desktop-smoke pre { white-space: pre-wrap; background: #111827; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow: auto; }
</style>
