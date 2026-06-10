import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'
import { isMobileDevice } from '../../utils/isMobile'

const IS_MOBILE = isMobileDevice()

/**
 * MobileActionBar
 *
 * Shown only on mobile. Appears at the bottom-right when the player
 * is holding a chemical bottle, giving them tap-accessible buttons
 * for all actions that would normally be keyboard shortcuts.
 */
const MobileActionBar = memo(function MobileActionBar() {
  if (!IS_MOBILE) return null

  const heldChemical  = useLabStore(s => s.heldChemical)
  const isPouring     = useLabStore(s => s.isPouring)
  const putDownBottle = useLabStore(s => s.putDownBottle)
  const setIsPouring  = useLabStore(s => s.setIsPouring)

  return (
    <AnimatePresence>
      {heldChemical && (
        <motion.div
          key="action-bar"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="fixed bottom-36 right-4 z-40 flex flex-col gap-3 items-end pointer-events-auto"
        >
          {/* Chemical name badge */}
          <div className="bg-black/70 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: heldChemical.color }}
            />
            <span className="text-white text-xs font-semibold">{heldChemical.name}</span>
          </div>

          {/* Pour button */}
          <motion.button
            onPointerDown={() => setIsPouring(true)}
            onPointerUp={() => setIsPouring(false)}
            onPointerLeave={() => setIsPouring(false)}
            whileTap={{ scale: 0.92 }}
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 shadow-lg transition-colors ${
              isPouring
                ? 'bg-blue-500/80 border-blue-400 shadow-blue-500/30'
                : 'bg-black/60 border-white/20 backdrop-blur-sm'
            }`}
            aria-label="Pour chemical"
          >
            <span className="text-2xl leading-none">🧪</span>
            <span className="text-white/70 text-[9px] font-bold uppercase tracking-wider">Pour</span>
          </motion.button>

          {/* Put Down button */}
          <motion.button
            onPointerDown={putDownBottle}
            whileTap={{ scale: 0.92 }}
            className="w-16 h-16 rounded-2xl bg-black/60 border-2 border-white/20 backdrop-blur-sm flex flex-col items-center justify-center gap-1 shadow-lg"
            aria-label="Put down bottle"
          >
            <span className="text-2xl leading-none">📤</span>
            <span className="text-white/70 text-[9px] font-bold uppercase tracking-wider">Drop</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default MobileActionBar
