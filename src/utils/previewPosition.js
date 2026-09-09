// Anchor to original-text offsets: displayed placeholder lengths are unstable.
function characterRect(span, index) {
  const node = span.firstChild
  if (!node || node.nodeType !== 3 || !node.length) return null
  const at = Math.max(0, Math.min(index, node.length - 1))
  const range = document.createRange()
  range.setStart(node, at)
  range.setEnd(node, Math.min(at + 1, node.length))
  return range.getBoundingClientRect()
}

export function capturePreviewPosition(panel) {
  if (!panel) return null
  const bounds = panel.getBoundingClientRect()
  const saved = { panel, top: panel.scrollTop, left: panel.scrollLeft }
  const spans = [...panel.querySelectorAll('span[data-original-start]')]
  for (const span of spans) {
    const boundsOfSpan = span.getBoundingClientRect()
    if (boundsOfSpan.bottom <= bounds.top + 2 || boundsOfSpan.top >= bounds.bottom) continue
    const text = span.firstChild
    if (!text || text.nodeType !== 3 || !text.length) continue
    let low = 0, high = text.length - 1
    while (low < high) {
      const mid = (low + high) >> 1
      const rect = characterRect(span, mid)
      if (rect.bottom <= bounds.top + 2) low = mid + 1
      else high = mid
    }
    const rect = characterRect(span, low)
    if (!rect || rect.height === 0) continue
    saved.offset = Number(span.dataset.originalStart) + (span.dataset.masked === 'true' ? 0 : low)
    saved.y = rect.top
    return saved
  }
  return saved
}

export function restorePreviewPosition(saved) {
  if (!saved?.panel?.isConnected) return
  const { panel } = saved
  panel.scrollLeft = saved.left
  if (saved.offset !== undefined) {
    const span = [...panel.querySelectorAll('span[data-original-start]')].find(item => Number(item.dataset.originalStart) <= saved.offset && Number(item.dataset.originalEnd) > saved.offset)
    if (span) {
      const index = span.dataset.masked === 'true' ? 0 : saved.offset - Number(span.dataset.originalStart)
      const rect = characterRect(span, index)
      if (rect?.height) { panel.scrollTop += rect.top - saved.y; return }
    }
  }
  panel.scrollTop = saved.top
}
