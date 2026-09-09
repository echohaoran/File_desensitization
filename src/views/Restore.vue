<template>
  <div class="container restore-main" :dir="uiDirection">
    <div class="index-eyebrow">
      <span class="index-eyebrow__line" aria-hidden="true"></span>
      <span class="mono-label">{{ $t('restore.eyebrow') }}</span>
    </div>

    <section class="index-hero">
      <h1>{{ $t('restore.heading') }}</h1>
      <p>
        {{ $t('restore.intro') }}
      </p>
    </section>

    <section class="history-panel" :aria-label="$t('restore.history')">
      <div class="history-panel__head">
        <h2>{{ $t('restore.history') }}</h2>
        <div class="history-panel__tools">
          <input v-model.trim="historySearch" class="history-search" type="search" :placeholder="$t('restore.searchPlaceholder')" :aria-label="$t('restore.searchLabel')" />
          <button v-if="history.length" class="btn btn--ghost btn--xs" @click="historySortDesc = !historySortDesc" :title="$t(historySortDesc ? 'restore.sortDescTitle' : 'restore.sortAscTitle')">{{ $t(historySortDesc ? 'restore.newest' : 'restore.oldest') }}</button>
          <span>{{ historySearch ? $t('restore.matches', { count: formatCount(visibleHistory.length), total: formatCount(history.length) }) : $t('restore.records', { count: formatCount(history.length) }) }}</span>
          <button v-if="history.length" class="btn btn--ghost btn--xs" @click="requestClearHistory">{{ $t('restore.clearAll') }}</button>
        </div>
      </div>
      <p v-if="!history.length" class="history-panel__empty">{{ $t('restore.emptyHistory') }}</p>
      <p v-else-if="!visibleHistory.length" class="history-panel__empty">{{ $t('restore.noSearchMatches', { query: historySearch }) }}</p>
      <div v-else class="history-list">
        <article v-for="item in visibleHistory" :key="item.id" class="history-item" :class="{ 'is-selected': selectedHistory?.id === item.id }">
          <button class="history-item__select" @click="selectHistory(item)">
            <strong dir="auto">{{ item.file_name }}</strong><span>{{ $t(item.redacted_file_key ? 'restore.savedRecord' : 'restore.legacyRecord', { date: formatDate(item.created_at), count: formatCount(item.mapping?.mappings?.length || 0) }) }}</span>
          </button>
          <button class="icon-btn" @click="requestRemoveHistory(item)" :aria-label="$t('restore.deleteRecordLabel', { filename: item.file_name })">×</button>
        </article>
      </div>
    </section>

    <div class="history-actions" :class="{ 'is-pending': !selectedHistory }" :aria-label="$t('restore.historyActions')">
      <span>{{ selectedHistory ? $t(historyMatchMode === 'auto' ? 'restore.autoSelected' : 'restore.manualSelected', { filename: selectedHistory.file_name }) : $t('restore.uploadToMatch') }}</span>
      <div>
        <template v-if="selectedHistory"><button class="btn btn--secondary" @click="downloadHistoryMapping">{{ $t('restore.downloadMapping') }}</button><button class="btn btn--primary" @click="downloadHistoryRedacted">{{ $t('restore.downloadRedacted') }}</button></template>
      </div>
    </div>

    <details v-if="false" class="restore-upload" :aria-label="$t('restore.restoreFromFile')">
      <summary>{{ $t('restore.legacyUpload') }}</summary>
    <div class="restore-grid" :aria-label="$t('restore.uploadArea')">
      <section class="restore-card">
        <div class="restore-card__head">
          <span class="num">01</span>
          <h3>{{ $t('restore.uploadRedacted') }}</h3>
        </div>
        <label class="upload-zone" :class="{ 'is-dragover': isDraggingRedacted }" tabindex="0" role="button"
          :aria-label="$t('restore.chooseRedactedLabel')" @dragover.prevent="isDraggingRedacted = true" @dragleave="isDraggingRedacted = false"
          @drop.prevent="handleRedactedDrop" @keydown.enter="$refs.redactedInput.click()" 
          @keydown.space.prevent="$refs.redactedInput.click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span class="upload-zone__title">{{ $t('restore.chooseRedacted') }}</span>
          <span class="upload-zone__hint">{{ $t('restore.formatsLegacy') }}</span>
          <input type="file" ref="redactedInput" accept=".txt,.csv,.json,.md,.markdown,.pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,text/*,image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            @change="handleRedactedSelect" style="display: none" />
        </label>
        <div class="file-meta" v-if="redactedFile" style="margin-top: 16px">
          <span class="file-meta__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </span>
          <div class="file-meta__info">
            <div class="file-meta__name" dir="auto">{{ redactedFile.name }}</div>
            <div class="file-meta__detail">{{ formatSize(redactedFile.size) }}</div>
          </div>
          <button class="icon-btn" @click="clearRedactedFile" :aria-label="$t('restore.removeCurrent')" :title="$t('restore.removeFile')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </section>

      <section class="restore-card">
        <div class="restore-card__head">
          <span class="num">02</span>
          <h3>{{ $t('restore.uploadMapping') }}</h3>
        </div>
        <label class="upload-zone" :class="{ 'is-dragover': isDraggingMapping }" tabindex="0" role="button"
          :aria-label="$t('restore.chooseMappingLabel')" @dragover.prevent="isDraggingMapping = true" @dragleave="isDraggingMapping = false"
          @drop.prevent="handleMappingDrop" @keydown.enter="$refs.mappingInput.click()"
          @keydown.space.prevent="$refs.mappingInput.click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="upload-zone__title">{{ $t('restore.chooseMapping') }}</span>
          <span class="upload-zone__hint">{{ $t('restore.mappingHint') }}</span>
          <input type="file" ref="mappingInput" accept=".json,application/json"
            @change="handleMappingSelect" style="display: none" />
        </label>
        <div class="file-meta" v-if="mappingFile" style="margin-top: 16px">
          <span class="file-meta__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </span>
          <div class="file-meta__info">
            <div class="file-meta__name" dir="auto">{{ mappingFile.name }}</div>
            <div class="file-meta__detail">{{ formatSize(mappingFile.size) }}</div>
          </div>
          <button class="icon-btn" @click="clearMappingFile" :aria-label="$t('restore.removeCurrent')" :title="$t('restore.removeFile')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </section>
    </div>
    </details>

    <section class="restore-card restore-current-upload" :aria-label="$t('restore.uploadRestoreLabel')">
      <div class="restore-card__head"><span class="num">02</span><h3>{{ $t('restore.uploadRestore') }}</h3></div>
      <p class="restore-current-upload__hint">{{ selectedHistory ? $t(historyMatchMode === 'auto' ? 'restore.autoHint' : 'restore.manualHint', { filename: selectedHistory.file_name }) : $t('restore.pendingHint') }}</p>
      <label v-if="!redactedFile" class="upload-zone" :class="{ 'is-dragover': isDraggingRedacted }" tabindex="0" role="button" :aria-label="$t('restore.chooseRestoreLabel')" @dragover.prevent="isDraggingRedacted = true" @dragleave="isDraggingRedacted = false" @drop.prevent="handleRedactedDrop" @keydown.enter="$refs.historyRedactedInput.click()" @keydown.space.prevent="$refs.historyRedactedInput.click()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span class="upload-zone__title">{{ $t('restore.chooseRestore') }}</span><span class="upload-zone__hint">{{ $t('restore.formats') }}</span>
        <input type="file" ref="historyRedactedInput" accept=".txt,.csv,.json,.md,.markdown,.pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,text/*,image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="handleRedactedSelect" style="display: none" />
      </label>
      <div v-else class="file-meta restore-current-upload__file"><div class="file-meta__info"><div class="file-meta__name" dir="auto">{{ redactedFile.name }}</div><div class="file-meta__detail">{{ formatSize(redactedFile.size) }}</div></div><button class="icon-btn" @click="clearRedactedFile" :aria-label="$t('restore.removeCurrent')">×</button></div>
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
        {{ $t(working ? 'restore.working' : 'restore.start') }}
      </button>
      <button class="btn btn--ghost btn--block" @click="requestReset" :disabled="!redactedFile && !selectedHistory">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        {{ $t('restore.restart') }}
      </button>
    </div>

    <div v-if="restored" class="restore-result-overlay" role="presentation" @click.self="closeRestoreResult">
      <section class="restore-result-modal" role="dialog" aria-modal="true" aria-labelledby="restore-result-title">
        <header class="restore-result-modal__head">
          <div><span class="mono-label">{{ $t('restore.complete') }}</span><h2 id="restore-result-title">{{ $t('restore.complete') }}</h2></div>
          <button class="icon-btn" type="button" :aria-label="$t('restore.closeResult')" @click="closeRestoreResult">×</button>
        </header>
    <div class="restore-result">
      <div class="restore-result__head">
        <h3>{{ $t('restore.results') }}</h3>
      </div>
      <div class="restore-result__body">
        <div v-if="redactedFileType === 'text' || redactedFileType === 'pdf' || redactedFileType === 'docx' || redactedFileType === 'excel'" class="text-preview" :dir="/\.(json|csv)$/i.test(redactedFile?.name || '') ? 'ltr' : 'auto'">
          <template v-for="(part, i) in restoredTextParts" :key="i">
            <span v-if="part.type === 'normal'">{{ part.text }}</span>
            <span v-else class="det" :title="$t('restore.originalValue')">{{ part.text }}</span>
          </template>
        </div>
        <div v-else-if="restoredImageDataUrl" class="canvas-wrap">
          <img :src="restoredImageDataUrl" :alt="$t('restore.restoredImage')" />
        </div>
      </div>
    </div>
    <p v-if="feedback" class="restore-feedback" role="status">{{ feedback }}</p>

    <div class="download-bar">
      <span class="download-bar__label">{{ $t('restore.complete') }}</span>
      <div class="download-bar__formats" v-if="redactedFileType === 'image'">
        <button class="btn btn--primary" @click="downloadRestoredImage">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {{ $t('restore.png') }}
        </button>
      </div>
      <div class="download-bar__formats" v-else>
        <button class="btn btn--primary" @click="downloadAsWord">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {{ $t('restore.word') }}
        </button>
        <button class="btn btn--secondary" @click="downloadAsExcel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {{ $t('restore.excel') }}
        </button>
        <button class="btn btn--secondary" @click="downloadAsCsv">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {{ $t('restore.csv') }}
        </button>
        <button class="btn btn--secondary" @click="downloadAsTxt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {{ $t('restore.txt') }}
        </button>
        <button class="btn btn--secondary" @click="downloadAsMarkdown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {{ $t('restore.markdown') }}
        </button>
      </div>
    </div>
      </section>
    </div>

    <div v-if="confirmDialog" class="confirm-overlay" role="presentation" @click.self="cancelConfirm">
      <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="history-confirm-title" aria-describedby="history-confirm-message">
        <div class="confirm-dialog__icon" aria-hidden="true">!</div>
        <h2 id="history-confirm-title">{{ confirmDialog.title }}</h2>
        <p id="history-confirm-message">{{ confirmDialog.message }}</p>
        <div class="confirm-dialog__actions">
          <button class="btn btn--secondary" type="button" @click="cancelConfirm">{{ $t('restore.cancel') }}</button>
          <button class="btn btn--primary" type="button" :disabled="clearingHistory" @click="executeConfirm">{{ clearingHistory ? $t('restore.clearing') : confirmDialog.confirmText }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { t, getLocale } from '@/i18n'
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
      restoredTextIsNotice: false,
      restoredImageDataUrl: null,
      restoredBlob: null,
      history: [],
      selectedHistory: null,
      historyMatchMode: ''
      ,working: false
      ,feedback: ''
      ,confirmDialog: null
      ,clearingHistory: false
      ,historySearch: ''
      ,historySortDesc: true
    }
  },
  computed: {
    uiLocale() {
      // Track the injected Composer even if getLocale normalizes a non-reactive value.
      void this.$i18n.locale
      return getLocale()
    },
    uiDirection() { return this.uiLocale === 'ar' ? 'rtl' : 'ltr' },
    visibleHistory() {
      const query = this.historySearch.toLowerCase()
      const items = this.history.filter(item =>
        !query ||
        String(item.file_name || '').toLowerCase().includes(query) ||
        String(item.created_at ?? '').toLowerCase().includes(query) ||
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
      if (this.restoredTextIsNotice) return [{ type: 'normal', text: t('restore.excelRestored') }]
      
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
    closeRestoreResult() { this.restored = false; this.feedback = '' },
    loadHistory() {
      try { this.history = JSON.parse(localStorage.getItem('desens_history') || '[]') } catch (_) { this.history = [] }
    },
    selectHistory(item) {
      this.selectedHistory = item
      this.mapping = item.mapping
      this.historyMatchMode = 'manual'
      this.restored = false; this.restoredText = ''; this.restoredImageDataUrl = null
      this.validateFiles()
    },
    requestRemoveHistory(item) {
      this.confirmDialog = { action: 'remove', id: item.id, title: t('restore.deleteTitle'), message: t('restore.deleteConfirm', { filename: item.file_name }), confirmText: t('restore.confirmDelete') }
    },
    requestClearHistory() {
      this.confirmDialog = { action: 'clear', title: t('restore.clearTitle'), message: t('restore.clearConfirm', { count: this.formatCount(this.history.length) }), confirmText: t('restore.confirmClear') }
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
      this.notify(t('restore.deleted'))
    },
    async clearHistory() {
      this.history = []
      localStorage.removeItem('desens_history')
      await clearHistoryFiles().catch(() => {})
      this.reset()
      this.notify(t('restore.cleared'))
    },
    formatDate(value) {
      const date = value ? new Date(value) : null
      return date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat(this.uiLocale, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date)
        : t('restore.unknownDate')
    },
    formatCount(value) { return new Intl.NumberFormat(this.uiLocale).format(value) },
    downloadHistoryMapping() {
      if (!this.selectedHistory?.mapping) { window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('restore.noMapping') } })); return }
      const blob = new Blob([JSON.stringify(this.selectedHistory.mapping, null, 2)], { type: 'application/json' })
      this.triggerDownload(blob, `mapping_${this.selectedHistory.file_name.replace(/\.[^.]+$/, '')}.json`)
    },
    async downloadHistoryRedacted() {
      if (!this.selectedHistory) return
      const stem = this.selectedHistory.file_name.replace(/\.[^.]+$/, '')
      try {
        if (this.selectedHistory.redacted_file_key) {
          const stored = await getHistoryFile(this.selectedHistory.redacted_file_key)
          if (!stored?.blob) throw new Error(t('restore.missingFile'))
          this.triggerDownload(stored.blob, stored.filename || `redacted_${this.selectedHistory.file_name}`)
          this.feedback = t('restore.historyDownloaded', { filename: stored.filename || '' })
          return
        }
        const text = this.selectedHistory.redacted_text || ''
        const complexTypes = ['docx', 'word', 'excel', 'xlsx', 'xls', 'pdf']
        if (complexTypes.includes(this.selectedHistory.file_type)) {
          throw new Error(t('restore.legacyMissing'))
        }
        if (!text) throw new Error(t('restore.noRedactedText'))
        const notice = '【处理与还原规则】本文件包含脱敏占位符。请完整保留占位符，不得删除、拆分或改写，否则可能无法还原。'
        this.triggerDownload(new Blob([`${notice}\n\n${text}`], { type: 'text/plain;charset=utf-8' }), `redacted_${stem}.txt`)
      } catch (error) {
        this.feedback = t('restore.downloadFailed', { reason: error.message || t('restore.unknownError') })
        window.dispatchEvent(new CustomEvent('desens:download-result', {
          detail: { success: false, message: error.message, filename: this.selectedHistory.file_name }
        }))
      }
    },
    async handleRedactedSelect(e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        if (await this.confirmUpload(file, t('restore.uploadPurpose'))) await this.setRedactedFile(file)
        else e.target.value = ''
      }
    },
    async handleRedactedDrop(e) {
      this.isDraggingRedacted = false
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (await this.confirmUpload(file, t('restore.uploadPurpose'))) await this.setRedactedFile(file)
      }
    },
    async handleMappingSelect(e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        if (await this.confirmUpload(file, t('restore.mappingPurpose'))) this.setMappingFile(file)
        else e.target.value = ''
      }
    },
    async handleMappingDrop(e) {
      this.isDraggingMapping = false
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (await this.confirmUpload(file, t('restore.mappingPurpose'))) this.setMappingFile(file)
      }
    },
    confirmUpload(file, purpose) {
      return requestAppConfirm({ title: t('restore.uploadTitle'), message: t('restore.uploadConfirm', { purpose, filename: file.name, size: this.formatSize(file.size) }), confirmText: t('restore.confirmUpload') })
    },
    async requestRunRestore() {
      const count = this.mapping?.mappings?.length || 0
      const accepted = await requestAppConfirm({ title: t('restore.startTitle'), message: t('restore.startConfirm', { count: this.formatCount(count), filename: this.redactedFile?.name || t('restore.currentFile') }), confirmText: t('restore.start') })
      if (accepted) await this.runRestore()
    },
    async requestReset() {
      const accepted = await requestAppConfirm({ title: t('restore.restartTitle'), message: t('restore.restartConfirm'), confirmText: t('restore.confirmRestart'), tone: 'warning' })
      if (accepted) this.reset()
    },
    async setRedactedFile(file) {
      this.redactedFile = file
      this.redactedFileType = this.inferFileType(file)
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      this.restoredBlob = null
      await this.autoMatchHistory(file)
      this.validateFiles()
    },
    historyMarkers(item) {
      return [...(item?.mapping?.mappings || [])]
        .map(entry => entry.placeholder || entry.marker)
        .filter(marker => typeof marker === 'string' && marker.length > 2)
    },
    async readableFileText(file) {
      const type = this.inferFileType(file)
      if (type === 'text') return file.text()
      if (type === 'docx' || type === 'excel') {
        const zip = await JSZip.loadAsync(await file.arrayBuffer())
        const entries = type === 'docx'
          ? Object.keys(zip.files).filter(name => /^word\/(document|header\d+|footer\d+)\.xml$/.test(name))
          : Object.keys(zip.files).filter(name => /^(xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/.test(name))
        return (await Promise.all(entries.map(name => zip.file(name).async('text')))).join('\n')
      }
      if (type === 'pdf') {
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
        const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
          const page = await pdf.getPage(index + 1)
          const content = await page.getTextContent()
          return content.items.map(item => item.str).join(' ')
        }))
        return pages.join('\n')
      }
      return ''
    },
    async autoMatchHistory(file) {
      if (!this.history.length) {
        this.selectedHistory = null
        this.mapping = null
        this.historyMatchMode = ''
        this.validation = { type: 'err', title: t('restore.noHistoryTitle'), message: t('restore.noHistoryMessage') }
        return
      }
      let content = ''
      try { content = await this.readableFileText(file) } catch (_) { /* 图片等文件使用文件名匹配 */ }
      const stem = file.name.replace(/^redacted[_-]/i, '').replace(/\.[^.]+$/, '').toLowerCase()
      const candidates = this.history.map(item => {
        const markers = this.historyMarkers(item)
        const markerScore = content ? markers.filter(marker => content.includes(marker)).length : 0
        const historyStem = String(item.file_name || '').replace(/\.[^.]+$/, '').toLowerCase()
        const filenameScore = stem && historyStem && (stem === historyStem || stem.includes(historyStem) || historyStem.includes(stem)) ? 1 : 0
        return { item, score: markerScore * 100 + filenameScore, markerScore }
      }).filter(candidate => candidate.score > 0).sort((a, b) => b.score - a.score)
      const best = candidates[0]
      const isUnique = best && (!candidates[1] || best.score > candidates[1].score)
      if (isUnique) {
        this.selectedHistory = best.item
        this.mapping = best.item.mapping
        this.historyMatchMode = 'auto'
        this.validation = { type: 'ok', title: t('restore.matchedTitle'), message: t('restore.matchedMessage', { filename: best.item.file_name, count: this.formatCount(best.markerScore || 1) }) }
        this.notify(t('restore.matchedNotice', { filename: best.item.file_name }))
      } else {
        this.selectedHistory = null
        this.mapping = null
        this.historyMatchMode = ''
        this.validation = { type: 'err', title: best ? t('restore.ambiguousTitle') : t('restore.unmatchedTitle'), message: best ? t('restore.ambiguousMessage') : t('restore.unmatchedMessage') }
      }
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
          this.validation = { type: 'wait', title: t('restore.waitingFile'), message: t('restore.selectFileMessage') }
        } else {
          this.validation = { type: 'ok', title: t('restore.ready'), message: t('restore.readyMessage', { filename: this.selectedHistory.file_name, count: this.formatCount(this.mapping?.mappings?.length || 0) }) }
        }
        return
      }
      if (!this.redactedFile && !this.mappingFile) {
        this.validation = null
        return
      }

      if (this.redactedFile && !this.mappingFile && this.validation?.type === 'err') return
      
      if (!this.redactedFile || !this.mappingFile) {
        this.validation = { type: 'wait', title: t('restore.waitingMatch'), message: t('restore.waitingMatchMessage') }
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
              title: t('restore.typeMismatch'),
              message: t('restore.typeMismatchMessage')
            }
            return
          }
          
          this.validation = { 
            type: 'ok', 
            title: t('restore.validated'),
            message: t('restore.validatedMessage', { count: this.formatCount(json.mappings ? json.mappings.length : 0) })
          }
        } catch (e) {
          this.validation = { 
            type: 'err', 
            title: t('restore.mappingParseFailed'),
            message: e.message || t('restore.validJson')
          }
        }
      }
      reader.readAsText(this.mappingFile)
    },
    async runRestore() {
      if (!this.canRestore) return
      this.working = true; this.feedback = t('restore.workingFile')
      
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      
      try {
        if (this.redactedFileType === 'text' || this.redactedFileType === 'pdf' ||
            this.redactedFileType === 'docx' || this.redactedFileType === 'excel') await this.restoreText()
        else await this.restoreImage()
        if (this.restored) { this.feedback = t('restore.reviewResult'); this.notify(t('restore.fileComplete')) }
      } catch (error) {
        this.feedback = t('restore.restoreFailed', { reason: error.message || t('restore.unknownError') })
        this.validation = { type: 'err', title: t('restore.restoreFailedTitle'), message: error.message }
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
      this.restoredTextIsNotice = false
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
        if (!mappings.length) throw new Error(t('restore.noValidMarkers'))
        try {
          const response = await restoreMappedText(text, mappings)
          const restoredText = response?.data?.restored_text
          if (typeof restoredText !== 'string') throw new Error(t('restore.invalidDesktopResult'))
          this.restoredText = restoredText
          this.restored = true
          return
        } catch (error) {
          const reason = error?.message || error?.error || String(error) || t('restore.unknownError')
          const fallback = this.performRestore(text)
          if (fallback !== text) {
            this.restoredText = fallback
            this.restored = true
            this.feedback = t('restore.fallback')
            console.warn('Rust 还原失败，已使用本地映射回退：', reason)
            return
          }
          throw new Error(t('restore.desktopFailed', { reason }))
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
          throw new Error(t('restore.pdfFailed'))
        }
      } else if (this.redactedFileType === 'docx') {
        try {
          const zip = await JSZip.loadAsync(await this.redactedFile.arrayBuffer())
          const markers = [...(this.mapping.mappings || [])].filter(item => item.placeholder && item.original !== undefined).sort((a, b) => b.placeholder.length - a.placeholder.length)
          const entries = Object.keys(zip.files).filter(name => /^word\/(document|header\d+|footer\d+)\.xml$/.test(name))
          if (!entries.length) throw new Error(t('restore.docxStructure'))
          let changed = false
          for (const name of entries) {
            let xml = await zip.file(name).async('text')
            const before = xml
            markers.forEach(item => { xml = xml.split(item.placeholder).join(item.original) })
            if (xml !== before) { zip.file(name, xml); changed = true }
          }
          if (!changed) throw new Error(t('restore.noMatchedMarkers'))
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
          if (!entries.length) throw new Error(t('restore.xlsxStructure'))
          let changed = false
          for (const name of entries) {
            let xml = await zip.file(name).async('text'); const before = xml
            markers.forEach(item => { xml = xml.split(item.placeholder).join(item.original) })
            if (xml !== before) { zip.file(name, xml); changed = true }
          }
          if (!changed) throw new Error(t('restore.noMatchedMarkers'))
          const extractedText = await this.extractExcelText(zip)
          this.restoredTextIsNotice = !extractedText
          // Preserve the legacy export fallback; only its UI preview is translated.
          this.restoredText = extractedText || 'Excel 工作簿已按映射表完成结构化还原。'
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
        reader.onerror = () => reject(new Error(t('restore.imageReadFailed')))
        reader.onload = (e) => {
        const img = new Image()
        img.onerror = () => reject(new Error(t('restore.imageInvalid')))
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
            patchImg.onerror = () => reject(new Error(t('restore.patchInvalid')))
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
        this.feedback = t('restore.downloaded', { filename })
      } catch (error) {
        console.error('生成 Word 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('restore.exportFailed', { format: 'Word', reason: error.message || t('restore.unknownError') }), filename } }))
      }
    },
    async downloadAsExcel() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.xlsx'
      try {
        const blob = this.redactedFileType === 'excel' && this.restoredBlob ? this.restoredBlob : await buildXlsxBlob(this.restoredText, { csv: this.sourceLooksLikeCsv() })
        this.triggerDownload(blob, filename)
        this.feedback = t('restore.downloaded', { filename })
      } catch (error) {
        console.error('生成 Excel 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('restore.exportFailed', { format: 'Excel', reason: error.message || t('restore.unknownError') }), filename } }))
      }
    },
    async downloadAsCsv() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.csv'
      try {
        const blob = await buildCsvBlob(this.restoredText, { csv: this.sourceLooksLikeCsv() })
        this.triggerDownload(blob, filename)
        this.feedback = t('restore.downloaded', { filename })
      } catch (error) {
        console.error('生成 CSV 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('restore.exportFailed', { format: 'CSV', reason: error.message || t('restore.unknownError') }), filename } }))
      }
    },
    async downloadAsTxt() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.txt'
      try {
        const blob = await buildTextBlob(this.restoredText, 'text/plain')
        this.triggerDownload(blob, filename)
        this.feedback = t('restore.downloaded', { filename })
      } catch (error) {
        console.error('生成 TXT 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('restore.exportFailed', { format: 'TXT', reason: error.message || t('restore.unknownError') }), filename } }))
      }
    },
    async downloadAsMarkdown() {
      if (!this.restored) return
      const filename = this.restoredStem() + '.md'
      try {
        const blob = await buildTextBlob(this.restoredText, 'text/markdown')
        this.triggerDownload(blob, filename)
        this.feedback = t('restore.downloaded', { filename })
      } catch (error) {
        console.error('生成 Markdown 文件失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('restore.exportFailed', { format: t('restore.markdown'), reason: error.message || t('restore.unknownError') }), filename } }))
      }
    },
    downloadRestoredImage() {
      if (!this.restored || !this.restoredImageDataUrl) return
      const filename = this.restoredStem() + '.png'
      try {
        this.triggerDownload(this.dataURLToBlob(this.restoredImageDataUrl), filename)
        this.feedback = t('restore.downloaded', { filename })
      } catch (error) {
        console.error('导出还原图片失败:', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('restore.imageExportFailed', { reason: error.message || t('restore.unknownError') }), filename } }))
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
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('restore.emptyDownload'), filename } }))
        throw new Error(t('restore.emptyDownloadError'))
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: true, message: t('restore.downloadSubmitted'), filename, size: blob.size } }))
      setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 30_000)
    },
    formatSize(bytes) {
      const unit = bytes < 1024 ? 'byte' : bytes < 1024 * 1024 ? 'kilobyte' : 'megabyte'
      const value = unit === 'byte' ? bytes : unit === 'kilobyte' ? bytes / 1024 : bytes / (1024 * 1024)
      return new Intl.NumberFormat(this.uiLocale, {
        style: 'unit', unit, unitDisplay: 'short',
        minimumFractionDigits: unit === 'byte' ? 0 : 1,
        maximumFractionDigits: unit === 'byte' ? 0 : 1
      }).format(value)
    },
    reset() {
      this.restoredTextIsNotice = false
      this.redactedFile = null
      this.redactedFileType = null
      this.mappingFile = null
      this.mapping = null
      this.validation = null
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      this.selectedHistory = null
      this.historyMatchMode = ''
      
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
.history-panel__empty{padding:18px 22px;color:var(--muted);margin:0}.history-item{display:flex;align-items:center;border-bottom:1px solid var(--border-soft)}.history-item:last-child{border-bottom:0}.history-item.is-selected{background:#f8fafc}.history-item__select{flex:1;text-align:start;padding:14px 22px;border:0;background:transparent;cursor:pointer;display:grid;gap:5px}.history-item__select span{font-size:var(--text-sm);color:var(--muted)}.history-item .icon-btn{margin-inline-end:14px;font-size:22px}.restore-upload{margin:24px 0}.restore-upload summary{cursor:pointer;font-weight:600;margin-bottom:16px}
.history-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:16px 0 24px;padding:14px 18px;border:1px solid var(--border);border-radius:var(--radius-lg);background:#f8fafc}.history-actions>span{font-size:var(--text-sm);font-weight:600}.history-actions>div{display:flex;gap:8px}.history-actions.is-pending{color:var(--muted);background:#fff}.restore-current-upload__hint{margin:8px 0 16px;color:var(--muted)}.restore-current-upload.is-pending{background:#fcfcfc}.restore-current-upload__pending{display:grid;place-items:center;flex:1;min-height:150px;padding:24px;border:1px dashed var(--border);border-radius:var(--radius-md);color:var(--muted);text-align:center;font-size:var(--text-sm)}.restore-current-upload__file{flex:1;align-self:stretch;margin:0;min-height:0}.restore-current-upload__file .file-meta__info{align-self:center}
.restore-result-overlay{position:fixed;inset:0;z-index:950;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.48);backdrop-filter:blur(5px)}.restore-result-modal{display:flex;flex-direction:column;width:min(900px,100%);max-height:calc(100vh - 48px);overflow:hidden;border-radius:20px;background:#fff;box-shadow:0 24px 80px rgba(15,23,42,.24)}.restore-result-modal__head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:26px 30px 20px;border-bottom:1px solid var(--border-soft)}.restore-result-modal__head h2{margin:7px 0 0;font-size:28px}.restore-result-modal .restore-result{border:0;border-radius:0;overflow:auto}.restore-result-modal .restore-result__body{max-height:min(46vh,460px);overflow:auto}.restore-result-modal .download-bar{width:100%;border:0;border-top:1px solid var(--border-soft);border-radius:0;flex-shrink:0}.restore-result-modal .restore-feedback{margin:0;padding:0 var(--space-6) var(--space-4);color:var(--success)}.confirm-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.48);backdrop-filter:blur(5px)}.confirm-dialog{width:min(460px,100%);padding:30px;border-radius:20px;background:#fff;text-align:center;box-shadow:0 24px 80px rgba(15,23,42,.24)}.confirm-dialog__icon{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 18px;border-radius:50%;background:#fee2e2;color:#dc2626;font-size:30px;font-weight:700}.confirm-dialog h2{margin:0;font-size:26px}.confirm-dialog p{margin:16px 0 24px;color:var(--muted);line-height:1.7}.confirm-dialog__actions{display:flex;justify-content:center;gap:12px}
.history-panel__head, .history-panel__tools, .history-actions, .history-actions>div, .download-bar__formats { flex-wrap: wrap; }
.history-search { min-width: 0; max-width: 100%; }
.history-item__select, .history-actions>span { min-width: 0; overflow-wrap: anywhere; }
.text-preview { text-align: start; unicode-bidi: plaintext; }
.text-preview[dir="ltr"] { unicode-bidi: isolate; }
</style>
