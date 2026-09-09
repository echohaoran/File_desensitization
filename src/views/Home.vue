<template>
  <div class="container index-main">
    <div class="index-eyebrow">
      <span class="index-eyebrow__line" aria-hidden="true"></span>
      <span class="mono-label">{{ $t('home.eyebrow') }}</span>
    </div>

    <section class="index-hero">
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.intro') }}</p>
    </section>

    <section class="cards-grid" :aria-label="$t('home.navigation')">
      <router-link class="nav-card" to="/desensitize" :aria-label="$t('home.redactLabel')">
        <div class="nav-card__head">
          <span class="nav-card__num">01</span>
          <span class="nav-card__tag">{{ $t('shell.redact') }}</span>
        </div>
        <h2>{{ $t('home.redactTitle') }}</h2>
        <p>{{ $t('home.redactIntro') }}</p>
        <ul class="nav-card__features">
          <li>{{ $t('home.detect') }}</li>
          <li>{{ $t('home.review') }}</li>
          <li>{{ $t('home.history') }}</li>
        </ul>
        <span class="btn btn--primary btn--block">
          {{ $t('home.enter') }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </router-link>

      <router-link class="nav-card" to="/restore" :aria-label="$t('home.restoreLabel')">
        <div class="nav-card__head">
          <span class="nav-card__num">02</span>
          <span class="nav-card__tag">{{ $t('shell.restore') }}</span>
        </div>
        <h2>{{ $t('home.restoreTitle') }}</h2>
        <p>{{ $t('home.restoreIntro') }}</p>
        <ul class="nav-card__features">
          <li>{{ $t('home.localMapping') }}</li>
          <li>{{ $t('home.placeholders') }}</li>
          <li>{{ $t('home.mappingRecords') }}</li>
        </ul>
        <span class="btn btn--secondary btn--block">
          {{ $t('home.enter') }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </router-link>
    </section>

    <div class="index-strip">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <p><strong>{{ $t('home.usage') }}</strong>{{ $t('home.usageText') }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>
