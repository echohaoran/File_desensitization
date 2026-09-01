<template>
  <div class="container restore-main" :class="{ 'has-selection': selectedHistory }">
    <div class="index-eyebrow">
      <span class="index-eyebrow__line" aria-hidden="true"></span>
      <span class="mono-label">RESTORE / v0.1 PROTOTYPE</span>
    </div>

    <section class="index-hero">
      <h1>还原工作流</h1>
      <p>
        选择本机的脱敏历史后，上传经 AI 或其他流程处理过的脱敏文件，再执行还原。
      </p>
    </section>

    <section class="history-panel" aria-label="脱敏历史">
      <div class="history-panel__head">
        <h2>脱敏历史</h2>
        <div class="history-panel__tools">
          <input v-model.trim="historySearch" class="history-search" type="search" placeholder="搜索文件名或时间" aria-label="搜索脱敏历史" />
          <button v-if="history.length" class="btn btn--ghost btn--xs" @click="historySortDesc = !historySortDesc" :title="historySortDesc ? '当前按时间倒序，点击切换为正序' : '当前按时间正序，点击切换为倒序'">{{ historySortDesc ? '最新在前' : '最早在前' }}</button>
          <span>{{ historySearch ? `匹配 ${visibleHistory.length} / ${history.length} 条` : `${history.length} 条记录` }}</span>
          <button v-if="history.length" class="btn btn--ghost btn--xs" @click="requestClearHistory">全部清空</button>
        </div>
      </div>
      <p v-if="!history.length" class="history-panel__empty">暂无本机历史记录。完成一次脱敏后，记录会自动显示在这里。</p>
      <p v-else-if="!visibleHistory.length" class="history-panel__empty">没有匹配“{{ historySearch }}”的历史记录，换个关键词试试。</p>
      <div v-else class="history-list">
        <article v-for="item in visibleHistory" :key="item.id" class="history-item" :class="{ 'is-selected': selectedHistory?.id === item.id }">
          <button class="history-item__select" @click="selectHistory(item)">
            <strong>{{ item.file_name }}</strong><span>{{ formatDate(item.created_at) }} · {{ item.mapping?.mappings?.length || 0 }} 项脱敏{{ item.redacted_file_key ? ' · 脱敏文件已保存' : ' · 旧记录' }}</span>
          </button>
          <button class="icon-btn" @click="requestRemoveHistory(item)" :aria-label="`删除 ${item.file_name} 历史记录`">×</button>
        </article>
      </div>
    </section>

    <div v-if="selectedHistory" class="history-actions" aria-label="已选历史记录操作">
      <span>已选择：{{ selectedHistory.file_name }}</span>
      <div>
        <button class="btn btn--secondary" @click="downloadHistoryMapping">下载对照表</button>
        <button class="btn btn--primary" @click="downloadHistoryRedacted">下载脱敏后文件</button>
      </div>
    </div>

    <details v-if="false" class="restore-upload" aria-label="从文件还原">
      <summary>从文件与映射表还原（兼容旧记录）</summary>
    <div class="restore-grid" aria-label="文件上传区">
      <section class="restore-card">
        <div class="restore-card__head">
          <span class="num">01</span>
          <h3>上传脱敏文件</h3>
        </div>
        <label class="upload-zone" :class="{ 'is-dragover': isDraggingRedacted }" tabindex="0" role="button"
          aria-label="选择或拖入脱敏文件" @dragover.prevent="isDraggingRedacted = true" @dragleave="isDraggingRedacted = false"
          @drop.prevent="handleRedactedDrop" @keydown.enter="$refs.redactedInput.click()" 
          @keydown.space.prevent="$refs.redactedInput.click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span class="upload-zone__title">点击选择或拖入脱敏文件</span>
          <span class="upload-zone__hint">支持 TXT / CSV / JSON / PDF / DOCX / XLSX / PNG / JPG</span>
          <input type="file" ref="redactedInput" accept=".txt,.csv,.json,.md,.markdown,.pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,text/*,image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            @change="handleRedactedSelect" style="display: none" />
        </label>
        <div class="file-meta" v-if="redactedFile" style="margin-top: 16px">
          <span class="file-meta__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </span>
          <div class="file-meta__info">
            <div class="file-meta__name">{{ redactedFile.name }}</div>
            <div class="file-meta__detail">{{ formatSize(redactedFile.size) }}</div>
          </div>
          <button class="icon-btn" @click="clearRedactedFile" aria-label="移除当前文件" title="移除文件">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </section>

      <section class="restore-card">
        <div class="restore-card__head">
          <span class="num">02</span>
          <h3>上传映射表</h3>
        </div>
        <label class="upload-zone" :class="{ 'is-dragover': isDraggingMapping }" tabindex="0" role="button"
          aria-label="选择或拖入映射表 JSON" @dragover.prevent="isDraggingMapping = true" @dragleave="isDraggingMapping = false"
          @drop.prevent="handleMappingDrop" @keydown.enter="$refs.mappingInput.click()"
          @keydown.space.prevent="$refs.mappingInput.click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="upload-zone__title">点击选择映射表 JSON</span>
          <span class="upload-zone__hint">仅支持由本系统生成的 .json 映射表</span>
          <input type="file" ref="mappingInput" accept=".json,application/json"
            @change="handleMappingSelect" style="display: none" />
        </label>
        <div class="file-meta" v-if="mappingFile" style="margin-top: 16px">
          <span class="file-meta__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </span>
          <div class="file-meta__info">
            <div class="file-meta__name">{{ mappingFile.name }}</div>
            <div class="file-meta__detail">{{ formatSize(mappingFile.size) }}</div>
          </div>
          <button class="icon-btn" @click="clearMappingFile" aria-label="移除当前文件" title="移除文件">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </section>
    </div>
    </details>

    <section v-if="selectedHistory" class="restore-card restore-current-upload" aria-label="上传待还原文件">
      <div class="restore-card__head"><span class="num">02</span><h3>上传待还原的脱敏文件</h3></div>
      <p class="restore-current-upload__hint">请上传基于“{{ selectedHistory.file_name }}”处理后的文件；系统会按该历史记录中的本机映射进行还原。</p>
      <label v-if="!redactedFile" class="upload-zone" :class="{ 'is-dragover': isDraggingRedacted }" tabindex="0" role="button" aria-label="选择或拖入待还原文件" @dragover.prevent="isDraggingRedacted = true" @dragleave="isDraggingRedacted = false" @drop.prevent="handleRedactedDrop" @keydown.enter="$refs.historyRedactedInput.click()" @keydown.space.prevent="$refs.historyRedactedInput.click()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span class="upload-zone__title">点击选择或拖入待还原文件</span><span class="upload-zone__hint">支持 TXT / PDF / DOCX / XLSX / PNG / JPG</span>
        <input type="file" ref="historyRedactedInput" accept=".txt,.csv,.json,.md,.markdown,.pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,text/*,image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="handleRedactedSelect" style="display: none" />
      </label>
      <div v-else class="file-meta restore-current-upload__file"><div class="file-meta__info"><div class="file-meta__name">{{ redactedFile.name }}</div><div class="file-meta__detail">{{ formatSize(redactedFile.size) }}</div></div><button class="icon-btn" @click="clearRedactedFile" aria-label="移除当前文件">×</button></div>
    </section>

    <div class="validate-box" v-if="validation" :class="{ 'is-ok': validation.type === 'ok', 'is-err': validation.type === 'err' }">
      <svg v-if="validation.type === 'ok'" class="validate-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <svg v-else-if="validation.type === 'err'" class="validate-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <svg v-else class="validate-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div class="validate-box__text">
        <strong>{{ validation.title }}</strong><br />
        <span class="mono">{{ validation.message }}</span>
      </div>
    </div>

    <div class="action-bar" style="margin-bottom: 24px">
      <button class="btn btn--primary btn--lg btn--block" @click="requestRunRestore" :disabled="!canRestore || working">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        {{ working ? '正在还原…' : '开始还原' }}
      </button>
      <button class="btn btn--ghost btn--block" @click="requestReset" :disabled="!redactedFile && !selectedHistory">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        重新开始
      </button>
    </div>

    <div class="restore-result" v-if="restored">
      <div class="restore-result__head">
        <h3>还原结果</h3>
      </div>
      <div class="restore-result__body">
        <div v-if="redactedFileType === 'text' || redactedFileType === 'pdf' || redactedFileType === 'docx' || redactedFileType === 'excel'" class="text-preview">
          <template v-for="(part, i) in restoredTextParts" :key="i">
            <span v-if="part.type === 'normal'">{{ part.text }}</span>
            <span v-else class="det" title="已还原为原始值">{{ part.text }}</span>
          </template>
        </div>
        <div v-else-if="restoredImageDataUrl" class="canvas-wrap">
          <img :src="restoredImageDataUrl" alt="还原后的图片" />
        </div>
      </div>
    </div>
    <p v-if="feedback" class="restore-feedback" role="status">{{ feedback }}</p>

    <div class="download-bar" v-if="restored">
      <span class="download-bar__label">还原完成</span>
      <div class="download-bar__formats" v-if="redactedFileType === 'image'">
        <button class="btn btn--primary" @click="downloadRestoredImage">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          图片 PNG
        </button>
      </div>
      <div class="download-bar__formats" v-else>
        <button class="btn btn--primary" @click="downloadAsWord">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          文档 Word
        </button>
        <button class="btn btn--secondary" @click="downloadAsExcel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          表格 Excel
        </button>
        <button class="btn btn--secondary" @click="downloadAsCsv">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          表格 CSV
        </button>
        <button class="btn btn--secondary" @click="downloadAsTxt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          文本文档 TXT
        </button>
        <button class="btn btn--secondary" @click="downloadAsMarkdown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Markdown
        </button>
      </div>
    </div>

    <div v-if="confirmDialog" class="confirm-overlay" role="presentation" @click.self="cancelConfirm">
      <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="history-confirm-title" aria-describedby="history-confirm-message">
        <div class="confirm-dialog__icon" aria-hidden="true">!</div>
        <h2 id="history-confirm-title">{{ confirmDialog.title }}</h2>
        <p id="history-confirm-message">{{ confirmDialog.message }}</p>
        <div class="confirm-dialog__actions">
          <button class="btn btn--secondary" type="button" @click="cancelConfirm">取消</button>
          <button class="btn btn--primary" type="button" :disabled="clearingHistory" @click="executeConfirm">{{ clearingHistory ? '正在清理…' : confirmDialog.confirmText }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/build/pdf.worker.entry'
import JSZip from 'jszip'
import DesensitizationAPI from '@/api/desensitization'
import { isTauriRuntime, restoreMappedText } from '@/api/tauriBridge'
import { getHistoryFile, deleteHistoryFile, clearHistoryFiles } from '@/utils/historyFiles'
import { requestAppConfirm } from '@/utils/appConfirm'
import { buildTextBlob, buildCsvBlob, buildDocxBlob, buildXlsxBlob } from '@/utils/formatExport'

// Worker is configured via the import above

export default {
  name: 'Restore',
  data() {
    return {
      redactedFile: null,
      redactedFileType: null,
      mappingFile: null,
      mapping: null,
      isDraggingRedacted: false,
      isDraggingMapping: false,
      validation: null,
      restored: false,
      restoredText: '',
      restoredImageDataUrl: null,
      restoredBlob: null,
      history: [],
      selectedHistory: null
      ,working: false
      ,feedback: ''
      ,confirmDialog: null
      ,clearingHistory: false
      ,historySearch: ''
      ,historySortDesc: true
    }
  },
  computed: {
    visibleHistory() {
      const query = this.historySearch.toLowerCase()
      const items = this.history.filter(item =>
        !query ||
        String(item.file_name || '').toLowerCase().includes(query) ||
        this.formatDate(item.created_at).toLowerCase().includes(query)
      )
      const timeOf = item => { const t = new Date(item.created_at || 0).getTime(); return Number.isNaN(t) ? 0 : t }
      return items.sort((a, b) => this.historySortDesc ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b))
    },
    canRestore() {
      return Boolean(this.selectedHistory && this.redactedFile && this.mapping && this.validation?.type === 'ok')
    },
    restoredTextParts() {
      if (!this.restoredText || !this.mapping) return []
      
      const parts = []
      const placeholders = {}
      this.mapping.mappings.forEach(m => {
        if (m.placeholder && m.original !== undefined) {
          placeholders[m.placeholder] = m.original
        }
      })
      
      const sortedPlaceholders = Object.keys(placeholders).sort((a, b) => b.length - a.length)
      if (sortedPlaceholders.length === 0) {
        return [{ type: 'normal', text: this.restoredText }]
      }
      
      const regex = new RegExp('(' + sortedPlaceholders.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g')
      const textParts = this.restoredText.split(regex)
      
      textParts.forEach(part => {
        if (placeholders[part]) {
          parts.push({ type: 'restored', text: placeholders[part] })
        } else {
          parts.push({ type: 'normal', text: part })
        }
      })
      
      return parts
    }
  },
  methods: {
    notify(message) { window.dispatchEvent(new CustomEvent('desens:status', { detail: { message } })) },
    loadHistory() {
      try { this.history = JSON.parse(localStorage.getItem('desens_history') || '[]') } catch (_) { this.history = [] }
    },
    selectHistory(item) {
      this.selectedHistory = item
      this.mapping = item.mapping
      this.redactedFile = null
      this.redactedFileType = null
      this.validation = { type: 'wait', title: '历史记录已选择', message: `已加载 ${item.file_name}。请上传当前需要还原的脱敏文件。` }
      this.restored = false; this.restoredText = ''; this.restoredImageDataUrl = null
    },
    requestRemoveHistory(item) {
      this.confirmDialog = { action: 'remove', id: item.id, title: '删除历史记录', message: `确定删除“${item.file_name}”吗？对应的脱敏文件也会删除，此操作无法撤销。`, confirmText: '确认删除' }
    },
    requestClearHistory() {
      this.confirmDialog = { action: 'clear', title: '清空全部历史', message: `确定清空全部 ${this.history.length} 条脱敏历史吗？对应的脱敏文件也会全部删除，此操作无法撤销。`, confirmText: '确认清空' }
    },
    cancelConfirm() { if (!this.clearingHistory) this.confirmDialog = null },
    async executeConfirm() {
      if (!this.confirmDialog || this.clearingHistory) return
      this.clearingHistory = true
      try {
        if (this.confirmDialog.action === 'clear') await this.clearHistory()
        else await this.removeHistory(this.confirmDialog.id)
        this.confirmDialog = null
      } finally { this.clearingHistory = false }
    },
    async removeHistory(id) {
      this.history = this.history.filter(item => item.id !== id)
      localStorage.setItem('desens_history', JSON.stringify(this.history))
      await deleteHistoryFile(id).catch(() => {})
      if (this.selectedHistory?.id === id) this.reset()
      this.notify('脱敏历史已删除')
    },
    async clearHistory() {
      this.history = []
      localStorage.removeItem('desens_history')
      await clearHistoryFiles().catch(() => {})
      this.reset()
      this.notify('全部脱敏历史已清空')
    },
    formatDate(value) { return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '未知时间' },
    downloadHistoryMapping() {
      if (!this.selectedHistory?.mapping) { window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: '当前历史记录没有映射表' } })); return }
      const blob = new Blob([JSON.stringify(this.selectedHistory.mapping, null, 2)], { type: 'application/json' })
      this.triggerDownload(blob, `mapping_${this.selectedHistory.file_name.replace(/\.[^.]+$/, '')}.json`)
    },
    async downloadHistoryRedacted() {
      if (!this.selectedHistory) return
      const stem = this.selectedHistory.file_name.replace(/\.[^.]+$/, '')
      try {
        if (this.selectedHistory.redacted_file_key) {
          const stored = await getHistoryFile(this.selectedHistory.redacted_file_key)
          if (!stored?.blob) throw new Error('历史文件索引存在，但真实文件内容已丢失或被浏览器清理。')
          this.triggerDownload(stored.blob, stored.filename || `redacted_${this.selectedHistory.file_name}`)
          this.feedback = `已下载历史脱敏文件 ${stored.filename || ''}`
          return
        }
        const text = this.selectedHistory.redacted_text || ''
        const complexTypes = ['docx', 'word', 'excel', 'xlsx', 'xls', 'pdf']
        if (complexTypes.includes(this.selectedHistory.file_type)) {
          throw new Error('这是旧版历史记录，当时未保存真实文件字节。请重新执行一次脱敏，新记录将支持随时下载。')
        }
        if (!text) throw new Error('历史记录中没有可下载的脱敏正文')
        const notice = '【处理与还原规则】本文件包含脱敏占位符。请完整保留占位符，不得删除、拆分或改写，否则可能无法还原。'
        this.triggerDownload(new Blob([`${notice}\n\n${text}`], { type: 'text/plain;charset=utf-8' }), `redacted_${stem}.txt`)
      } catch (error) {
        this.feedback = `下载失败：${error.message}`
        window.dispatchEvent(new CustomEvent('desens:download-result', {
          detail: { success: false, message: error.message, filename: this.selectedHistory.file_name }
        }))
      }
    },
    async handleRedactedSelect(e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        if (await this.confirmUpload(file, '待还原的脱敏文件')) this.setRedactedFile(file)
        else e.target.value = ''
      }
    },
    async handleRedactedDrop(e) {
      this.isDraggingRedacted = false
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (await this.confirmUpload(file, '待还原的脱敏文件')) this.setRedactedFile(file)
      }
    },
    async handleMappingSelect(e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        if (await this.confirmUpload(file, 'JSON 映射表')) this.setMappingFile(file)
        else e.target.value = ''
      }
    },
    async handleMappingDrop(e) {
      this.isDraggingMapping = false
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (await this.confirmUpload(file, 'JSON 映射表')) this.setMappingFile(file)
      }
    },
    confirmUpload(file, purpose) {
      return requestAppConfirm({ title: '确认上传文件', message: `即将读取${purpose}：\n${file.name} · ${this.formatSize(file.size)}\n确认后才会开始校验。`, confirmText: '确认上传' })
    },
    async requestRunRestore() {
      const count = this.mapping?.mappings?.length || 0
      const accepted = await requestAppConfirm({ title: '开始还原文件', message: `将使用 ${count} 条映射还原“${this.redactedFile?.name || '当前文件'}”。请确认文件与映射记录对应。`, confirmText: '开始还原' })
      if (accepted) await this.runRestore()
    },
    async requestReset() {
      const accepted = await requestAppConfirm({ title: '重新开始当前流程', message: '已选择的历史记录、上传文件和当前还原结果将被清除。确认重新开始吗？', confirmText: '确认重新开始', tone: 'warning' })
      if (accepted) this.reset()
    },
    setRedactedFile(file) {
      this.redactedFile = file
      this.redactedFileType = this.inferFileType(file)
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      this.restoredBlob = null
      this.validateFiles()
    },
    inferFileType(file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        return 'pdf'
      }
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          file.name.toLowerCase().endsWith('.docx')) {
        return 'docx'
      }
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.toLowerCase().endsWith('.xlsx') || 
          file.name.toLowerCase().endsWith('.xls')) {
        return 'excel'
      }
      if (file.type.startsWith('image/')) return 'image'
      return 'text'
    },
    setMappingFile(file) {
      this.mappingFile = file
      this.mapping = null
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      this.restoredBlob = null
      this.validateFiles()
    },
    clearRedactedFile() {
      this.redactedFile = null
      this.redactedFileType = null
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      this.restoredBlob = null
      if (this.$refs.redactedInput) this.$refs.redactedInput.value = ''
      this.validateFiles()
    },
    clearMappingFile() {
      this.mappingFile = null
      this.mapping = null
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      if (this.$refs.mappingInput) this.$refs.mappingInput.value = ''
      this.validateFiles()
    },
    validateFiles() {
      if (this.selectedHistory) {
        if (!this.redactedFile) {
          this.validation = { type: 'wait', title: '等待文件', message: '请选择当前需要还原的脱敏文件。' }
        } else {
          this.validation = { type: 'ok', title: '文件已就绪', message: `将使用 ${this.selectedHistory.file_name} 的 ${this.mapping?.mappings?.length || 0} 条映射进行还原。` }
        }
        return
      }
      if (!this.redactedFile && !this.mappingFile) {
        this.validation = null
        return
      }
      
      if (!this.redactedFile || !this.mappingFile) {
        this.validation = { type: 'wait', title: '等待文件', message: '请同时上传脱敏文件与映射表。' }
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result)
          this.mapping = json
          
          // 允许映射表中的 file_type 与上传文件类型不完全匹配
          // 因为脱敏后的文件可能被转换为 .txt 格式
          const allowedOriginalTypes = ['text', 'pdf', 'docx', 'xlsx', 'xls', 'txt', 'csv', 'json', 'md']
          const isAllowedCombination = 
            (allowedOriginalTypes.includes(json.file_type) && allowedOriginalTypes.includes(this.redactedFileType)) ||
            (json.file_type === 'image' && ['png', 'jpg', 'jpeg'].includes(this.redactedFileType))
          
          if (json.file_type && !isAllowedCombination) {
            this.validation = { 
              type: 'err', 
              title: '文件类型不匹配', 
              message: '映射表记录的 file_type 与上传的脱敏文件类型不一致。' 
            }
            return
          }
          
          this.validation = { 
            type: 'ok', 
            title: '校验通过', 
            message: '映射表已加载，共 ' + (json.mappings ? json.mappings.length : 0) + ' 条记录，可执行还原。'
          }
        } catch (e) {
          this.validation = { 
            type: 'err', 
            title: '映射表解析失败', 
            message: e.message || '请上传有效的 JSON 映射表。' 
          }
        }
      }
      reader.readAsText(this.mappingFile)
    },
    async runRestore() {
      if (!this.canRestore) return
      this.working = true; this.feedback = '正在还原文件…'
      
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      
      try {
        if (this.redactedFileType === 'text' || this.redactedFileType === 'pdf' ||
            this.redactedFileType === 'docx' || this.redactedFileType === 'excel') await this.restoreText()
        else await this.restoreImage()
        if (this.restored) { this.feedback = '还原完成，请检查结果后下载'; this.notify('文件还原完成') }
      } catch (error) {
        this.feedback = `还原失败：${error.message}`
        this.validation = { type: 'err', title: '还原失败', message: error.message }
        this.notify(this.feedback)
      } finally { this.working = false }
    },
    restoreHistoryImage() {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0)
        const mappings = this.mapping.mappings || []; const patchMappings = mappings.filter(item => item.rect && item.patch)
        if (!patchMappings.length) { this.restoredImageDataUrl = canvas.toDataURL('image/png'); this.restored = true; return }
        let loaded = 0
        patchMappings.forEach(item => { const patch = new Image(); patch.onload = () => { ctx.drawImage(patch, item.rect.x, item.rect.y); loaded++; if (loaded === patchMappings.length) { this.restoredImageDataUrl = canvas.toDataURL('image/png'); this.restored = true } }; patch.src = item.patch })
      }
      img.src = this.selectedHistory.redacted_image
    },
    async restoreText() {
      if (isTauriRuntime() && this.redactedFileType === 'text') {
        const text = await this.redactedFile.text()
        const mappings = (this.mapping.mappings || [])
          .filter(item => (item.placeholder || item.marker) && item.original !== undefined && item.original !== null)
          .map((item, index) => ({
            mapping_id: String(item.id ?? item.mapping_id ?? `map_${index + 1}`),
            marker: String(item.placeholder ?? item.marker),
            kind: String(item.type ?? item.kind ?? 'manual'),
            original: String(item.original),
            start: Number.isInteger(item.start) ? item.start : 0,
            end: Number.isInteger(item.end) ? item.end : 0
          }))
        if (!mappings.length) throw new Error('映射表中没有可用于还原的有效标记')
        try {
          const response = await restoreMappedText(text, mappings)
          const restoredText = response?.data?.restored_text
          if (typeof restoredText !== 'string') throw new Error('桌面还原服务未返回有效正文')
          this.restoredText = restoredText
          this.restored = true
          return
        } catch (error) {
          const reason = error?.message || error?.error || String(error) || '未知错误'
          const fallback = this.performRestore(text)
          if (fallback !== text) {
            this.restoredText = fallback
            this.restored = true
            this.feedback = '桌面还原服务暂不可用，已使用映射表完成本地还原。'
            console.warn('Rust 还原失败，已使用本地映射回退：', reason)
            return
          }
          throw new Error(`桌面还原服务失败：${reason}`)
        }
      }
      if (this.redactedFileType === 'pdf') {
        try {
          const arrayBuffer = await this.redactedFile.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          let fullText = ''
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const pageText = textContent.items.map(item => item.str).join(' ')
            fullText += pageText + '\n'
          }
          
          let text = fullText.trim()
          text = this.performRestore(text)
          
          this.restoredText = text
          this.restored = true
        } catch (error) {
          console.error('PDF parsing error:', error)
          throw new Error('PDF 解析失败，请确保文件未加密或尝试其他格式。')
        }
      } else if (this.redactedFileType === 'docx') {
        try {
          const zip = await JSZip.loadAsync(await this.redactedFile.arrayBuffer())
          const markers = [...(this.mapping.mappings || [])].filter(item => item.placeholder && item.original !== undefined).sort((a, b) => b.placeholder.length - a.placeholder.length)
          const entries = Object.keys(zip.files).filter(name => /^word\/(document|header\d+|footer\d+)\.xml$/.test(name))
          if (!entries.length) throw new Error('DOCX 缺少可还原的文档结构')
          let changed = false
          for (const name of entries) {
            let xml = await zip.file(name).async('text')
            const before = xml
            markers.forEach(item => { xml = xml.split(item.placeholder).join(item.original) })
            if (xml !== before) { zip.file(name, xml); changed = true }
          }
          if (!changed) throw new Error('未找到可匹配的脱敏标记，请确认文件和映射表对应')
          const bodyXml = await zip.file('word/document.xml')?.async('text')
          if (bodyXml) {
            const parsed = new DOMParser().parseFromString(bodyXml, 'application/xml')
            this.restoredText = [...parsed.querySelectorAll('w\\:p, p')]
              .map(node => [...node.querySelectorAll('w\\:t, t')].map(text => text.textContent || '').join(''))
              .filter(Boolean).join('\n')
          }
          this.restoredBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
          this.restored = true
        } catch (error) { throw error }
      } else if (this.redactedFileType === 'excel') {
        try {
          const zip = await JSZip.loadAsync(await this.redactedFile.arrayBuffer())
          const markers = [...(this.mapping.mappings || [])].filter(item => item.placeholder && item.original !== undefined).sort((a, b) => b.placeholder.length - a.placeholder.length)
          const entries = Object.keys(zip.files).filter(name => /^(xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/.test(name))
          if (!entries.length) throw new Error('XLSX 缺少可还原的工作表结构')
          let changed = false
          for (const name of entries) {
            let xml = await zip.file(name).async('text'); const before = xml
            markers.forEach(item => { xml = xml.split(item.placeholder).join(item.original) })
            if (xml !== before) { zip.file(name, xml); changed = true }
          }
          if (!changed) throw new Error('未找到可匹配的脱敏标记，请确认文件和映射表对应')
          this.restoredText = (await this.extractExcelText(zip)) || 'Excel 工作簿已按映射表完成结构化还原。'
          this.restoredBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          this.restored = true
        } catch (error) { throw error }
      } else {
        const text = await this.redactedFile.text()
        this.restoredText = this.performRestore(text)
        this.restored = true
      }
    },
    async extractExcelText(zip) {
      const parser = new DOMParser()
      let shared = []
      const ssFile = zip.file('xl/sharedStrings.xml')
      if (ssFile) {
        const ssDoc = parser.parseFromString(await ssFile.async('text'), 'application/xml')
        shared = [...ssDoc.getElementsByTagName('si')].map(si =>
          [...si.getElementsByTagName('t')].map(t => t.textContent || '').join(''))
      }
      const sheetNames = Object.keys(zip.files).filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort()
      const lines = []
      for (const name of sheetNames) {
        const doc = parser.parseFromString(await zip.file(name).async('text'), 'application/xml')
        ;[...doc.getElementsByTagName('row')].forEach(row => {
          const cells = [...row.getElementsByTagName('c')].map(cell => {
            const type = cell.getAttribute('t')
            if (type === 's') return shared[Number(cell.getElementsByTagName('v')[0]?.textContent)] ?? ''
            if (type === 'inlineStr') return [...cell.getElementsByTagName('t')].map(t => t.textContent || '').join('')
            return cell.getElementsByTagName('v')[0]?.textContent || ''
          })
          if (cells.some(cell => cell !== '')) lines.push(cells.join(','))
        })
      }
      return lines.join('\n')
    },
    performRestore(text) {
      const mappings = [...(this.mapping.mappings || [])]
        .filter(m => m.placeholder && m.original !== undefined)
        .sort((a, b) => b.placeholder.length - a.placeholder.length)
      
      let restored = text
      let replacements = 0
      
      // 使用正则表达式进行精确匹配
      mappings.forEach(m => {
        // 转义占位符中的特殊字符（花括号需要转义）
        const escaped = m.placeholder.replace(/[{}]/g, '\\$&')
        const regex = new RegExp(escaped, 'g')
        
        if (regex.test(restored)) {
          restored = restored.replace(regex, m.original)
          replacements++
        }
      })
      
      // 未知标记必须原样保留，支持部分还原并便于人工复核。
      
      console.log(`还原完成: ${replacements}/${mappings.length} 个占位符已替换`)
      
      return restored
    },
    restoreImage() {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('无法读取脱敏图片'))
        reader.onload = (e) => {
        const img = new Image()
        img.onerror = () => reject(new Error('脱敏图片格式无效'))
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          
          const mappings = this.mapping.mappings || []
          let loaded = 0
          
          if (mappings.length === 0) {
            this.restoredImageDataUrl = canvas.toDataURL('image/png')
            this.restored = true
            resolve()
            return
          }
          const patchMappings = mappings.filter(m => m.rect && m.patch)
          if (!patchMappings.length) {
            this.restoredImageDataUrl = canvas.toDataURL('image/png')
            this.restored = true
            resolve()
            return
          }
          patchMappings.forEach(m => {
            const r = m.rect
            const patchImg = new Image()
            patchImg.onerror = () => reject(new Error('映射表中的图片补丁无效'))
            patchImg.onload = () => {
              ctx.drawImage(patchImg, r.x, r.y)
              loaded++
              if (loaded === patchMappings.length) {
                this.restoredImageDataUrl = canvas.toDataURL('image/png')
                this.restored = true
                resolve()
              }
            }
            patchImg.src = m.patch
          })
        }
        img.src = e.target.result
      }
        reader.readAsDataURL(this.redactedFile)
      })
    },
    restoredStem() { return 'restored_' + this.activeFileName().replace(/\.[^.]+$/, '') },
    sourceLooksLikeCsv() { return /\.csv$/i.test(this.activeFileName()) },
    async downloadAsWord() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.docx'
      try {
        // 还原的是 DOCX 时优先使用改写过的原始文档包，其余情况本地生成真实 OOXML。
        const blob = (this.redactedFileType === 'docx' && this.restoredBlob) ? this.restoredBlob : await buildDocxBlob(this.restoredText)
        this.triggerDownload(blob, filename)
        this.feedback = `已下载 ${filename}`
      } catch (error) {
        console.error('生成 Word 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: `生成 Word 文件失败：${error.message}`, filename } }))
      }
    },
    async downloadAsExcel() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.xlsx'
      try {
        const blob = this.redactedFileType === 'excel' && this.restoredBlob ? this.restoredBlob : await buildXlsxBlob(this.restoredText, { csv: this.sourceLooksLikeCsv() })
        this.triggerDownload(blob, filename)
        this.feedback = `已下载 ${filename}`
      } catch (error) {
        console.error('生成 Excel 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: `生成 Excel 文件失败：${error.message}`, filename } }))
      }
    },
    async downloadAsCsv() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.csv'
      try {
        const blob = await buildCsvBlob(this.restoredText, { csv: this.sourceLooksLikeCsv() })
        this.triggerDownload(blob, filename)
        this.feedback = `已下载 ${filename}`
      } catch (error) {
        console.error('生成 CSV 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: `生成 CSV 文件失败：${error.message}`, filename } }))
      }
    },
    async downloadAsTxt() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.txt'
      try {
        const blob = await buildTextBlob(this.restoredText, 'text/plain')
        this.triggerDownload(blob, filename)
        this.feedback = `已下载 ${filename}`
      } catch (error) {
        console.error('生成 TXT 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: `生成 TXT 文件失败：${error.message}`, filename } }))
      }
    },
    async downloadAsMarkdown() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.md'
      try {
        const blob = await buildTextBlob(this.restoredText, 'text/markdown')
        this.triggerDownload(blob, filename)
        this.feedback = `已下载 ${filename}`
      } catch (error) {
        console.error('生成 Markdown 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: `生成 Markdown 文件失败：${error.message}`, filename } }))
      }
    },
    downloadRestoredImage() {
      if (!this.restored || !this.restoredImageDataUrl) return
      const filename = this.restoredStem() + '.png'
      try {
        this.triggerDownload(this.dataURLToBlob(this.restoredImageDataUrl), filename)
        this.feedback = `已下载 ${filename}`
      } catch (error) {
        console.error('导出还原图片失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: `导出还原图片失败：${error.message}`, filename } }))
      }
    },
    downloadRestoredFile() {
      // 保留旧方法作为备用
      this.downloadAsWord()
    },
    activeFileName() { return this.selectedHistory?.file_name || this.redactedFile?.name || 'document.txt' },
    dataURLToBlob(dataUrl) {
      const arr = dataUrl.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) u8arr[n] = bstr.charCodeAt(n)
      return new Blob([u8arr], { type: mime })
    },
    triggerDownload(blob, filename) {
      if (!(blob instanceof Blob) || blob.size === 0) {
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: '下载内容为空，已阻止生成文件。', filename } }))
        throw new Error('下载内容为空，已阻止下载')
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: true, message: '文件已生成并提交到系统下载目录。', filename, size: blob.size } }))
      setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 30_000)
    },
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    reset() {
      this.redactedFile = null
      this.redactedFileType = null
      this.mappingFile = null
      this.mapping = null
      this.validation = null
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      this.selectedHistory = null
      
      if (this.$refs.redactedInput) this.$refs.redactedInput.value = ''
      if (this.$refs.historyRedactedInput) this.$refs.historyRedactedInput.value = ''
      if (this.$refs.mappingInput) this.$refs.mappingInput.value = ''
    }
  },
  mounted() { this.loadHistory() }
}
</script>

