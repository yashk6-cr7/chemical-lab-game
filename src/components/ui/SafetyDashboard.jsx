import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'
import safetyFacts from '../../data/safetyFacts.json'

const GEAR_LABELS = [
  { key: 'goggles',  withKey: 'reactionsWithGoggles',  withoutKey: 'reactionsWithoutGoggles',  name: 'Goggles',  icon: '🥽' },
  { key: 'gloves',   withKey: 'reactionsWithGloves',   withoutKey: 'reactionsWithoutGloves',   name: 'Gloves',   icon: '🧤' },
  { key: 'coat',     withKey: 'reactionsWithCoat',     withoutKey: 'reactionsWithoutCoat',     name: 'Lab Coat', icon: '🥼' },
]

const ACCIDENT_LABELS = {
  eye_exposure:    { label: 'Eye Exposure',     color: 'text-red-400',    bg: 'bg-red-900/40',    border: 'border-red-700' },
  skin_exposure:   { label: 'Skin Contact',     color: 'text-orange-400', bg: 'bg-orange-900/40', border: 'border-orange-700' },
  clothing_damage: { label: 'Clothing Damage',  color: 'text-yellow-400', bg: 'bg-yellow-900/40', border: 'border-yellow-700' },
  fire_hazard:     { label: 'Fire',             color: 'text-red-500',    bg: 'bg-red-950/60',    border: 'border-red-800' },
  air_quality_drop:{ label: 'Air Hazard',       color: 'text-green-400',  bg: 'bg-green-900/40',  border: 'border-green-700' },
  beaker_crack:    { label: 'Glassware Break',  color: 'text-blue-400',   bg: 'bg-blue-900/40',   border: 'border-blue-700' },
  overflow:        { label: 'Overflow',         color: 'text-cyan-400',   bg: 'bg-cyan-900/40',   border: 'border-cyan-700' },
}

const PREVENTION_TEXT = {
  goggles: 'Goggles would have prevented eye exposure.',
  gloves: 'Gloves would have prevented skin contact.',
  'Lab Coat': 'A lab coat would have prevented clothing damage.',
}

function ComplianceBar({ pct, label, icon, total }) {
  const color = pct >= 80 ? '#4caf50' : pct >= 50 ? '#ffc107' : '#f44336'
  const message = pct === 100 ? '✓ Perfect compliance!' : pct >= 80 ? 'Good habit forming' : pct >= 50 ? 'Needs improvement' : '⚠ Serious safety risk'
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <span className="text-sm font-black" style={{ color }}>{total > 0 ? Math.round(pct) : '--'}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? pct : 0}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="text-xs mt-1" style={{ color }}>{total > 0 ? message : 'No reactions yet this session'}</div>
    </div>
  )
}

