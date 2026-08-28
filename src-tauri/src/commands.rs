use crate::{
    document::{capabilities, AdapterCapability, DocumentAdapter, DocumentOutput, TextAdapter},
    domain::{request_id, ApiResponse, HealthData, SCHEMA_VERSION},
    model::{inspect_gguf, ModelRecord},
    redaction::{redact_text, restore_text, ApprovedSpan, Mapping, RedactionResult},
    storage::{JsonEnvelope, StorageProvider},
    task::{TaskEvent, TaskKind, TaskSnapshot},
    AppState,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{Emitter, State};

#[derive(Debug, Serialize)]
pub struct CommandError {
    pub code: &'static str,
    pub message: &'static str,
    pub retryable: bool,
}

impl From<crate::storage::StorageError> for CommandError {
    fn from(error: crate::storage::StorageError) -> Self {
        if matches!(error, crate::storage::StorageError::RevisionConflict { .. }) {
            return Self {
                code: "STORAGE_REVISION_CONFLICT",
                message: "本地数据已被其他操作更新，请刷新后重试",
                retryable: true,
            };
        }
        Self {
            code: "STORAGE_ERROR",
            message: "本地数据存储失败",
            retryable: true,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CollectionRequest {
    pub schema_version: u32,
    pub expected_revision: Option<u64>,
    pub items: Vec<Value>,
}

#[derive(Debug, Deserialize)]
pub struct RedactionRequest {
    pub schema_version: u32,
    pub text: String,
    pub spans: Vec<ApprovedSpan>,
}

#[derive(Debug, Deserialize)]
pub struct PersistRedactionRequest {
    pub schema_version: u32,
    pub source_filename: String,
    pub text: String,
    pub spans: Vec<ApprovedSpan>,
}

#[derive(Debug, Serialize)]
pub struct RestoreResult {
    pub restored_text: String,
    pub missing_markers: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct FileRedactionRequest {
    pub schema_version: u32,
    pub input_path: String,
    pub spans: Vec<ApprovedSpan>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterModelRequest {
    pub schema_version: u32,
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub schema_version: u32,
    pub kind: TaskKind,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub schema_version: u32,
    pub task_id: String,
    pub status: crate::task::TaskStatus,
    pub progress: Option<u8>,
    pub message: String,
}

#[tauri::command]
pub fn health() -> Result<ApiResponse<HealthData>, CommandError> {
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: HealthData {
            service: "desens-tauri".to_string(),
            status: "healthy".to_string(),
            architecture: "vue-rust-tauri".to_string(),
        },
    })
}

#[tauri::command]
pub fn document_capabilities() -> Result<ApiResponse<Vec<AdapterCapability>>, CommandError> {
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: capabilities(),
    })
}

#[tauri::command]
pub fn create_task(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    request: CreateTaskRequest,
) -> Result<ApiResponse<TaskSnapshot>, CommandError> {
    if request.schema_version != SCHEMA_VERSION {
        return Err(CommandError {
            code: "INVALID_SCHEMA_VERSION",
            message: "数据版本不受支持",
            retryable: false,
        });
    }
    let task = state
        .tasks
        .create(request.kind, request.message)
        .map_err(|_| CommandError {
            code: "TASK_STORE_ERROR",
            message: "任务状态保存失败",
            retryable: true,
        })?;
    persist_task(&state, &task)?;
    let _ = app.emit(
        "task-event",
        TaskEvent {
            schema_version: SCHEMA_VERSION,
            task_id: task.task_id.clone(),
            kind: "started".to_string(),
            stage: "queued".to_string(),
            progress: task.progress,
            message: task.message.clone(),
            status: task.status.clone(),
        },
    );
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: task,
    })
}

#[tauri::command]
pub fn get_task(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<ApiResponse<Option<TaskSnapshot>>, CommandError> {
    let task = state.tasks.get(&task_id).map_err(|_| CommandError {
        code: "TASK_STORE_ERROR",
        message: "任务状态读取失败",
        retryable: true,
    })?;
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: task,
    })
}

#[tauri::command]
pub fn update_task(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    request: UpdateTaskRequest,
) -> Result<ApiResponse<Option<TaskSnapshot>>, CommandError> {
    if request.schema_version != SCHEMA_VERSION {
        return Err(CommandError {
            code: "INVALID_SCHEMA_VERSION",
            message: "数据版本不受支持",
            retryable: false,
        });
    }
    let task = state
        .tasks
        .update(
            &request.task_id,
            request.status,
            request.progress,
            request.message,
        )
        .map_err(|_| CommandError {
            code: "TASK_STORE_ERROR",
            message: "任务状态更新失败",
            retryable: true,
        })?;
    if let Some(ref snapshot) = task {
        persist_task(&state, snapshot)?;
        let _ = app.emit(
            "task-event",
            TaskEvent {
                schema_version: SCHEMA_VERSION,
                task_id: snapshot.task_id.clone(),
                kind: "progress".to_string(),
                stage: "updated".to_string(),
                progress: snapshot.progress,
                message: snapshot.message.clone(),
                status: snapshot.status.clone(),
            },
        );
    }
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: task,
    })
}

