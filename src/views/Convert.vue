<template>
  <div class="container convert-page">
    <div class="page-heading">
      <span class="mono-label">FILE CONVERSION</span>
      <h1>PDF 与 Word 转换</h1>
      <p>选择一个 PDF 或 DOCX 文件，转换完成后下载结果。PDF 转 Word 会重建可编辑的文字、表格和图片；Word 转 PDF 会保留原文档的页面结构。</p>
    </div>

    <section class="convert-card">
      <div class="convert-options" role="radiogroup" aria-label="转换方向">
        <label :class="{ 'is-selected': direction === 'pdf-to-word' }"><input v-model="direction" type="radio" value="pdf-to-word" />PDF 转 Word</label>
        <label :class="{ 'is-selected': direction === 'word-to-pdf' }"><input v-model="direction" type="radio" value="word-to-pdf" />Word 转 PDF</label>
      </div>
      <p v-if="direction === 'word-to-pdf' && libreOfficeAvailable === false" class="convert-warning">Word 转 PDF 需要 LibreOffice。请安装 LibreOffice 后重试；PDF 转 Word 不受影响。</p>
      <label class="convert-drop" :class="{ 'is-dragover': dragging }" @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="selectFile($event.dataTransfer.files[0])">
        <input ref="fileInput" type="file" :accept="accept" @change="selectFile($event.target.files[0])" />
        <strong>{{ file ? file.name : `选择或拖入 ${direction === 'pdf-to-word' ? 'PDF' : 'DOCX'} 文件` }}</strong>
        <span>{{ file ? formatSize(file.size) : `仅支持 ${direction === 'pdf-to-word' ? '.pdf' : '.docx'} 格式` }}</span>
      </label>
      <p v-if="error" class="convert-error">{{ error }}</p>
      <button class="btn btn--primary" :disabled="!file || converting || (direction === 'word-to-pdf' && libreOfficeAvailable === false)" @click="convert">{{ converting ? '正在转换…' : '开始转换' }}</button>
    </section>

    <section v-if="result" class="convert-result"><strong>转换完成</strong><span>{{ result }}</span></section>
    <p v-if="direction === 'pdf-to-word'" class="convert-note">说明：转换结果为可编辑 Word。复杂 PDF 的文字位置、分页或表格边距可能与原件略有差异，请在交付前复核。</p>
  </div>
</template>

<script>
import DesensitizationAPI from '@/api/desensitization'

export default {
  name: 'Convert',
  data: () => ({ direction: 'pdf-to-word', file: null, dragging: false, converting: false, error: '', result: '', libreOfficeAvailable: null }),
  computed: { accept() { return this.direction === 'pdf-to-word' ? '.pdf,application/pdf' : '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' } },
  async mounted() {
    try {
      const capabilities = await DesensitizationAPI.getRuntimeCapabilities()
      this.libreOfficeAvailable = Boolean(capabilities.word_to_pdf?.available)
    } catch (_) {
      // 浏览器开发环境后端尚未启动时仍允许由接口给出错误提示。
      this.libreOfficeAvailable = null
    }
  },
  watch: { direction() { this.file = null; this.error = ''; this.result = '' } },
  methods: {
    formatSize(size) { return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB` },
    selectFile(file) {
      this.dragging = false; this.error = ''; this.result = ''
      if (!file) return
      const expected = this.direction === 'pdf-to-word' ? '.pdf' : '.docx'
      if (!file.name.toLowerCase().endsWith(expected)) { this.error = `请选择 ${expected.toUpperCase()} 文件。`; return }
      this.file = file
    },
    async convert() {
      this.converting = true; this.error = ''; this.result = ''
      try {
        const blob = this.direction === 'pdf-to-word' ? await DesensitizationAPI.convertPdfToWord(this.file) : await DesensitizationAPI.convertWordToPdf(this.file)
        if (!(blob instanceof Blob) || blob.size === 0) throw new Error('转换服务返回了空文件，请检查后端转换依赖')
        const extension = this.direction === 'pdf-to-word' ? '.docx' : '.pdf'
        const filename = `${this.file.name.replace(/\.[^.]+$/, '')}${extension}`
        const url = URL.createObjectURL(blob); const link = document.createElement('a')
        link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove()
        // WebView/浏览器可能在 click 返回后才开始读取 Blob，不能立即撤销 URL。
        setTimeout(() => URL.revokeObjectURL(url), 30_000)
        this.result = `已生成 ${filename}。`
      } catch (error) { this.error = error.message || '转换失败，请确认后端服务已启动。' } finally { this.converting = false }
    }
  }
}
</script>

<style scoped>
.convert-page{max-width:920px;padding-top:64px;padding-bottom:72px}.page-heading h1{margin:10px 0;font-size:clamp(32px,5vw,52px)}.page-heading p{color:var(--muted);max-width:680px}.convert-card,.convert-result{margin-top:32px;border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;background:#fff}.convert-options{display:grid;grid-template-columns:1fr 1fr;gap:12px}.convert-options label{border:1px solid var(--border);border-radius:8px;padding:14px;cursor:pointer;font-weight:600}.convert-options label.is-selected{border-color:var(--fg);background:#f7f7f7}.convert-options input{margin-right:8px}.convert-drop{display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center;min-height:190px;margin-top:20px;border:1px dashed var(--border);border-radius:8px;cursor:pointer;text-align:center}.convert-drop.is-dragover{border-color:var(--fg);background:#fafafa}.convert-drop input{display:none}.convert-drop span,.convert-result span,.convert-note{color:var(--muted);font-size:var(--text-sm)}.convert-card .btn{margin-top:20px}.convert-error{color:#b42318;margin:16px 0 0}.convert-warning{margin:16px 0 0;padding:12px 14px;border:1px solid #f0c36d;background:#fff8e5;color:#7a4b00;font-size:var(--text-sm);line-height:1.6}.convert-result{display:flex;gap:12px;align-items:center}.convert-note{margin:16px 0 0;line-height:1.7}@media(max-width:600px){.convert-options{grid-template-columns:1fr}}
</style>
