<template>
  <div id="app">
    <!-- Shared Header -->
    <header class="site-header">
      <div class="container site-header__inner">
        <router-link class="brand" to="/" aria-label="脱敏系统首页">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__name">脱敏系统<span> / DESENS</span></span>
        </router-link>
        <nav class="site-nav" aria-label="主导航">
          <router-link to="/">概览</router-link>
          <router-link to="/desensitize">脱敏</router-link>
          <router-link to="/restore">还原</router-link>
        </nav>
        <div class="header-spacer"></div>
        <router-link class="user-pill" to="/login" title="" aria-label="登录 / 当前用户标识">
          <span class="user-pill__dot" aria-hidden="true"></span>
          <span class="user-pill__label">USER</span>
          <span class="user-pill__id">{{ userId }}</span>
        </router-link>
      </div>
    </header>

    <main>
      <router-view />
    </main>

    <!-- Status announcer for accessibility -->
    <div class="sr-only" aria-live="polite" role="status">{{ statusMessage }}</div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      userId: '——',
      statusMessage: ''
    }
  },
  mounted() {
    this.userId = this.getOrCreateUserId().slice(0, 8).toUpperCase()
  },
  methods: {
    getOrCreateUserId() {
      try {
        const key = 'desens_user_id'
        let id = localStorage.getItem(key)
        if (!id) {
          if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            id = window.crypto.randomUUID()
          } else {
            id = 'u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
          }
          localStorage.setItem(key, id)
        }
        return id
      } catch (e) {
        return 'u-fallback-' + Date.now()
      }
    },
    announce(message) {
      this.statusMessage = ''
      setTimeout(() => { this.statusMessage = message }, 100)
    }
  }
}
</script>
