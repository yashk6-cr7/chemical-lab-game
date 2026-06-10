const SAVE_KEY = 'lab-save-v1'
const SAVE_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function startAutoSave(store) {
  const interval = setInterval(() => {
    saveState(store)
  }, SAVE_INTERVAL)
  return () => clearInterval(interval)  // return cleanup
}

export function saveState(store) {
  const s = store.getState()
  const saveData = {
    version: 1,
    timestamp: Date.now(),
    logbookEntries: s.logbookEntries,
    unlockedChemicals: s.unlockedChemicals,
    reactionsDiscovered: s.reactionsDiscovered,
    settings: s.settings,
    bottleUseCounts: s.bottleUseCounts,
    benchDamage: s.benchDamage,
  }
  // Notebook saved separately (may contain large dataUrls)
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
  } catch (e) {
    // Quota exceeded — try without bench damage (large-ish)
    try {
      saveData.benchDamage = { stains: [], scorchMarks: [], cracks: [] }
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
    } catch {}
  }
}

export function loadSave(store) {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (!data.version) return false
    store.setState({
      logbookEntries: data.logbookEntries || [],
      unlockedChemicals: data.unlockedChemicals || [],
      reactionsDiscovered: data.reactionsDiscovered || 0,
      bottleUseCounts: data.bottleUseCounts || {},
      benchDamage: data.benchDamage || { stains: [], scorchMarks: [], cracks: [] },
    })
    store.getState().updateSettings(data.settings || {})
    return true
  } catch {
    return false
  }
}
