const rows = [
  ['cancelTitle', '取消此项脱敏？', 'Remove this redaction?', 'Annuler ce masquage ?', 'この項目のマスキングを解除しますか？', 'Diese Maskierung entfernen?', '이 항목의 비식별화를 취소할까요?'],
  ['cancelMessage', '取消后，此处将恢复显示原文，并从检测列表移除：\n{value}', 'This item will be removed from the detection list and its original text will be shown:\n{value}', 'Cet élément sera retiré de la liste et son texte original sera affiché :\n{value}', '検出一覧から削除し、この箇所の原文を表示します：\n{value}', 'Dieser Eintrag wird aus der Liste entfernt und der Originaltext angezeigt:\n{value}', '탐지 목록에서 제거하고 원문을 표시합니다:\n{value}'],
  ['keep', '保留脱敏', 'Keep redaction', 'Conserver le masquage', 'マスキングを維持', 'Maskierung beibehalten', '비식별화 유지'],
  ['navigation', '脱敏校对导航', 'Redaction review navigation', 'Navigation de vérification', 'マスキング確認ナビゲーション', 'Navigation zur Maskierungsprüfung', '비식별화 검토 탐색'],
  ['previous', '上一个', 'Previous', 'Précédent', '前へ', 'Zurück', '이전'],
  ['next', '下一个', 'Next', 'Suivant', '次へ', 'Weiter', '다음'],
  ['position', '{current} / {total}', '{current} / {total}', '{current} / {total}', '{current} / {total}', '{current} / {total}', '{current} / {total}']
]
export default Object.fromEntries(['zh', 'en', 'fr', 'ja', 'de', 'ko'].map((locale, index) => [locale, { review: Object.fromEntries(rows.map(row => [row[0], row[index + 1]])) }]))
