use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{fs, path::Path};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelSource {
    HuggingFace,
    ModelScope,
    Local,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelStatus {
    Discovered,
    Downloading,
    Verifying,
    Ready,
    Incompatible,
    Failed,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRecord {
    pub id: String,
    pub name: String,
    pub source: ModelSource,
    pub path: String,
    pub sha256: Option<String>,
    pub size_bytes: Option<u64>,
    pub architecture: Option<String>,
    pub quantization: Option<String>,
    pub purpose: Vec<String>,
    pub status: ModelStatus,
}

#[derive(Debug, thiserror::Error)]
pub enum ModelError {
    #[error("模型文件不存在或无法读取")]
    Read(#[source] std::io::Error),
    #[error("不是有效的 GGUF 文件")]
    InvalidFormat,
}

pub fn inspect_gguf(path: &Path) -> Result<ModelRecord, ModelError> {
    let bytes = fs::read(path).map_err(ModelError::Read)?;
    if bytes.len() < 4 || &bytes[..4] != b"GGUF" {
        return Err(ModelError::InvalidFormat);
    }
    let digest = Sha256::digest(&bytes);
    let sha256 = digest.iter().map(|byte| format!("{byte:02x}")).collect();
    let name = path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("model")
        .to_string();
    Ok(ModelRecord {
        id: format!("model_{}", uuid::Uuid::new_v4().simple()),
        name,
        source: ModelSource::Local,
        path: path.to_string_lossy().to_string(),
        sha256: Some(sha256),
        size_bytes: Some(bytes.len() as u64),
        architecture: None,
        quantization: None,
        purpose: vec!["inference".to_string()],
        status: ModelStatus::Ready,
    })
}
