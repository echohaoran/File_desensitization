const desktopInvoke = () => window.__TAURI__?.core?.invoke || window.__TAURI_INTERNALS__?.invoke

export function isTauriRuntime() { return typeof window !== 'undefined' && typeof desktopInvoke() === 'function' }
export async function invokeDesktop(command, payload = {}) {
  const invoke = desktopInvoke()
  if (typeof invoke !== 'function') throw new Error('当前不是 Tauri 桌面运行环境')
  return invoke(command, payload)
}
export const desktopHealth = () => invokeDesktop('health')
export const documentCapabilities = () => invokeDesktop('document_capabilities')
export const redactApprovedText = (request) => invokeDesktop('redact_approved_text', { request })
export const restoreMappedText = (redactedText, mappings) => invokeDesktop('restore_mapped_text', { redactedText, mappings })
export const listModels = () => invokeDesktop('list_models')
export const registerLocalModel = (request) => invokeDesktop('register_local_model', { request })
export const unregisterModel = (request) => invokeDesktop('unregister_model', { request })
export const downloadModel = (request) => invokeDesktop('download_model', { request })
export const aiDetectCandidates = (request) => invokeDesktop('ai_detect_candidates', { request })
export const aiConvertRulesToRegex = (request) => invokeDesktop('ai_convert_rules_to_regex', { request })
export const createTask = (request) => invokeDesktop('create_task', { request })
export const getTask = (taskId) => invokeDesktop('get_task', { taskId })
export const updateTask = (request) => invokeDesktop('update_task', { request })

export function onTaskEvent(handler) {
  if (!isTauriRuntime() || typeof window.__TAURI__?.event?.listen !== 'function') return () => {}
  let unlisten
  window.__TAURI__.event.listen('task-event', (event) => handler(event.payload)).then((stop) => { unlisten = stop })
  return () => { if (typeof unlisten === 'function') unlisten() }
}
