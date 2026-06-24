<template>
  <div class="container restore-main">
    <div class="index-eyebrow">
      <span class="index-eyebrow__line" aria-hidden="true"></span>
      <span class="mono-label">RESTORE / v0.1 PROTOTYPE</span>
    </div>

    <section class="index-hero">
      <h1>还原工作流</h1>
      <p>
        上传此前生成的脱敏文件与对应映射表 JSON。系统会校验映射表的用户归属，
        并按记录将占位符或遮盖区域还原为原始内容。
      </p>
    </section>

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
      <button class="btn btn--primary btn--lg btn--block" @click="runRestore" :disabled="!canRestore">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        开始还原
      </button>
      <button class="btn btn--ghost btn--block" @click="reset" :disabled="!redactedFile && !mappingFile">
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

    <div class="download-bar" v-if="restored">
      <span class="download-bar__label">还原完成</span>
      <button class="btn btn--primary" @click="downloadRestoredFile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        下载原文件
      </button>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/build/pdf.worker.entry'

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
      restoredImageDataUrl: null
    }
  },
  computed: {
    canRestore() {
      return this.redactedFile && this.mapping && this.validation?.type === 'ok'
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
    handleRedactedSelect(e) {
      if (e.target.files && e.target.files[0]) {
        this.setRedactedFile(e.target.files[0])
      }
    },
    handleRedactedDrop(e) {
      this.isDraggingRedacted = false
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.setRedactedFile(e.dataTransfer.files[0])
      }
    },
    handleMappingSelect(e) {
      if (e.target.files && e.target.files[0]) {
        this.setMappingFile(e.target.files[0])
      }
    },
    handleMappingDrop(e) {
      this.isDraggingMapping = false
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.setMappingFile(e.dataTransfer.files[0])
      }
    },
    setRedactedFile(file) {
      this.redactedFile = file
      this.redactedFileType = this.inferFileType(file)
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
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
      this.validateFiles()
    },
    clearRedactedFile() {
      this.redactedFile = null
      this.redactedFileType = null
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
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
          
          if (!json.user_id) {
            throw new Error('映射表缺少用户标识')
          }
          
          const userId = this.getUserId()
          if (json.user_id !== userId) {
            this.validation = { 
              type: 'err', 
              title: '用户归属不一致', 
              message: '当前浏览器用户标识与映射表中的 user_id 不匹配，无法还原。请使用生成该映射表的同一浏览器或同一账户。' 
            }
            return
          }
          
          if (json.file_type && json.file_type !== this.redactedFileType && 
              !(json.file_type === 'text' && this.redactedFileType === 'pdf')) {
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
            message: '映射表归属一致，共 ' + (json.mappings ? json.mappings.length : 0) + ' 条记录，可执行还原。' 
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
    getUserId() {
      try {
        return localStorage.getItem('desens_user_id') || ''
      } catch (e) {
        return ''
      }
    },
    runRestore() {
      if (!this.canRestore) return
      
      this.restored = false
      this.restoredText = ''
      this.restoredImageDataUrl = null
      
      if (this.redactedFileType === 'text' || this.redactedFileType === 'pdf' || 
          this.redactedFileType === 'docx' || this.redactedFileType === 'excel') {
        this.restoreText()
      } else {
        this.restoreImage()
      }
    },
    async restoreText() {
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
          const mappings = [...(this.mapping.mappings || [])].sort((a, b) => b.placeholder.length - a.placeholder.length)
          
          mappings.forEach(m => {
            if (!m.placeholder || m.original === undefined) return
            text = text.split(m.placeholder).join(m.original)
          })
          
          this.restoredText = text
          this.restored = true
        } catch (error) {
          console.error('PDF parsing error:', error)
          alert('PDF 解析失败，请确保文件未加密或尝试其他格式。')
        }
      } else if (this.redactedFileType === 'docx' || this.redactedFileType === 'excel') {
        // Word 和 Excel 文件需要通过后端处理
        alert('Word 和 Excel 文件需要后端服务支持进行还原。请确保后端服务已启动。')
      } else {
        const reader = new FileReader()
        reader.onload = (e) => {
          let text = e.target.result
          const mappings = [...(this.mapping.mappings || [])].sort((a, b) => b.placeholder.length - a.placeholder.length)
          
          mappings.forEach(m => {
            if (!m.placeholder || m.original === undefined) return
            text = text.split(m.placeholder).join(m.original)
          })
          
          this.restoredText = text
          this.restored = true
        }
        reader.readAsText(this.redactedFile)
      }
    },
    restoreImage() {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
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
            return
          }
          
          mappings.forEach(m => {
            if (!m.rect || !m.patch) return
            const r = m.rect
            const patchImg = new Image()
            patchImg.onload = () => {
              ctx.drawImage(patchImg, r.x, r.y)
              loaded++
              if (loaded === mappings.length) {
                this.restoredImageDataUrl = canvas.toDataURL('image/png')
                this.restored = true
              }
            }
            patchImg.src = m.patch
          })
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(this.redactedFile)
    },
    downloadRestoredFile() {
      if (!this.restored) return
      
      let blob, filename
      if (this.redactedFileType === 'text' || this.redactedFileType === 'pdf' || 
          this.redactedFileType === 'docx' || this.redactedFileType === 'excel') {
        blob = new Blob([this.restoredText], { type: 'text/plain;charset=utf-8' })
        filename = 'restored_' + this.redactedFile.name.replace(/\.(pdf|docx|xlsx|xls)$/i, '.txt')
      } else {
        blob = this.dataURLToBlob(this.restoredImageDataUrl)
        filename = 'restored_' + this.redactedFile.name.replace(/\.[^.]+$/, '') + '.png'
      }
      
      this.triggerDownload(blob, filename)
    },
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
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 100)
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
      
      if (this.$refs.redactedInput) this.$refs.redactedInput.value = ''
      if (this.$refs.mappingInput) this.$refs.mappingInput.value = ''
    }
  }
}
</script>
