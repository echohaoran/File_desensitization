use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovedSpan {
    pub start: usize,
    pub end: usize,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mapping {
    pub mapping_id: String,
    pub marker: String,
    pub kind: String,
    pub original: String,
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedactionResult {
    pub document_id: String,
    pub redacted_text: String,
    pub mappings: Vec<Mapping>,
}

#[derive(Debug, thiserror::Error)]
pub enum RedactionError {
    #[error("脱敏区间无效")]
    InvalidSpan,
    #[error("脱敏区间重叠")]
    OverlappingSpan,
}

pub fn redact_text(text: &str, spans: &[ApprovedSpan]) -> Result<RedactionResult, RedactionError> {
    let mut ordered = spans.to_vec();
    ordered.sort_by_key(|span| (span.start, span.end));
    let mut previous_end = 0;
    for span in &ordered {
        if span.start >= span.end
            || span.end > text.len()
            || !text.is_char_boundary(span.start)
            || !text.is_char_boundary(span.end)
        {
            return Err(RedactionError::InvalidSpan);
        }
        if span.start < previous_end {
            return Err(RedactionError::OverlappingSpan);
        }
        previous_end = span.end;
    }
    let document_id = format!("DESENS-DOC-{}", random_id(8));
    let mut redacted = String::with_capacity(text.len());
    let mut mappings = Vec::with_capacity(ordered.len());
    let mut cursor = 0;
    for span in ordered {
        redacted.push_str(&text[cursor..span.start]);
        let marker = format!("{{{}}}", random_id(6));
        let original = text[span.start..span.end].to_string();
        redacted.push_str(&marker);
        mappings.push(Mapping {
            mapping_id: format!("map_{}", Uuid::new_v4().simple()),
            marker,
            kind: span.kind,
            original,
            start: span.start,
            end: span.end,
        });
        cursor = span.end;
    }
    redacted.push_str(&text[cursor..]);
    Ok(RedactionResult {
        document_id,
        redacted_text: redacted,
        mappings,
    })
}

pub fn restore_text(redacted_text: &str, mappings: &[Mapping]) -> (String, Vec<String>) {
    let mut restored = redacted_text.to_string();
    let mut missing = Vec::new();
    for mapping in mappings {
        if restored.contains(&mapping.marker) {
            restored = restored.replace(&mapping.marker, &mapping.original);
        } else {
            missing.push(mapping.marker.clone());
        }
    }
    (restored, missing)
}

fn random_id(length: usize) -> String {
    Uuid::new_v4().simple().to_string()[..length].to_uppercase()
}

#[cfg(test)]
mod tests {
    use super::{redact_text, restore_text, ApprovedSpan};
    #[test]
    fn redacts_and_restores_utf8() {
        let text = "联系人：张三，电话：13800138000";
        let start = text.find("13800138000").unwrap();
        let result = redact_text(
            text,
            &[ApprovedSpan {
                start,
                end: start + "13800138000".len(),
                kind: "phone".into(),
            }],
        )
        .unwrap();
        assert!(!result.redacted_text.contains("13800138000"));
        let (restored, missing) = restore_text(&result.redacted_text, &result.mappings);
        assert_eq!(restored, text);
        assert!(missing.is_empty());
    }
    #[test]
    fn rejects_overlapping_spans() {
        let error = redact_text(
            "abcdefgh",
            &[
                ApprovedSpan {
                    start: 1,
                    end: 4,
                    kind: "x".into(),
                },
                ApprovedSpan {
                    start: 3,
                    end: 5,
                    kind: "y".into(),
                },
            ],
        )
        .unwrap_err();
        assert!(matches!(error, super::RedactionError::OverlappingSpan));
    }

    #[test]
    fn restores_partial_mapping_and_reports_missing_marker() {
        let mappings = vec![
            super::Mapping { mapping_id: "map_a".into(), marker: "{A1}".into(), kind: "name".into(), original: "张三".into(), start: 0, end: 6 },
            super::Mapping { mapping_id: "map_b".into(), marker: "{B1}".into(), kind: "phone".into(), original: "13800138000".into(), start: 0, end: 0 },
        ];
        let (restored, missing) = restore_text("联系人 {A1}，电话 {UNKNOWN}", &mappings);
        assert_eq!(restored, "联系人 张三，电话 {UNKNOWN}");
        assert_eq!(missing, vec!["{B1}".to_string()]);
    }
}
