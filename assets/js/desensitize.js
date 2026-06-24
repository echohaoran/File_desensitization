/**
 * desensitize.js — 多步骤脱敏工作流（前端原型）
 *
 * 说明：
 * - 本文件为 Prototype 级别实现，所有解析与映射操作在浏览器本地完成，
 *   生产环境需将文件与映射表提交至后端 Python 服务处理。
 * - 用户隔离通过 localStorage 中的独立 user_id 实现；映射表按 user_id 分区存储。
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // 常量
  // ─────────────────────────────────────────────────────────────────────────
  const STORAGE_KEY_USER = 'desens_user_id';
  const STORAGE_KEY_MAPS = 'desens_mappings';
  const FILE_TYPE_TEXT = 'text';
  const FILE_TYPE_IMAGE = 'image';

  const PATTERNS = [
    { id: 'phone', label: '手机号', regex: /1[3-9]\d{9}/g },
    { id: 'idcard', label: '身份证', regex: /\d{17}[\dXx]/g },
    { id: 'email', label: '邮箱', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { id: 'bankcard', label: '银行卡', regex: /\d{16,19}/g },
    { id: 'amount', label: '金额', regex: /(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?\s*(?:万元|元|美元|USD|CNY|￥|\$)/g },
    { id: 'name', label: '姓名', regex: /[\u4e00-\u9fa5]{2,4}(?=(?:先生|女士|总|经理|董事|合伙人|投资|基金|LP|GP))/g }
  ];

  const TYPE_NAMES = {
    phone: '手机号', idcard: '身份证', email: '邮箱', bankcard: '银行卡',
    amount: '金额', name: '姓名', manual: '区域'
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 状态
  // ─────────────────────────────────────────────────────────────────────────
  const state = {
    userId: null,
    file: null,
    fileName: '',
    fileType: null, // 'text' | 'image'
    originalText: '',
    detections: [], // {id, type, label, value, start, end, placeholder, active, manual}
    nextId: 1,
    image: {
      originalSrc: null,
      img: null,
      canvas: null,
      ctx: null,
      width: 0,
      height: 0,
      rects: [] // {id, x, y, w, h, active, manual}
    },
    mapping: null,
    confirmed: false,
    selection: null // 图片框选状态
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DOM 引用
  // ─────────────────────────────────────────────────────────────────────────
  const els = {
    fileInput: document.getElementById('fileInput'),
    uploadZone: document.getElementById('uploadZone'),
    fileMeta: document.getElementById('fileMeta'),
    fileMetaIcon: document.getElementById('fileMetaIcon'),
    fileMetaName: document.getElementById('fileMetaName'),
    fileMetaDetail: document.getElementById('fileMetaDetail'),
    clearFileBtn: document.getElementById('clearFileBtn'),
    detectList: document.getElementById('detectList'),
    detectCount: document.getElementById('detectCount'),
    confirmBtn: document.getElementById('confirmBtn'),
    resetBtn: document.getElementById('resetBtn'),
    previewTitle: document.getElementById('previewTitle'),
    previewTools: document.getElementById('previewTools'),
    previewBody: document.getElementById('previewBody'),
    emptyState: document.getElementById('emptyState'),
    mappingPre: document.getElementById('mappingPre'),
    mappingToggle: document.getElementById('mappingToggle'),
    mappingBody: document.getElementById('mappingBody'),
    mappingJson: document.getElementById('mappingJson'),
    downloadBar: document.getElementById('downloadBar'),
    downloadFileBtn: document.getElementById('downloadFileBtn'),
    downloadMappingBtn: document.getElementById('downloadMappingBtn'),
    liveRegion: document.getElementById('liveRegion'),
    steps: [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3'),
      document.getElementById('step-4')
    ],
    userId: document.querySelector('[data-user-id]'),
    selectionPopup: null
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 初始化
  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    state.userId = getOrCreateUserId();
    renderUserId();
    bindEvents();
    setStep(0);
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
    els.fileInput.addEventListener('change', onFileSelect);
    els.uploadZone.addEventListener('dragover', onDragOver);
    els.uploadZone.addEventListener('dragleave', onDragLeave);
    els.uploadZone.addEventListener('drop', onDrop);
    els.uploadZone.addEventListener('keydown', onUploadKey);
    els.clearFileBtn.addEventListener('click', reset);
    els.confirmBtn.addEventListener('click', confirmRedaction);
    els.resetBtn.addEventListener('click', reset);
    els.mappingToggle.addEventListener('click', toggleMapping);
    els.mappingToggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMapping(); }
    });
    els.downloadFileBtn.addEventListener('click', downloadRedactedFile);
    els.downloadMappingBtn.addEventListener('click', downloadMapping);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 文件上传
  // ─────────────────────────────────────────────────────────────────────────
  function onDragOver(e) { e.preventDefault(); els.uploadZone.classList.add('is-dragover'); }
  function onDragLeave() { els.uploadZone.classList.remove('is-dragover'); }
  function onDrop(e) {
    e.preventDefault();
    els.uploadZone.classList.remove('is-dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }
  function onUploadKey(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }
  }
  function onFileSelect(e) {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  }

  function handleFile(file) {
    reset(false);
    state.file = file;
    state.fileName = file.name;
    state.fileType = inferFileType(file);
    renderFileMeta();
    setStep(1);
    announce('已上传 ' + file.name + '，正在解析敏感内容');

    if (state.fileType === FILE_TYPE_TEXT) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        state.originalText = ev.target.result;
        runTextDetection();
        renderTextPreview();
        renderDetectList();
        setStep(2);
        announce('检测到 ' + state.detections.filter(d => d.active).length + ' 处敏感内容，请复核');
      };
      reader.onerror = function () { announce('文件读取失败'); };
      reader.readAsText(file);
    } else if (state.fileType === FILE_TYPE_IMAGE) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        state.image.originalSrc = ev.target.result;
        loadImageForCanvas(ev.target.result);
      };
      reader.onerror = function () { announce('图片读取失败'); };
      reader.readAsDataURL(file);
    }
  }

  function inferFileType(file) {
    if (file.type.startsWith('image/')) return FILE_TYPE_IMAGE;
    return FILE_TYPE_TEXT;
  }

  function renderFileMeta() {
    els.fileMeta.classList.remove('hidden');
    els.fileMetaName.textContent = state.fileName;
    els.fileMetaDetail.textContent = (state.fileType === FILE_TYPE_IMAGE ? '图片' : '文本') + ' · ' + formatSize(state.file.size);
    els.fileMetaIcon.innerHTML = state.fileType === FILE_TYPE_IMAGE
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    els.resetBtn.disabled = false;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 文本检测
  // ─────────────────────────────────────────────────────────────────────────
  function runTextDetection() {
    const text = state.originalText;
    const raw = [];
    PATTERNS.forEach(p => {
      let m;
      p.regex.lastIndex = 0;
      while ((m = p.regex.exec(text)) !== null) {
        raw.push({ type: p.id, label: p.label, value: m[0], start: m.index, end: m.index + m[0].length });
      }
    });
    // 按位置排序并去除重叠（长者优先）
    raw.sort((a, b) => a.start - b.start || b.end - a.end);
    const merged = [];
    raw.forEach(r => {
      const last = merged[merged.length - 1];
      if (last && r.start < last.end) return;
      merged.push(r);
    });
    merged.sort((a, b) => a.start - b.start);
    state.detections = merged.map((r, i) => ({
      id: state.nextId++,
      type: r.type,
      label: r.label,
      value: r.value,
      start: r.start,
      end: r.end,
      placeholder: makePlaceholder(r.type, i + 1),
      active: true,
      manual: false
    }));
  }

  function makePlaceholder(type, index) {
    return '掩码-' + (TYPE_NAMES[type] || '敏感项') + '-' + String(index).padStart(3, '0');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 文本预览渲染
  // ─────────────────────────────────────────────────────────────────────────
  function renderTextPreview() {
    els.previewTitle.textContent = '文本预览';
    els.previewTools.innerHTML = '';
    els.previewBody.innerHTML = '';

    const text = state.originalText;
    const detections = state.detections.slice().sort((a, b) => a.start - b.start);
    const container = document.createElement('div');
    container.className = 'text-preview';
    container.dataset.role = 'text-preview';

    let cursor = 0;
    detections.forEach(d => {
      if (d.start > cursor) container.appendChild(makeTextChunk(text.slice(cursor, d.start), cursor));
      const span = document.createElement('span');
      span.className = d.active ? 'tok' : 'det';
      span.textContent = d.active ? d.placeholder : d.value;
      span.title = (d.active ? '已脱敏：' : '未脱敏：') + d.label;
      span.dataset.id = String(d.id);
      span.addEventListener('click', function () { toggleDetection(d.id); });
      container.appendChild(span);
      cursor = d.end;
    });
    if (cursor < text.length) container.appendChild(makeTextChunk(text.slice(cursor), cursor));

    container.addEventListener('mouseup', onTextMouseUp);
    container.addEventListener('mousedown', hideSelectionPopup);
    els.previewBody.appendChild(container);
    els.textPreview = container;
    createSelectionPopup();
  }

  function makeTextChunk(str, startIndex) {
    const span = document.createElement('span');
    span.textContent = str;
    span.dataset.start = String(startIndex);
    return span;
  }

  function createSelectionPopup() {
    const popupExists = els.selectionPopup && els.selectionPopup.isConnected;
    if (popupExists) return;
    els.selectionPopup = null;
    const popup = document.createElement('div');
    popup.className = 'selection-popup';
    popup.id = 'selectionPopup';
    popup.setAttribute('role', 'toolbar');
    popup.setAttribute('aria-label', '选区操作');
    popup.innerHTML =
      '<button type="button" id="selectionAddBtn" aria-label="将选中文本加入脱敏">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
      '添加' +
      '</button>' +
      '<span class="selection-popup__hint">加入脱敏</span>';
    if (els.textPreview) {
      els.textPreview.style.position = 'relative';
      els.textPreview.appendChild(popup);
    } else {
      els.previewBody.style.position = 'relative';
      els.previewBody.appendChild(popup);
    }
    els.selectionPopup = popup;
    document.getElementById('selectionAddBtn').addEventListener('click', addSelectionAsRedaction);

    // 阻止弹窗内的 mousedown 冒泡到文本预览，避免在点击“添加”时误触发 hideSelectionPopup
    popup.addEventListener('mousedown', function (e) { e.stopPropagation(); });

    document.addEventListener('mousedown', function (e) {
      if (!els.selectionPopup || !els.selectionPopup.classList.contains('is-visible')) return;
      if (!els.selectionPopup.contains(e.target)) hideSelectionPopup();
    });
    els.previewBody.addEventListener('scroll', hideSelectionPopup);
  }

  function getSelectionRangeOffsets() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);

    const startOffset = getNodeOffset(range.startContainer, range.startOffset);
    const endOffset = getNodeOffset(range.endContainer, range.endOffset);
    if (startOffset === null || endOffset === null || startOffset >= endOffset) return null;

    return { start: startOffset, end: endOffset, text: state.originalText.slice(startOffset, endOffset) };
  }

  function getNodeOffset(node, offsetInNode) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (el && el !== els.previewBody) {
      if (el.dataset && el.dataset.start !== undefined) {
        const chunkStart = parseInt(el.dataset.start, 10);
        const preceding = getPrecedingTextLength(node, offsetInNode, el);
        return chunkStart + preceding;
      }
      if (el.dataset && el.dataset.id !== undefined) {
        const d = state.detections.find(x => String(x.id) === el.dataset.id);
        if (d) return d.start + offsetInNode;
      }
      el = el.parentElement;
    }
    return null;
  }

  function getPrecedingTextLength(targetNode, targetOffset, boundary) {
    let len = 0;
    const walker = document.createTreeWalker(boundary, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n === targetNode) return len + Math.min(targetOffset, n.textContent.length);
      len += n.textContent.length;
    }
    return len;
  }

  function onTextMouseUp(e) {
    if (e.target && e.target.closest && e.target.closest('.selection-popup')) return;
    setTimeout(function () {
      const info = getSelectionRangeOffsets();
      if (!info) { hideSelectionPopup(); return; }
      if (!info.text.trim()) { hideSelectionPopup(); return; }

      state.selection = info;
      stashSelectionOnPopup(info);
      positionSelectionPopup();
      els.selectionPopup.classList.add('is-visible');
    }, 10);
  }

  function stashSelectionOnPopup(info) {
    if (!els.selectionPopup) return;
    const btn = document.getElementById('selectionAddBtn');
    if (!btn) return;
    btn.dataset.start = String(info.start);
    btn.dataset.end = String(info.end);
    btn.dataset.text = info.text;
  }

  function readSelectionFromPopup() {
    const btn = document.getElementById('selectionAddBtn');
    if (!btn || btn.dataset.start === undefined) return null;
    const start = parseInt(btn.dataset.start, 10);
    const end = parseInt(btn.dataset.end, 10);
    const text = btn.dataset.text || '';
    if (isNaN(start) || isNaN(end) || start >= end) return null;
    return { start, end, text };
  }

  function positionSelectionPopup() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const rects = range.getClientRects();
    const rect = rects && rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
    if (!rect || !rect.width) return;

    const popup = els.selectionPopup;
    const container = els.textPreview || els.previewBody;
    const containerRect = container.getBoundingClientRect();
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top;
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
  }

  function hideSelectionPopup() {
    if (els.selectionPopup) els.selectionPopup.classList.remove('is-visible');
    const btn = document.getElementById('selectionAddBtn');
    if (btn) {
      delete btn.dataset.start;
      delete btn.dataset.end;
      delete btn.dataset.text;
    }
    state.selection = null;
  }

  function addSelectionAsRedaction() {
    let info = readSelectionFromPopup() || state.selection || getSelectionRangeOffsets();
    if (!info) {
      hideSelectionPopup();
      return;
    }

    const text = info.text;
    const start = info.start;
    const end = info.end;

    if (!text.trim()) { hideSelectionPopup(); return; }
    const existing = state.detections.find(d => d.start === start && d.end === end);
    if (existing) {
      hideSelectionPopup();
      announce('该区域已存在于检测列表中');
      return;
    }

    state.detections = state.detections.filter(d => !(start <= d.start && end >= d.end));

    const newItem = {
      id: state.nextId++,
      type: 'manual',
      label: '区域',
      value: text,
      start: start,
      end: end,
      placeholder: makePlaceholder('manual', state.detections.filter(d => d.type === 'manual').length + 1),
      active: true,
      manual: true
    };

    state.detections = state.detections.filter(d => !(d.start < end && d.end > start));
    state.detections.push(newItem);
    state.detections.sort((a, b) => a.start - b.start);

    hideSelectionPopup();
    window.getSelection().removeAllRanges();
    renderTextPreview();
    renderDetectList();
    announce('已添加手动脱敏区域：' + text.slice(0, 20) + (text.length > 20 ? '…' : ''));
  }

  function toggleDetection(id) {
    const d = state.detections.find(x => x.id === id);
    if (!d) return;
    d.active = !d.active;
    renderTextPreview();
    renderDetectList();
    announce(d.label + (d.active ? ' 已标记为脱敏' : ' 已取消脱敏'));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 图片预览渲染
  // ─────────────────────────────────────────────────────────────────────────
  function loadImageForCanvas(dataUrl) {
    const img = new Image();
    img.onload = function () {
      state.image.img = img;
      state.image.width = img.naturalWidth;
      state.image.height = img.naturalHeight;
      // 模拟基础检测：在图片上生成若干候选区域
      simulateImageDetections();
      renderImagePreview();
      renderDetectList();
      setStep(2);
      announce('图片加载完成，检测到 ' + state.image.rects.filter(r => r.active).length + ' 处敏感区域，可框选增删');
    };
    img.onerror = function () { announce('图片解析失败'); };
    img.src = dataUrl;
  }

  function simulateImageDetections() {
    const w = state.image.width;
    const h = state.image.height;
    const rects = [];
    const count = Math.min(4, Math.max(2, Math.floor((w * h) / 200000)));
    for (let i = 0; i < count; i++) {
      const rw = Math.max(80, Math.min(240, w * 0.22));
      const rh = Math.max(24, Math.min(80, h * 0.08));
      const x = Math.floor((w - rw) * (0.12 + i * 0.22));
      const y = Math.floor((h - rh) * (0.25 + (i % 2) * 0.35));
      rects.push({
        id: state.nextId++,
        x: x, y: y, w: rw, h: rh,
        placeholder: makePlaceholder('manual', i + 1),
        active: true,
        manual: false
      });
    }
    state.image.rects = rects;
  }

  function renderImagePreview() {
    els.previewTitle.textContent = '图片预览';
    els.previewTools.innerHTML = '';
    els.previewBody.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'canvas-wrap';

    const canvas = document.createElement('canvas');
    canvas.width = state.image.width;
    canvas.height = state.image.height;
    const ctx = canvas.getContext('2d');
    state.image.canvas = canvas;
    state.image.ctx = ctx;

    drawImageCanvas();
    bindCanvasInteraction(canvas);

    wrap.appendChild(canvas);

    const legend = document.createElement('div');
    legend.className = 'canvas-legend';
    legend.innerHTML = '<span><i class="box"></i>已脱敏区域</span><span><i></i>候选区域</span><span><i class="off"></i>已跳过区域</span>';
    wrap.appendChild(legend);

    els.previewBody.appendChild(wrap);
  }

  function drawImageCanvas() {
    const ctx = state.image.ctx;
    const canvas = state.image.canvas;
    const img = state.image.img;
    if (!ctx || !canvas || !img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    state.image.rects.forEach(r => {
      ctx.strokeStyle = r.active ? '#000000' : 'rgba(0,0,0,0.25)';
      ctx.lineWidth = r.active ? 2 : 1.5;
      ctx.setLineDash(r.active ? [] : [5, 4]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      if (r.active) {
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(r.placeholder, r.x + 4, r.y + 16);
      }
    });
    ctx.setLineDash([]);
  }

  function bindCanvasInteraction(canvas) {
    let start = null;
    canvas.addEventListener('mousedown', function (e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // 优先：点击已有区域则切换
      const clicked = state.image.rects.slice().reverse().find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      if (clicked) {
        clicked.active = !clicked.active;
        drawImageCanvas();
        renderDetectList();
        announce(clicked.placeholder + (clicked.active ? ' 已标记为脱敏' : ' 已跳过'));
        return;
      }
      start = { x, y };
    });
    canvas.addEventListener('mousemove', function (e) {
      if (!start) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      drawImageCanvas();
      state.image.ctx.strokeStyle = '#000000';
      state.image.ctx.lineWidth = 2;
      state.image.ctx.setLineDash([4, 4]);
      state.image.ctx.strokeRect(start.x, start.y, x - start.x, y - start.y);
      state.image.ctx.setLineDash([]);
    });
    function endDrag(e) {
      if (!start) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const rx = Math.min(start.x, x);
      const ry = Math.min(start.y, y);
      const rw = Math.abs(x - start.x);
      const rh = Math.abs(y - start.y);
      if (rw > 20 && rh > 12) {
        state.image.rects.push({
          id: state.nextId++,
          x: Math.max(0, rx), y: Math.max(0, ry),
          w: Math.min(state.image.width - rx, rw),
          h: Math.min(state.image.height - ry, rh),
          placeholder: makePlaceholder('manual', state.image.rects.length + 1),
          active: true,
          manual: true
        });
        drawImageCanvas();
        renderDetectList();
        announce('已新增一处手动脱敏区域');
      }
      start = null;
      drawImageCanvas();
    }
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', function () { start = null; drawImageCanvas(); });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 检测结果列表
  // ─────────────────────────────────────────────────────────────────────────
  function renderDetectList() {
    const items = state.fileType === FILE_TYPE_TEXT ? state.detections : state.image.rects;
    els.detectCount.textContent = items.filter(i => i.active).length + ' 项';
    els.detectList.innerHTML = '';

    if (items.length === 0) {
      els.detectList.innerHTML = '';
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'detect-item' + (item.active ? '' : ' is-off');

      const badge = document.createElement('span');
      badge.className = 'badge badge--' + (item.type || 'manual');
      badge.textContent = item.label || '区域';

      const body = document.createElement('div');
      body.className = 'detect-item__body';
      const value = document.createElement('div');
      value.className = 'detect-item__value';
      value.textContent = state.fileType === FILE_TYPE_TEXT
        ? (item.active ? item.placeholder : item.value)
        : item.placeholder;
      const sub = document.createElement('div');
      sub.className = 'detect-item__sub';
      sub.textContent = item.manual ? '手动框选' : '自动检测';
      body.appendChild(value);
      body.appendChild(sub);

      const label = document.createElement('label');
      label.className = 'switch';
      label.title = item.active ? '点击取消脱敏' : '点击加入脱敏';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = item.active;
      input.addEventListener('change', function () {
        item.active = input.checked;
        if (state.fileType === FILE_TYPE_TEXT) renderTextPreview();
        else drawImageCanvas();
        renderDetectList();
      });
      const track = document.createElement('span');
      track.className = 'switch__track';
      const knob = document.createElement('span');
      knob.className = 'switch__knob';
      label.appendChild(input);
      label.appendChild(track);
      label.appendChild(knob);

      row.appendChild(badge);
      row.appendChild(body);
      row.appendChild(label);
      els.detectList.appendChild(row);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 确认脱敏
  // ─────────────────────────────────────────────────────────────────────────
  function confirmRedaction() {
    if (state.fileType === FILE_TYPE_TEXT) {
      buildTextMapping();
    } else {
      buildImageMapping();
    }
    state.confirmed = true;
    setStep(3);
    renderMappingPreview();
    els.downloadBar.classList.remove('hidden');
    els.confirmBtn.disabled = true;
    storeMapping();
    announce('脱敏完成，可下载脱敏文件与映射表');
  }

  function buildTextMapping() {
    const mappings = [];
    const activeDetections = state.detections.filter(d => d.active).sort((a, b) => b.start - a.start);
    let redacted = state.originalText;
    activeDetections.forEach(d => {
      mappings.push({ id: d.id, placeholder: d.placeholder, type: d.type, original: d.value });
      redacted = redacted.slice(0, d.start) + d.placeholder + redacted.slice(d.end);
    });
    state.mapping = {
      version: '1.0',
      user_id: state.userId,
      created_at: new Date().toISOString(),
      file_name: state.fileName,
      file_type: FILE_TYPE_TEXT,
      mappings: mappings.reverse()
    };
    state.redactedText = redacted;
  }

  function buildImageMapping() {
    const canvas = state.image.canvas;
    const ctx = state.image.ctx;
    const mappings = [];

    // 对每个 active 区域，先保存原图 patch，再绘制遮盖块
    state.image.rects.filter(r => r.active).forEach(r => {
      const patchCanvas = document.createElement('canvas');
      patchCanvas.width = r.w;
      patchCanvas.height = r.h;
      const patchCtx = patchCanvas.getContext('2d');
      patchCtx.drawImage(state.image.img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
      mappings.push({
        id: r.id,
        placeholder: r.placeholder,
        type: 'manual',
        rect: { x: r.x, y: r.y, w: r.w, h: r.h },
        patch: patchCanvas.toDataURL('image/png')
      });
    });

    // 重新绘制遮盖
    drawImageCanvas();

    state.mapping = {
      version: '1.0',
      user_id: state.userId,
      created_at: new Date().toISOString(),
      file_name: state.fileName,
      file_type: FILE_TYPE_IMAGE,
      mappings: mappings
    };
  }

  function renderMappingPreview() {
    els.mappingPre.classList.remove('hidden');
    els.mappingJson.textContent = JSON.stringify(state.mapping, null, 2);
  }

  function toggleMapping() {
    const open = els.mappingPre.classList.toggle('is-open');
    els.mappingToggle.setAttribute('aria-expanded', String(open));
  }

  function storeMapping() {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY_MAPS) || '[]');
      list.push({
        user_id: state.userId,
        file_name: state.fileName,
        created_at: state.mapping.created_at,
        mapping_preview: state.mapping.mappings.slice(0, 3)
      });
      localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(list.slice(-20)));
    } catch (_) { /* ignore */ }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 下载
  // ─────────────────────────────────────────────────────────────────────────
  function downloadRedactedFile() {
    if (!state.confirmed) return;
    let blob, filename;
    if (state.fileType === FILE_TYPE_TEXT) {
      blob = new Blob([state.redactedText], { type: 'text/plain;charset=utf-8' });
      filename = 'redacted_' + state.fileName;
    } else {
      const dataUrl = state.image.canvas.toDataURL('image/png');
      blob = dataURLToBlob(dataUrl);
      filename = 'redacted_' + state.fileName.replace(/\.[^.]+$/, '') + '.png';
    }
    triggerDownload(blob, filename);
    announce('脱敏文件已下载');
  }

  function downloadMapping() {
    if (!state.mapping) return;
    const blob = new Blob([JSON.stringify(state.mapping, null, 2)], { type: 'application/json' });
    triggerDownload(blob, 'mapping_' + state.fileName.replace(/\.[^.]+$/, '') + '.json');
    announce('映射表已下载');
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
  // 流程控制
  // ─────────────────────────────────────────────────────────────────────────
  function setStep(index) {
    els.steps.forEach((el, i) => {
      el.classList.remove('is-active', 'is-done');
      if (i < index) el.classList.add('is-done');
      else if (i === index) el.classList.add('is-active');
    });
    els.confirmBtn.disabled = !state.file || state.confirmed;
    els.resetBtn.disabled = !state.file;
  }

  function reset(clearInput) {
    state.file = null;
    state.fileName = '';
    state.fileType = null;
    state.originalText = '';
    state.redactedText = '';
    state.detections = [];
    state.nextId = 1;
    state.image = { originalSrc: null, img: null, canvas: null, ctx: null, width: 0, height: 0, rects: [] };
    state.mapping = null;
    state.confirmed = false;

    if (clearInput !== false) els.fileInput.value = '';
    els.fileMeta.classList.add('hidden');
    els.detectCount.textContent = '0 项';
    els.detectList.innerHTML = '';
    els.previewTitle.textContent = '预览';
    els.previewTools.innerHTML = '';
    els.previewBody.innerHTML = '';
    els.previewBody.appendChild(els.emptyState);
    els.emptyState.classList.remove('hidden');
    els.selectionPopup = null;
    els.mappingPre.classList.add('hidden', 'is-open');
    els.mappingJson.textContent = '';
    els.downloadBar.classList.add('hidden');
    setStep(0);
    announce('已重置，请重新上传文件');
  }

  function announce(msg) {
    if (!els.liveRegion) return;
    els.liveRegion.textContent = '';
    setTimeout(function () { els.liveRegion.textContent = msg; }, 100);
  }

  init();
})();
