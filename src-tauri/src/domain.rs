use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub schema_version: u32,
    pub success: bool,
    pub request_id: String,
    pub data: T,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthData {
    pub service: String,
    pub status: String,
    pub architecture: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
    pub id: String,
    pub task_id: String,
    pub source: DetectionSource,
    pub kind: String,
    pub start: usize,
    pub end: usize,
    pub confidence: f32,
    pub status: ReviewStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DetectionSource {
    Rule,
    Manual,
    Ai,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReviewStatus {
    Pending,
    Approved,
    Rejected,
    Modified,
}

pub fn request_id() -> String {
    format!("req_{}", Uuid::new_v4().simple())
}
