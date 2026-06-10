export function encodeReactionShare(logbookEntry) {
  const payload = {
    c: logbookEntry.chemicalIds,    // chemical ids
    t: logbookEntry.reactionType,
    v: 1,                           // schema version
  }
  const encoded = btoa(JSON.stringify(payload))
  return `${window.location.origin}?share=${encodeURIComponent(encoded)}`
}

export function decodeReactionShare(url = window.location.href) {
  try {
    const params = new URLSearchParams(new URL(url).search)
    const raw = params.get('share')
    if (!raw) return null
    return JSON.parse(atob(decodeURIComponent(raw)))
  } catch {
    return null
  }
}

export async function copyShareLink(logbookEntry) {
  const url = encodeReactionShare(logbookEntry)
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