fn persist_task(state: &State<'_, AppState>, task: &TaskSnapshot) -> Result<(), CommandError> {
    let storage = state.storage.lock().map_err(|_| CommandError {
        code: "STORAGE_LOCK_ERROR",
        message: "本地数据存储锁不可用",
        retryable: true,
    })?;
    let provider = storage.as_ref().ok_or(CommandError {
        code: "STORAGE_NOT_READY",
        message: "本地数据存储尚未准备完成",
        retryable: true,
    })?;
    let mut tasks = provider.read_collection::<Value>("tasks")?;
    let value = serde_json::to_value(task).map_err(|_| CommandError {
        code: "TASK_STORE_ERROR",
        message: "任务状态序列化失败",
        retryable: true,
    })?;
    if let Some(existing) = tasks
        .items
        .iter_mut()
        .find(|item| item.get("task_id") == Some(&Value::String(task.task_id.clone())))
    {
        *existing = value;
    } else {
        tasks.items.push(value);
    }
    provider.write_collection_if_revision("tasks", &tasks.items, tasks.revision)?;
    Ok(())
}

#[tauri::command]
pub fn redact_approved_text(
    request: RedactionRequest,
) -> Result<ApiResponse<RedactionResult>, CommandError> {
    if request.schema_version != SCHEMA_VERSION {
        return Err(CommandError {
            code: "INVALID_SCHEMA_VERSION",
            message: "数据版本不受支持",
            retryable: false,
        });
    }
    let data = redact_text(&request.text, &request.spans).map_err(|_| CommandError {
        code: "INVALID_REDACTION_SPAN",
        message: "脱敏选区无效或存在重叠",
        retryable: false,
    })?;
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data,
    })
}

#[tauri::command]
pub fn redact_text_file(
    request: FileRedactionRequest,
) -> Result<ApiResponse<DocumentOutput>, CommandError> {
    if request.schema_version != SCHEMA_VERSION {
        return Err(CommandError {
            code: "INVALID_SCHEMA_VERSION",
            message: "数据版本不受支持",
            retryable: false,
        });
    }
    let output = TextAdapter::new()
        .write_redacted(std::path::Path::new(&request.input_path), &request.spans)
        .map_err(|_| CommandError {
            code: "DOCUMENT_WRITE_FAILED",
            message: "文本文件脱敏输出失败",
            retryable: false,
        })?;
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: output,
    })
}

#[tauri::command]
pub fn redact_and_persist_text(
    state: State<'_, AppState>,
    request: PersistRedactionRequest,
) -> Result<ApiResponse<RedactionResult>, CommandError> {
    if request.schema_version != SCHEMA_VERSION {
        return Err(CommandError {
            code: "INVALID_SCHEMA_VERSION",
            message: "数据版本不受支持",
            retryable: false,
        });
    }
    let mut data = redact_text(&request.text, &request.spans).map_err(|_| CommandError {
        code: "INVALID_REDACTION_SPAN",
        message: "脱敏选区无效或存在重叠",
        retryable: false,
    })?;
    let history_id = format!("history_{}", uuid::Uuid::new_v4().simple());
    let mapping_value = serde_json::json!({
        "schema_version": SCHEMA_VERSION,
        "document_id": data.document_id.clone(),
        "source_filename": request.source_filename.clone(),
        "mappings": data.mappings.clone(),
    });
    let history_value = serde_json::json!({
        "id": history_id,
        "document_id": data.document_id,
        "source_filename": request.source_filename,
        "mapping_count": mapping_value["mappings"].as_array().map_or(0, Vec::len),
        "mapping_file": format!("mappings/{history_id}.json"),
    });
    let storage = state.storage.lock().map_err(|_| CommandError {
        code: "STORAGE_LOCK_ERROR",
        message: "本地数据存储锁不可用",
        retryable: true,
    })?;
    let provider = storage.as_ref().ok_or(CommandError {
        code: "STORAGE_NOT_READY",
        message: "本地数据存储尚未准备完成",
        retryable: true,
    })?;
    provider.write_mapping(&history_id, &mapping_value)?;
    let mut history = provider.read_collection::<Value>("history")?;
    history.items.push(history_value);
    provider.write_collection_if_revision("history", &history.items, history.revision)?;
    data.mappings =
        serde_json::from_value(mapping_value["mappings"].clone()).map_err(|_| CommandError {
            code: "STORAGE_ERROR",
            message: "映射数据生成失败",
            retryable: true,
        })?;
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data,
    })
}

