const rows = [
  ['done', '完成', 'Done', 'Terminer', '完了', 'Fertig', '완료'],
  ['label', '批量编辑敏感字段', 'Edit sensitive fields in bulk', 'Modifier les champs en lot', '機密項目の一括編集', 'Sensible Felder gesammelt bearbeiten', '민감 필드 일괄 편집'],
  ['selectAll', '全选', 'Select all', 'Tout sélectionner', 'すべて選択', 'Alle auswählen', '전체 선택'],
  ['selected', '已选择 {count} 项', '{count} selected', '{count} sélectionnés', '{count} 件を選択中', '{count} ausgewählt', '{count}개 선택됨'],
  ['selectRule', '选择 {name}', 'Select {name}', 'Sélectionner {name}', '{name} を選択', '{name} auswählen', '{name} 선택'],
  ['disable', '批量停用', 'Disable selected', 'Désactiver la sélection', '一括無効化', 'Auswahl deaktivieren', '선택 항목 비활성화'],
  ['enable', '批量启用', 'Enable selected', 'Activer la sélection', '一括有効化', 'Auswahl aktivieren', '선택 항목 활성화'],
  ['enabled', '已启用 {count} 项敏感字段', 'Enabled {count} sensitive fields', '{count} champs sensibles activés', '{count} 件の機密項目を有効にしました', '{count} sensible Felder aktiviert', '민감 필드 {count}개 활성화됨'],
  ['disabled', '已停用 {count} 项敏感字段', 'Disabled {count} sensitive fields', '{count} champs sensibles désactivés', '{count} 件の機密項目を無効にしました', '{count} sensible Felder deaktiviert', '민감 필드 {count}개 비활성화됨'],
  ['failed', '保存失败，启用状态未更改，请重试。', 'Save failed. Status was not changed. Please try again.', 'Échec de l’enregistrement. Les états sont inchangés. Réessayez.', '保存に失敗しました。状態は変更されていません。再試行してください。', 'Speichern fehlgeschlagen. Der Status wurde nicht geändert. Bitte erneut versuchen.', '저장에 실패했습니다. 상태는 변경되지 않았습니다. 다시 시도하세요.']
]
export default Object.fromEntries(['zh', 'en', 'fr', 'ja', 'de', 'ko'].map((locale, index) => [locale, { batch: Object.fromEntries(rows.map(row => [row[0], row[index + 1]])) }]))
