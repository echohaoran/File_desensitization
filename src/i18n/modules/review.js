const rows = [
  ['navigation', '脱敏校对导航', 'Redaction review navigation', 'Navigation de vérification', 'マスキング確認ナビゲーション', 'Navigation zur Maskierungsprüfung', '비식별화 검토 탐색'],
  ['previous', '上一个', 'Previous', 'Précédent', '前へ', 'Zurück', '이전'],
  ['next', '下一个', 'Next', 'Suivant', '次へ', 'Weiter', '다음'],
  ['position', '{current} / {total}', '{current} / {total}', '{current} / {total}', '{current} / {total}', '{current} / {total}', '{current} / {total}']
]
export default Object.fromEntries(['zh', 'en', 'fr', 'ja', 'de', 'ko'].map((locale, index) => [locale, { review: Object.fromEntries(rows.map(row => [row[0], row[index + 1]])) }]))
