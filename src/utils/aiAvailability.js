import { isTauriRuntime } from '@/api/tauriBridge'

export const AI_AVAILABILITY_EVENT = 'desens:ai-availability-change'

export function readAiAvailability({ requireDesktop = true } = {}) {
  const enabled = localStorage.getItem('desens_ai_enabled') === 'true'
  const modelPath = localStorage.getItem('desens_active_model_path') || ''

  if (!enabled) {
    return {
      available: false,
      enabled,
      modelPath,
      state: 'ai-disabled',
      message: 'AI 功能未开启，请前往设置开启。'
    }
  }

  if (!modelPath) {
    return {
      available: false,
      enabled,
      modelPath,
      state: 'model-missing',
      message: '尚未应用本地模型，请前往设置下载并应用。'
    }
  }

  if (requireDesktop && !isTauriRuntime()) {
    return {
      available: false,
      enabled,
      modelPath,
      state: 'desktop-required',
      message: 'AI 功能仅可在桌面应用中使用。'
    }
  }

  return { available: true, enabled, modelPath, state: 'ready', message: '' }
}

export function announceAiAvailabilityChange() {
  window.dispatchEvent(new CustomEvent(AI_AVAILABILITY_EVENT, { detail: readAiAvailability() }))
}
