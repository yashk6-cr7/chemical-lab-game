import { getDepthContent } from './depthLayer'
import { checkUnlocks } from './unlockSystem'
import chemicalsData from '../data/chemicals.json'

function getChemicalName(chemicalId) {
  const data = chemicalsData.find(c => c.id === chemicalId)
  return data ? data.name : chemicalId
}

export function recordReaction(reactionResult, chemicals, store) {
  const content = getDepthContent(reactionResult)

  const chemicalNames = chemicals.map(c => getChemicalName(c.chemicalId))
  const chemicalIds = chemicals.map(c => c.chemicalId)

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    chemicals: chemicalNames,
    chemicalIds: chemicalIds,
    reactionType: reactionResult?.type || 'mixing_only',
    reactionResult,
    description: (content.headline + ' ' + content.body).trim(),
    equation: content.equation || '',
    molecules: content.moleculeKeys || { reactant1: null, reactant2: null, product1: null, product2: null },
    energyData: content.energyData || { deltaH: 0, activationEnergy: 30, isExothermic: false },
    followUpQuestions: content.followUpQuestions || [],
    realWorldLink: content.realWorldLink || '',
    safetyViolations: reactionResult?.safetyViolations || [],
  }

  // Update store and persist
  const current = store.getState().logbookEntries || []
  const updated = [entry, ...current].slice(0, 500) // max 500 entries
  
  const uniqueTypes = new Set([
    ...current.map(e => e.reactionType),
    entry.reactionType
  ])

  store.setState({ 
    logbookEntries: updated,
    reactionsDiscovered: uniqueTypes.size
  })

  checkUnlocks(store)
  
  try {
    localStorage.setItem('lab-logbook', JSON.stringify(updated))
  } catch (e) {
    // localStorage quota exceeded — silently fail
    console.warn('Logbook localStorage save failed:', e)
  }
}

export function loadLogbookFromStorage() {
  try {
    const raw = localStorage.getItem('lab-logbook')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function buildLogbookHTML(entries) {
  const rows = entries.map(e => {
    return `
      <div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-weight:bold;font-size:16px;">${e.chemicals?.join(' + ') || 'Unknown'}</div>
        <div style="color:#888;font-size:12px;margin-bottom:8px;">
          ${e.reactionType?.replace(/_/g, ' ')} · ${new Date(e.timestamp).toLocaleString()}
        </div>
        <p style="font-size:14px;line-height:1.6;">${e.description || e.easyDescription || e.moderateDescription || e.complexDescription || 'No description available'}</p>
        ${e.equation ? `<code style="display:block;background:#f4f4f4;padding:8px;border-radius:4px;margin-top:8px;">${e.equation}</code>` : ''}
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chemistry Logbook</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { font-size: 24px; margin-bottom: 24px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>🧪 Discovery Logbook</h1>
      <p style="color:#888;">Exported ${new Date().toLocaleDateString()} · ${entries.length} discoveries</p>
      ${rows}
    </body>
    </html>
  `
}
