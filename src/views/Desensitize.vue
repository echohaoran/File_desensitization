<template>
  <div class="container workflow" :dir="uiDirection">
    <div class="steps" :aria-label="$t('desensitize.steps')">
      <div class="step" :class="{ 'is-active': step === 1, 'is-done': step > 1 }">
        <span class="step__num">{{ formatNumber(1) }}</span> {{ $t('desensitize.upload') }}
      </div>
      <span class="step__sep" aria-hidden="true"></span>
      <div class="step" :class="{ 'is-active': step === 2, 'is-done': step > 2 }">
        <span class="step__num">{{ formatNumber(2) }}</span> {{ $t('desensitize.detect') }}
      </div>
      <span class="step__sep" aria-hidden="true"></span>
      <div class="step" :class="{ 'is-active': step === 3, 'is-done': step > 3 }">
        <span class="step__num">{{ formatNumber(3) }}</span> {{ $t('desensitize.review') }}
      </div>
      <span class="step__sep" aria-hidden="true"></span>
      <div class="step" :class="{ 'is-active': step === 4, 'is-done': step > 4 }">
        <span class="step__num">{{ formatNumber(4) }}</span> {{ $t('desensitize.download') }}
      </div>
    </div>

    <div class="split">
      <aside class="aside" :aria-label="$t('desensitize.controls')">
        <section class="panel upload-panel" :class="{ 'upload-panel--collapsed': uploadCollapsed }">
          <div class="panel__head"><h3>{{ $t('desensitize.uploadFile') }}</h3><button v-if="file" class="panel-toggle" type="button" @click="uploadCollapsed = !uploadCollapsed">{{ uploadCollapsed ? $t('desensitize.expand') : $t('desensitize.collapse') }}</button></div>
          <div v-if="!uploadCollapsed" class="panel__body">
            <label class="upload-zone" :class="{ 'is-dragover': isDragging }" tabindex="0" role="button" 
              :aria-label="$t('desensitize.chooseFile')" @dragenter.prevent="isDragging = true" @dragover.prevent="isDragging = true" @dragleave="isDragging = false"
              @drop.prevent="handleDrop" @keydown.enter="$refs.fileInput.click()" @keydown.space.prevent="$refs.fileInput.click()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span class="upload-zone__title">{{ $t('desensitize.dropFile') }}</span>
              <span class="upload-zone__hint">{{ $t('desensitize.formats') }}</span>
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
                <div class="file-meta__name" dir="auto">{{ file.name }}</div>
                <div class="file-meta__detail">{{ fileType === 'image' ? $t('desensitize.image') : fileType === 'pdf' ? 'PDF' : fileType === 'docx' ? 'Word' : fileType === 'excel' ? 'Excel' : $t('desensitize.text') }} · {{ formatSize(file.size) }}</div>
              </div>
              <button class="icon-btn" @click="requestReset" :aria-label="$t('desensitize.removeCurrent')" :title="$t('desensitize.removeFile')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <!-- 后端处理状态 -->
            <div v-if="isLoadingBackend" class="backend-status" style="margin-top: 16px; padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 20px; height: 20px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"/>
                </svg>
                <span style="font-size: 14px; color: #0369a1;">{{ $t('desensitize.backendLoading') }}</span>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 8px; margin-bottom: 0;">
                {{ $t('desensitize.backendHint') }}
              </p>
            </div>
            <!-- 后端错误提示 -->
            <div v-if="backendError" class="backend-error" style="margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
              <p style="font-size: 12px; color: #dc2626; margin: 0;">
                {{ $t('desensitize.backendUnavailable', { error: backendError || $t('desensitize.backendConnection') }) }}
              </p>
            </div>
            <div v-if="formatWarning" class="format-info" style="margin-top: 16px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
              <p style="font-size: 12px; color: #1d4ed8; margin: 0;">{{ formatWarning }}</p>
            </div>
            <!-- PDF 转换成功提示 -->
            <div v-if="convertedFromPdf" class="conversion-success" style="margin-top: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 20px; height: 20px; color: #16a34a;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span style="font-size: 14px; color: #16a34a;">{{ $t('desensitize.pdfConverted') }}</span>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 8px; margin-bottom: 0;">
                {{ $t('desensitize.pdfConvertedHint') }}
              </p>
            </div>
          </div>
        </section>

        <section class="panel panel--grow">
          <div class="panel__head">
            <h3>{{ $t('desensitize.results') }}</h3>
            <span class="panel__count">{{ $t('desensitize.itemCount', { count: formatNumber(detections.length) }) }}</span>
          </div>
          <div class="ai-action">
            <AiFeatureButton block button-class="btn btn--secondary btn--sm btn--block" :disabled="aiDetecting || !rawOriginalText" @click="requestAiDetection">{{ aiDetecting ? $t('desensitize.aiDetecting') : $t('desensitize.aiFull') }}</AiFeatureButton>
            <div v-if="aiDetecting" class="ai-progress" role="progressbar" :aria-label="$t('desensitize.aiDetecting')" :aria-valuenow="aiProgress" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: `${aiProgress}%` }"></span></div>
          </div>
          <div class="panel__stats" v-if="detections.length > 0">
            <div class="stat-item" v-for="(count, type) in detectionsByType" :key="type">
              <span class="badge badge--sm" :class="'badge--' + type">{{ getGroupLabel(type) }}</span>
              <span class="stat-count">{{ formatNumber(count) }}</span>
            </div>
          </div>
          <div class="panel__body" ref="detectionScroll">
            <div class="detect-list" :data-empty-text="$t('desensitize.noDetections')">
              <div v-for="item in detections" :key="item.id" class="detect-item" :data-detection-id="item.id" :class="{ 'is-linked-hover': hoverDetectionId === item.id }" @mouseenter="setHoverDetection(item.id)" @mouseleave="clearHoverDetection" @click="lockHoverDetection(item.id)">
                <div class="detect-item__main">
                  <div class="detect-item__info">
                    <div class="detect-item__header">
                      <span class="badge" :class="'badge--' + (item.type || 'manual')">{{ getDetectionLabel(item) }}</span>
                      <span class="detect-item__sub">{{ item.manual ? $t('desensitize.manualSelection') : $t('desensitize.automatic') }}</span>
                    </div>
                    <div class="detect-item__value" dir="ltr">{{ item.placeholder }}</div>
                  </div>
                  <button class="detect-item__delete" @click.stop="toggleDetection(item)" :title="$t('desensitize.cancelRedaction')" :aria-label="$t('desensitize.cancelRedaction')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div class="detect-item__original">
                  <span class="detect-item__original-label">{{ $t('desensitize.originalContent') }}</span>
                  <span class="detect-item__original-text" dir="auto">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- PDF 转换 Word 下载按钮 -->
          <div class="panel__footer" v-if="convertedFromPdf">
            <button class="btn btn--secondary btn--sm btn--block" @click="downloadConvertedWord">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ $t('desensitize.downloadWord') }}
            </button>
          </div>
        </section>

        <section class="action-bar">
          <button class="btn btn--primary btn--lg btn--block" @click="requestConfirmRedaction" :disabled="!file || confirmed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {{ $t('desensitize.confirmRedaction') }}
          </button>
          <button class="btn btn--ghost btn--block" @click="requestReset" :disabled="!file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            {{ $t('desensitize.restart') }}
          </button>
        </section>
      </aside>

      <section class="preview" aria-live="polite">
        <div class="preview__head">
          <h3>{{ previewTitle }}</h3>
        </div>
        <nav class="review-navigation" :aria-label="$t('review.navigation')">
          <button class="btn btn--secondary btn--sm" :disabled="!reviewItems.length || reviewIndex === 0" @click="navigateReview(-1)">{{ $t('review.previous') }}</button>
          <div class="review-actions" @mousedown.prevent>
            <button class="btn btn--secondary btn--sm" :disabled="reviewIndex < 0 || previewCancelPending" @click="requestPreviewCancel(reviewItems[reviewIndex])">{{ $t('desensitize.cancelRedaction') }}</button>
            <span aria-live="polite">{{ $t('review.position', { current: formatNumber(reviewIndex + 1), total: formatNumber(reviewItems.length) }) }}</span>
            <button class="btn btn--primary btn--sm" :disabled="!pendingSelections.length || applyingSelections" @click="applyPendingSelections('mask')">{{ $t('desensitize.redact') }}</button>
            <button class="btn btn--secondary btn--sm" :disabled="!pendingSelections.length || applyingSelections" @click="applyPendingSelections('rule')">{{ $t('selection.addFields') }}</button>
          </div>
          <button class="btn btn--secondary btn--sm" :disabled="!reviewItems.length || reviewIndex === reviewItems.length - 1" @click="navigateReview(1)">{{ $t('review.next') }}</button>
        </nav>
        <div v-if="pendingSelections.length" class="pending-selections">
          <span>{{ $t('selection.pending', { count: pendingSelections.length }) }}</span>
          <button v-for="(selection, index) in pendingSelections" :key="selection.start" class="pending-chip" @click="pendingSelections.splice(index, 1)" :title="$t('selection.remove')">{{ rawOriginalText.slice(selection.start, selection.end).slice(0, 28) }} ×</button>
          <button class="btn btn--secondary btn--sm" @click="clearPendingSelections">{{ $t('selection.clear') }}</button>
        </div>
        <div class="preview__body" ref="previewBody" @click="onPreviewDetectionClick" @keydown.enter="onPreviewDetectionClick">
          <div v-if="!file" class="comparison-preview comparison-preview--empty">
            <article class="comparison-pane comparison-pane--original">
              <header class="comparison-pane__head"><span>{{ $t('desensitize.originalFile') }}</span><small>{{ $t('desensitize.waitingUpload') }}</small></header>
              <div class="empty-state"><p>{{ $t('desensitize.emptyOriginal') }}</p></div>
            </article>
            <article class="comparison-pane comparison-pane--redacted">
              <header class="comparison-pane__head"><span>{{ $t('desensitize.redactedFile') }}</span><small>{{ $t('desensitize.waitingConfirmation') }}</small></header>
              <div class="empty-state"><p>{{ $t('desensitize.emptyRedacted') }}</p></div>
            </article>
          </div>
          <div v-else-if="fileType === 'docx' && documentPreview.length" class="document-preview" dir="auto" @mouseup="handleTextSelect">
            <template v-for="(block, blockIndex) in documentPreview" :key="blockIndex">
              <component v-if="block.type !== 'table'" :is="block.type === 'heading' ? 'h' + Math.min(Math.max(block.level || 2, 1), 4) : 'p'" :class="['document-preview__' + block.type, { 'document-preview__blank': !block.text, 'document-preview__list': block.format?.list }]" :style="previewBlockStyle(block)" :data-source-start="block.start" :data-source-end="block.end">
                <template v-for="(part, i) in partsForRange(block.start, block.end)" :key="i">
                  <span v-if="part.type === 'normal'" :data-original-start="part.start" :data-original-end="part.end">{{ part.text }}</span>
                  <span v-else :class="[part.active ? 'tok' : 'det', 'detection-mark', { 'is-linked-hover': hoverDetectionId === part.id }]" :title="$t(part.active ? 'desensitize.redactedLabel' : 'desensitize.unredactedLabel', { label: getDetectionLabel(part) })" @mouseenter="setHoverDetection(part.id)" @mouseleave="clearHoverDetection" @click.stop="selectPreviewDetection(part)">{{ part.active ? part.placeholder : part.text }}</span>
                </template>
              </component>
              <table v-else class="document-preview__table">
                <tbody>
                  <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
                    <td v-for="(cell, cellIndex) in row" :key="cellIndex" :data-source-start="cell.start" :data-source-end="cell.end">
                      <template v-for="(part, i) in partsForRange(cell.start, cell.end)" :key="i">
                        <span v-if="part.type === 'normal'" :data-original-start="part.start" :data-original-end="part.end">{{ part.text }}</span>
                        <span v-else :class="[part.active ? 'tok' : 'det', 'detection-mark', { 'is-linked-hover': hoverDetectionId === part.id }]" :title="$t(part.active ? 'desensitize.redactedLabel' : 'desensitize.unredactedLabel', { label: getDetectionLabel(part) })" @mouseenter="setHoverDetection(part.id)" @mouseleave="clearHoverDetection" @click.stop="selectPreviewDetection(part)">{{ part.active ? part.placeholder : part.text }}</span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </div>
          <div v-else-if="fileType === 'text' || fileType === 'pdf' || fileType === 'docx' || fileType === 'excel'" class="comparison-preview">
            <article class="comparison-pane comparison-pane--original">
              <header class="comparison-pane__head"><span>{{ $t('desensitize.originalFile') }}</span><small>{{ $t('desensitize.readOnly') }}</small></header>
              <pre class="comparison-pane__body" :dir="documentDirection" ref="originalScroll"><template v-for="(part, i) in partsForRange(0, rawOriginalText.length)" :key="i"><span v-if="part.type === 'normal'" :data-original-start="part.start" :data-original-end="part.end">{{ part.text }}</span><span v-else :data-original-start="part.start" :data-original-end="part.end" :data-detection-id="part.id" role="button" tabindex="0" :aria-label="$t('review.cancelTitle')" :class="['detection-mark', { 'is-linked-hover': hoverDetectionId === part.id }]" @mouseenter="setHoverDetection(part.id)" @mouseleave="clearHoverDetection">{{ part.text }}</span></template></pre>
            </article>
            <article class="comparison-pane comparison-pane--redacted" @mouseup="handleTextSelect">
              <header class="comparison-pane__head"><span>{{ $t('desensitize.redactedFile') }}</span><small>{{ $t('desensitize.selectionOnly') }}</small></header>
              <pre class="comparison-pane__body" :dir="documentDirection" ref="redactedScroll"><template v-for="(part, i) in partsForRange(0, rawOriginalText.length)" :key="i"><span v-if="part.type === 'normal'" :data-original-start="part.start" :data-original-end="part.end">{{ part.text }}</span><span v-else :data-original-start="part.start" :data-original-end="part.end" :data-masked="part.active" :data-detection-id="part.id" role="button" tabindex="0" :aria-label="$t('review.cancelTitle')" :class="['detection-mark', { 'is-linked-hover': hoverDetectionId === part.id }]" @mouseenter="setHoverDetection(part.id)" @mouseleave="clearHoverDetection">{{ part.active ? part.placeholder : part.text }}</span></template></pre>
            </article>
          </div>
          <div v-else-if="fileType === 'image'" class="canvas-wrap">
            <canvas ref="canvas" :width="imageWidth" :height="imageHeight" @mousedown="startCanvasDraw" 
              @mousemove="drawCanvas" @mouseup="endCanvasDraw" @mouseleave="cancelCanvasDraw"></canvas>
            <div class="canvas-legend">
              <span><i class="box"></i>{{ $t('desensitize.redactedRegions') }}</span>
              <span><i></i>{{ $t('desensitize.candidateRegions') }}</span>
              <span><i class="off"></i>{{ $t('desensitize.skippedRegions') }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="mapping-pre" v-if="false && mapping" :class="{ 'is-open': showMapping }">
      <div class="mapping-pre__head" @click="showMapping = !showMapping" role="button" tabindex="0" 
        :aria-expanded="showMapping" @keydown.enter.space="showMapping = !showMapping">
        <h3>{{ $t('desensitize.mappingJson') }}</h3>
        <svg class="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="mapping-pre__body" v-show="showMapping">
        <pre dir="ltr">{{ JSON.stringify(mapping, null, 2) }}</pre>
      </div>
    </div>

    <div class="download-bar" v-if="false && confirmed">
      <span class="download-bar__label">{{ $t('desensitize.completed') }}</span>
      <button class="btn btn--primary" @click="downloadRedactedFile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ $t('desensitize.downloadRedacted') }}
      </button>
      <button class="btn btn--secondary" @click="downloadMapping">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ $t('desensitize.downloadMapping') }}
      </button>
    </div>
    <div v-if="showCompletionModal" class="completion-modal" role="dialog" aria-modal="true" aria-labelledby="completion-title">
      <div class="completion-modal__backdrop" @click="showCompletionModal = false"></div>
      <section class="completion-modal__card">
        <p class="mono-label">{{ $t('desensitize.completed') }}</p>
        <h2 id="completion-title">{{ $t('desensitize.completionTitle') }}</h2>
        <p>{{ $t('desensitize.completionHint') }}</p>
        <div class="completion-modal__actions">
          <button class="btn btn--secondary" @click="showCompletionModal = false">{{ $t('desensitize.later') }}</button>
          <button class="btn btn--primary" @click="downloadFromCompletion">{{ $t('desensitize.downloadFile') }}</button>
        </div>
      </section>
    </div>
    <div v-if="aiResultModal" class="completion-modal" role="dialog" aria-modal="true" aria-labelledby="ai-result-title">
      <div class="completion-modal__backdrop" @click="aiResultModal = null"></div>
      <section class="completion-modal__card">
        <p class="mono-label">{{ $t('desensitize.aiCaption') }}</p>
        <h2 id="ai-result-title">{{ aiResultModal.success ? $t('desensitize.aiCompleted') : $t('desensitize.aiEnded') }}</h2>
        <p>{{ aiResultModal.message }}</p>
        <div v-if="aiResultModal.success" class="ai-result-summary">
          <span>{{ $t('desensitize.added') }} <strong>{{ formatNumber(aiResultModal.added) }}</strong></span>
          <span>{{ $t('desensitize.rejected') }} <strong>{{ formatNumber(aiResultModal.rejected) }}</strong></span>
          <span>{{ $t('desensitize.total') }} <strong>{{ formatNumber(aiResultModal.total) }}</strong></span>
        </div>
        <div class="completion-modal__actions">
          <button class="btn btn--primary" @click="aiResultModal = null">{{ $t('desensitize.ok') }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/build/pdf.worker.entry'
import JSZip from 'jszip'
import { t, getLocale } from '@/i18n'
import DesensitizationAPI from '@/api/desensitization'
import { detectWithRules, loadSensitiveRules } from '@/utils/sensitiveRules'
import { saveHistoryFile } from '@/utils/historyFiles'
import { isTauriRuntime, redactApprovedText, aiDetectCandidates } from '@/api/tauriBridge'
import { requestAppConfirm } from '@/utils/appConfirm'
import { saveSensitiveRules } from '@/utils/sensitiveRules'
import { capturePreviewPosition, restorePreviewPosition } from '@/utils/previewPosition'
import AiFeatureButton from '@/components/AiFeatureButton.vue'
import { AI_AVAILABILITY_EVENT, readAiAvailability } from '@/utils/aiAvailability'

// Worker is configured via the import above

const TYPE_NAMES = {
  phone: '手机号', idcard: '身份证', email: '邮箱', bankcard: '银行卡',
  amount: '金额', name: '姓名', ip_address: 'IP地址', ipv6_address: 'IPv6地址', mac_address: 'MAC地址',
  landline: '固定电话', license_plate: '车牌号', jdbc_connection: 'JDBC连接串', date: '日期', manual: '区域'
}

// UI-only lookup tables: stored labels and replacement markers remain unchanged.
const TYPE_LABEL_KEYS = {
  "phone": "type_phone",
  "idcard": "type_idcard",
  "email": "type_email",
  "bankcard": "type_bankcard",
  "amount": "type_amount",
  "name": "type_name",
  "chinese_name": "type_chinese_name",
  "landline": "type_landline",
  "ip_address": "type_ip_address",
  "license_plate": "type_license_plate",
  "passport": "type_passport",
  "unified_social_credit_code": "type_unified_social_credit_code",
  "ssn": "type_ssn",
  "credit_card": "type_credit_card",
  "address": "type_address",
  "date": "type_date",
  "ipv6_address": "type_ipv6_address",
  "mac_address": "type_mac_address",
  "gender": "type_gender",
  "ethnicity": "type_ethnicity",
  "province": "type_province",
  "hong_kong_macao_permit": "type_hong_kong_macao_permit",
  "jdbc_connection": "type_jdbc_connection",
  "vehicle_identification_number": "type_vehicle_identification_number",
  "organization_code": "type_organization_code",
  "business_license": "type_business_license",
  "manual": "type_manual",
  "sensitive": "type_sensitive",
  "custom": "type_custom",
  "ai": "type_ai",
  "dateOnly": "type_dateOnly",
  "id_card": "type_idcard",
  "bank_card": "type_bankcard"
}
const ORIGINAL_LABEL_KEYS = {
  "手机号": "type_phone",
  "身份证": "type_idcard",
  "邮箱": "type_email",
  "银行卡": "type_bankcard",
  "金额": "type_amount",
  "姓名": "type_name",
  "中文姓名": "type_chinese_name",
  "固定电话": "type_landline",
  "IP地址": "type_ip_address",
  "车牌号": "type_license_plate",
  "护照号": "type_passport",
  "统一社会信用代码": "type_unified_social_credit_code",
  "社会安全号": "type_ssn",
  "信用卡": "type_credit_card",
  "地址": "type_address",
  "日期时间": "type_date",
  "IPv6地址": "type_ipv6_address",
  "MAC地址": "type_mac_address",
  "性别": "type_gender",
  "民族": "type_ethnicity",
  "省份": "type_province",
  "港澳通行证": "type_hong_kong_macao_permit",
  "JDBC连接串": "type_jdbc_connection",
  "车辆识别代码": "type_vehicle_identification_number",
  "组织机构代码": "type_organization_code",
  "营业执照号码": "type_business_license",
  "区域": "type_manual",
  "敏感项": "type_sensitive",
  "敏感字段": "type_custom",
  "AI候选": "type_ai",
  "日期": "type_dateOnly"
}

export default {
  name: 'Desensitize',
  components: { AiFeatureButton },
  data() {
    return {
      step: 0,
      file: null,
      fileType: null,
      originalText: '',
      rawOriginalText: '',  // 存储真正的原始文本（未脱敏）
      detections: [],
      nextId: 1,
      isDragging: false,
      uploadCollapsed: false,
      hoverDetectionId: null,
      reviewDetectionId: null,
      previewCancelPending: false,
      pendingSelections: [],
      applyingSelections: false,
      selectionClickUntil: 0,
      restoringPreviewPosition: false,
      hoverLockUntil: 0,
      hoverLockTimer: null,
      aiDetecting: false,
      aiProgress: 0,
      aiResultModal: null,
      aiEnabled: localStorage.getItem('desens_ai_enabled') === 'true',
      activeModelPath: localStorage.getItem('desens_active_model_path') || '',
      syncingScroll: false,
      confirmed: false,
      mapping: null,
      currentHistoryId: null,
      showMapping: false,
      showCompletionModal: false,
      selectionPopup: null,
      redactedText: '',
      isLoadingBackend: false,
      backendError: null,
      formatWarning: null,
      convertedFromPdf: false,
      documentPreview: [],
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
    reviewItems() { return this.detections.filter(item => Number.isFinite(item.start)).slice().sort((a, b) => a.start - b.start || a.end - b.end) },
    reviewIndex() { return this.reviewItems.findIndex(item => item.id === this.reviewDetectionId) },
    uiDirection() {
      return getLocale() === 'ar' ? 'rtl' : 'ltr'
    },
    documentDirection() {
      return /\.(json|csv)$/i.test(this.file?.name || '') ? 'ltr' : 'auto'
    },
    previewTitle() {
      if (!this.file) return t('desensitize.preview')
      if (this.fileType === 'pdf') return t('desensitize.pdfPreview')
      if (this.fileType === 'docx') return t('desensitize.wordPreview')
      if (this.fileType === 'excel') return t('desensitize.excelPreview')
      return this.fileType === 'text' ? t('desensitize.textPreview') : t('desensitize.imagePreview')
    },
    textParts() {
      if ((this.fileType !== 'text' && this.fileType !== 'pdf' && this.fileType !== 'docx' && this.fileType !== 'excel') || !this.rawOriginalText) return []
      
      const parts = []
      let cursor = 0
      
      const sorted = [...this.detections].sort((a, b) => a.start - b.start)
      
      for (const det of sorted) {
        if (det.start > cursor) {
          parts.push({ type: 'normal', text: this.rawOriginalText.slice(cursor, det.start) })
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
      
      if (cursor < this.rawOriginalText.length) {
        parts.push({ type: 'normal', text: this.rawOriginalText.slice(cursor) })
      }
      
      return parts
    },
    liveRedactedText() {
      if (!this.rawOriginalText) return ''
      const active = [...this.detections].filter(d => d.active).sort((a, b) => b.start - a.start)
      let result = this.rawOriginalText
      active.forEach(d => { result = result.slice(0, d.start) + d.placeholder + result.slice(d.end) })
      return result
    },
    imageWidth() {
      return this.image.width || 800
    },
    imageHeight() {
      return this.image.height || 600
    },
    detectionsByType() {
      const counts = {}
      this.detections.forEach(d => {
        const type = d.type || 'manual'
        counts[type] = (counts[type] || 0) + 1
      })
      return counts
    }
  },
  watch: {
    detections: {
      deep: true,
      handler() {
        if (!this.rawOriginalText || this.restoringPreviewPosition) return
        const anchors = [this.$refs.originalScroll, this.$refs.redactedScroll].map(capturePreviewPosition)
        const list = this.$refs.detectionScroll
        const listTop = list?.scrollTop
        this.restoringPreviewPosition = true
        this.hoverLockUntil = Date.now() + 2000
        window.clearTimeout(this.hoverLockTimer)
        this.hoverLockTimer = window.setTimeout(() => { this.hoverLockUntil = 0 }, 2000)
        this.$nextTick(() => {
          anchors.forEach(restorePreviewPosition)
          if (list && listTop !== undefined) list.scrollTop = listTop
          this.restoringPreviewPosition = false
        })
      }
    }
  },
  methods: {
    onPreviewDetectionClick(event) {
      const target = event.target.closest?.('[data-detection-id]')
      if (!target || !this.$refs.previewBody?.contains(target)) return
      const item = this.detections.find(item => String(item.id) === target.dataset.detectionId)
      if (item) this.selectPreviewDetection(item)
    },
    selectPreviewDetection(item) {
      if (Date.now() > this.selectionClickUntil && !window.getSelection()?.toString()) this.lockHoverDetection(item.id)
    },
    async requestPreviewCancel(part) {
      if (!part) return
      if (this.previewCancelPending || window.getSelection()?.toString()) return
      const item = this.detections.find(item => item.id === part.id)
      if (!item) return
      this.previewCancelPending = true
      this.selectionPopup = null
      this.lockHoverDetection(item.id)
      const file = this.file
      try {
        const accepted = await requestAppConfirm({ title: t('review.cancelTitle'), message: t('review.cancelMessage', { value: item.value }), confirmText: t('desensitize.cancelRedaction'), cancelText: t('review.keep'), tone: 'warning' })
        if (accepted && this.file === file && this.detections.includes(item)) this.toggleDetection(item)
      } finally { this.previewCancelPending = false }
    },
    navigateReview(direction) {
      if (!this.reviewItems.length) return
      const index = this.reviewIndex < 0 ? (direction > 0 ? 0 : this.reviewItems.length - 1) : this.reviewIndex + direction
      const item = this.reviewItems[index]
      if (!item) return
      this.lockHoverDetection(item.id)
      this.$nextTick(() => {
        this.$el.querySelectorAll('[data-detection-id]').forEach(target => {
          if (target.dataset.detectionId !== String(item.id)) return
          const panel = target.closest('.comparison-pane__body, .panel__body')
          if (panel) panel.scrollTop += target.getBoundingClientRect().top - panel.getBoundingClientRect().top - panel.clientHeight / 2 + target.clientHeight / 2
          else target.scrollIntoView({ block: 'nearest', behavior: 'auto' })
        })
      })
    },
    setHoverDetection(id) {
      if (this.restoringPreviewPosition) return
      if (this.pendingSelections.length || window.getSelection()?.toString()) return
      if (this.hoverLockUntil > Date.now()) return
      this.hoverDetectionId = id
      this.$nextTick(() => {
        if (this.restoringPreviewPosition || this.hoverDetectionId !== id || this.hoverLockUntil > Date.now()) return
        const targets = this.$el.querySelectorAll(`[data-detection-id="${id}"]`)
        targets.forEach(target => { if (!this.isElementVisible(target)) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) })
        const card = this.$el.querySelector(`.detect-item[data-detection-id="${id}"]`)
        if (card && !this.isElementVisible(card)) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    },
    lockHoverDetection(id) {
      this.reviewDetectionId = id
      this.hoverDetectionId = id
      this.hoverLockUntil = Date.now() + 2000
      window.clearTimeout(this.hoverLockTimer)
      this.hoverLockTimer = window.setTimeout(() => {
        this.hoverLockUntil = 0
        this.hoverDetectionId = this.reviewDetectionId
      }, 2000)
    },
    clearHoverDetection() {
      if (Date.now() >= this.hoverLockUntil) this.hoverDetectionId = this.reviewDetectionId
    },
    isElementVisible(element) {
      const rect = element.getBoundingClientRect(); const parent = element.closest('.panel__body, .comparison-pane__body')
      if (!parent) return true
      const parentRect = parent.getBoundingClientRect()
      return rect.top >= parentRect.top && rect.bottom <= parentRect.bottom
    },
    syncScroll(source, event) {
      if (this.syncingScroll) return
      const origin = event.currentTarget; const max = origin.scrollHeight - origin.clientHeight
      const ratio = max > 0 ? origin.scrollTop / max : 0
      this.syncingScroll = true
      const targets = [this.$refs.detectionScroll, this.$refs.originalScroll, this.$refs.redactedScroll].filter(Boolean)
      targets.forEach(target => { if (target !== origin) target.scrollTop = ratio * (target.scrollHeight - target.clientHeight) })
      requestAnimationFrame(() => { this.syncingScroll = false })
    },
    async handleFileSelect(e) {
      if (e.target.files && e.target.files[0]) {
        const accepted = await this.confirmUpload(e.target.files[0])
        if (accepted) this.handleFile(e.target.files[0])
        else e.target.value = ''
      }
    },
    async handleDrop(e) {
      this.isDragging = false
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if (await this.confirmUpload(e.dataTransfer.files[0])) this.handleFile(e.dataTransfer.files[0])
      }
    },
    confirmUpload(file) {
      return requestAppConfirm({ title: t('desensitize.confirmUploadTitle'), message: t('desensitize.confirmUploadMessage', { name: file.name, size: this.formatSize(file.size) }), confirmText: t('desensitize.confirmUpload') })
    },
    async requestAiDetection() {
      this.syncAiAvailability()
      if (!this.aiEnabled || !this.activeModelPath) return
      const accepted = await requestAppConfirm({ title: t('desensitize.startAiTitle'), message: t('desensitize.startAiMessage', { name: this.file?.name || t('desensitize.currentDocument') }), confirmText: t('desensitize.startDetection') })
      if (accepted) await this.runAiDetection()
    },
    async requestConfirmRedaction() {
      const count = this.detections.filter(item => item.active).length
      const accepted = await requestAppConfirm({ title: t('desensitize.startRedactionTitle'), message: t('desensitize.startRedactionMessage', { count: this.formatNumber(count), name: this.file?.name || t('desensitize.currentFile') }), confirmText: t('desensitize.startRedaction') })
      if (accepted) await this.confirmRedaction()
    },
    async requestReset() {
      const accepted = await requestAppConfirm({ title: t('desensitize.restartTitle'), message: t('desensitize.restartMessage'), confirmText: t('desensitize.confirmRestart'), tone: 'warning' })
      if (accepted) this.reset()
    },
    handleFile(file) {
      this.reset()
      this.file = file
      this.fileType = this.inferFileType(file)
      this.uploadCollapsed = true
      this.step = 1
      this.isLoadingBackend = true
      this.backendError = null
      this.formatWarning = null
      
      // Tauri 版本优先使用本地前端解析，避免依赖未打包的 FastAPI 服务。
      // 浏览器/Electron 兼容链路继续使用原有后端检测。
      if (isTauriRuntime()) {
        this.isLoadingBackend = false
        this.fallbackToFrontend(file)
      } else {
        this.callBackendRedaction(file)
      }
    },
    async callBackendRedaction(file) {
      try {
        const rules = loadSensitiveRules()
        
        // 如果是 PDF 文件，使用支持转换的接口
        let result
        if (this.fileType === 'pdf') {
          result = await DesensitizationAPI.redactFileWithConversion(file, rules)
        } else {
          result = await DesensitizationAPI.redactFile(file, rules)
        }
        
        // 后端处理成功，使用后端结果
        this.rawOriginalText = result.original_text  // 存储真正的原始文本
        this.originalText = result.redacted_text
        this.documentPreview = result.document_preview || []
        this.detections = result.mappings.map((m, i) => ({
          id: this.nextId++,
          type: m.type,
          label: rules.find(rule => rule.id === m.type && !rule.builtIn)?.name || m.type,
          preserveLabel: rules.some(rule => rule.id === m.type && !rule.builtIn),
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
        const reason = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
        console.warn('后端 API 调用失败，使用前端处理：', reason)
        this.backendError = reason
        this.isLoadingBackend = false
        
        // 降级到前端处理
        this.fallbackToFrontend(file)
      }
    },
    fallbackToFrontend(file) {
      if (this.fileType === 'pdf') {
        this.handlePdfFile(file)
      } else if (this.fileType === 'docx') {
        // 保留已加入的文件，不能因后端不可用而 reset；结构化解析交由兼容后端或适配器。
        this.readDocxText(file)
      } else if (this.fileType === 'excel') {
        this.readExcelText(file)
      } else if (this.fileType === 'text') {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.rawOriginalText = e.target.result
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
    async readDocxText(file) {
      try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer())
        const entry = zip.file('word/document.xml')
        if (!entry) throw new Error(t('desensitize.docxMissing'))
        const xml = await entry.async('text')
        const doc = new DOMParser().parseFromString(xml, 'application/xml')
        if (doc.querySelector('parsererror')) throw new Error(t('desensitize.docxXml'))
        const paragraphs = [...doc.querySelectorAll('w\\:p, p')].map(node => [...node.querySelectorAll('w\\:t, t')].map(text => text.textContent || '').join('')).filter(Boolean)
        const extracted = paragraphs.join('\n').trim()
        if (!extracted) throw new Error(t('desensitize.docxEmpty'))
        this.rawOriginalText = extracted
        this.originalText = extracted
        this.formatWarning = t('desensitize.wordWarning')
        this.runTextDetection()
        this.step = 2
      } catch (error) {
        this.formatWarning = t('desensitize.wordReadFailed', { error: error.message || t('desensitize.unknownError') })
        this.rawOriginalText = this.file.name
        this.originalText = this.rawOriginalText
        this.step = 2
      }
    },
    async readExcelText(file) {
      try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer())
        const entries = Object.keys(zip.files).filter(name => /^(xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/.test(name))
        if (!entries.length) throw new Error(t('desensitize.xlsxMissing'))
        const values = []
        for (const name of entries) {
          const xml = await zip.file(name).async('text')
          const doc = new DOMParser().parseFromString(xml, 'application/xml')
          if (doc.querySelector('parsererror')) continue
          const textNodes = [
            ...doc.getElementsByTagNameNS('*', 't'),
            ...[...doc.getElementsByTagNameNS('*', 'v')].filter(node => node.parentElement?.getAttribute('t') === 'str')
          ]
          textNodes.forEach(node => { const value = (node.textContent || '').trim(); if (value) values.push(value) })
        }
        const extracted = values.join('\n').trim()
        if (!extracted) throw new Error(t('desensitize.xlsxEmpty'))
        this.rawOriginalText = extracted; this.originalText = extracted
        this.formatWarning = t('desensitize.excelWarning')
        this.runTextDetection(); this.step = 2
      } catch (error) {
        this.formatWarning = t('desensitize.excelReadFailed', { error: error.message || t('desensitize.unknownError') })
        this.rawOriginalText = ''; this.originalText = ''; this.step = 2
      }
    },
    getTypeLabel(type) {
      const key = Object.hasOwn(TYPE_LABEL_KEYS, type) ? TYPE_LABEL_KEYS[type] : null
      return t('desensitize.' + (key || 'type_sensitive'))
    },
    getGroupLabel(type) {
      const detection = this.detections.find(item => (item.type || 'manual') === type)
      return detection?.preserveLabel ? detection.label : this.getTypeLabel(type)
    },
    getDetectionLabel(item) {
      const detection = this.detections.find(entry => entry.id === item.id) || item
      // Provenance is captured when detecting, never inferred by reading storage during render.
      if (detection.preserveLabel) return detection.label
      const typeKey = Object.hasOwn(TYPE_LABEL_KEYS, detection.type) ? TYPE_LABEL_KEYS[detection.type] : null
      const originalKey = Object.hasOwn(ORIGINAL_LABEL_KEYS, detection.label) ? ORIGINAL_LABEL_KEYS[detection.label] : null
      const key = typeKey && (detection.label === detection.type || originalKey === typeKey) ? typeKey : null
      return key ? t('desensitize.' + key) : (detection.label || this.getTypeLabel(detection.type || 'manual'))
    },
    partsForRange(start, end) {
      const parts = []
      let cursor = start
      const detections = [...this.detections]
        .filter(det => det.start < end && det.end > start)
        .sort((a, b) => a.start - b.start)

      detections.forEach(det => {
        const detectionStart = Math.max(det.start, start)
        const detectionEnd = Math.min(det.end, end)
        if (detectionStart > cursor) {
          parts.push({ type: 'normal', start: cursor, end: detectionStart, text: this.rawOriginalText.slice(cursor, detectionStart) })
        }
        parts.push({
          type: 'detection',
          start: detectionStart,
          end: detectionEnd,
          text: this.rawOriginalText.slice(detectionStart, detectionEnd),
          placeholder: det.placeholder,
          active: det.active,
          label: det.label,
          id: det.id
        })
        cursor = detectionEnd
      })
      if (cursor < end) parts.push({ type: 'normal', start: cursor, end, text: this.rawOriginalText.slice(cursor, end) })
      return parts
    },
    previewBlockStyle(block) {
      const format = block.format || {}
      const style = {}
      if (format.font_size) style.fontSize = `${Math.min(format.font_size, 28)}pt`
      if (format.bold) style.fontWeight = 700
      if (format.alignment) style.textAlign = format.alignment
      return style
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
        
        this.rawOriginalText = fullText.trim()
        this.originalText = fullText.trim()
        this.runTextDetection()
        this.step = 2
      } catch (error) {
        console.error('PDF parsing error:', error)
        this.formatWarning = t('desensitize.pdfWarning')
        this.backendError = error?.message || t('desensitize.pdfFailed')
        this.step = 2
        window.dispatchEvent(new CustomEvent('desens:status', { detail: { message: this.formatWarning } }))
      }
    },
    runTextDetection() {
      const text = this.originalText
      const raw = []
      
      const rules = loadSensitiveRules()
      raw.push(...detectWithRules(text, rules).map(item => ({
        ...item,
        preserveLabel: !rules.find(rule => rule.id === item.type)?.builtIn
      })))
      
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
        source: r.source,
        preserveLabel: r.preserveLabel,
        value: r.value,
        start: r.start,
        end: r.end,
        placeholder: isTauriRuntime() ? `{${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}}` : '掩码-' + (TYPE_NAMES[r.type] || '敏感项') + '-' + String(i + 1).padStart(3, '0'),
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
        
        this.image.rects = []
        this.step = 2
        
        this.$nextTick(() => {
          this.drawImageCanvas()
        })
      }
      img.src = dataUrl
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
      const selection = window.getSelection()
      const body = this.$refs.redactedScroll || this.$refs.previewBody?.querySelector('.document-preview')
      if (!body || !selection || !selection.rangeCount || selection.isCollapsed) return
      const range = selection.getRangeAt(0)
      if (!body.contains(range.startContainer) || !body.contains(range.endContainer)) return
      const boundary = (node, nodeOffset, endBoundary) => {
        const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
        const block = body === this.$refs.redactedScroll ? body : element?.closest('[data-source-start]')
        if (!block || !body.contains(block)) return null
        const sourceStart = Number(block.dataset.sourceStart || 0)
        const sourceEnd = block.dataset.sourceEnd === undefined ? this.rawOriginalText.length : Number(block.dataset.sourceEnd)
        const prefix = document.createRange()
        prefix.selectNodeContents(block); prefix.setEnd(node, nodeOffset)
        const offset = prefix.toString().length
        let displayed = 0, original = sourceStart
        for (const part of this.partsForRange(sourceStart, sourceEnd)) {
          const masked = part.type !== 'normal' && part.active
          const shown = masked ? part.placeholder : part.text
          const limit = displayed + shown.length
          if (offset < limit || (endBoundary && offset === limit)) {
            return masked ? original + (endBoundary ? part.text.length : 0) : original + offset - displayed
          }
          displayed = limit; original += part.text.length
        }
        return original
      }
      const start = boundary(range.startContainer, range.startOffset, false)
      const end = boundary(range.endContainer, range.endOffset, true)
      if (start === null || end === null) return
      if (end <= start || !this.rawOriginalText.slice(start, end).trim()) return
      const ranges = [...this.pendingSelections, { start, end }].sort((a,b) => a.start - b.start)
      const merged = []
      for (const item of ranges) {
        const previous = merged[merged.length - 1]
        if (previous && item.start < previous.end) previous.end = Math.max(previous.end, item.end)
        else merged.push({ ...item })
      }
      this.pendingSelections = merged
      this.selectionClickUntil = Date.now() + 350
      selection.removeAllRanges()
    },
    clearPendingSelections() { this.pendingSelections = []; window.getSelection()?.removeAllRanges() },
    async applyPendingSelections(action) {
      this.handleTextSelect()
      if (!this.pendingSelections.length || this.applyingSelections) return
      const file = this.file
      const selected = this.pendingSelections.map(item => ({ ...item }))
      this.applyingSelections = true
      try {
        const accepted = await requestAppConfirm({ title: t(action === 'rule' ? 'selection.addFields' : 'desensitize.redact'), message: t('selection.confirm', { count: selected.length }), confirmText: t('shared.confirmContinue') })
        if (!accepted || this.file !== file) return
        if (action === 'rule') {
          const rules = loadSensitiveRules()
          for (const item of selected) {
            const value = this.rawOriginalText.slice(item.start, item.end)
            if (!rules.some(rule => rule.kind === 'keyword' && rule.value === value)) rules.push({ id: 'custom_' + crypto.randomUUID().replace(/-/g, ''), name: value.slice(0, 24), value, kind: 'keyword', enabled: true, builtIn: false })
          }
          saveSensitiveRules(rules)
        }
        let next = [...this.detections]
        for (const item of selected) {
          next = next.filter(d => !(d.start < item.end && d.end > item.start))
          next.push({ id: this.nextId++, type: 'manual', label: '区域', value: this.rawOriginalText.slice(item.start, item.end), start: item.start, end: item.end, placeholder: '{' + crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase() + '}', active: true, manual: true })
        }
        this.detections = next.sort((a,b) => a.start - b.start)
        this.confirmed = false; this.mapping = null; this.showCompletionModal = false
        this.reviewDetectionId = null; this.hoverDetectionId = null
        this.clearPendingSelections()
      } catch (error) {
        window.dispatchEvent(new CustomEvent('desens:status', { detail: { message: t('selection.failed') } }))
      } finally { this.applyingSelections = false }
    },
    async runAiDetection() {
      if (!this.activeModelPath || !this.aiEnabled || !isTauriRuntime() || !this.rawOriginalText || this.aiDetecting) {
        this.backendError = !this.activeModelPath ? t('desensitize.modelRequired') : t('desensitize.aiUnavailable')
        this.aiResultModal = { success: false, message: this.backendError }
        return
      }
      this.aiDetecting = true
      this.aiProgress = 8
      const beforeCount = this.detections.length
      const timer = window.setInterval(() => { this.aiProgress = Math.min(88, this.aiProgress + 7) }, 700)
      try {
        const rules = loadSensitiveRules().filter(rule => rule.enabled).map(rule => `${rule.name}: ${rule.value}`).join('\n').slice(0, 6000)
        const response = await aiDetectCandidates({ schema_version: 1, model_path: this.activeModelPath, rules_summary: rules, selected_text: this.rawOriginalText.slice(0, 1400) })
        const rawOutput = response.data || ''
        const cleanedOutput = rawOutput.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
        let parsed = null
        const candidates = [cleanedOutput]
        const objectStart = cleanedOutput.indexOf('{')
        const objectEnd = cleanedOutput.lastIndexOf('}')
        if (objectStart >= 0 && objectEnd >= objectStart) candidates.push(cleanedOutput.slice(objectStart, objectEnd + 1))
        const arrayStart = cleanedOutput.indexOf('[')
        const arrayEnd = cleanedOutput.lastIndexOf(']')
        if (arrayStart >= 0 && arrayEnd >= arrayStart) candidates.push(`{"items":${cleanedOutput.slice(arrayStart, arrayEnd + 1)}}`)
        for (const candidate of candidates) { try { const value = JSON.parse(candidate); if (Array.isArray(value)) parsed = { items: value }; else if (value && Array.isArray(value.items)) parsed = value; if (parsed) break } catch (_) {} }
        if (!parsed) throw new Error(t('desensitize.invalidAiJson'))
      const items = Array.isArray(parsed.items) ? parsed.items : []
      let acceptedCount = 0
      let rejectedCount = 0
      items.forEach(item => {
        if (!item.text || !Number.isFinite(item.start) || !Number.isFinite(item.end) || item.end <= item.start) {
          rejectedCount++
          return
        }
        const start = item.start; const end = item.end
        if (start < 0 || end > this.rawOriginalText.length || this.detections.some(d => d.start === start && d.end === end)) {
          rejectedCount++
          return
        }
        this.detections.push({ id: this.nextId++, type: item.type || 'ai', label: item.type || 'AI候选', value: this.rawOriginalText.slice(start, end), start, end, placeholder: '{AI_' + String(this.nextId).padStart(3, '0') + '}', active: true, manual: false, source: 'ai', confidence: item.confidence })
        acceptedCount++
      })
      this.detections.sort((a, b) => a.start - b.start)
      this.aiProgress = 100
      this.backendError = acceptedCount ? t('desensitize.aiGenerated', { count: this.formatNumber(acceptedCount) }) : t('desensitize.aiNoNew')
      this.aiResultModal = { success: true, message: t('desensitize.aiReview'), added: this.detections.length - beforeCount, rejected: rejectedCount, total: this.detections.length }
    } catch (error) {
      this.backendError = error.message || t('desensitize.aiFailed')
      // 小模型偶尔会输出非 JSON 文本；保留 AI 失败事实，同时用同一套本地规则生成可审核候选，避免按钮无实际作用。
      const fallbackBefore = this.detections.length
      const fallbackRules = loadSensitiveRules().filter(rule => rule.enabled)
      const fallback = detectWithRules(this.rawOriginalText, fallbackRules).map(item => ({
        ...item,
        preserveLabel: !fallbackRules.find(rule => rule.id === item.type)?.builtIn
      }))
      fallback.forEach(item => {
        if (!this.detections.some(d => d.start === item.start && d.end === item.end)) this.detections.push({ ...item, id: this.nextId++, source: 'rule-fallback', manual: false, active: true, placeholder: '{AI_' + String(this.nextId).padStart(3, '0') + '}' })
      })
      this.detections.sort((a, b) => a.start - b.start)
      if (this.detections.length > fallbackBefore) {
        this.backendError = t('desensitize.aiFallback')
        this.aiResultModal = { success: true, message: this.backendError, added: this.detections.length - beforeCount, rejected: 0, total: this.detections.length }
      } else {
        this.aiResultModal = { success: false, message: this.backendError }
      }
    }
    finally { window.clearInterval(timer); this.aiProgress = 100; window.setTimeout(() => { this.aiDetecting = false; this.aiProgress = 0 }, 650) }
    },
    toggleDetection(item) {
      if (this.confirmed) { this.confirmed = false; this.mapping = null; this.showCompletionModal = false }
      const previousIndex = this.reviewIndex
      const wasReviewing = this.reviewDetectionId === item.id
      if (this.hoverDetectionId === item.id) {
        window.clearTimeout(this.hoverLockTimer)
        this.hoverLockUntil = 0
        this.hoverDetectionId = null
      }
      // 从检测列表中移除该项
      this.detections = this.detections.filter(d => d.id !== item.id)
      if (wasReviewing) {
        this.reviewDetectionId = null
        if (this.reviewItems.length) {
          const next = this.reviewItems[Math.min(previousIndex, this.reviewItems.length - 1)]
          this.lockHoverDetection(next.id)
        }
      }
      
      // 如果是图片类型，重新绘制画布
      if (this.fileType === 'image') {
        this.drawImageCanvas()
      }
    },
    async confirmRedaction() {
      if (isTauriRuntime() && (this.fileType === 'text' || this.fileType === 'pdf' || this.fileType === 'docx' || this.fileType === 'excel')) {
        try {
          const toByteOffset = (value) => new TextEncoder().encode(this.rawOriginalText.slice(0, value)).length
          const response = await redactApprovedText({
            schema_version: 1,
            text: this.rawOriginalText,
            spans: this.detections.filter(d => d.active).map(d => ({ start: toByteOffset(d.start), end: toByteOffset(d.end), kind: d.type || 'manual' }))
          })
          const result = response.data
          this.redactedText = result.redacted_text
          this.mapping = {
            version: '1.0',
            created_at: new Date().toISOString(),
            document_id: result.document_id,
            file_name: this.file.name,
            file_type: this.fileType,
            mappings: result.mappings.map((item, index) => ({
              id: item.mapping_id,
              placeholder: item.marker,
              type: item.kind,
              original: item.original,
              start: item.start,
              end: item.end,
              index
            }))
          }
          this.confirmed = true
          this.step = 4
          this.currentHistoryId = this.storeMapping()
          await this.persistHistoryRedactedFile(this.currentHistoryId)
          this.showCompletionModal = true
          return
        } catch (error) {
          this.backendError = error?.message || t('desensitize.rustFailed')
        }
      }
      if (this.fileType === 'text' || this.fileType === 'pdf' || this.fileType === 'docx' || this.fileType === 'excel') {
        this.buildTextMapping()
      } else {
        this.buildImageMapping()
      }
      this.confirmed = true
      this.step = 4
      this.currentHistoryId = this.storeMapping()
      await this.persistHistoryRedactedFile(this.currentHistoryId)
      this.showCompletionModal = true
    },
    buildTextMapping() {
      const mappings = []
      const activeDetections = [...this.detections].filter(d => d.active).sort((a, b) => b.start - a.start)
      
      // 使用原始文本（未脱敏）作为基础
      let redacted = this.rawOriginalText
      
      activeDetections.forEach(d => {
        mappings.push({ id: d.id, placeholder: d.placeholder, type: d.type, original: d.value, start: d.start, end: d.end })
        redacted = redacted.slice(0, d.start) + d.placeholder + redacted.slice(d.end)
      })
      
      this.mapping = {
        version: '1.0',
        created_at: new Date().toISOString(),
        file_name: this.file.name,
        file_type: this.fileType,
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
        created_at: new Date().toISOString(),
        file_name: this.file.name,
        file_type: 'image',
        mappings
      }
    },
    storeMapping() {
      try {
        const key = 'desens_history'
        const list = JSON.parse(localStorage.getItem(key) || '[]')
        const id = 'history_' + Date.now().toString(36) + '_' + crypto.randomUUID().slice(0, 8)
        list.push({
          id,
          file_name: this.file.name,
          file_type: this.fileType,
          created_at: this.mapping.created_at,
          mapping: this.mapping,
          redacted_text: this.redactedText,
          redacted_image: this.fileType === 'image' ? this.$refs.canvas?.toDataURL('image/png') : null
        })
        localStorage.setItem(key, JSON.stringify(list.slice(-20)))
        return id
      } catch (e) { console.warn('保存脱敏历史失败：本机存储空间不足。', e); return null }
    },
    async persistHistoryRedactedFile(historyId) {
      if (!historyId) return
      try {
        let blob, filename
        if (this.fileType === 'docx') {
          blob = await this.buildLocalDocxBlob(); filename = `redacted_${this.file.name}`
        } else if (this.fileType === 'excel') {
          blob = await this.buildLocalXlsxBlob(); filename = `redacted_${this.file.name.replace(/\.xls$/i, '.xlsx')}`
        } else if (this.fileType === 'text') {
          const extension = (this.file.name.split('.').pop() || 'txt').toLowerCase()
          const mime = extension === 'json' ? 'application/json' : extension === 'csv' ? 'text/csv' : extension === 'md' || extension === 'markdown' ? 'text/markdown' : 'text/plain'
          blob = new Blob([this.redactedText], { type: `${mime};charset=utf-8` }); filename = `redacted_${this.file.name}`
        } else if (this.fileType === 'image') {
          blob = this.dataURLToBlob(this.$refs.canvas.toDataURL('image/png')); filename = `redacted_${this.file.name.replace(/\.[^.]+$/, '')}.png`
        } else return
        await saveHistoryFile({ id: historyId, blob, filename, mime: blob.type, size: blob.size, created_at: new Date().toISOString() })
        const key = 'desens_history'; const list = JSON.parse(localStorage.getItem(key) || '[]')
        const item = list.find(entry => entry.id === historyId)
        if (item) { item.redacted_file_key = historyId; item.redacted_file_name = filename; item.redacted_file_size = blob.size; localStorage.setItem(key, JSON.stringify(list)) }
      } catch (error) {
        window.dispatchEvent(new CustomEvent('desens:status', { detail: { message: t('desensitize.historyFailed', { error: error.message || t('desensitize.unknownError') }) } }))
      }
    },
    goToRestore() {
      this.showCompletionModal = false
      this.$router.push({ name: 'Restore' })
    },
    async downloadFromCompletion() {
      const completed = await this.downloadRedactedFile()
      if (completed) this.showCompletionModal = false
    },
    async downloadRedactedFile() {
      if (!this.confirmed) return
      
      let blob, filename
      if (this.fileType === 'pdf' || this.fileType === 'docx' || this.fileType === 'excel') {
        try {
          // Tauri 包内不依赖未打包的 FastAPI：DOCX 直接改写原始 ZIP 文档包。
          if (this.fileType === 'docx') {
            blob = await this.buildLocalDocxBlob()
            filename = `redacted_${this.file.name}`
          } else if (this.fileType === 'excel') {
            blob = await this.buildLocalXlsxBlob()
            filename = `redacted_${this.file.name.replace(/\.xls$/i, '.xlsx')}`
          } else {
            const result = await DesensitizationAPI.redactPreservingFormat(this.file, this.mapping)
            blob = result.blob
            const matched = result.filename?.match(/filename=\"?([^\";]+)\"?/i)
            filename = matched?.[1] || `redacted_${this.file.name.replace(/\.(pdf|docx|xlsx|xls)$/i, this.fileType === 'excel' ? '.xlsx' : '.docx')}`
          }
          if (!(blob instanceof Blob) || blob.size < 1024) throw new Error(t('desensitize.invalidOutput'))
        } catch (error) {
          const stage = this.fileType === 'docx' ? t('desensitize.docxGenerationFailed') : this.fileType === 'excel' ? t('desensitize.xlsxGenerationFailed') : t('desensitize.formatOutputFailed')
          window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('desensitize.stageError', { stage, error: error.message || t('desensitize.unknownError') }), filename: this.file?.name } }))
          return false
        }
      } else if (this.fileType === 'text') {
        const extension = (this.file.name.split('.').pop() || 'txt').toLowerCase()
        const mime = extension === 'json' ? 'application/json' : extension === 'csv' ? 'text/csv' : extension === 'md' || extension === 'markdown' ? 'text/markdown' : 'text/plain'
        blob = new Blob([this.redactedText], { type: `${mime};charset=utf-8` })
        filename = 'redacted_' + this.file.name
      } else {
        const canvas = this.$refs.canvas
        const dataUrl = canvas.toDataURL('image/png')
        blob = this.dataURLToBlob(dataUrl)
        filename = 'redacted_' + this.file.name.replace(/\.[^.]+$/, '') + '.png'
      }
      
      if (this.fileType === 'text') {
        this.triggerDownload(blob, filename, false)
        const companionName = `${filename}.desens-meta`
        const companion = new Blob([JSON.stringify({
          schema_version: 1,
          marker_type: 'companion',
          file_name: filename,
          source_file: this.file.name,
          document_id: this.mapping?.document_id || null,
          mapping_count: this.mapping?.mappings?.length || 0,
          created_at: this.mapping?.created_at || new Date().toISOString()
        }, null, 2)], { type: 'application/json' })
        this.triggerDownload(companion, companionName, false)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: true, message: t('desensitize.downloadCompanionSuccess'), filename: `${filename} + ${companionName}`, size: blob.size + companion.size } }))
      } else this.triggerDownload(blob, filename)
      return true
    },
    async buildLocalDocxBlob() {
      const zip = await JSZip.loadAsync(await this.file.arrayBuffer())
      const documentEntries = Object.keys(zip.files).filter(name => /^word\/(document|header\d+|footer\d+)\.xml$/.test(name))
      if (!documentEntries.length) throw new Error(t('desensitize.docxNotWritable'))
      const replacements = [...(this.mapping?.mappings || [])].filter(item => item.placeholder && item.original).map(item => ({ value: item.original, placeholder: item.placeholder })).sort((a, b) => b.value.length - a.value.length)
      let changed = 0
      for (const name of documentEntries) {
        let xml = await zip.file(name).async('text')
        const before = xml
        for (const item of replacements) {
          const escaped = item.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const expression = new RegExp(escaped, 'g')
          xml = xml.replace(expression, item.placeholder)
        }
        if (xml !== before) { zip.file(name, xml); changed += 1 }
      }
      if (!changed) throw new Error(t('desensitize.docxNotChanged'))
      const marker = `\n脱敏文档 ID：${this.mapping?.document_id || 'local'}\n映射项数量：${this.mapping?.mappings?.length || 0}\n`
      const settings = zip.file('word/document.xml')
      if (settings) {
        let xml = await settings.async('text')
        xml = xml.replace('</w:body>', `<w:p><w:r><w:t>${marker}</w:t></w:r></w:p></w:body>`)
        zip.file('word/document.xml', xml)
      }
      return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    },
    async buildLocalXlsxBlob() {
      const zip = await JSZip.loadAsync(await this.file.arrayBuffer())
      const entries = Object.keys(zip.files).filter(name => /^(xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/.test(name))
      if (!entries.length) throw new Error(t('desensitize.xlsxNotWritable'))
      const replacements = [...(this.mapping?.mappings || [])].filter(item => item.placeholder && item.original).map(item => ({ value: item.original, placeholder: item.placeholder })).sort((a, b) => b.value.length - a.value.length)
      let changed = 0
      for (const name of entries) {
        let xml = await zip.file(name).async('text'); const before = xml
        for (const item of replacements) xml = xml.split(item.value).join(item.placeholder)
        if (xml !== before) { zip.file(name, xml); changed += 1 }
      }
      if (!changed) throw new Error(t('desensitize.xlsxNotChanged'))
      return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    },
    downloadMapping() {
      if (!this.mapping) return
      const blob = new Blob([JSON.stringify(this.mapping, null, 2)], { type: 'application/json' })
      this.triggerDownload(blob, 'mapping_' + this.file.name.replace(/\.[^.]+$/, '') + '.json')
    },
    async downloadConvertedWord() {
      if (!this.file || !this.convertedFromPdf) return
      
      try {
        const blob = await DesensitizationAPI.convertPdfToWord(this.file)
        const filename = this.file.name.replace(/\.pdf$/i, '.docx')
        this.triggerDownload(blob, filename)
      } catch (error) {
        console.error('下载 Word 文档失败：', error)
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: error.message, filename: this.file?.name } }))
      }
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
    triggerDownload(blob, filename, notify = true) {
      if (!(blob instanceof Blob) || blob.size === 0) {
        window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: false, message: t('desensitize.emptyDownloadMessage'), filename } }))
        throw new Error(t('desensitize.emptyDownload'))
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      if (notify) window.dispatchEvent(new CustomEvent('desens:download-result', { detail: { success: true, message: t('desensitize.downloadSuccess'), filename, size: blob.size } }))
      setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 30_000)
    },
    formatNumber(value) {
      return new Intl.NumberFormat(getLocale()).format(value)
    },
    formatSize(bytes) {
      const unit = bytes < 1024 ? 'byte' : bytes < 1024 * 1024 ? 'kilobyte' : 'megabyte'
      const value = unit === 'byte' ? bytes : unit === 'kilobyte' ? bytes / 1024 : bytes / (1024 * 1024)
      return new Intl.NumberFormat(getLocale(), { style: 'unit', unit, unitDisplay: 'short', minimumFractionDigits: unit === 'byte' ? 0 : 1, maximumFractionDigits: unit === 'byte' ? 0 : 1 }).format(value)
    },
    reset() {
      this.pendingSelections = []
      this.selectionClickUntil = 0
      this.reviewDetectionId = null
      this.hoverDetectionId = null
      this.hoverLockUntil = 0
      window.clearTimeout(this.hoverLockTimer)
      this.file = null
      this.fileType = null
      this.originalText = ''
      this.rawOriginalText = ''
      this.detections = []
      this.nextId = 1
      this.confirmed = false
      this.mapping = null
      this.currentHistoryId = null
      this.showMapping = false
      this.showCompletionModal = false
      this.redactedText = ''
      this.formatWarning = null
      this.backendError = null
      this.convertedFromPdf = false
      this.documentPreview = []
      this.image = { img: null, canvas: null, ctx: null, width: 0, height: 0, rects: [] }
      this.canvasDraw = { start: null, current: null }
      this.step = 0
      this.uploadCollapsed = false
      
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },
    syncAiAvailability() {
      const availability = readAiAvailability({ requireDesktop: false })
      this.aiEnabled = availability.enabled
      this.activeModelPath = availability.modelPath
    }
  },
  mounted() {
    this.selectionListener = () => this.handleTextSelect()
    this.selectionDismissListener = (event) => {
      if (this.selectionPopup && !event.target.closest?.('.selection-popup')) {
        this.selectionPopup = null
        window.getSelection()?.removeAllRanges()
      }
    }
    document.addEventListener('mouseup', this.selectionListener)
    document.addEventListener('mousedown', this.selectionDismissListener)
    this.aiAvailabilityListener = () => this.syncAiAvailability()
    window.addEventListener(AI_AVAILABILITY_EVENT, this.aiAvailabilityListener)
    window.addEventListener('storage', this.aiAvailabilityListener)
    this.syncAiAvailability()
  },
  beforeUnmount() {
    document.removeEventListener('mouseup', this.selectionListener)
    document.removeEventListener('mousedown', this.selectionDismissListener)
    window.removeEventListener(AI_AVAILABILITY_EVENT, this.aiAvailabilityListener)
    window.removeEventListener('storage', this.aiAvailabilityListener)
    window.clearTimeout(this.hoverLockTimer)
  }
}
</script>

