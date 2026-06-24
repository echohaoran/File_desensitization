<template>
  <div class="login-page">
    <a href="#loginMain" class="skip-link">跳转到登录表单</a>

    <main class="login-main" id="loginMain" aria-label="登录与注册">
      <div class="login-card">
        <div class="login-card__head">
          <div class="login-card__brand">
            <span class="brand__mark" aria-hidden="true"></span>
            <span class="brand__name">DESENS</span>
          </div>
          <span class="mono-label login-card__badge">安全访问</span>
        </div>

        <div class="login-mode-tabs" role="tablist" aria-label="登录或注册">
          <button class="login-mode-tab" :class="{ 'is-active': mode === 'login' }" type="button" role="tab" 
            :aria-selected="mode === 'login'" @click="setMode('login')">登录</button>
          <button class="login-mode-tab" :class="{ 'is-active': mode === 'register' }" type="button" role="tab" 
            :aria-selected="mode === 'register'" @click="setMode('register')">注册</button>
        </div>

        <h1 class="login-card__title">{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h1>
        <p class="login-card__lead">{{ mode === 'login' ? '请使用企业账号登录，每个账户的数据独立存储、互不交叉。' : '注册后你的脱敏映射表与文件将存储在独立会话空间中。' }}</p>

        <div class="login-card__alert" :class="{ 'is-visible': alert }" role="alert" aria-live="assertive">
          {{ alert }}
        </div>

        <form class="login-form" @submit.prevent="handleSubmit" novalidate>
          <div class="field">
            <label class="field__label" for="loginEmail">企业邮箱</label>
            <input class="field__input" :class="{ 'is-invalid': errors.email }" type="email" id="loginEmail" 
              v-model="form.email" placeholder="name@company.com" autocomplete="email" required aria-required="true" />
            <span class="field__hint" :class="{ 'is-error': errors.email }">{{ errors.email || '示例：investor@fund.com' }}</span>
          </div>

          <div class="field">
            <label class="field__label" for="loginPassword">密码</label>
            <div class="field__input-wrap">
              <input class="field__input" :class="{ 'is-invalid': errors.password }" :type="showPassword ? 'text' : 'password'" 
                id="loginPassword" v-model="form.password" placeholder="输入登录密码" 
                :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" required aria-required="true" />
              <button class="field__reveal" type="button" @click="showPassword = !showPassword" 
                :aria-label="showPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showPassword">
                <svg v-if="!showPassword" class="field__reveal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else class="field__reveal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <span class="field__hint" :class="{ 'is-error': errors.password }">{{ errors.password || '密码至少 6 位' }}</span>
          </div>

          <div class="field" v-if="mode === 'register'">
            <label class="field__label" for="loginPasswordConfirm">确认密码</label>
            <input class="field__input" :class="{ 'is-invalid': errors.confirm }" type="password" id="loginPasswordConfirm" 
              v-model="form.confirm" placeholder="再次输入密码" autocomplete="new-password" />
            <span class="field__hint" :class="{ 'is-error': errors.confirm }">{{ errors.confirm || '请再次输入密码' }}</span>
          </div>

          <div class="login-options" v-if="mode === 'login'">
            <label class="check-row">
              <input type="checkbox" v-model="form.remember" />
              <span class="check-row__box" aria-hidden="true"></span>
              <span class="check-row__label">保持登录</span>
            </label>
            <button class="text-link" type="button" @click="alert = '原型环境暂不支持重置密码，请直接登录或注册新账号。'">忘记密码？</button>
          </div>

          <button class="btn btn--primary btn--lg btn--block" type="submit" :disabled="loading">
            <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>{{ loading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登录' : '注册') }}</span>
          </button>

          <p class="login-form__note">{{ mode === 'login' ? '原型环境下输入任意邮箱与 6 位以上密码即可登录。' : '原型环境下输入任意邮箱与 6 位以上密码即可完成注册。' }}</p>
        </form>

        <p class="login-switch">
          <span>{{ mode === 'login' ? '还没有账号？' : '已有账号？' }}</span>
          <button class="text-link" type="button" @click="setMode(mode === 'login' ? 'register' : 'login')">
            {{ mode === 'login' ? '立即注册' : '直接登录' }}
          </button>
        </p>
      </div>

      <p class="login-footer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>用户数据隔离：登录后所有映射表与文件操作均绑定当前会话标识。</span>
      </p>
    </main>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      mode: 'login',
      form: {
        email: '',
        password: '',
        confirm: '',
        remember: false
      },
      errors: {},
      alert: '',
      loading: false,
      showPassword: false
    }
  },
  methods: {
    setMode(mode) {
      this.mode = mode
      this.errors = {}
      this.alert = ''
    },
    validate() {
      this.errors = {}
      
      if (!this.form.email.trim()) {
        this.errors.email = '请输入企业邮箱'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
        this.errors.email = '邮箱格式不正确'
      }
      
      if (!this.form.password) {
        this.errors.password = '请输入密码'
      } else if (this.form.password.length < 6) {
        this.errors.password = '密码至少 6 位'
      }
      
      if (this.mode === 'register' && this.form.password !== this.form.confirm) {
        this.errors.confirm = '两次输入的密码不一致'
      }
      
      return Object.keys(this.errors).length === 0
    },
    handleSubmit() {
      this.alert = ''
      
      if (!this.validate()) {
        this.alert = '请检查表单中的错误项。'
        return
      }
      
      this.loading = true
      
      setTimeout(() => {
        try {
          const user = {
            email: this.form.email.trim(),
            loggedInAt: new Date().toISOString(),
            registered: this.mode === 'register'
          }
          sessionStorage.setItem('desens_user_session', JSON.stringify(user))
        } catch (e) {}
        
        this.$router.push('/')
        this.loading = false
      }, 800)
    }
  }
}
</script>
