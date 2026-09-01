mod commands;
mod document;
mod domain;
mod model;
mod inference;
mod redaction;
mod storage;
mod task;

use std::sync::Mutex;
use storage::JsonStorageProvider;
use storage::StorageProvider;
use tauri::Manager;

pub struct AppState {
    pub storage: Mutex<Option<JsonStorageProvider>>,
    pub tasks: task::TaskManager,
}

pub fn run_inference_cli() -> i32 {
    use std::io::{Read, Write};
    let mut input = Vec::new();
    if std::io::stdin().read_to_end(&mut input).is_err() { return 2; }
    let request: commands::AiDetectRequest = match serde_json::from_slice(&input) { Ok(value) => value, Err(_) => return 2 };
    match inference::run_candidate_inference(&request.model_path, &request.rules_summary, &request.selected_text) {
        Ok(output) => { let _ = std::io::stdout().write_all(output.as_bytes()); 0 }
        Err(error) => { let _ = writeln!(std::io::stderr(), "{error}"); 3 }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState {
            storage: Mutex::new(None),
            tasks: task::TaskManager::default(),
        })
        .setup(|app| {
            let root = app.path().app_data_dir()?;
            let provider = JsonStorageProvider::new(root)
                .map_err(|error| std::io::Error::other(error.to_string()))?;
            let persisted = provider
                .read_collection::<task::TaskSnapshot>("tasks")
                .map_err(|error| std::io::Error::other(error.to_string()))?;
            let state = app.state::<AppState>();
            state
                .tasks
                .restore(persisted.items)
                .map_err(|_| std::io::Error::other("任务状态恢复失败"))?;
            *state
                .storage
                .lock()
                .map_err(|_| std::io::Error::other("存储锁不可用"))? = Some(provider);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::health,
            commands::document_capabilities,
            commands::create_task,
            commands::get_task,
            commands::update_task,
            commands::redact_approved_text,
            commands::redact_text_file,
            commands::redact_and_persist_text,
            commands::restore_mapped_text,
            commands::read_collection,
            commands::write_collection,
            commands::list_rules,
            commands::list_history,
            commands::list_settings,
            commands::list_models,
            commands::register_local_model,
            commands::unregister_model,
            commands::download_model,
            commands::ai_detect_candidates
        ])
        .run(tauri::generate_context!())
        .expect("error while running DESENS Tauri application");
}
