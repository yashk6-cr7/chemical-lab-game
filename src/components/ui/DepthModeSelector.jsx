import { memo, useCallback } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

const MODES = [
  { key: 'easy',     label: 'Easy',     emoji: '🌱' },
  { key: 'moderate', label: 'Moderate', emoji: '🔬' },
  { key: 'complex',  label: 'Complex',  emoji: '⚛️' },
]

export const DepthModeSelector = memo(function DepthModeSelector({ compact = false }) {
  const depthMode = useLabStore(s => s.depthMode)
  const setDepthMode = useCallback(
    (mode) => useLabStore.getState().setDepthMode(mode),
    []
  )

  const containerClass = compact
    ? 'flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1'
    : 'fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1 ' +
      'backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-1.5 ' +
      'shadow-xl shadow-black/40 pointer-events-auto'

  return (
    <LayoutGroup>
      <div className={containerClass}>
        {MODES.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setDepthMode(key)}
            className="relative px-3 py-1.5 rounded-xl text-sm font-medium
                       transition-colors duration-150 select-none cursor-pointer z-0"
            style={{ color: depthMode === key ? '#fff' : 'rgba(255,255,255,0.4)' }}
          >
            {depthMode === key && (
              <motion.div
                layoutId="depth-active-pill"
                className="absolute inset-0 bg-white/15 rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>{emoji}</span>
              <span className={compact && key !== depthMode ? 'hidden sm:inline' : ''}>
                {label}
              </span>
            </span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  )
})
