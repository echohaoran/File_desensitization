<template>
  <div id="app">
    <!-- Shared Header -->
    <header class="site-header">
      <div class="container site-header__inner">
        <router-link class="brand" to="/" :aria-label="$t('shell.homeLabel')">
          <img class="brand__mark" src="/assets/desens-shield.png" alt="" aria-hidden="true" />
          <span class="brand__content">
            <span class="brand__name">{{ $t('shell.brand') }}<span v-if="$i18n.locale === 'zh'"> / DESENS</span></span>
            <button class="brand__version" :class="{ 'has-update': updateAvailable }" type="button" @click.stop.prevent="openVersionDialog" :title="checkingUpdate ? t('shell.checking') : t('shell.check')">
              {{ currentVersion }}<i v-if="updateAvailable" :aria-label="$t('shell.newVersion')"></i>
            </button>
          </span>
        </router-link>
        <nav class="site-nav" :aria-label="$t('shell.nav')">
          <router-link to="/">{{ $t('shell.home') }}</router-link>
          <router-link to="/desensitize">{{ $t('shell.redact') }}</router-link>
          <router-link to="/restore">{{ $t('shell.restore') }}</router-link>
          <router-link to="/sensitive-rules">{{ $t('shell.rules') }}</router-link>
          <router-link to="/settings">{{ $t('shell.settings') }}</router-link>
        </nav>
        <div class="header-spacer"></div>
        <select class="language-select" :value="$i18n.locale" :aria-label="$t('shell.language')" @change="setLocale($event.target.value)">
          <option v-for="language in languages" :key="language.code" :value="language.code" :lang="language.tag">{{ language.name }}</option>
        </select>
      </div>
    </header>

    <div v-if="showVersionDialog" class="version-modal" role="dialog" aria-modal="true" :aria-label="$t('shell.updateTitle')" @click.self="showVersionDialog = false">
      <section class="version-modal__card">
        <header class="version-modal__head"><div><span class="mono-label">GITHUB RELEASE UPDATE</span><h2>{{ $t('shell.updateTitle') }}</h2></div><button class="icon-btn" :disabled="updating" @click="showVersionDialog = false" :aria-label="$t('shell.closeUpdate')">×</button></header>
        <p class="version-modal__status" :class="{ 'is-update': updateAvailable }">{{ versionStatus }}</p>
        <dl class="version-modal__meta"><div><dt>{{ $t('shell.current') }}</dt><dd>{{ currentVersion }}</dd></div><div><dt>{{ $t('shell.source') }}</dt><dd>{{ $t('shell.signedSource') }}</dd></div></dl>
        <section class="version-modal__commits"><h3>{{ $t('shell.notes') }}</h3><p v-if="checkingUpdate">{{ $t('shell.checkingRelease') }}</p><p v-else-if="!versionInfo?.notes">{{ updateAvailable ? t('shell.noNotes') : t('shell.latest') }}</p><p v-else class="version-modal__notes">{{ versionInfo.notes }}</p></section>
        <div v-if="updateProgress.active" class="version-modal__progress" role="progressbar" :aria-valuenow="updateProgress.percent" aria-valuemin="0" aria-valuemax="100">
          <div class="version-modal__progress-head"><span>{{ updateProgress.label }}</span><strong>{{ updateProgress.percent }}%</strong></div>
          <div class="version-modal__progress-track"><i :style="{ width: `${updateProgress.percent}%` }"></i></div>
          <small>{{ formatBytes(updateProgress.downloaded) }}<template v-if="updateProgress.total"> / {{ formatBytes(updateProgress.total) }}</template></small>
        </div>
        <p class="version-modal__hint">{{ $t('shell.updateHint') }}</p>
        <footer class="version-modal__actions"><button class="btn btn--secondary" @click="checkForUpdates" :disabled="checkingUpdate || updating">{{ checkingUpdate ? t('shell.checkingShort') : t('shell.check') }}</button><button class="btn btn--primary" @click="requestUpdate" :disabled="!updateAvailable || updating">{{ updating ? t('shell.downloading') : t('shell.update') }}</button><a class="btn btn--ghost" :href="repositoryUrl" target="_blank" rel="noopener" @click="showToast(t('shell.openRepo'))">{{ $t('shell.repository') }}</a></footer>
      </section>
    </div>

    <div v-if="showRestartDialog" class="action-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="restart-update-title">
      <section class="action-confirm-modal__card">
        <div class="action-confirm-modal__icon">✓</div>
        <h2 id="restart-update-title">{{ $t('shell.downloaded') }}</h2>
        <p>{{ $t('shell.restartMessage', { version: versionInfo?.version }) }}</p>
        <div class="action-confirm-modal__actions"><button class="btn btn--secondary" :disabled="installingUpdate" @click="showRestartDialog = false">{{ $t('shell.later') }}</button><button class="btn btn--primary" :disabled="installingUpdate" @click="installAndRestart">{{ installingUpdate ? t('shell.restarting') : t('shell.restart') }}</button></div>
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
        <h2 id="download-result-title">{{ downloadDialog.success ? t('shell.downloadDone') : t('shell.downloadFailed') }}</h2>
        <p>{{ downloadDialog.message }}</p>
        <small v-if="downloadDialog.filename">{{ downloadDialog.filename }}<template v-if="downloadDialog.size"> · {{ formatBytes(downloadDialog.size) }}</template></small>
        <button class="btn btn--primary" @click="downloadDialog = null">{{ $t('shell.ok') }}</button>
      </section>
    </div>
    <div v-if="actionConfirm" class="action-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="action-confirm-title" @click.self="resolveActionConfirm(false)">
      <section class="action-confirm-modal__card">
        <div class="action-confirm-modal__icon" :class="{ 'is-warning': actionConfirm.tone === 'warning' }">?</div>
        <h2 id="action-confirm-title">{{ actionConfirm.title }}</h2>
        <p>{{ actionConfirm.message }}</p>
        <div class="action-confirm-modal__actions">
          <button class="btn btn--secondary" data-no-feedback="true" @click="resolveActionConfirm(false)">{{ actionConfirm.cancelText || $t('shell.cancel') }}</button>
          <button class="btn btn--primary" data-no-feedback="true" @click="resolveActionConfirm(true)">{{ actionConfirm.confirmText }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { t, languages, setLocale, getLocale } from '@/i18n'
import { isTauriRuntime } from '@/api/tauriBridge'
import packageInfo from '../package.json'

export default {
  name: 'App',
  data() {
    return {
      languages,
      statusMessage: '',
      currentVersion: `v${packageInfo.version} Beta`,
      updateAvailable: false,
      checkingUpdate: false,
      showVersionDialog: false,
      versionInfo: null,
      versionError: '',
      updateRequestId: 0,
      updateResource: null,
      updateProgress: { active: false, downloaded: 0, total: 0, percent: 0, label: t('shell.downloadPackage') },
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
      if (this.checkingUpdate) return t('shell.checkingRelease')
      if (this.updating) return this.updateProgress.label
      if (this.versionError) return this.versionError
      return this.updateAvailable ? t('shell.available', { version: this.versionInfo?.version }) : t('shell.latest')
    }
  },
  methods: {
    t,
    setLocale,
    showToast(message) {
      this.toastMessage = message
      clearTimeout(this.toastTimer)
      this.toastTimer = setTimeout(() => { this.toastMessage = '' }, 2200)
    },
    formatBytes(bytes) {
      if (!bytes) return ''
      const unit = bytes < 1024 ? 'byte' : bytes < 1024 * 1024 ? 'kilobyte' : 'megabyte'
      const divisor = unit === 'byte' ? 1 : unit === 'kilobyte' ? 1024 : 1024 * 1024
      return new Intl.NumberFormat(getLocale(), { style: 'unit', unit, maximumFractionDigits: 1 }).format(bytes / divisor)
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
      this.showToast(t('shell.openVersion'))
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
      if (!response.ok) throw new Error(t('shell.httpError', { status: response.status }))
      const release = await response.json()
      return { version: String(release.tag_name || '').replace(/^v/, ''), notes: release.body || '', date: release.published_at || '' }
    },
    async requestUpdate() {
      if (!this.updateAvailable || this.updating) return
      if (!this.desktopRuntime || !this.updateResource) {
        this.versionError = t('shell.desktopOnly')
        return
      }
      this.updating = true
      this.updateProgress = { active: true, downloaded: 0, total: 0, percent: 0, label: t('shell.downloadPackage') }
      try {
        await this.updateResource.download((event) => {
          if (event.event === 'Started') {
            this.updateProgress.total = event.data.contentLength || 0
            this.updateProgress.label = t('shell.downloadVerify')
          } else if (event.event === 'Progress') {
            this.updateProgress.downloaded += event.data.chunkLength
            this.updateProgress.percent = this.updateProgress.total ? Math.min(99, Math.round(this.updateProgress.downloaded / this.updateProgress.total * 100)) : 0
          } else if (event.event === 'Finished') {
            this.updateProgress.percent = 100
            this.updateProgress.label = t('shell.finishingVerify')
          }
        })
        this.updateProgress.percent = 100
        this.updateProgress.label = t('shell.ready')
        this.showRestartDialog = true
        this.announce(t('shell.restartPending', { version: this.versionInfo?.version }))
      } catch (error) {
        this.versionError = t('shell.verifyFailed', { error: error?.message || t('shell.unknown') })
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
        this.versionError = t('shell.installFailed', { error: error?.message || t('shell.unknown') })
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
            // Tauri Update is a Resource with private fields. Vue must not proxy it,
            // otherwise method calls such as download() lose the native private slot.
            this.updateResource = update ? markRaw(update) : null
            this.versionInfo = update ? { version: update.version, notes: update.body || '', date: update.date || '' } : null
            this.updateAvailable = Boolean(update)
            this.announce(update ? t('shell.found', { version: update.version }) : t('shell.latestShort'))
          } catch (updaterError) {
            const release = await this.fetchLatestRelease()
            if (requestId !== this.updateRequestId) return
            this.versionInfo = release
            if (this.isNewerVersion(release.version)) {
              this.versionError = t('shell.manifestPending', { version: release.version })
              this.announce(t('shell.manifestMissing'))
            } else {
              this.versionError = ''
              this.announce(t('shell.latestManifest'))
            }
          }
          return
        }
        const release = await this.fetchLatestRelease()
        if (requestId !== this.updateRequestId) return
        this.versionInfo = release
        this.updateAvailable = this.isNewerVersion(this.versionInfo.version)
        this.announce(this.updateAvailable ? t('shell.foundRelease', { version: this.versionInfo.version }) : t('shell.latestShort'))
      } catch (error) {
        if (requestId !== this.updateRequestId) return
        this.versionInfo = null
        this.versionError = t('shell.checkFailed', { error: error?.message || t('shell.network') })
        this.announce(t('shell.unavailable'))
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
      if (!label || label === '×' || label === t('shell.ok')) return
      this.showToast(t('shell.processing', { label }))
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
