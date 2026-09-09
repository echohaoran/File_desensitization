import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/css/styles.css'
import './assets/css/i18n.css'
import { i18n, setLocale } from './i18n'

const app = createApp(App)
app.use(router)
app.use(i18n)
setLocale(i18n.global.locale.value)
app.mount('#app')
