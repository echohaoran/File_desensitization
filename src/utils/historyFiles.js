import { t } from '@/i18n'

const DB_NAME = 'desens_history_files'
const DB_VERSION = 1
const STORE_NAME = 'files'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error(t('shared.historyOpenFailed')))
  })
}

function runTransaction(mode, action) {
  return openDatabase().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = action(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error(t('shared.historyStorageFailed')))
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error(t('shared.historyTransactionFailed'))) }
  }))
}

export function saveHistoryFile(record) {
  if (!record?.id || !(record.blob instanceof Blob) || record.blob.size === 0) return Promise.reject(new Error(t('shared.historyInvalid')))
  return runTransaction('readwrite', store => store.put(record))
}

export function getHistoryFile(id) {
  return runTransaction('readonly', store => store.get(id))
}

export function deleteHistoryFile(id) {
  return runTransaction('readwrite', store => store.delete(id))
}

export function clearHistoryFiles() {
  return runTransaction('readwrite', store => store.clear())
}
