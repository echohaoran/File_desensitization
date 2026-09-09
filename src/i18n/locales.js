export const languages = [
  { code: 'zh', name: '简体中文', tag: 'zh-CN', dir: 'ltr' },
  { code: 'en', name: 'English', tag: 'en-US', dir: 'ltr' },
  { code: 'fr', name: 'Français', tag: 'fr-FR', dir: 'ltr' },
  { code: 'ja', name: '日本語', tag: 'ja-JP', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', tag: 'de-DE', dir: 'ltr' },
  { code: 'ko', name: '한국어', tag: 'ko-KR', dir: 'ltr' }
]

export function resolveLocale(saved, preferred = []) {
  const supported = new Set(languages.map(item => item.code))
  if (supported.has(saved)) return saved
  return preferred.map(value => String(value || '').toLowerCase().split(/[-_]/)[0])
    .find(code => supported.has(code)) || 'en'
}
