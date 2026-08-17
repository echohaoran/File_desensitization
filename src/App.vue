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
          <router-link to="/convert">格式转换</router-link>
        </nav>
        <div class="header-spacer"></div>
      </div>
    </header>

    <div v-if="showVersionDialog" class="version-modal" role="dialog" aria-modal="true" aria-label="版本更新" @click.self="showVersionDialog = false">
      <section class="version-modal__card">
        <header class="version-modal__head"><div><span class="mono-label">CNB UPDATE</span><h2>版本更新</h2></div><button class="icon-btn" @click="showVersionDialog = false" aria-label="关闭版本更新窗口">×</button></header>
        <p class="version-modal__status" :class="{ 'is-update': updateAvailable }">{{ versionStatus }}</p>
        <dl class="version-modal__meta"><div><dt>当前版本</dt><dd>{{ currentVersion }} · {{ shortRevision(versionInfo?.current_revision) }}</dd></div><div><dt>更新来源</dt><dd>CNB / main</dd></div></dl>
        <section class="version-modal__commits"><h3>最近提交</h3><p v-if="checkingUpdate">正在从 CNB 获取版本信息…</p><p v-else-if="!versionInfo?.commits?.length">暂未取得提交摘要，可前往 CNB 仓库查看。</p><ol v-else><li v-for="commit in versionInfo.commits" :key="commit.id"><code>{{ commit.short_id }}</code><span>{{ commit.message }}</span><time>{{ formatCommitDate(commit.created_at) }}</time></li></ol></section>
        <p class="version-modal__hint">更新版本将通过 CNB 部署流程获取；请勿直接覆盖本机脱敏历史。</p>
        <footer class="version-modal__actions"><button class="btn btn--secondary" @click="checkForUpdates" :disabled="checkingUpdate">检查更新</button><button class="btn btn--primary" @click="requestUpdate">更新版本</button><a class="btn btn--ghost" :href="repositoryUrl" target="_blank" rel="noopener">前往仓库</a></footer>
      </section>
    </div>

    <main>
      <router-view />
    </main>

    <!-- Status announcer for accessibility -->
    <div class="sr-only" aria-live="polite" role="status">{{ statusMessage }}</div>
  </div>
</template>

<script>
import { apiUrl } from '@/api/desensitization'

export default {
  name: 'App',
  data() {
    return {
      statusMessage: '',
      currentVersion: 'v0.1.0',
      updateAvailable: false,
      checkingUpdate: false,
      showVersionDialog: false,
      versionInfo: null,
      versionError: ''
    }
  },
  computed: {
    repositoryUrl() {
      return this.versionInfo?.repository || 'https://cnb.cool/echohaoran/File_desensitization'
    },
    versionStatus() {
      if (this.checkingUpdate) return '正在从 CNB 检查最新版本…'
      if (this.versionError) return this.versionError
      return this.updateAvailable ? 'CNB main 有新的可用提交。' : '已从 CNB 检查：当前已是最新版本。'
    }
  },
  methods: {
    announce(message) {
      this.statusMessage = ''
      setTimeout(() => { this.statusMessage = message }, 100)
    },
    openVersionDialog() {
      this.showVersionDialog = true
      this.checkForUpdates()
    },
    shortRevision(value) {
      return value ? String(value).slice(0, 7) : '本机部署'
    },
    formatCommitDate(value) {
      return value ? new Date(value).toLocaleDateString('zh-CN') : ''
    },
    requestUpdate() {
      if (!this.updateAvailable) {
        this.announce('当前已是最新版本，无需更新')
        return
      }
      window.open(this.repositoryUrl, '_blank', 'noopener')
      this.announce('已打开 CNB 仓库，请通过部署流程更新版本')
    },
    async checkForUpdates() {
      if (this.checkingUpdate) return
      this.checkingUpdate = true
      try {
        const response = await fetch(apiUrl('/api/version/check?ts=' + Date.now()), { cache: 'no-store' })
        if (!response.ok) throw new Error('CNB update endpoint unavailable')
        const data = await response.json()
        this.versionInfo = data
        this.versionError = ''
        this.updateAvailable = Boolean(data.update_available)
        this.announce(this.updateAvailable ? 'CNB main 有新的可用提交' : '已从 CNB 检查：当前已是最新版本')
      } catch (_) {
        try {
          const response = await fetch('/version.json?ts=' + Date.now(), { cache: 'no-store' })
          if (!response.ok) throw new Error('fallback endpoint unavailable')
          const data = await response.json()
          const latest = String(data.version || '').replace(/^v/, '')
          const current = this.currentVersion.replace(/^v/, '')
          this.updateAvailable = Boolean(latest && latest !== current)
          this.announce(this.updateAvailable ? `检测到备用更新 v${latest}` : 'CNB 暂不可用；本机版本无更新')
        } catch (_) {
          this.versionInfo = null
          this.versionError = '暂时无法连接 CNB 更新源'
          this.announce('暂时无法检查 CNB 更新')
        }
      } finally {
        this.checkingUpdate = false
      }
    }
  }
}
</script>