<style scoped>
.comparison-pane__body, .panel__body { overflow-anchor: none; scroll-behavior: auto; }
.review-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
.pending-selections { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; max-height: 88px; overflow: auto; padding: 4px 24px 10px; flex-shrink: 0; font-size: 12px; }
.pending-chip { border: 1px solid #eab308; border-radius: 6px; background: #fef9c3; padding: 5px 9px; cursor: pointer; max-width: 230px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.review-navigation { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 24px; flex-shrink: 0; }
.review-navigation span { font-size: 12px; color: #64748b; }
.workflow { text-align: start; }
.steps, .completion-modal__actions, .detect-item__header { flex-wrap: wrap; }
.comparison-pane__head { gap: 8px; }
.comparison-pane__head small { text-align: end; }
.comparison-pane__body, .document-preview, .detect-item__original-text { text-align: start; }
.comparison-pane__body[dir="auto"], .document-preview { unicode-bidi: plaintext; }
.detect-item__original-text, .file-meta__name { unicode-bidi: isolate; }
.workflow[dir="rtl"] .ai-progress span { margin-inline-start: 0; margin-inline-end: auto; }

.panel-toggle { border: 0; background: transparent; color: #64748b; font-size: 12px; cursor: pointer; }
.upload-panel--collapsed .panel__head { padding-bottom: 12px; }
.is-linked-hover { background: #fef08a !important; color: #111827 !important; border-radius: 3px; box-shadow: 0 0 0 2px #facc15; transition: background .12s ease, box-shadow .12s ease; }
.detection-mark {
  padding-bottom: 4px;
  text-decoration-line: underline;
  text-decoration-style: wavy;
  text-decoration-color: #dc2626;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 2px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='3' viewBox='0 0 12 3'%3E%3Cpath d='M0 1.2Q1.5-.1 3 1.2T6 1.2T9 1.2T12 1.2M0 2.7Q1.5 1.4 3 2.7T6 2.7T9 2.7T12 2.7' fill='none' stroke='%23dc2626' stroke-width='.65'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 12px 3px;
  background-position: left calc(100% + 2px);
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.panel__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-count {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.badge--sm {
  font-size: 11px;
  padding: 2px 6px;
}

.panel__footer {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.detect-item {
  position: relative;
  overflow: hidden;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.detect-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.detect-item__main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detect-item__info {
  flex: 1;
  min-width: 0;
}

.detect-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.detect-item__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detect-item__sub {
  font-size: 11px;
  color: #64748b;
}

.detect-item__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.detect-item__delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

.detect-item__delete svg {
  width: 16px;
  height: 16px;
}

.detect-item__original {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, margin-top 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
  background: #ffffff;
  border-radius: 6px;
  margin-top: 0;
  padding: 0 12px;
  opacity: 0;
  border: 1px solid transparent;
}

.detect-item:hover .detect-item__original {
  max-height: 80px;
  margin-top: 10px;
  padding: 10px 12px;
  opacity: 1;
  border-color: #e2e8f0;
}

.detect-item__original-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}

.detect-item__original-text {
  font-size: 12px;
  color: #1e293b;
  word-break: break-all;
  line-height: 1.5;
}

.comparison-preview { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; height: 100%; min-height: 520px; }
.comparison-pane { display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
.comparison-pane--redacted { border-color: #cbd5e1; }
.comparison-pane__head { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 650; color: #0f172a; }
.comparison-pane--redacted .comparison-pane__head { background: #f8fafc; }
.comparison-pane__head small { font-size: 11px; font-weight: 500; color: #64748b; }
.comparison-pane__body { flex: 1; margin: 0; padding: 20px; overflow: auto; white-space: pre-wrap; word-break: break-word; font: 14px/1.9 ui-monospace, SFMono-Regular, Menlo, monospace; color: #334155; }
.comparison-pane--redacted .comparison-pane__body { cursor: text; user-select: text; color: #0f172a; }
.ai-action { padding: 10px 16px 12px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.ai-action small { display: block; margin-top: 6px; color: #64748b; font-size: 11px; }
.ai-progress { height: 6px; margin-top: 8px; border-radius: 999px; overflow: hidden; background: #e2e8f0; }
.ai-progress span { display: block; height: 100%; background: #111827; transition: width .35s ease; }
.ai-result-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.ai-result-summary span { padding: 10px; border-radius: 8px; background: #f8fafc; color: #64748b; font-size: 12px; text-align: center; }
.ai-result-summary strong { display: block; margin-top: 4px; color: #111827; font-size: 20px; }
@media (max-width: 540px) { .ai-result-summary { grid-template-columns: 1fr; } }
@media (max-width: 1100px) { .comparison-preview { grid-template-columns: 1fr; min-height: auto; } .comparison-pane { min-height: 360px; } }
</style>
