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
        <header class="version-modal__head"><div><span class="mono-label">GITHUB RELEASE UPDATE</span><h2>版本更新</h2></div><button class="icon-btn" :disabled="updating" @click="showVersionDialog = false" aria-label="关闭版本更新窗口">×</button></header>
        <p class="version-modal__status" :class="{ 'is-update': updateAvailable }">{{ versionStatus }}</p>
        <dl class="version-modal__meta"><div><dt>当前版本</dt><dd>{{ currentVersion }}</dd></div><div><dt>更新来源</dt><dd>GitHub Release · 签名验证</dd></div></dl>
        <section class="version-modal__commits"><h3>发布说明</h3><p v-if="checkingUpdate">正在检查 GitHub Release…</p><p v-else-if="!versionInfo?.notes">{{ updateAvailable ? '该版本未提供更新说明。' : '当前已是最新版本。' }}</p><p v-else class="version-modal__notes">{{ versionInfo.notes }}</p></section>
        <div v-if="updateProgress.active" class="version-modal__progress" role="progressbar" :aria-valuenow="updateProgress.percent" aria-valuemin="0" aria-valuemax="100">
          <div class="version-modal__progress-head"><span>{{ updateProgress.label }}</span><strong>{{ updateProgress.percent }}%</strong></div>
          <div class="version-modal__progress-track"><i :style="{ width: `${updateProgress.percent}%` }"></i></div>
          <small>{{ formatBytes(updateProgress.downloaded) }}<template v-if="updateProgress.total"> / {{ formatBytes(updateProgress.total) }}</template></small>
        </div>
        <p class="version-modal__hint">更新包来自 GitHub Release，并在安装前由应用验证签名；不会覆盖本机脱敏历史。</p>
        <footer class="version-modal__actions"><button class="btn btn--secondary" @click="checkForUpdates" :disabled="checkingUpdate || updating">{{ checkingUpdate ? '检查中…' : '检查更新' }}</button><button class="btn btn--primary" @click="requestUpdate" :disabled="!updateAvailable || updating">{{ updating ? '正在下载…' : '更新版本' }}</button><a class="btn btn--ghost" :href="repositoryUrl" target="_blank" rel="noopener" @click="showToast('正在打开代码仓库')">前往仓库</a></footer>
      </section>
    </div>

    <div v-if="showRestartDialog" class="action-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="restart-update-title">
      <section class="action-confirm-modal__card">
        <div class="action-confirm-modal__icon">✓</div>
        <h2 id="restart-update-title">更新已下载</h2>
        <p>版本 {{ versionInfo?.version }} 已通过签名校验并准备安装。重启应用后将完成更新。</p>
        <div class="action-confirm-modal__actions"><button class="btn btn--secondary" :disabled="installingUpdate" @click="showRestartDialog = false">稍后重启</button><button class="btn btn--primary" :disabled="installingUpdate" @click="installAndRestart">{{ installingUpdate ? '正在重启…' : '立即重启' }}</button></div>
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
import { isTauriRuntime } from '@/api/tauriBridge'
import packageInfo from '../package.json'

