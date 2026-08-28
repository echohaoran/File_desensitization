mod commands;
mod document;
mod domain;
mod model;
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

pub fn run() {
    tauri::Builder::default()
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
            commands::register_local_model
        ])
        .run(tauri::generate_context!())
        .expect("error while running DESENS Tauri application");
}
