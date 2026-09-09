const rows = [
 ['addFields','添加字段','Add fields','Ajouter des champs','項目を追加','Felder hinzufügen','필드 추가'],
 ['pending','待处理选区：{count}','Pending selections: {count}','Sélections en attente : {count}','未処理の選択範囲：{count}','Ausstehende Auswahlen: {count}','대기 중 선택 영역: {count}'],
 ['clear','清空选区','Clear selections','Effacer les sélections','選択をクリア','Auswahl leeren','선택 지우기'],
 ['remove','移除此选区','Remove this selection','Retirer cette sélection','この選択を削除','Diese Auswahl entfernen','이 선택 제거'],
 ['confirm','将一次性处理 {count} 个选区，确认继续？','Process {count} selections together?','Traiter ensemble {count} sélections ?','{count} 件の選択範囲をまとめて処理しますか？','{count} Auswahlen gemeinsam verarbeiten?','선택 영역 {count}개를 한 번에 처리할까요?'],
 ['failed','处理失败，已保留选区，请重试。','Processing failed. Selections were kept; please retry.','Échec du traitement. Les sélections sont conservées. Réessayez.','処理に失敗しました。選択範囲を保持しています。再試行してください。','Verarbeitung fehlgeschlagen. Die Auswahl bleibt erhalten. Bitte erneut versuchen.','처리에 실패했습니다. 선택 영역이 유지되었습니다. 다시 시도하세요.']
]
export default Object.fromEntries(['zh','en','fr','ja','de','ko'].map((locale,i)=>[locale,{selection:Object.fromEntries(rows.map(row=>[row[0],row[i+1]]))}]))
