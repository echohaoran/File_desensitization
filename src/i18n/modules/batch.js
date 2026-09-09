const rows = [
  ['delete', '批量删除', 'Delete selected', 'Supprimer la sélection', '一括削除', 'Auswahl löschen', '선택 항목 삭제'],
  ['deleteTitle', '删除所选敏感字段？', 'Delete selected sensitive fields?', 'Supprimer les champs sélectionnés ?', '選択した機密項目を削除しますか？', 'Ausgewählte sensible Felder löschen?', '선택한 민감 필드를 삭제할까요?'],
  ['deleteMessage', '将删除所选的 {count} 项敏感字段，后续检测不再使用这些规则。确认继续？', 'Delete {count} selected sensitive fields? These rules will no longer be used for detection.', 'Supprimer les {count} champs sélectionnés ? Ces règles ne seront plus utilisées pour la détection.', '選択した {count} 件の機密項目を削除します。以後の検出では使用されません。続行しますか？', '{count} ausgewählte sensible Felder löschen? Diese Regeln werden danach nicht mehr zur Erkennung verwendet.', '선택한 민감 필드 {count}개를 삭제합니다. 이후 탐지에 사용되지 않습니다. 계속할까요?'],
  ['deleteConfirm', '确认删除', 'Confirm deletion', 'Confirmer la suppression', '削除を確認', 'Löschen bestätigen', '삭제 확인'],
  ['deleted', '已删除 {count} 项敏感字段', 'Deleted {count} sensitive fields', '{count} champs sensibles supprimés', '{count} 件の機密項目を削除しました', '{count} sensible Felder gelöscht', '민감 필드 {count}개 삭제됨'],
  ['deleteFailed', '删除失败，请刷新列表检查后重试。', 'Deletion failed. Refresh the list and try again.', 'Échec de la suppression. Actualisez la liste et réessayez.', '削除に失敗しました。一覧を更新して再試行してください。', 'Löschen fehlgeschlagen. Liste aktualisieren und erneut versuchen.', '삭제에 실패했습니다. 목록을 새로 고친 후 다시 시도하세요.'],
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
