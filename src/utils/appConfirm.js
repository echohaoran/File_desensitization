let requestSequence = 0

export function requestAppConfirm({ title, message, confirmText = '确认继续', tone = 'default' }) {
  return new Promise(resolve => {
    const id = `confirm_${Date.now()}_${++requestSequence}`
    const handleResult = event => {
      if (event.detail?.id !== id) return
      window.removeEventListener('desens:confirm-result', handleResult)
      resolve(Boolean(event.detail.confirmed))
    }
    window.addEventListener('desens:confirm-result', handleResult)
    window.dispatchEvent(new CustomEvent('desens:confirm-request', {
      detail: { id, title, message, confirmText, tone }
    }))
  })
}