export default {
  name: 'App',
  data() {
    return {
      statusMessage: '',
      currentVersion: `v${packageInfo.version} Beta`,
      updateAvailable: false,
      checkingUpdate: false,
      showVersionDialog: false,
      versionInfo: null,
      versionError: '',
      updateRequestId: 0,
      updateResource: null,
      updateProgress: { active: false, downloaded: 0, total: 0, percent: 0, label: '正在下载更新包' },
      updating: false,
      installingUpdate: false,
      showRestartDialog: false,
      toastMessage: '',
      toastTimer: null,
      downloadDialog: null,
      actionConfirm: null,
      desktopRuntime: isTauriRuntime()
    }
  },
  computed: {
    repositoryUrl() {
      return 'https://github.com/echohaoran/File_desensitization'
    },
    versionStatus() {
      if (this.checkingUpdate) return '正在检查 GitHub Release…'
      if (this.updating) return this.updateProgress.label
      if (this.versionError) return this.versionError
      return this.updateAvailable ? `发现可用更新：v${this.versionInfo?.version}。` : '当前已是最新版本。'
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
    isNewerVersion(version) {
      const parse = value => String(value || '').replace(/^v/, '').split('.').map(part => Number(part.replace(/\D.*$/, '')) || 0)
      const [nextMajor, nextMinor, nextPatch] = parse(version)
      const [currentMajor, currentMinor, currentPatch] = parse(packageInfo.version)
      return nextMajor > currentMajor || (nextMajor === currentMajor && (nextMinor > currentMinor || (nextMinor === currentMinor && nextPatch > currentPatch)))
    },
    async fetchLatestRelease() {
      const response = await fetch('https://api.github.com/repos/echohaoran/File_desensitization/releases/latest', { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' })
      if (!response.ok) throw new Error(`GitHub Release 返回 ${response.status}`)
      const release = await response.json()
      return { version: String(release.tag_name || '').replace(/^v/, ''), notes: release.body || '', date: release.published_at || '' }
    },
    async requestUpdate() {
      if (!this.updateAvailable || this.updating) return
      if (!this.desktopRuntime || !this.updateResource) {
        this.versionError = '自动更新仅在已签名的桌面安装包中可用。'
        return
      }
      this.updating = true
      this.updateProgress = { active: true, downloaded: 0, total: 0, percent: 0, label: '正在下载更新包' }
      try {
        await this.updateResource.download((event) => {
          if (event.event === 'Started') {
            this.updateProgress.total = event.data.contentLength || 0
            this.updateProgress.label = '正在下载并验证更新包'
          } else if (event.event === 'Progress') {
            this.updateProgress.downloaded += event.data.chunkLength
            this.updateProgress.percent = this.updateProgress.total ? Math.min(99, Math.round(this.updateProgress.downloaded / this.updateProgress.total * 100)) : 0
          } else if (event.event === 'Finished') {
            this.updateProgress.percent = 100
            this.updateProgress.label = '更新包已下载，正在完成签名校验'
          }
        })
        this.updateProgress.percent = 100
        this.updateProgress.label = '更新已准备就绪'
        this.showRestartDialog = true
        this.announce(`更新 v${this.versionInfo?.version} 下载完成，等待确认重启`)
      } catch (error) {
        this.versionError = `更新下载或签名校验失败：${error?.message || '未知错误'}`
        this.updateProgress.active = false
      } finally {
        this.updating = false
      }
    },
    async installAndRestart() {
      if (!this.updateResource || this.installingUpdate) return
      this.installingUpdate = true
      try {
        await this.updateResource.install({ restartAfterInstall: true })
        if (!/Windows/i.test(navigator.userAgent)) {
          const { relaunch } = await import('@tauri-apps/plugin-process')
          await relaunch()
        }
      } catch (error) {
        this.installingUpdate = false
        this.showRestartDialog = false
        this.versionError = `更新安装失败：${error?.message || '未知错误'}`
      }
    },
    async checkForUpdates() {
      const requestId = ++this.updateRequestId
      this.checkingUpdate = true
      this.versionError = ''
      this.updateAvailable = false
      if (this.updateResource) this.updateResource.close().catch(() => {})
      this.updateResource = null
      try {
        if (this.desktopRuntime) {
          try {
            const { check } = await import('@tauri-apps/plugin-updater')
            const update = await check({ timeout: 15000 })
            if (requestId !== this.updateRequestId) { await update?.close?.(); return }
            this.updateResource = update
            this.versionInfo = update ? { version: update.version, notes: update.body || '', date: update.date || '' } : null
            this.updateAvailable = Boolean(update)
            this.announce(update ? `发现更新 v${update.version}` : '当前已是最新版本')
          } catch (updaterError) {
            const release = await this.fetchLatestRelease()
            if (requestId !== this.updateRequestId) return
            this.versionInfo = release
            if (this.isNewerVersion(release.version)) {
              this.versionError = `发现 v${release.version}，但签名更新清单尚未发布，请稍后重试。`
              this.announce('更新清单尚未发布')
            } else {
              this.versionError = ''
              this.announce('当前已是最新版本；签名更新清单将在下次发布后启用')
            }
          }
          return
        }
        const release = await this.fetchLatestRelease()
        if (requestId !== this.updateRequestId) return
        this.versionInfo = release
        this.updateAvailable = this.isNewerVersion(this.versionInfo.version)
        this.announce(this.updateAvailable ? `发现 GitHub Release 更新 v${this.versionInfo.version}` : '当前已是最新版本')
      } catch (error) {
        if (requestId !== this.updateRequestId) return
        this.versionInfo = null
        this.versionError = `暂时无法检查 GitHub Release：${error?.message || '网络错误'}`
        this.announce('暂时无法检查 GitHub Release')
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
.version-modal__progress{margin:18px 0;padding:14px 16px;border:1px solid #dbe4f0;border-radius:12px;background:#f8fafc}.version-modal__progress-head{display:flex;justify-content:space-between;gap:16px;color:#334155;font-size:13px}.version-modal__progress-head strong{color:#0f172a}.version-modal__progress-track{height:8px;margin:10px 0 7px;overflow:hidden;border-radius:999px;background:#e2e8f0}.version-modal__progress-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2563eb,#7c3aed);transition:width .2s ease}.version-modal__progress small{color:#64748b;font-variant-numeric:tabular-nums}.version-modal__notes{max-height:120px;overflow:auto;white-space:pre-wrap}
</style>
