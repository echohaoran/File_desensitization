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
        <div class="user-info">
          <span class="user-info__dot" aria-hidden="true"></span>
          <span class="user-info__label">访客模式</span>
        </div>
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
      statusMessage: ''
    }
  },
  methods: {
    announce(message) {
      this.statusMessage = ''
      setTimeout(() => { this.statusMessage = message }, 100)
    }
  }
}
</script>
