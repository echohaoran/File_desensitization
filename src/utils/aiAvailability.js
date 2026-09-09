import { isTauriRuntime } from '@/api/tauriBridge'
import { t } from '@/i18n'

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
      message: t('shared.aiDisabled')
    }
  }

  if (!modelPath) {
    return {
      available: false,
      enabled,
      modelPath,
      state: 'model-missing',
      message: t('shared.modelMissing')
    }
  }

  if (requireDesktop && !isTauriRuntime()) {
    return {
      available: false,
      enabled,
      modelPath,
      state: 'desktop-required',
      message: t('shared.aiDesktopRequired')
    }
  }

  return { available: true, enabled, modelPath, state: 'ready', message: '' }
}

export function announceAiAvailabilityChange() {
  window.dispatchEvent(new CustomEvent(AI_AVAILABILITY_EVENT, { detail: readAiAvailability() }))
}
