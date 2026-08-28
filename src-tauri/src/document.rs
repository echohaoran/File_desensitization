use crate::redaction::{redact_text, ApprovedSpan, RedactionError};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentBlock {
    pub block_id: String,
    pub text: String,
    pub start: usize,
    pub end: usize,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentOutput {
    pub output_path: String,
    pub metadata_path: String,
    pub document_id: String,
    pub mapping_count: usize,
    pub source_sha256: String,
    pub redacted_sha256: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMarker {
    pub schema_version: u32,
    pub document_id: String,
    pub source_filename: String,
    pub format: String,
    pub source_sha256: String,
    pub redacted_sha256: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DocumentFormat {
    Txt,
    Csv,
    Json,
    Md,
    Docx,
    Xlsx,
    Pdf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdapterCapability {
    pub format: DocumentFormat,
    pub preview: bool,
    pub redaction: bool,
    pub restoration: bool,
    pub note: String,
}

pub fn capabilities() -> Vec<AdapterCapability> {
    vec![
        AdapterCapability {
            format: DocumentFormat::Txt,
            preview: true,
            redaction: true,
            restoration: true,
            note: "文本适配器已接入".into(),
        },
        AdapterCapability {
            format: DocumentFormat::Csv,
            preview: true,
            redaction: true,
            restoration: true,
            note: "文本适配器已接入；保留分隔符需补充结构化解析".into(),
        },
        AdapterCapability {
            format: DocumentFormat::Json,
            preview: false,
            redaction: false,
            restoration: false,
            note: "使用伴随元数据；JSON 节点适配器待接入".into(),
        },
        AdapterCapability {
            format: DocumentFormat::Md,
            preview: true,
            redaction: true,
            restoration: true,
            note: "文本适配器已接入".into(),
        },
        AdapterCapability {
            format: DocumentFormat::Docx,
            preview: false,
            redaction: false,
            restoration: false,
            note: "DOCX 结构适配器待接入，旧 FastAPI 链路可用".into(),
        },
        AdapterCapability {
            format: DocumentFormat::Xlsx,
            preview: false,
            redaction: false,
            restoration: false,
            note: "XLSX 结构适配器待接入，旧 FastAPI 链路可用".into(),
        },
        AdapterCapability {
            format: DocumentFormat::Pdf,
            preview: false,
            redaction: false,
            restoration: false,
            note: "PDF 适配器待接入，旧 FastAPI 转换链路可用".into(),
        },
    ]
}

#[derive(Debug, thiserror::Error)]
pub enum DocumentError {
    #[error("不支持的文本文件格式")]
    Unsupported,
    #[error("文件读取失败")]
    Read(#[source] std::io::Error),
    #[error("文件写入失败")]
    Write(#[source] std::io::Error),
    #[error("脱敏区间无效")]
    Redaction(#[from] RedactionError),
}

pub trait DocumentAdapter {
    fn extract_blocks(&self, content: &str) -> Vec<DocumentBlock>;
    fn write_redacted(
        &self,
        input: &Path,
        spans: &[ApprovedSpan],
    ) -> Result<DocumentOutput, DocumentError>;
}

pub struct TextAdapter;
impl TextAdapter {
    pub fn new() -> Self {
        Self
    }
    fn supported(path: &Path) -> bool {
        matches!(
            path.extension()
                .and_then(|ext| ext.to_str())
                .unwrap_or_default()
                .to_ascii_lowercase()
                .as_str(),
            "txt" | "csv" | "md" | "markdown"
        )
    }
}

impl DocumentAdapter for TextAdapter {
    fn extract_blocks(&self, content: &str) -> Vec<DocumentBlock> {
        let mut cursor = 0;
        content
            .lines()
            .enumerate()
            .map(|(index, line)| {
                let start = cursor;
                let end = start + line.len();
                cursor = end + 1;
                DocumentBlock {
                    block_id: format!("line_{}", index + 1),
                    text: line.to_string(),
                    start,
                    end,
                }
            })
            .collect()
    }
    fn write_redacted(
        &self,
        input: &Path,
        spans: &[ApprovedSpan],
    ) -> Result<DocumentOutput, DocumentError> {
        if !Self::supported(input) {
            return Err(DocumentError::Unsupported);
        }
        let content = fs::read_to_string(input).map_err(DocumentError::Read)?;
        let result = redact_text(&content, spans)?;
        let output_path = output_path(input);
        let metadata_path = PathBuf::from(format!("{}.desens-meta", output_path.display()));
        fs::write(&output_path, result.redacted_text.as_bytes()).map_err(DocumentError::Write)?;
        let source_sha256 = sha256(content.as_bytes());
        let redacted_sha256 = sha256(result.redacted_text.as_bytes());
        let marker = DocumentMarker {
            schema_version: 1,
            document_id: result.document_id.clone(),
            source_filename: input
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or_default()
                .to_string(),
            format: input
                .extension()
                .and_then(|ext| ext.to_str())
                .unwrap_or_default()
                .to_ascii_lowercase(),
            source_sha256: source_sha256.clone(),
            redacted_sha256: redacted_sha256.clone(),
        };
        let metadata = serde_json::to_vec_pretty(&marker)
            .map_err(|error| DocumentError::Write(std::io::Error::other(error)))?;
        fs::write(&metadata_path, metadata).map_err(DocumentError::Write)?;
        Ok(DocumentOutput {
            output_path: output_path.display().to_string(),
            metadata_path: metadata_path.display().to_string(),
            document_id: result.document_id,
            mapping_count: result.mappings.len(),
            source_sha256,
            redacted_sha256,
        })
    }
}

fn sha256(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}
fn output_path(input: &Path) -> PathBuf {
    let stem = input
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("document");
    let extension = input
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("txt");
    input.with_file_name(format!("{stem}_desensitized.{extension}"))
}
