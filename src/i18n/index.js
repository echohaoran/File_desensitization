import { createI18n } from 'vue-i18n'

export const languages = [
  { code: 'zh', name: '简体中文', tag: 'zh-CN', dir: 'ltr' },
  { code: 'en', name: 'English', tag: 'en-US', dir: 'ltr' },
  { code: 'fr', name: 'Français', tag: 'fr-FR', dir: 'ltr' },
  { code: 'ru', name: 'Русский', tag: 'ru-RU', dir: 'ltr' },
  { code: 'ar', name: 'العربية', tag: 'ar', dir: 'rtl' }
]
const messages = Object.fromEntries(languages.map(({ code }) => [code, {}]))
const modules = import.meta.glob('./modules/*.js', { eager: true, import: 'default' })
for (const module of Object.values(modules)) {
  for (const { code } of languages) Object.assign(messages[code], module[code] || {})
}
function initialLocale() {
  let saved
  try { saved = localStorage.getItem('desens_locale') } catch { /* restricted storage */ }
  if (languages.some(({ code }) => code === saved)) return saved
  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language]
  return preferred.map(value => value?.split('-')[0]).find(code => languages.some(item => item.code === code)) || 'en'
}
export const i18n = createI18n({ legacy: false, globalInjection: true, locale: initialLocale(), fallbackLocale: 'en', messages })
export const t = (key, params) => i18n.global.t(key, params || {})
export const getLocale = () => languages.find(item => item.code === i18n.global.locale.value)?.tag || 'en-US'
export function setLocale(code) {
  const language = languages.find(item => item.code === code)
  if (!language) return
  i18n.global.locale.value = code
  document.documentElement.lang = language.tag
  document.documentElement.dir = language.dir
  document.title = t('home.title')
  try { localStorage.setItem('desens_locale', code) } catch { /* in-memory preference still works */ }
  window.dispatchEvent(new CustomEvent('desens:locale-change', { detail: { locale: code } }))
}
