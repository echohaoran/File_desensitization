use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskKind {
    File,
    Download,
    Inference,
    Training,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Queued,
    Running,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskEvent {
    pub schema_version: u32,
    pub task_id: String,
    pub kind: String,
    pub stage: String,
    pub progress: Option<u8>,
    pub message: String,
    pub status: TaskStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskSnapshot {
    pub task_id: String,
    pub task_kind: TaskKind,
    pub status: TaskStatus,
    pub progress: Option<u8>,
    pub message: String,
}

#[derive(Default)]
pub struct TaskManager {
    tasks: Mutex<HashMap<String, TaskSnapshot>>,
}
impl TaskManager {
    pub fn restore(&self, snapshots: impl IntoIterator<Item = TaskSnapshot>) -> Result<(), ()> {
        let mut tasks = self.tasks.lock().map_err(|_| ())?;
        for snapshot in snapshots {
            tasks.insert(snapshot.task_id.clone(), snapshot);
        }
        Ok(())
    }
    pub fn create(&self, task_kind: TaskKind, message: String) -> Result<TaskSnapshot, ()> {
        let task = TaskSnapshot {
            task_id: format!("task_{}", Uuid::new_v4().simple()),
            task_kind,
            status: TaskStatus::Queued,
            progress: Some(0),
            message,
        };
        self.tasks
            .lock()
            .map_err(|_| ())?
            .insert(task.task_id.clone(), task.clone());
        Ok(task)
    }
    pub fn get(&self, task_id: &str) -> Result<Option<TaskSnapshot>, ()> {
        Ok(self.tasks.lock().map_err(|_| ())?.get(task_id).cloned())
    }
    pub fn update(
        &self,
        task_id: &str,
        status: TaskStatus,
        progress: Option<u8>,
        message: String,
    ) -> Result<Option<TaskSnapshot>, ()> {
        let mut tasks = self.tasks.lock().map_err(|_| ())?;
        let Some(task) = tasks.get_mut(task_id) else {
            return Ok(None);
        };
        if matches!(
            task.status,
            TaskStatus::Completed | TaskStatus::Failed | TaskStatus::Cancelled
        ) && !matches!(
            status,
            TaskStatus::Completed | TaskStatus::Failed | TaskStatus::Cancelled
        ) {
            return Ok(None);
        }
        task.status = status;
        task.progress = progress;
        task.message = message;
        Ok(Some(task.clone()))
    }
}
