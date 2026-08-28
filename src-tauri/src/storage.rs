use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;
use std::{
    fs::{self, File},
    io::{self, Write},
    path::{Path, PathBuf},
    sync::{Mutex, MutexGuard},
    time::{SystemTime, UNIX_EPOCH},
};

pub const STORAGE_SCHEMA_VERSION: u32 = 1;

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("存储目录不可用")]
    Directory(#[source] io::Error),
    #[error("数据文件读取失败")]
    Read(#[source] io::Error),
    #[error("数据文件格式无效")]
    Parse(#[source] serde_json::Error),
    #[error("数据文件写入失败")]
    Write(#[source] io::Error),
    #[error("数据文件结构无效")]
    InvalidEnvelope,
    #[error("不支持的数据集合")]
    InvalidCollection,
    #[error("数据版本冲突")]
    RevisionConflict { expected: u64, actual: u64 },
}

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct JsonEnvelope<T> {
    pub schema_version: u32,
    pub collection: String,
    pub revision: u64,
    pub updated_at: String,
    pub items: Vec<T>,
}

pub trait StorageProvider {
    fn read_collection<T: DeserializeOwned>(
        &self,
        collection: &str,
    ) -> Result<JsonEnvelope<T>, StorageError>;
    fn write_collection<T: Serialize + Clone>(
        &self,
        collection: &str,
        items: &[T],
    ) -> Result<JsonEnvelope<T>, StorageError>;
    fn write_collection_if_revision<T: Serialize + Clone>(
        &self,
        collection: &str,
        items: &[T],
        expected_revision: u64,
    ) -> Result<JsonEnvelope<T>, StorageError>;
}

pub struct JsonStorageProvider {
    root: PathBuf,
    write_lock: Mutex<()>,
}

impl JsonStorageProvider {
    pub fn new(root: impl Into<PathBuf>) -> Result<Self, StorageError> {
        let root = root.into();
        fs::create_dir_all(root.join("mappings")).map_err(StorageError::Directory)?;
        fs::create_dir_all(root.join("annotations")).map_err(StorageError::Directory)?;
        fs::create_dir_all(root.join("models")).map_err(StorageError::Directory)?;
        fs::create_dir_all(root.join("exports")).map_err(StorageError::Directory)?;
        fs::create_dir_all(root.join("temp")).map_err(StorageError::Directory)?;
        Ok(Self {
            root,
            write_lock: Mutex::new(()),
        })
    }

    fn collection_path(&self, collection: &str) -> Result<PathBuf, StorageError> {
        let allowed = matches!(
            collection,
            "settings" | "rules" | "history" | "models" | "training_jobs" | "datasets" | "tasks"
        );
        if !allowed || collection.chars().any(|ch| matches!(ch, '/' | '\\' | '.')) {
            return Err(StorageError::InvalidCollection);
        }
        Ok(self.root.join(format!("{collection}.json")))
    }

    fn lock(&self) -> Result<MutexGuard<'_, ()>, StorageError> {
        self.write_lock
            .lock()
            .map_err(|_| StorageError::Write(io::Error::other("存储锁异常")))
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn write_mapping<T: Serialize>(
        &self,
        id: &str,
        value: &T,
    ) -> Result<PathBuf, StorageError> {
        if id.is_empty()
            || id
                .chars()
                .any(|ch| !ch.is_ascii_alphanumeric() && ch != '-' && ch != '_')
        {
            return Err(StorageError::InvalidCollection);
        }
        let path = self.root.join("mappings").join(format!("{id}.json"));
        let bytes = serde_json::to_vec_pretty(value).map_err(StorageError::Parse)?;
        let _guard = self.lock()?;
        atomic_write(&path, &bytes)?;
        Ok(path)
    }
}

impl StorageProvider for JsonStorageProvider {
    fn read_collection<T: DeserializeOwned>(
        &self,
        collection: &str,
    ) -> Result<JsonEnvelope<T>, StorageError> {
        let path = self.collection_path(collection)?;
        if !path.exists() {
            return Ok(JsonEnvelope {
                schema_version: STORAGE_SCHEMA_VERSION,
                collection: collection.to_string(),
                revision: 0,
                updated_at: now_string(),
                items: Vec::new(),
            });
        }
        let bytes = fs::read(path).map_err(StorageError::Read)?;
        let envelope: JsonEnvelope<T> =
            serde_json::from_slice(&bytes).map_err(StorageError::Parse)?;
        if envelope.collection != collection || envelope.schema_version > STORAGE_SCHEMA_VERSION {
            return Err(StorageError::InvalidEnvelope);
        }
        Ok(envelope)
    }

    fn write_collection<T: Serialize + Clone>(
        &self,
        collection: &str,
        items: &[T],
    ) -> Result<JsonEnvelope<T>, StorageError> {
        let path = self.collection_path(collection)?;
        let _guard = self.lock()?;
        let revision = if path.exists() {
            let bytes = fs::read(&path).map_err(StorageError::Read)?;
            serde_json::from_slice::<JsonEnvelope<Value>>(&bytes)
                .map(|value| value.revision.saturating_add(1))
                .map_err(StorageError::Parse)?
        } else {
            1
        };
        let envelope = JsonEnvelope {
            schema_version: STORAGE_SCHEMA_VERSION,
            collection: collection.to_string(),
            revision,
            updated_at: now_string(),
            items: items.to_vec(),
        };
        let bytes = serde_json::to_vec_pretty(&envelope).map_err(StorageError::Parse)?;
        atomic_write(&path, &bytes)?;
        Ok(envelope)
    }

    fn write_collection_if_revision<T: Serialize + Clone>(
        &self,
        collection: &str,
        items: &[T],
        expected_revision: u64,
    ) -> Result<JsonEnvelope<T>, StorageError> {
        let path = self.collection_path(collection)?;
        let _guard = self.lock()?;
        let actual_revision = if path.exists() {
            let bytes = fs::read(&path).map_err(StorageError::Read)?;
            serde_json::from_slice::<JsonEnvelope<Value>>(&bytes)
                .map(|value| value.revision)
                .map_err(StorageError::Parse)?
        } else {
            0
        };
        if actual_revision != expected_revision {
            return Err(StorageError::RevisionConflict {
                expected: expected_revision,
                actual: actual_revision,
            });
        }
        let envelope = JsonEnvelope {
            schema_version: STORAGE_SCHEMA_VERSION,
            collection: collection.to_string(),
            revision: actual_revision.saturating_add(1),
            updated_at: now_string(),
            items: items.to_vec(),
        };
        let bytes = serde_json::to_vec_pretty(&envelope).map_err(StorageError::Parse)?;
        atomic_write(&path, &bytes)?;
        Ok(envelope)
    }
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), StorageError> {
    let temp_path = path.with_extension(format!("json.tmp.{}", std::process::id()));
    let mut file = File::create(&temp_path).map_err(StorageError::Write)?;
    file.write_all(bytes).map_err(StorageError::Write)?;
    file.sync_all().map_err(StorageError::Write)?;
    fs::rename(&temp_path, path).map_err(StorageError::Write)
}

fn now_string() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

#[cfg(test)]
mod tests {
    use super::{JsonStorageProvider, StorageProvider};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    struct Rule {
        id: String,
    }

    #[test]
    fn writes_and_reads_versioned_collection() {
        let root = std::env::temp_dir().join(format!("desens-storage-{}", std::process::id()));
        let storage = JsonStorageProvider::new(&root).expect("storage");
        let written = storage
            .write_collection("rules", &[Rule { id: "r1".into() }])
            .expect("write");
        let read = storage.read_collection::<Rule>("rules").expect("read");
        assert_eq!(written.revision, 1);
        assert_eq!(read.items, vec![Rule { id: "r1".into() }]);
        let _ = std::fs::remove_dir_all(root);
    }
}
