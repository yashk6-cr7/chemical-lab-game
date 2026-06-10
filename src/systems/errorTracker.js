const ERROR_KEY = 'lab-errors'

export function initErrorTracking(store) {
  window.addEventListener('error', (e) => {
    const entry = {
      timestamp: Date.now(),
      message: e.message,
      source: e.filename,
      line: e.lineno,
      col: e.colno,
      stack: e.error?.stack?.slice(0, 500) || '',
      userAgent: navigator.userAgent.slice(0, 100),
    }
    store.getState().appendError(entry)
    try {
      const existing = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]')
      localStorage.setItem(ERROR_KEY, JSON.stringify([...existing, entry].slice(-50)))
    } catch {}
  })

  window.addEventListener('unhandledrejection', (e) => {
    const entry = {
      timestamp: Date.now(),
      message: String(e.reason),
      source: 'unhandled-promise',
      stack: e.reason?.stack?.slice(0, 500) || '',
    }
    store.getState().appendError(entry)
  })
}

export function getErrorLog() {
  try {
    return JSON.parse(localStorage.getItem(ERROR_KEY) || '[]')
  } catch { return [] }
}

export async function copyErrorLog() {
  const log = getErrorLog()
  const text = JSON.stringify(log, null, 2)
  try {
    await navigator.clipboard.writeText(text)
    console.log('Error log copied to clipboard')
  } catch (err) {
    console.error('Failed to copy error log', err)
  }
}
