<template>
  <div class="container workflow">
    <div class="steps" aria-label="脱敏流程步骤">
      <div class="step" :class="{ 'is-active': step === 1, 'is-done': step > 1 }">
        <span class="step__num">1</span> 上传
      </div>
      <span class="step__sep" aria-hidden="true"></span>
      <div class="step" :class="{ 'is-active': step === 2, 'is-done': step > 2 }">
        <span class="step__num">2</span> 检测
      </div>
      <span class="step__sep" aria-hidden="true"></span>
      <div class="step" :class="{ 'is-active': step === 3, 'is-done': step > 3 }">
        <span class="step__num">3</span> 复核
      </div>
      <span class="step__sep" aria-hidden="true"></span>
      <div class="step" :class="{ 'is-active': step === 4, 'is-done': step > 4 }">
        <span class="step__num">4</span> 下载
      </div>
    </div>

    <div class="split">
      <aside class="aside" aria-label="脱敏控制面板">
        <section class="panel">
          <div class="panel__head"><h3>上传文件</h3></div>
          <div class="panel__body">
            <label class="upload-zone" :class="{ 'is-dragover': isDragging }" tabindex="0" role="button" 
              aria-label="选择或拖入文件" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" 
              @drop.prevent="handleDrop" @keydown.enter="$refs.fileInput.click()" @keydown.space.prevent="$refs.fileInput.click()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span class="upload-zone__title">点击选择或拖入文件</span>
              <span class="upload-zone__hint">支持 TXT / CSV / JSON / PDF / DOCX / XLSX / PNG / JPG</span>
              <input type="file" ref="fileInput" accept=".txt,.csv,.json,.md,.markdown,.pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,text/*,image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                @change="handleFileSelect" style="display: none" />
            </label>
            <div class="file-meta" v-if="file" style="margin-top: 16px">
              <span class="file-meta__icon" aria-hidden="true">
                <svg v-if="fileType === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <svg v-else-if="fileType === 'pdf'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <svg v-else-if="fileType === 'docx'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <svg v-else-if="fileType === 'excel'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </span>
              <div class="file-meta__info">
                <div class="file-meta__name">{{ file.name }}</div>
                <div class="file-meta__detail">{{ fileType === 'image' ? '图片' : fileType === 'pdf' ? 'PDF' : fileType === 'docx' ? 'Word' : fileType === 'excel' ? 'Excel' : '文本' }} · {{ formatSize(file.size) }}</div>
              </div>
              <button class="icon-btn" @click="reset" aria-label="移除当前文件" title="移除文件">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <!-- 后端处理状态 -->
            <div v-if="isLoadingBackend" class="backend-status" style="margin-top: 16px; padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 20px; height: 20px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"/>
                </svg>
                <span style="font-size: 14px; color: #0369a1;">正在调用后端进行初步脱敏...</span>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 8px; margin-bottom: 0;">
                使用 Microsoft Presidio 和中国百家姓库进行智能检测
              </p>
            </div>
            <!-- 后端错误提示 -->
            <div v-if="backendError" class="backend-error" style="margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
              <p style="font-size: 12px; color: #dc2626; margin: 0;">
                后端服务不可用，已切换到前端处理模式。错误：{{ backendError }}
              </p>
            </div>
            <!-- PDF 转换成功提示 -->
            <div v-if="convertedFromPdf" class="conversion-success" style="margin-top: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 20px; height: 20px; color: #16a34a;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span style="font-size: 14px; color: #16a34a;">PDF 已自动转换为 Word 格式</span>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 8px; margin-bottom: 0;">
                原始 PDF 已保留格式转换为 Word 文档，便于后续编辑和处理
              </p>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel__head">
            <h3>检测结果</h3>
            <span class="panel__count">{{ detections.filter(d => d.active).length }} 项</span>
          </div>
          <div class="panel__body">
            <div class="detect-list">
              <div v-for="item in detections" :key="item.id" class="detect-item" :class="{ 'is-off': !item.active }">
                <span class="badge" :class="'badge--' + (item.type || 'manual')">{{ item.label || '区域' }}</span>
                <div class="detect-item__body">
                  <div class="detect-item__value">{{ item.active ? item.placeholder : item.value }}</div>
                  <div class="detect-item__sub">{{ item.manual ? '手动框选' : '自动检测' }}</div>
                </div>
                <label class="switch" :title="item.active ? '点击取消脱敏' : '点击加入脱敏'">
                  <input type="checkbox" :checked="item.active" @change="toggleDetection(item)" />
                  <span class="switch__track"></span>
                  <span class="switch__knob"></span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section class="action-bar">
          <button class="btn btn--primary btn--lg btn--block" @click="confirmRedaction" :disabled="!file || confirmed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            确认脱敏
          </button>
          <button class="btn btn--ghost btn--block" @click="reset" :disabled="!file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            重新开始
          </button>
        </section>
      </aside>

      <section class="preview" aria-live="polite">
        <div class="preview__head">
          <h3>{{ previewTitle }}</h3>
        </div>
        <div class="preview__body" ref="previewBody">
          <div v-if="!file" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>上传文件后在此预览检测结果</p>
          </div>
          <div v-else-if="fileType === 'text' || fileType === 'pdf'" class="text-preview" @mouseup="handleTextSelect">
            <template v-for="(part, i) in textParts" :key="i">
              <span v-if="part.type === 'normal'">{{ part.text }}</span>
              <span v-else :class="part.active ? 'tok' : 'det'" :title="(part.active ? '已脱敏：' : '未脱敏：') + part.label" 
                @click="toggleDetection(part)">{{ part.active ? part.placeholder : part.text }}</span>
            </template>
          </div>
          <div v-else-if="fileType === 'image'" class="canvas-wrap">
            <canvas ref="canvas" :width="imageWidth" :height="imageHeight" @mousedown="startCanvasDraw" 
              @mousemove="drawCanvas" @mouseup="endCanvasDraw" @mouseleave="cancelCanvasDraw"></canvas>
            <div class="canvas-legend">
              <span><i class="box"></i>已脱敏区域</span>
              <span><i></i>候选区域</span>
              <span><i class="off"></i>已跳过区域</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="mapping-pre" v-if="mapping" :class="{ 'is-open': showMapping }">
      <div class="mapping-pre__head" @click="showMapping = !showMapping" role="button" tabindex="0" 
        :aria-expanded="showMapping" @keydown.enter.space="showMapping = !showMapping">
        <h3>映射表 JSON</h3>
        <svg class="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="mapping-pre__body" v-show="showMapping">
        <pre>{{ JSON.stringify(mapping, null, 2) }}</pre>
      </div>
    </div>

    <div class="download-bar" v-if="confirmed">
      <span class="download-bar__label">脱敏完成</span>
      <button class="btn btn--primary" @click="downloadRedactedFile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        下载脱敏文件
      </button>
      <button class="btn btn--secondary" @click="downloadMapping">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        下载映射表
      </button>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/build/pdf.worker.entry'