<style scoped>
.history-panel { margin: 28px 0; border: 1px solid var(--border); border-radius: var(--radius-lg); background: #fff; overflow: hidden; }
.history-panel__head { display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid var(--border-soft); }.history-panel__head h2{font-size:var(--text-lg);margin:0}.history-panel__tools{display:flex;align-items:center;gap:12px}.history-panel__tools>span{font:12px var(--font-mono);color:var(--muted)}.history-panel__tools .btn--xs{padding:5px 10px;font-size:12px}
.history-panel__empty{padding:18px 22px;color:var(--muted);margin:0}.history-item{display:flex;align-items:center;border-bottom:1px solid var(--border-soft)}.history-item:last-child{border-bottom:0}.history-item.is-selected{background:#f8fafc}.history-item__select{flex:1;text-align:left;padding:14px 22px;border:0;background:transparent;cursor:pointer;display:grid;gap:5px}.history-item__select span{font-size:var(--text-sm);color:var(--muted)}.history-item .icon-btn{margin-right:14px;font-size:22px}.restore-upload{margin:24px 0}.restore-upload summary{cursor:pointer;font-weight:600;margin-bottom:16px}
.history-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:16px 0 24px;padding:14px 18px;border:1px solid var(--border);border-radius:var(--radius-lg);background:#f8fafc}.history-actions>span{font-size:var(--text-sm);font-weight:600}.history-actions>div{display:flex;gap:8px}.restore-current-upload__hint{margin:8px 0 16px;color:var(--muted)}.restore-current-upload__file{flex:1;align-self:stretch;margin:0;min-height:0}.restore-current-upload__file .file-meta__info{align-self:center}
.confirm-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.48);backdrop-filter:blur(5px)}.confirm-dialog{width:min(460px,100%);padding:30px;border-radius:20px;background:#fff;text-align:center;box-shadow:0 24px 80px rgba(15,23,42,.24)}.confirm-dialog__icon{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 18px;border-radius:50%;background:#fee2e2;color:#dc2626;font-size:30px;font-weight:700}.confirm-dialog h2{margin:0;font-size:26px}.confirm-dialog p{margin:16px 0 24px;color:var(--muted);line-height:1.7}.confirm-dialog__actions{display:flex;justify-content:center;gap:12px}
</style>
