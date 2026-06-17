import { memo, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { shallow } from 'zustand/shallow'
import useLabStore from '../../store/useLabStore'
import { copyShareLink } from '../../systems/shareSystem'

const TYPE_COLORS = {
  neutralization_violent:  'text-green-300 bg-green-500/10 border-green-500/20',
  neutralization_gentle:   'text-green-300 bg-green-500/10 border-green-500/20',
  acid_carbonate:          'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
  acid_metal:              'text-orange-300 bg-orange-500/10 border-orange-500/20',
  catalytic_decomposition: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
  indicator:               'text-violet-300 bg-violet-500/10 border-violet-500/20',
  flammable_vapor:         'text-red-300 bg-red-500/10 border-red-500/20',
  dangerous_dilution:      'text-red-400 bg-red-600/10 border-red-600/20',
  precipitation:           'text-blue-300 bg-blue-500/10 border-blue-500/20',
  volatile_exposure:       'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  mixing_only:             'text-gray-300 bg-gray-500/10 border-gray-500/20',
}

const FILTER_OPTIONS = [
  { key: 'all',           label: 'All' },
  { key: 'neutralization_violent', label: 'Neutralization' },
  { key: 'acid_carbonate', label: 'Gas' },
  { key: 'precipitation', label: 'Precipitation' },
  { key: 'indicator',     label: 'Indicator' },
  { key: 'flammable_vapor', label: 'Fire' },
  { key: 'mixing_only',   label: 'No Reaction' },
]

// ── Entry Card ────────────────────────────────────────────────────────────────
const EntryCard = memo(function EntryCard({ entry, onSelect, setToast }) {
  const description = entry.description || entry.moderateDescription || entry.easyDescription || entry.complexDescription

  const typeColor = TYPE_COLORS[entry.reactionType] || 'text-white/50 bg-white/5 border-white/10'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4
                 flex flex-col gap-2 cursor-pointer hover:bg-white/8 transition-colors"
      onClick={() => onSelect(entry)}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-white">
          {entry.chemicals?.join(' + ') || 'Unknown'}
        </span>
        <span className="text-[10px] text-white/30 font-mono flex-shrink-0">
          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Type badge */}
      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border w-fit ${typeColor}`}>
        {entry.reactionType?.replace(/_/g, ' ') || 'reaction'}
      </span>

      {/* Description */}
      <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Equation */}
      {entry.equation && (
        <code className="text-[10px] text-cyan-400 font-mono bg-black/30 px-2 py-1 rounded-lg">
          {entry.equation}
        </code>
      )}

      <div className="flex justify-between items-center mt-1">
        <button
          onClick={async (e) => {
            e.stopPropagation()
            const ok = await copyShareLink(entry)
            setToast(ok ? 'Link copied!' : 'Could not copy')
            setTimeout(() => setToast(null), 2000)
          }}
          className="text-white/30 hover:text-white/60 text-xs transition-colors"
          aria-label="Share this reaction"
        >
          🔗 Share
        </button>
        <div className="text-[10px] text-white/30 hover:text-white/60 transition-colors text-right">
          View details ›
        </div>
      </div>
    </motion.div>
  )
})

// ── Entry Detail Modal ────────────────────────────────────────────────────────
const EntryDetail = memo(function EntryDetail({ entry, onClose }) {
  if (!entry) return null
  const description = entry.description || entry.moderateDescription || entry.easyDescription || entry.complexDescription

  return (
    <motion.div
      key="entry-detail"
      className="fixed inset-4 z-[110] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10
                   rounded-2xl p-6 max-h-[80vh] overflow-y-auto z-10"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{entry.chemicals?.join(' + ')}</h3>
            <div className="text-xs text-white/30 mt-0.5">
              {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
             style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
              Reactants
            </div>
            <h2 className="text-2xl font-bold text-white">
              {entry.chemicals?.join(' + ') || 'Unknown Reaction'}
            </h2>
            {entry.reactionType && entry.reactionType !== 'mixing_only' && (
              <div className="text-xs text-cyan-400 mt-2">
                Type: <span className="uppercase tracking-wider">{entry.reactionType.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-white/80 leading-relaxed">
              {description}
            </p>
          </div>

          {entry.equation && (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Equation</div>
              <code className="text-cyan-300 text-sm font-mono block">
                {entry.equation}
              </code>
            </div>
          )}

          {entry.realWorldLink && (
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 mb-4 flex gap-3">
              <span className="text-xl">🌍</span>
              <p className="text-emerald-200 text-xs leading-relaxed">{entry.realWorldLink}</p>
            </div>
          )}

          {entry.safetyViolations?.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 text-xs text-red-300">
              ⚠ Missing gear: {entry.safetyViolations.join(', ')}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
})

// ── buildLogbookHTML ──────────────────────────────────────────────────────────
function buildLogbookHTML(entries) {
  const rows = entries.map(e => {
    const desc = e.description || e.easyDescription || e.moderateDescription || e.complexDescription
    return `
      <div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-weight:bold;font-size:16px;">${e.chemicals?.join(' + ') || 'Unknown'}</div>
        <div style="color:#888;font-size:12px;margin-bottom:8px;">
          ${e.reactionType?.replace(/_/g,' ')} · ${new Date(e.timestamp).toLocaleString()}
        </div>
        <p style="font-size:14px;line-height:1.6;">${desc || ''}</p>
        ${e.equation ? `<code style="display:block;background:#f4f4f4;padding:8px;border-radius:4px;margin-top:8px;">${e.equation}</code>` : ''}
      </div>
    `
  }).join('')

  return `<!DOCTYPE html><html><head><title>Chemistry Logbook</title>
    <style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;}
    h1{font-size:24px;}@media print{body{margin:0;}}</style></head>
    <body>
      <h1>🧪 Discovery Logbook</h1>
      <p style="color:#888;">Exported ${new Date().toLocaleDateString()} · ${entries.length} discoveries</p>
      ${rows}
    </body></html>`
}

// ── Main DiscoveryLogbook ─────────────────────────────────────────────────────
export const DiscoveryLogbook = memo(function DiscoveryLogbook() {
  const entries = useLabStore(s => s.logbookEntries)
  const show = useLabStore(s => s.showLogbook)
  const search = useLabStore(s => s.logbookSearch)
  const filter = useLabStore(s => s.logbookFilter)

  const setSearch    = useLabStore(s => s.setLogbookSearch)
  const setFilter    = useLabStore(s => s.setLogbookFilter)

  const [selectedEntry, setSelectedEntry] = useState(null)
  const [toast, setToast] = useState(null)

  const handleClose = useCallback(() => {
    useLabStore.getState().setShowLogbook(false)
  }, [])

  const handleSearch = useCallback((e) => setSearch(e.target.value), [setSearch])

  const filteredEntries = useMemo(() => {
    let list = entries || []
    if (filter !== 'all') {
      // Match by prefix to catch both neutralization types
      list = list.filter(e => {
        if (filter === 'neutralization_violent') {
          return e.reactionType?.startsWith('neutralization')
        }
        return e.reactionType === filter
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.chemicals?.some(c => c.toLowerCase().includes(q)) ||
        (e.description || e.easyDescription || e.moderateDescription)?.toLowerCase().includes(q) ||
        e.equation?.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => b.timestamp - a.timestamp)
  }, [entries, filter, search])

  const handleExport = useCallback(() => {
    const html = buildLogbookHTML(filteredEntries)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.print()
    }
  }, [filteredEntries])

  return (
    <>
      <AnimatePresence>
        {show && (
          <>
            {/* Backdrop */}
            <motion.div
              key="logbook-backdrop"
              className="fixed inset-0 z-[49] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Panel */}
            <motion.div
              key="logbook-panel"
              className="fixed inset-4 z-[50] flex flex-col bg-[#0a0a0a]
                         border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📓</span>
                  <div>
                    <h2 className="text-lg font-black text-white">Discovery Logbook</h2>
                    <p className="text-xs text-white/30">{entries?.length || 0} reactions recorded</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    className="px-3 py-1.5 rounded-xl text-xs text-white/50 hover:text-white
                               border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15
                               flex items-center justify-center text-white/50 hover:text-white transition-all"
                  >✕</button>
                </div>
              </div>

              {/* Search + Filter */}
              <div className="px-6 py-3 border-b border-white/10 flex flex-col gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search reactions, chemicals, equations..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2
                             text-sm text-white placeholder-white/20 outline-none
                             focus:border-white/25 transition-colors"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {FILTER_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setFilter(opt.key)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                        filter === opt.key || (filter === 'neutralization_violent' && opt.key === 'neutralization_violent')
                          ? 'bg-white/15 text-white border border-white/20'
                          : 'text-white/40 border border-white/5 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry list */}
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredEntries.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-48 gap-3"
                    >
                      <span className="text-5xl">📓</span>
                      <p className="text-white/30 text-sm text-center">
                        {search
                          ? 'No reactions match your search.'
                          : 'Start mixing chemicals to fill your logbook!'}
                      </p>
                    </motion.div>
                  ) : (
                    filteredEntries.map(entry => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onSelect={setSelectedEntry}
                        setToast={setToast}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Entry Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <EntryDetail
            key="entry-detail"
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[150]
                       bg-white/10 backdrop-blur-md border border-white/20
                       rounded-full px-4 py-1.5 text-white text-sm pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})