import DesensitizationAPI from '@/api/desensitization'

// Worker is configured via the import above

const PATTERNS = [
  { id: 'phone', label: '手机号', regex: /1[3-9]\d{9}/g },
  { id: 'idcard', label: '身份证', regex: /\d{17}[\dXx]/g },
  { id: 'email', label: '邮箱', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { id: 'bankcard', label: '银行卡', regex: /\d{16,19}/g },
  { id: 'amount', label: '金额', regex: /(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?\s*(?:万元|元|美元|USD|CNY|￥|\$)/g },
  { id: 'name', label: '姓名', regex: /[\u4e00-\u9fa5]{2,4}(?=(?:先生|女士|总|经理|董事|合伙人|投资|基金|LP|GP))/g }
]

const TYPE_NAMES = {
  phone: '手机号', idcard: '身份证', email: '邮箱', bankcard: '银行卡',
  amount: '金额', name: '姓名', manual: '区域'
}

export default {
  name: 'Desensitize',
  data() {
    return {
      step: 0,
      file: null,
      fileType: null,
      originalText: '',
      detections: [],
      nextId: 1,
      isDragging: false,
      confirmed: false,
      mapping: null,
      showMapping: false,
      redactedText: '',
      isLoadingBackend: false,
      backendError: null,
      convertedFromPdf: false,
      image: {
        img: null,
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        rects: []
      },
      canvasDraw: {
        start: null,
        current: null
      }
    }
  },
  computed: {
    previewTitle() {
      if (!this.file) return '预览'
      if (this.fileType === 'pdf') return 'PDF 预览'
      if (this.fileType === 'docx') return 'Word 预览'
      if (this.fileType === 'excel') return 'Excel 预览'
      return this.fileType === 'text' ? '文本预览' : '图片预览'
    },
    textParts() {
      if ((this.fileType !== 'text' && this.fileType !== 'pdf' && this.fileType !== 'docx' && this.fileType !== 'excel') || !this.originalText) return []
      
      const parts = []
      let cursor = 0
      
      const sorted = [...this.detections].sort((a, b) => a.start - b.start)
      
      for (const det of sorted) {
        if (det.start > cursor) {
          parts.push({ type: 'normal', text: this.originalText.slice(cursor, det.start) })
        }
        parts.push({ 
          type: 'detection', 
          text: det.value, 
          placeholder: det.placeholder, 
          active: det.active, 
          label: det.label,
          id: det.id 
        })
        cursor = det.end
      }
      
      if (cursor < this.originalText.length) {
        parts.push({ type: 'normal', text: this.originalText.slice(cursor) })
      }
      
      return parts
    },
    imageWidth() {
      return this.image.width || 800
    },
    imageHeight() {
      return this.image.height || 600
    }
  },
  methods: {
    handleFileSelect(e) {
      if (e.target.files && e.target.files[0]) {
        this.handleFile(e.target.files[0])
      }
    },
    handleDrop(e) {
      this.isDragging = false
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFile(e.dataTransfer.files[0])
      }
    },
    handleFile(file) {
      this.reset()
      this.file = file
      this.fileType = this.inferFileType(file)
      this.step = 1
      this.isLoadingBackend = true
      this.backendError = null
      
      // 首先尝试调用后端 API 进行初步脱敏
      this.callBackendRedaction(file)
    },
    async callBackendRedaction(file) {
      try {
        const userId = this.getUserId()
        
        // 如果是 PDF 文件，使用支持转换的接口
        let result
        if (this.fileType === 'pdf') {
          result = await DesensitizationAPI.redactFileWithConversion(file, userId)
        } else {
          result = await DesensitizationAPI.redactFile(file, userId)
        }
        
        // 后端处理成功，使用后端结果
        this.originalText = result.redacted_text
        this.detections = result.mappings.map((m, i) => ({
          id: this.nextId++,
          type: m.type,
          label: this.getTypeLabel(m.type),
          value: m.original,
          start: m.start,
          end: m.end,
          placeholder: m.placeholder,
          active: true,
          manual: false,
          confidence: m.confidence,
          source: m.source
        }))
        
        this.mapping = {
          version: '1.0',
          user_id: userId,
          created_at: result.created_at,
          file_name: file.name,
          file_type: this.fileType,
          mappings: result.mappings
        }
        
        // 如果是 PDF 转换后的结果，更新文件类型
        if (result.converted_from_pdf) {
          this.fileType = 'docx'
          this.convertedFromPdf = true
        }
        
        this.isLoadingBackend = false
        this.step = 2
        
        console.log('后端脱敏完成，检测到', result.detection_count, '处敏感信息')
        
      } catch (error) {
        console.warn('后端 API 调用失败，使用前端处理：', error.message)
        this.backendError = error.message
        this.isLoadingBackend = false
        
        // 降级到前端处理
        this.fallbackToFrontend(file)
      }
    },
    fallbackToFrontend(file) {
      if (this.fileType === 'pdf') {
        this.handlePdfFile(file)
      } else if (this.fileType === 'docx' || this.fileType === 'excel') {
        // Word 和 Excel 文件需要通过后端处理
        // 前端无法直接解析这些格式
        alert('Word 和 Excel 文件需要后端服务支持。请确保后端服务已启动。')
        this.reset()
      } else if (this.fileType === 'text') {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.originalText = e.target.result
          this.runTextDetection()
          this.step = 2
        }
        reader.readAsText(file)
      } else {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.loadImageForCanvas(e.target.result)
        }
        reader.readAsDataURL(file)
      }
    },
    getTypeLabel(type) {
      const labels = {
        phone: '手机号',
        idcard: '身份证',
        id_card: '身份证',
        email: '邮箱',
        bankcard: '银行卡',
        bank_card: '银行卡',
        amount: '金额',
        name: '姓名',
        chinese_name: '中文姓名',
        landline: '固定电话',
        ip_address: 'IP地址',
        license_plate: '车牌号',
        passport: '护照号',
        unified_social_credit_code: '统一社会信用代码',
        ssn: '社会安全号',
        credit_card: '信用卡',
        address: '地址',
        date: '日期时间',
        manual: '区域'
      }
      return labels[type] || '敏感项'
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
    async handlePdfFile(file) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let fullText = ''
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map(item => item.str).join(' ')
          fullText += pageText + '\n'
        }
        
        this.originalText = fullText.trim()
        this.runTextDetection()
        this.step = 2
      } catch (error) {
        console.error('PDF parsing error:', error)
        alert('PDF 解析失败，请确保文件未加密或尝试其他格式。')
        this.reset()
      }
    },
    runTextDetection() {
      const text = this.originalText
      const raw = []
      
      PATTERNS.forEach(p => {
        let m
        p.regex.lastIndex = 0
        while ((m = p.regex.exec(text)) !== null) {
          raw.push({ type: p.id, label: p.label, value: m[0], start: m.index, end: m.index + m[0].length })
        }
      })
      
      raw.sort((a, b) => a.start - b.start || b.end - a.end)
      const merged = []
      raw.forEach(r => {
        const last = merged[merged.length - 1]
        if (last && r.start < last.end) return
        merged.push(r)
      })
      merged.sort((a, b) => a.start - b.start)
      
      this.detections = merged.map((r, i) => ({
        id: this.nextId++,
        type: r.type,
        label: r.label,
        value: r.value,
        start: r.start,
        end: r.end,
        placeholder: '掩码-' + (TYPE_NAMES[r.type] || '敏感项') + '-' + String(i + 1).padStart(3, '0'),
        active: true,
        manual: false
      }))
    },
    loadImageForCanvas(dataUrl) {
      const img = new Image()
      img.onload = () => {
        this.image.img = img
        this.image.width = img.naturalWidth
        this.image.height = img.naturalHeight
        
        this.simulateImageDetections()
        this.step = 2
        
        this.$nextTick(() => {
          this.drawImageCanvas()
        })
      }
      img.src = dataUrl
    },
    simulateImageDetections() {
      const w = this.image.width
      const h = this.image.height
      const rects = []
      const count = Math.min(4, Math.max(2, Math.floor((w * h) / 200000)))
      
      for (let i = 0; i < count; i++) {
        const rw = Math.max(80, Math.min(240, w * 0.22))
        const rh = Math.max(24, Math.min(80, h * 0.08))
        const x = Math.floor((w - rw) * (0.12 + i * 0.22))
        const y = Math.floor((h - rh) * (0.25 + (i % 2) * 0.35))
        
        rects.push({
          id: this.nextId++,
          x, y, w: rw, h: rh,
          placeholder: '掩码-区域-' + String(i + 1).padStart(3, '0'),
          active: true,
          manual: false
        })
      }
      
      this.image.rects = rects
    },
    drawImageCanvas() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(this.image.img, 0, 0)
      
      this.image.rects.forEach(r => {
        ctx.strokeStyle = r.active ? '#000000' : 'rgba(0,0,0,0.25)'
        ctx.lineWidth = r.active ? 2 : 1.5
        ctx.setLineDash(r.active ? [] : [5, 4])
        ctx.strokeRect(r.x, r.y, r.w, r.h)
        
        if (r.active) {
          ctx.fillStyle = 'rgba(0,0,0,0.78)'
          ctx.fillRect(r.x, r.y, r.w, r.h)
          ctx.fillStyle = '#ffffff'
          ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
          ctx.fillText(r.placeholder, r.x + 4, r.y + 16)
        }
      })
      
      ctx.setLineDash([])
    },
    startCanvasDraw(e) {
      const canvas = this.$refs.canvas
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      
      const clicked = [...this.image.rects].reverse().find(r => 
        x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
      )
      
      if (clicked) {
        clicked.active = !clicked.active
        this.drawImageCanvas()
        return
      }
      
      this.canvasDraw.start = { x, y }
    },
    drawCanvas(e) {
      if (!this.canvasDraw.start) return
      
      const canvas = this.$refs.canvas
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      
      this.drawImageCanvas()
      
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.strokeRect(this.canvasDraw.start.x, this.canvasDraw.start.y, 
        x - this.canvasDraw.start.x, y - this.canvasDraw.start.y)
      ctx.setLineDash([])
    },
    endCanvasDraw(e) {
      if (!this.canvasDraw.start) return
      
      const canvas = this.$refs.canvas
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      
      const rx = Math.min(this.canvasDraw.start.x, x)
      const ry = Math.min(this.canvasDraw.start.y, y)
      const rw = Math.abs(x - this.canvasDraw.start.x)
      const rh = Math.abs(y - this.canvasDraw.start.y)
      
      if (rw > 20 && rh > 12) {
        this.image.rects.push({
          id: this.nextId++,
          x: Math.max(0, rx),
          y: Math.max(0, ry),
          w: Math.min(this.image.width - rx, rw),
          h: Math.min(this.image.height - ry, rh),
          placeholder: '掩码-区域-' + String(this.image.rects.length + 1).padStart(3, '0'),
          active: true,
          manual: true
        })
      }
      
      this.canvasDraw.start = null
      this.drawImageCanvas()
    },
    cancelCanvasDraw() {
      this.canvasDraw.start = null
      this.drawImageCanvas()
    },
    handleTextSelect() {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
      
      const range = sel.getRangeAt(0)
      const text = sel.toString().trim()
      if (!text) return
      
      const preview = this.$refs.previewBody
      const preRange = document.createRange()
      preRange.selectNodeContents(preview)
      
      const startOffset = this.getSelectionOffset(preview, range.startContainer, range.startOffset)
      const endOffset = this.getSelectionOffset(preview, range.endContainer, range.endOffset)
      
      if (startOffset === null || endOffset === null || startOffset >= endOffset) return
      
      const existing = this.detections.find(d => d.start === startOffset && d.end === endOffset)
      if (existing) return
      
      this.detections = this.detections.filter(d => !(startOffset <= d.start && endOffset >= d.end))
      
      const newItem = {
        id: this.nextId++,
        type: 'manual',
        label: '区域',
        value: text,
        start: startOffset,
        end: endOffset,
        placeholder: '掩码-区域-' + String(this.detections.filter(d => d.type === 'manual').length + 1).padStart(3, '0'),
        active: true,
        manual: true
      }
      
      this.detections = this.detections.filter(d => !(d.start < endOffset && d.end > startOffset))
      this.detections.push(newItem)
      this.detections.sort((a, b) => a.start - b.start)
      
      sel.removeAllRanges()
    },
    getSelectionOffset(container, node, offset) {
      let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
      while (el && el !== container) {
        if (el.dataset && el.dataset.detectionId) {
          const det = this.detections.find(d => String(d.id) === el.dataset.detectionId)
          if (det) return det.start + offset
        }
        el = el.parentElement
      }
      
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
      let len = 0
      while (walker.nextNode()) {
        const n = walker.currentNode
        if (n === node) return len + Math.min(offset, n.textContent.length)
        len += n.textContent.length
      }
      return null
    },
    toggleDetection(item) {
      item.active = !item.active
      if (this.fileType === 'image') {
        this.drawImageCanvas()
      }
    },
    confirmRedaction() {
      if (this.fileType === 'text' || this.fileType === 'pdf') {
        this.buildTextMapping()
      } else {
        this.buildImageMapping()
      }
      this.confirmed = true
      this.step = 4
      this.storeMapping()
    },
    buildTextMapping() {
      const mappings = []
      const activeDetections = [...this.detections].filter(d => d.active).sort((a, b) => b.start - a.start)
      let redacted = this.originalText
      
      activeDetections.forEach(d => {
        mappings.push({ id: d.id, placeholder: d.placeholder, type: d.type, original: d.value })
        redacted = redacted.slice(0, d.start) + d.placeholder + redacted.slice(d.end)
      })
      
      this.mapping = {
        version: '1.0',
        user_id: this.getUserId(),
        created_at: new Date().toISOString(),
        file_name: this.file.name,
        file_type: 'text',
        mappings: mappings.reverse()
      }
      this.redactedText = redacted
    },
    buildImageMapping() {
      const canvas = document.createElement('canvas')
      canvas.width = this.image.width
      canvas.height = this.image.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(this.image.img, 0, 0)
      
      const mappings = []
      this.image.rects.filter(r => r.active).forEach(r => {
        const patchCanvas = document.createElement('canvas')
        patchCanvas.width = r.w
        patchCanvas.height = r.h
        const patchCtx = patchCanvas.getContext('2d')
        patchCtx.drawImage(this.image.img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h)
        
        mappings.push({
          id: r.id,
          placeholder: r.placeholder,
          type: 'manual',
          rect: { x: r.x, y: r.y, w: r.w, h: r.h },
          patch: patchCanvas.toDataURL('image/png')
        })
      })
      
      this.mapping = {
        version: '1.0',
        user_id: this.getUserId(),
        created_at: new Date().toISOString(),
        file_name: this.file.name,
        file_type: 'image',
        mappings
      }
    },
    getUserId() {
      try {
        return localStorage.getItem('desens_user_id') || ''
      } catch (e) {
        return ''
      }
    },
    storeMapping() {
      try {
        const key = 'desens_mappings'
        const list = JSON.parse(localStorage.getItem(key) || '[]')
        list.push({
          user_id: this.mapping.user_id,
          file_name: this.file.name,
          created_at: this.mapping.created_at,
          mapping_preview: this.mapping.mappings.slice(0, 3)
        })
        localStorage.setItem(key, JSON.stringify(list.slice(-20)))
      } catch (e) {}
    },
    downloadRedactedFile() {
      if (!this.confirmed) return
      
      let blob, filename
      if (this.fileType === 'text' || this.fileType === 'pdf') {
        blob = new Blob([this.redactedText], { type: 'text/plain;charset=utf-8' })
        filename = 'redacted_' + this.file.name.replace(/\.pdf$/i, '.txt')
      } else {
        const canvas = this.$refs.canvas
        const dataUrl = canvas.toDataURL('image/png')
        blob = this.dataURLToBlob(dataUrl)
        filename = 'redacted_' + this.file.name.replace(/\.[^.]+$/, '') + '.png'
      }
      
      this.triggerDownload(blob, filename)
    },
    downloadMapping() {
      if (!this.mapping) return
      const blob = new Blob([JSON.stringify(this.mapping, null, 2)], { type: 'application/json' })
      this.triggerDownload(blob, 'mapping_' + this.file.name.replace(/\.[^.]+$/, '') + '.json')
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
      this.file = null
      this.fileType = null
      this.originalText = ''
      this.detections = []
      this.nextId = 1
      this.confirmed = false
      this.mapping = null
      this.showMapping = false
      this.redactedText = ''
      this.convertedFromPdf = false
      this.image = { img: null, canvas: null, ctx: null, width: 0, height: 0, rects: [] }
      this.canvasDraw = { start: null, current: null }
      this.step = 0
      
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    }
  }
}
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
