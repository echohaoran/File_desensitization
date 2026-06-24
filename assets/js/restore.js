/**
 * restore.js — 还原工作流（前端原型）
 *
 * 说明：
 * - 本文件为 Prototype 级别实现，还原逻辑在浏览器本地完成。
 * - 生产环境需将脱敏文件与映射表提交至后端 Python 服务处理。
 * - 映射表中的 user_id 必须与本浏览器 user_id 一致方可还原（原型隔离）。
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // 常量
  // ─────────────────────────────────────────────────────────────────────────
  const STORAGE_KEY_USER = 'desens_user_id';
  const FILE_TYPE_TEXT = 'text';
  const FILE_TYPE_IMAGE = 'image';

  // ─────────────────────────────────────────────────────────────────────────
  // 状态
  // ─────────────────────────────────────────────────────────────────────────
  const state = {
    userId: null,
    redactedFile: null,
    redactedFileName: '',
    redactedFileType: null,
    redactedText: '',
    redactedImageSrc: null,
    mappingFile: null,
    mapping: null,
    restored: false,
    restoredText: '',
    restoredImageDataUrl: null
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DOM 引用
  // ─────────────────────────────────────────────────────────────────────────
  const els = {
    redactedFileInput: document.getElementById('redactedFileInput'),
    redactedUploadZone: document.getElementById('redactedUploadZone'),
    redactedFileMeta: document.getElementById('redactedFileMeta'),
    redactedFileMetaIcon: document.getElementById('redactedFileMetaIcon'),
    redactedFileMetaName: document.getElementById('redactedFileMetaName'),
    redactedFileMetaDetail: document.getElementById('redactedFileMetaDetail'),
    clearRedactedFileBtn: document.getElementById('clearRedactedFileBtn'),

    mappingFileInput: document.getElementById('mappingFileInput'),
    mappingUploadZone: document.getElementById('mappingUploadZone'),
    mappingFileMeta: document.getElementById('mappingFileMeta'),
    mappingFileMetaIcon: document.getElementById('mappingFileMetaIcon'),
    mappingFileMetaName: document.getElementById('mappingFileMetaName'),
    mappingFileMetaDetail: document.getElementById('mappingFileMetaDetail'),
    clearMappingFileBtn: document.getElementById('clearMappingFileBtn'),

    validateBox: document.getElementById('validateBox'),
    validateText: document.getElementById('validateText'),

    restoreBtn: document.getElementById('restoreBtn'),
    resetBtn: document.getElementById('resetBtn'),

    restoreResult: document.getElementById('restoreResult'),
    restoreResultBody: document.getElementById('restoreResultBody'),
    restoreEmptyState: document.getElementById('restoreEmptyState'),

    downloadBar: document.getElementById('downloadBar'),
    downloadRestoredBtn: document.getElementById('downloadRestoredBtn'),

    liveRegion: document.getElementById('liveRegion'),
    userId: document.querySelector('[data-user-id]')
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 初始化
  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    state.userId = getOrCreateUserId();
    renderUserId();
    bindEvents();
    updateReadyState();
  }

  function getOrCreateUserId() {
    try {
      let id = localStorage.getItem(STORAGE_KEY_USER);
      if (!id) {
        id = (window.crypto && typeof window.crypto.randomUUID === 'function')
          ? window.crypto.randomUUID()
          : ('u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10));
        localStorage.setItem(STORAGE_KEY_USER, id);
      }
      return id;
    } catch (e) {
      return 'u-fallback-' + Date.now();
    }
  }

  function renderUserId() {
    if (!els.userId) return;
    els.userId.textContent = state.userId.slice(0, 8).toUpperCase();
    const pill = els.userId.closest('.user-pill');
    if (pill) pill.title = '完整用户标识：' + state.userId;
  }

  function bindEvents() {
    bindUpload(els.redactedFileInput, els.redactedUploadZone, 'redacted');
    bindUpload(els.mappingFileInput, els.mappingUploadZone, 'mapping');

    els.clearRedactedFileBtn.addEventListener('click', function () { clearFile('redacted'); });
    els.clearMappingFileBtn.addEventListener('click', function () { clearFile('mapping'); });

    els.restoreBtn.addEventListener('click', runRestore);
    els.resetBtn.addEventListener('click', reset);
    els.downloadRestoredBtn.addEventListener('click', downloadRestoredFile);
  }

  function bindUpload(input, zone, key) {
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('is-dragover'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('is-dragover'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0], key);
    });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0], key);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 文件处理
  // ─────────────────────────────────────────────────────────────────────────
  function handleFile(file, key) {
    if (key === 'redacted') {
      state.redactedFile = file;
      state.redactedFileName = file.name;
      state.redactedFileType = inferFileType(file);
      state.redactedText = '';
      state.redactedImageSrc = null;
      renderFileMeta('redacted');
      announce('已上传脱敏文件 ' + file.name);
    } else {
      state.mappingFile = file;
      state.mapping = null;
      renderFileMeta('mapping');
      announce('已上传映射表 ' + file.name);
    }
    updateReadyState();
  }

  function inferFileType(file) {
    if (file.type.startsWith('image/')) return FILE_TYPE_IMAGE;
    return FILE_TYPE_TEXT;
  }

  function renderFileMeta(key) {
    const isRedacted = key === 'redacted';
    const file = isRedacted ? state.redactedFile : state.mappingFile;
    const meta = isRedacted ? els.redactedFileMeta : els.mappingFileMeta;
    const icon = isRedacted ? els.redactedFileMetaIcon : els.mappingFileMetaIcon;
    const name = isRedacted ? els.redactedFileMetaName : els.mappingFileMetaName;
    const detail = isRedacted ? els.redactedFileMetaDetail : els.mappingFileMetaDetail;

    meta.classList.remove('hidden');
    name.textContent = file.name;
    detail.textContent = formatSize(file.size);
    icon.innerHTML = isRedacted
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
  }

  function clearFile(key) {
    if (key === 'redacted') {
      state.redactedFile = null;
      state.redactedFileName = '';
      state.redactedFileType = null;
      state.redactedText = '';
      state.redactedImageSrc = null;
      els.redactedFileInput.value = '';
      els.redactedFileMeta.classList.add('hidden');
    } else {
      state.mappingFile = null;
      state.mapping = null;
      els.mappingFileInput.value = '';
      els.mappingFileMeta.classList.add('hidden');
    }
    updateReadyState();
    announce('已移除文件');
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 就绪校验
  // ─────────────────────────────────────────────────────────────────────────
  function updateReadyState() {
    const hasRedacted = !!state.redactedFile;
    const hasMapping = !!state.mappingFile;
    const ready = hasRedacted && hasMapping;

    els.restoreBtn.disabled = !ready;
    els.resetBtn.disabled = !(hasRedacted || hasMapping);

    if (!hasRedacted && !hasMapping) {
      els.validateBox.classList.add('hidden');
      return;
    }

    els.validateBox.classList.remove('hidden');
    if (!ready) {
      setValidate('wait', '等待文件', '请同时上传脱敏文件与映射表。');
      return;
    }

    // 两个文件都有了，尝试读取映射表并校验
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const json = JSON.parse(ev.target.result);
        state.mapping = json;
        if (!json.user_id) throw new Error('映射表缺少用户标识');
        if (json.user_id !== state.userId) {
          setValidate('err', '用户归属不一致', '当前浏览器用户标识与映射表中的 user_id 不匹配，无法还原。请使用生成该映射表的同一浏览器或同一账户。');
          els.restoreBtn.disabled = true;
        } else if (json.file_type && json.file_type !== state.redactedFileType) {
          setValidate('err', '文件类型不匹配', '映射表记录的 file_type 与上传的脱敏文件类型不一致。');
          els.restoreBtn.disabled = true;
        } else {
          setValidate('ok', '校验通过', '映射表归属一致，共 ' + (json.mappings ? json.mappings.length : 0) + ' 条记录，可执行还原。');
        }
      } catch (e) {
        setValidate('err', '映射表解析失败', e.message || '请上传有效的 JSON 映射表。');
        els.restoreBtn.disabled = true;
      }
    };
    reader.onerror = function () {
      setValidate('err', '映射表读取失败', '无法读取映射表文件。');
      els.restoreBtn.disabled = true;
    };
    reader.readAsText(state.mappingFile);
  }

  function setValidate(type, strong, mono) {
    els.validateBox.className = 'validate-box ' + (type === 'ok' ? 'is-ok' : type === 'err' ? 'is-err' : '');
    const icon = type === 'ok'
      ? '<svg class="validate-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      : type === 'err'
        ? '<svg class="validate-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        : '<svg class="validate-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    els.validateBox.innerHTML = icon + '<div class="validate-box__text"><strong>' + strong + '</strong><br /><span class="mono">' + mono + '</span></div>';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 执行还原
  // ─────────────────────────────────────────────────────────────────────────
  function runRestore() {
    if (!state.redactedFile || !state.mapping) return;
    state.restored = false;
    state.restoredText = '';
    state.restoredImageDataUrl = null;

    if (state.redactedFileType === FILE_TYPE_TEXT) {
      restoreText();
    } else {
      restoreImage();
    }
  }

  function restoreText() {
    const reader = new FileReader();
    reader.onload = function (ev) {
      let text = ev.target.result;
      state.redactedText = text;
      const mappings = (state.mapping.mappings || []).slice().sort((a, b) => {
        // 占位符长度可能不同，先替换长的避免子串问题
        return b.placeholder.length - a.placeholder.length;
      });

      mappings.forEach(m => {
        if (!m.placeholder || m.original === undefined) return;
        text = text.split(m.placeholder).join(m.original);
      });

      state.restoredText = text;
      state.restored = true;
      renderTextResult();
      els.downloadBar.classList.remove('hidden');
      announce('文本还原完成，可下载原文件');
    };
    reader.onerror = function () { announce('脱敏文件读取失败'); };
    reader.readAsText(state.redactedFile);
  }

  function restoreImage() {
    const reader = new FileReader();
    reader.onload = function (ev) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const mappings = state.mapping.mappings || [];
        mappings.forEach(m => {
          if (!m.rect || !m.patch) return;
          const r = m.rect;
          const patchImg = new Image();
          patchImg.onload = function () {
            ctx.drawImage(patchImg, r.x, r.y);
            state.restoredImageDataUrl = canvas.toDataURL('image/png');
            renderImageResult(canvas);
          };
          patchImg.src = m.patch;
        });

        if (mappings.length === 0) {
          state.restoredImageDataUrl = canvas.toDataURL('image/png');
          renderImageResult(canvas);
        }

        state.restored = true;
        els.downloadBar.classList.remove('hidden');
        announce('图片还原完成，可下载原文件');
      };
      img.onerror = function () { announce('脱敏图片解析失败'); };
      img.src = ev.target.result;
    };
    reader.onerror = function () { announce('脱敏文件读取失败'); };
    reader.readAsDataURL(state.redactedFile);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 结果渲染
  // ─────────────────────────────────────────────────────────────────────────
  function renderTextResult() {
    els.restoreResult.classList.remove('hidden');
    els.restoreResultBody.innerHTML = '';

    const diff = document.createElement('div');
    diff.className = 'text-preview';

    const redactedMap = {};
    (state.mapping.mappings || []).forEach(m => { redactedMap[m.placeholder] = m.original; });

    // 将脱敏文本按占位符拆分，渲染为对比视图
    const text = state.redactedText;
    const placeholders = Object.keys(redactedMap).sort((a, b) => b.length - a.length);
    const regex = placeholders.length ? new RegExp('(' + placeholders.map(escapeRegExp).join('|') + ')', 'g') : null;

    if (!regex) {
      diff.textContent = state.restoredText;
    } else {
      const parts = text.split(regex);
      parts.forEach(part => {
        if (redactedMap[part]) {
          const span = document.createElement('span');
          span.className = 'det';
          span.textContent = redactedMap[part];
          span.title = '已还原为原始值';
          diff.appendChild(span);
        } else {
          diff.appendChild(document.createTextNode(part));
        }
      });
    }

    els.restoreResultBody.appendChild(diff);
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function renderImageResult(canvas) {
    els.restoreResult.classList.remove('hidden');
    els.restoreResultBody.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'canvas-wrap';
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    out.getContext('2d').drawImage(canvas, 0, 0);
    wrap.appendChild(out);
    els.restoreResultBody.appendChild(wrap);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 下载
  // ─────────────────────────────────────────────────────────────────────────
  function downloadRestoredFile() {
    if (!state.restored) return;
    let blob, filename;
    if (state.redactedFileType === FILE_TYPE_TEXT) {
      blob = new Blob([state.restoredText], { type: 'text/plain;charset=utf-8' });
      filename = 'restored_' + state.redactedFileName;
    } else {
      blob = dataURLToBlob(state.restoredImageDataUrl);
      filename = 'restored_' + state.redactedFileName.replace(/\.[^.]+$/, '') + '.png';
    }
    triggerDownload(blob, filename);
    announce('原文件已下载');
  }

  function dataURLToBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 重置
  // ─────────────────────────────────────────────────────────────────────────
  function reset() {
    state.redactedFile = null;
    state.redactedFileName = '';
    state.redactedFileType = null;
    state.redactedText = '';
    state.redactedImageSrc = null;
    state.mappingFile = null;
    state.mapping = null;
    state.restored = false;
    state.restoredText = '';
    state.restoredImageDataUrl = null;

    els.redactedFileInput.value = '';
    els.mappingFileInput.value = '';
    els.redactedFileMeta.classList.add('hidden');
    els.mappingFileMeta.classList.add('hidden');
    els.validateBox.classList.add('hidden');
    els.restoreResult.classList.add('hidden');
    els.restoreResultBody.innerHTML = '';
    els.restoreResultBody.appendChild(els.restoreEmptyState);
    els.restoreEmptyState.classList.remove('hidden');
    els.downloadBar.classList.add('hidden');

    updateReadyState();
    announce('已重置，请重新上传文件');
  }

  function announce(msg) {
    if (!els.liveRegion) return;
    els.liveRegion.textContent = '';
    setTimeout(function () { els.liveRegion.textContent = msg; }, 100);
  }

  init();
})();