#[tauri::command]
pub fn restore_mapped_text(
    redacted_text: String,
    mappings: Vec<Mapping>,
) -> Result<ApiResponse<RestoreResult>, CommandError> {
    let (restored_text, missing_markers) = restore_text(&redacted_text, &mappings);
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: RestoreResult {
            restored_text,
            missing_markers,
        },
    })
}

#[tauri::command]
pub fn read_collection(
    state: State<'_, AppState>,
    collection: String,
) -> Result<ApiResponse<JsonEnvelope<Value>>, CommandError> {
    let storage = state.storage.lock().map_err(|_| CommandError {
        code: "STORAGE_LOCK_ERROR",
        message: "本地数据存储锁不可用",
        retryable: true,
    })?;
    let envelope = storage
        .as_ref()
        .ok_or(CommandError {
            code: "STORAGE_NOT_READY",
            message: "本地数据存储尚未准备完成",
            retryable: true,
        })?
        .read_collection(&collection)?;
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: envelope,
    })
}

#[tauri::command]
pub fn write_collection(
    state: State<'_, AppState>,
    collection: String,
    request: CollectionRequest,
) -> Result<ApiResponse<JsonEnvelope<Value>>, CommandError> {
    if request.schema_version != SCHEMA_VERSION {
        return Err(CommandError {
            code: "INVALID_SCHEMA_VERSION",
            message: "数据版本不受支持",
            retryable: false,
        });
    }
    let storage = state.storage.lock().map_err(|_| CommandError {
        code: "STORAGE_LOCK_ERROR",
        message: "本地数据存储锁不可用",
        retryable: true,
    })?;
    let provider = storage.as_ref().ok_or(CommandError {
        code: "STORAGE_NOT_READY",
        message: "本地数据存储尚未准备完成",
        retryable: true,
    })?;
    let envelope = match request.expected_revision {
        Some(expected) => {
            provider.write_collection_if_revision(&collection, &request.items, expected)?
        }
        None => provider.write_collection(&collection, &request.items)?,
    };
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: envelope,
    })
}

fn collection_response(
    state: State<'_, AppState>,
    collection: &'static str,
) -> Result<ApiResponse<JsonEnvelope<Value>>, CommandError> {
    let storage = state.storage.lock().map_err(|_| CommandError {
        code: "STORAGE_LOCK_ERROR",
        message: "本地数据存储锁不可用",
        retryable: true,
    })?;
    let envelope = storage
        .as_ref()
        .ok_or(CommandError {
            code: "STORAGE_NOT_READY",
            message: "本地数据存储尚未准备完成",
            retryable: true,
        })?
        .read_collection(collection)?;
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: envelope,
    })
}

#[tauri::command]
pub fn list_rules(
    state: State<'_, AppState>,
) -> Result<ApiResponse<JsonEnvelope<Value>>, CommandError> {
    collection_response(state, "rules")
}

#[tauri::command]
pub fn list_history(
    state: State<'_, AppState>,
) -> Result<ApiResponse<JsonEnvelope<Value>>, CommandError> {
    collection_response(state, "history")
}

#[tauri::command]
pub fn list_settings(
    state: State<'_, AppState>,
) -> Result<ApiResponse<JsonEnvelope<Value>>, CommandError> {
    collection_response(state, "settings")
}

#[tauri::command]
pub fn list_models(
    state: State<'_, AppState>,
) -> Result<ApiResponse<JsonEnvelope<Value>>, CommandError> {
    collection_response(state, "models")
}

#[tauri::command]
pub fn register_local_model(
    state: State<'_, AppState>,
    request: RegisterModelRequest,
) -> Result<ApiResponse<ModelRecord>, CommandError> {
    if request.schema_version != SCHEMA_VERSION {
        return Err(CommandError {
            code: "INVALID_SCHEMA_VERSION",
            message: "数据版本不受支持",
            retryable: false,
        });
    }
    let model = inspect_gguf(std::path::Path::new(&request.path)).map_err(|_| CommandError {
        code: "MODEL_INVALID_FORMAT",
        message: "选择的文件不是有效的 GGUF 模型",
        retryable: false,
    })?;
    let storage = state.storage.lock().map_err(|_| CommandError {
        code: "STORAGE_LOCK_ERROR",
        message: "本地数据存储锁不可用",
        retryable: true,
    })?;
    let provider = storage.as_ref().ok_or(CommandError {
        code: "STORAGE_NOT_READY",
        message: "本地数据存储尚未准备完成",
        retryable: true,
    })?;
    let mut models = provider.read_collection::<Value>("models")?;
    models
        .items
        .push(serde_json::to_value(&model).map_err(|_| CommandError {
            code: "STORAGE_ERROR",
            message: "模型记录生成失败",
            retryable: true,
        })?);
    provider.write_collection_if_revision("models", &models.items, models.revision)?;
    Ok(ApiResponse {
        schema_version: SCHEMA_VERSION,
        success: true,
        request_id: request_id(),
        data: model,
    })
}
