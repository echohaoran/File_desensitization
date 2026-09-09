import { createI18n } from 'vue-i18n'
import { languages, resolveLocale } from './locales'

export { languages }
const messages = Object.fromEntries(languages.map(({ code }) => [code, {}]))
const modules = import.meta.glob('./modules/*.js', { eager: true, import: 'default' })
for (const module of Object.values(modules)) {
  for (const { code } of languages) Object.assign(messages[code], module[code] || {})
}
function initialLocale() {
  let saved
  try { saved = localStorage.getItem('desens_locale') } catch { /* restricted storage */ }
  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language]
  return resolveLocale(saved, preferred)
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