const SafetyDashboard = memo(function SafetyDashboard() {
  const showSafetyDashboard = useLabStore(state => state.showSafetyDashboard)
  const toggleSafetyDashboard = useLabStore(state => state.toggleSafetyDashboard)
  const safetyStats = useLabStore(state => state.safetyStats)
  const accidentLog = useLabStore(state => state.accidentLog)

  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * safetyFacts.length))
  const [factRotating, setFactRotating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const mountTime = useRef(Date.now())

  useEffect(() => {
    if (!showSafetyDashboard) return
    mountTime.current = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - mountTime.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [showSafetyDashboard])

  const rotateFact = useCallback(() => {
    setFactRotating(true)
    setTimeout(() => {
      setFactIndex(i => (i + 1) % safetyFacts.length)
      setFactRotating(false)
    }, 200)
  }, [])

  const formatElapsed = (s) => `${Math.floor(s / 60)}m ${s % 60}s`

  const total = safetyStats.totalReactions

  const gearPcts = {
    goggles: total > 0 ? (safetyStats.reactionsWithGoggles / total) * 100 : 0,
    gloves:  total > 0 ? (safetyStats.reactionsWithGloves  / total) * 100 : 0,
    coat:    total > 0 ? (safetyStats.reactionsWithCoat    / total) * 100 : 0,
  }

  const fact = safetyFacts[factIndex]

  return (
    <AnimatePresence>
      {showSafetyDashboard && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) toggleSafetyDashboard() }}
        >
          <motion.div
            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-t-3xl p-8 max-h-[88vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Your Lab Safety Record</h2>
                  <p className="text-xs text-white/40 mt-0.5">Session duration: {formatElapsed(elapsed)}</p>
                </div>
              </div>
              <button
                onClick={toggleSafetyDashboard}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >✕</button>
            </div>

            <div className="h-px bg-white/10 mb-6" />

            {/* Gear Compliance */}
            <section className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Gear Compliance This Session</h3>
              {GEAR_LABELS.map(g => (
                <ComplianceBar
                  key={g.key}
                  label={g.name}
                  icon={g.icon}
                  pct={gearPcts[g.key]}
                  total={total}
                />
              ))}
              {total === 0 && (
                <p className="text-xs text-white/30 italic">Complete a reaction to see compliance data.</p>
              )}
            </section>

            <div className="h-px bg-white/10 mb-6" />

            {/* Accident Log */}
            <section className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">
                Incident Log
                {accidentLog.length > 0 && (
                  <span className="ml-2 text-red-400 normal-case font-normal">{accidentLog.length} incident{accidentLog.length > 1 ? 's' : ''}</span>
                )}
              </h3>

              {accidentLog.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center gap-3 py-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="text-5xl">✅</div>
                  <p className="text-green-400 font-bold text-lg">Perfect safety record this session!</p>
                  <p className="text-white/30 text-xs">No accidents recorded. Keep up the good work.</p>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  {accidentLog.map((acc, i) => {
                    const cfg = ACCIDENT_LABELS[acc.type] || { label: acc.type, color: 'text-gray-400', bg: 'bg-gray-900/40', border: 'border-gray-700' }
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}
                      >
                        <div className={`text-xs font-black uppercase tracking-wider ${cfg.color} mb-2`}>{cfg.label}</div>
                        <div className="text-sm text-white/70 mb-1">
                          Chemical: <span className="text-white font-medium">{acc.chemical || 'Unknown'}</span>
                        </div>
                        {acc.missingGear?.length > 0 && (
                          <>
                            <div className="text-sm text-white/70 mb-1">
                              Missing protection: <span className="text-red-300 font-medium">{acc.missingGear.join(', ')}</span>
                            </div>
                            <div className="text-xs text-white/40 italic">
                              {acc.missingGear.map(g => PREVENTION_TEXT[g]).filter(Boolean).join(' ')}
                            </div>
                          </>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </section>

            <div className="h-px bg-white/10 mb-6" />

            {/* Real-World Fact */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Did You Know?</h3>
                <motion.button
                  onClick={rotateFact}
                  whileTap={{ rotate: 180 }}
                  transition={{ duration: 0.2 }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all text-sm"
                >↻</motion.button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={factIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5"
                >
                  <p className="text-white text-sm leading-relaxed italic mb-3">"{fact.fact}"</p>
                  <p className="text-white/30 text-xs">— {fact.source}</p>
                </motion.div>
              </AnimatePresence>
            </section>

            {/* Bottom padding for safe area */}
            <div className="h-6" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export const SafetyDashboardTrigger = memo(function SafetyDashboardTrigger() {
  const toggleSafetyDashboard = useLabStore(state => state.toggleSafetyDashboard)
  const accidentCount = useLabStore(state => state.accidentLog.length)

  return (
    <motion.button
      onClick={toggleSafetyDashboard}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-center hover:bg-white/10 transition-colors"
      title="Safety Dashboard"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.7}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      {accidentCount > 0 && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {accidentCount > 9 ? '9+' : accidentCount}
        </motion.div>
      )}
    </motion.button>
  )
})

export default SafetyDashboard
