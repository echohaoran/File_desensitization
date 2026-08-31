<template>
  <div id="app">
    <!-- Shared Header -->
    <header class="site-header">
      <div class="container site-header__inner">
        <router-link class="brand" to="/" aria-label="脱敏系统首页">
          <img class="brand__mark" src="/assets/desens-shield.png" alt="" aria-hidden="true" />
          <span class="brand__content">
            <span class="brand__name">脱敏系统<span> / DESENS</span></span>
            <button class="brand__version" :class="{ 'has-update': updateAvailable }" type="button" @click.stop.prevent="openVersionDialog" :title="checkingUpdate ? '正在检查更新' : '检查更新'">
              {{ currentVersion }}<i v-if="updateAvailable" aria-label="有新版本"></i>
            </button>
          </span>
        </router-link>
        <nav class="site-nav" aria-label="主导航">
          <router-link to="/">概览</router-link>
          <router-link to="/desensitize">脱敏</router-link>
          <router-link to="/restore">还原</router-link>
          <router-link to="/sensitive-rules">敏感字段</router-link>
          <router-link to="/settings">设置</router-link>
        </nav>
        <div class="header-spacer"></div>
      </div>
    </header>

    <div v-if="showVersionDialog" class="version-modal" role="dialog" aria-modal="true" aria-label="版本更新" @click.self="showVersionDialog = false">
      <section class="version-modal__card">
        <header class="version-modal__head"><div><span class="mono-label">{{ sourceLabel.toUpperCase() }} UPDATE</span><h2>版本更新</h2></div><button class="icon-btn" @click="showVersionDialog = false" aria-label="关闭版本更新窗口">×</button></header>
        <p class="version-modal__status" :class="{ 'is-update': updateAvailable }">{{ versionStatus }}</p>
        <dl class="version-modal__meta"><div><dt>当前版本</dt><dd>{{ currentVersion }} · {{ shortRevision(versionInfo?.current_revision) }}</dd></div><div><dt>更新来源</dt><dd><select v-model="updateSource" class="version-modal__source-select" @change="changeUpdateSource"><option v-for="item in updateSources" :key="item.key" :value="item.key">{{ item.label }} / main</option></select></dd></div></dl>
        <section class="version-modal__commits"><h3>最近提交</h3><p v-if="checkingUpdate">正在从 {{ sourceLabel }} 获取版本信息…</p><p v-else-if="!versionInfo?.commits?.length">暂未取得提交摘要，可前往 {{ sourceLabel }} 仓库查看。</p><ol v-else><li v-for="commit in versionInfo.commits" :key="commit.id"><code>{{ commit.short_id }}</code><span>{{ commit.message }}</span><time>{{ formatCommitDate(commit.created_at) }}</time></li></ol></section>
        <p class="version-modal__hint">更新版本将通过 {{ sourceLabel }} 部署流程获取；请勿直接覆盖本机脱敏历史。</p>
        <footer class="version-modal__actions"><button class="btn btn--secondary" @click="checkForUpdates" :disabled="checkingUpdate">{{ checkingUpdate ? '检查中…' : '检查更新' }}</button><a class="btn btn--primary" :href="updateUrl" target="_blank" rel="noopener" @click="requestUpdate">{{ updateAvailable ? '更新版本' : '查看最新版本' }}</a><a class="btn btn--ghost" :href="repositoryUrl" target="_blank" rel="noopener" @click="showToast('正在打开代码仓库')">前往仓库</a></footer>
      </section>
    </div>

    <main>
      <router-view />
    </main>

    <!-- Status announcer for accessibility -->
    <div class="sr-only" aria-live="polite" role="status">{{ statusMessage }}</div>
    <Transition name="toast"><div v-if="toastMessage" class="app-toast" role="status">{{ toastMessage }}</div></Transition>
    <div v-if="downloadDialog" class="download-result-modal" role="dialog" aria-modal="true" aria-labelledby="download-result-title" @click.self="downloadDialog = null">
      <section class="download-result-modal__card">
        <div class="download-result-modal__icon" :class="downloadDialog.success ? 'is-success' : 'is-error'">{{ downloadDialog.success ? '✓' : '!' }}</div>
        <h2 id="download-result-title">{{ downloadDialog.success ? '下载已完成' : '下载失败' }}</h2>
        <p>{{ downloadDialog.message }}</p>
        <small v-if="downloadDialog.filename">{{ downloadDialog.filename }}<template v-if="downloadDialog.size"> · {{ formatBytes(downloadDialog.size) }}</template></small>
        <button class="btn btn--primary" @click="downloadDialog = null">知道了</button>
      </section>
    </div>
    <div v-if="actionConfirm" class="action-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="action-confirm-title" @click.self="resolveActionConfirm(false)">
      <section class="action-confirm-modal__card">
        <div class="action-confirm-modal__icon" :class="{ 'is-warning': actionConfirm.tone === 'warning' }">?</div>
        <h2 id="action-confirm-title">{{ actionConfirm.title }}</h2>
        <p>{{ actionConfirm.message }}</p>
        <div class="action-confirm-modal__actions">
          <button class="btn btn--secondary" data-no-feedback="true" @click="resolveActionConfirm(false)">取消</button>
          <button class="btn btn--primary" data-no-feedback="true" @click="resolveActionConfirm(true)">{{ actionConfirm.confirmText }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { apiUrl } from '@/api/desensitization'
import packageInfo from '../package.json'

export default {
  name: 'App',
  data() {
    return {
      statusMessage: '',
      currentVersion: `v${packageInfo.version}`,
      updateAvailable: false,
      checkingUpdate: false,
      showVersionDialog: false,
      versionInfo: null,
      versionError: '',
      updateRequestId: 0,
      toastMessage: '',
      toastTimer: null,
      downloadDialog: null,
      actionConfirm: null,
      updateSource: localStorage.getItem('desens:update-source') || 'github',
      updateSources: [
        { key: 'github', label: 'GitHub' },
        { key: 'gitee', label: 'Gitee' },
        { key: 'cnb', label: 'CNB' }
      ]
    }
  },
  computed: {
    repositoryUrl() {
      return this.versionInfo?.repository || ({
        github: 'https://github.com/echohaoran/File_desensitization',
        gitee: 'https://gitee.com/echohaoran/file_desensitization',
        cnb: 'https://cnb.cool/echohaoran/File_desensitization'
      }[this.updateSource])
    },
    updateUrl() {
      if (this.versionInfo?.latest_release) return this.versionInfo.latest_release
      return ({
        github: 'https://github.com/echohaoran/File_desensitization/releases/latest',
        gitee: 'https://gitee.com/echohaoran/file_desensitization/releases',
        cnb: 'https://cnb.cool/echohaoran/File_desensitization/-/releases'
      }[this.updateSource])
    },
    sourceLabel() {
      return this.updateSources.find(item => item.key === this.updateSource)?.label || 'GitHub'
    },
    versionStatus() {
      if (this.checkingUpdate) return `正在从 ${this.sourceLabel} 检查最新版本…`
      if (this.versionError) return this.versionError
      return this.updateAvailable ? `${this.sourceLabel} main 有新的可用提交。` : `已从 ${this.sourceLabel} 检查：当前已是最新版本。`
    }
  },
  methods: {
    showToast(message) {
      this.toastMessage = message
      clearTimeout(this.toastTimer)
      this.toastTimer = setTimeout(() => { this.toastMessage = '' }, 2200)
    },
    formatBytes(bytes) {
      if (!bytes) return ''
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    },
    announce(message) {
      this.statusMessage = ''
      setTimeout(() => { this.statusMessage = message }, 100)
    },
    resolveActionConfirm(confirmed) {
      if (!this.actionConfirm) return
      const id = this.actionConfirm.id
      this.actionConfirm = null
      window.dispatchEvent(new CustomEvent('desens:confirm-result', { detail: { id, confirmed } }))
    },
    openVersionDialog() {
      this.showToast('正在打开版本信息')
      this.showVersionDialog = true
      this.checkForUpdates()
    },
    changeUpdateSource() {
      localStorage.setItem('desens:update-source', this.updateSource)
      this.versionInfo = null
      this.versionError = ''
      this.updateAvailable = false
      this.checkForUpdates()
    },
    shortRevision(value) {
      return value ? String(value).slice(0, 7) : '本机部署'
    },
    formatCommitDate(value) {
      return value ? new Date(value).toLocaleDateString('zh-CN') : ''
    },
    requestUpdate() { this.showToast(this.updateAvailable ? `已打开 ${this.sourceLabel} 最新版本页面` : `已打开 ${this.sourceLabel} 发布页面`); this.announce(this.updateAvailable ? `已打开 ${this.sourceLabel} 最新版本页面，请下载对应平台安装包` : `已打开 ${this.sourceLabel} 发布页面`) },
    async checkForUpdates() {
      const requestId = ++this.updateRequestId
      const source = this.updateSource
      this.checkingUpdate = true
      try {
        const response = await fetch(apiUrl(`/api/version/check?source=${encodeURIComponent(source)}&ts=${Date.now()}`), { cache: 'no-store' })
        if (!response.ok) throw new Error('update endpoint unavailable')
        const data = await response.json()
        if (requestId !== this.updateRequestId) return
        this.versionInfo = data
        this.versionError = ''
        this.updateAvailable = Boolean(data.update_available)
        this.announce(this.updateAvailable ? `${this.sourceLabel} main 有新的可用提交` : `已从 ${this.sourceLabel} 检查：当前已是最新版本`)
      } catch (_) {
        try {
          const response = await fetch('/version.json?ts=' + Date.now(), { cache: 'no-store' })
          if (!response.ok) throw new Error('fallback endpoint unavailable')
          const data = await response.json()
          if (requestId !== this.updateRequestId) return
          const latest = String(data.version || '').replace(/^v/, '')
          const current = this.currentVersion.replace(/^v/, '')
          this.updateAvailable = Boolean(latest && latest !== current)
          this.announce(this.updateAvailable ? `检测到备用更新 v${latest}` : `${this.sourceLabel} 暂不可用；本机版本无更新`)
        } catch (_) {
          if (requestId !== this.updateRequestId) return
          this.versionInfo = null
          this.versionError = `暂时无法连接 ${this.sourceLabel} 更新源`
          this.announce(`暂时无法检查 ${this.sourceLabel} 更新`)
        }
      } finally {
        if (requestId === this.updateRequestId) this.checkingUpdate = false
      }
    }
  },
  mounted() {
    this._downloadFeedback = (event) => { this.downloadDialog = event.detail }
    window.addEventListener('desens:download-result', this._downloadFeedback)
    this._statusFeedback = (event) => { if (event.detail?.message) this.showToast(event.detail.message) }
    window.addEventListener('desens:status', this._statusFeedback)
    this._confirmRequest = event => {
      if (this.actionConfirm) this.resolveActionConfirm(false)
      this.actionConfirm = event.detail
    }
    window.addEventListener('desens:confirm-request', this._confirmRequest)
    this._buttonFeedback = (event) => {
      const button = event.target.closest?.('button')
      if (!button || button.disabled || button.dataset.noFeedback === 'true' || button.classList.contains('panel-toggle')) return
      const label = (button.getAttribute('aria-label') || button.title || button.textContent).trim().replace(/…$/, '')
      if (!label || label === '×' || /知道了|关闭/.test(label)) return
      if (/下载|转换|脱敏|还原|检查|登记|应用|保存|添加|刷新/.test(label)) this.showToast(`正在处理：${label}`)
      else this.showToast(`已执行：${label}`)
    }
    document.addEventListener('click', this._buttonFeedback, true)
  },
  beforeUnmount() {
    window.removeEventListener('desens:download-result', this._downloadFeedback)
    window.removeEventListener('desens:status', this._statusFeedback)
    window.removeEventListener('desens:confirm-request', this._confirmRequest)
    document.removeEventListener('click', this._buttonFeedback, true)
    clearTimeout(this.toastTimer)
  }
}
</script>

<style>
.app-toast{position:fixed;z-index:3000;left:50%;bottom:28px;transform:translateX(-50%);padding:11px 18px;border-radius:999px;background:#111827;color:#fff;font-size:13px;box-shadow:0 8px 24px rgba(15,23,42,.2);pointer-events:none}.toast-enter-active,.toast-leave-active{transition:opacity .18s,transform .18s}.toast-enter-from,.toast-leave-to{opacity:0;transform:translate(-50%,8px)}
.download-result-modal{position:fixed;z-index:3200;inset:0;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.45);backdrop-filter:blur(3px)}.download-result-modal__card{width:min(420px,100%);padding:30px;border-radius:18px;background:#fff;text-align:center;box-shadow:0 22px 60px rgba(15,23,42,.28)}.download-result-modal__icon{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 14px;border-radius:50%;font-size:28px;font-weight:700}.download-result-modal__icon.is-success{color:#166534;background:#dcfce7}.download-result-modal__icon.is-error{color:#b91c1c;background:#fee2e2}.download-result-modal__card h2{margin:0 0 10px}.download-result-modal__card p{margin:0;color:#475569}.download-result-modal__card small{display:block;margin:12px 0 18px;color:#64748b;word-break:break-all}.download-result-modal__card .btn{margin-top:18px;min-width:120px}
.action-confirm-modal{position:fixed;z-index:3300;inset:0;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.48);backdrop-filter:blur(5px)}.action-confirm-modal__card{width:min(460px,100%);padding:30px;border-radius:20px;background:#fff;text-align:center;box-shadow:0 24px 80px rgba(15,23,42,.28)}.action-confirm-modal__icon{display:grid;place-items:center;width:60px;height:60px;margin:0 auto 16px;border-radius:50%;background:#e0f2fe;color:#0369a1;font-size:28px;font-weight:700}.action-confirm-modal__icon.is-warning{background:#fef3c7;color:#92400e}.action-confirm-modal__card h2{margin:0;font-size:26px}.action-confirm-modal__card p{margin:16px 0 24px;color:#475569;line-height:1.75;white-space:pre-line}.action-confirm-modal__actions{display:flex;justify-content:center;gap:12px}.action-confirm-modal__actions .btn{min-width:120px}
</style>
