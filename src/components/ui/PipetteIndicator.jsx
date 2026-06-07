import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

export const PipetteIndicator = memo(function PipetteIndicator() {
  const isPipetteActive = useLabStore(state => state.isPipetteActive)
  const pipetteContents = useLabStore(state => state.pipetteContents)

  return (
    <AnimatePresence>
      {isPipetteActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="backdrop-blur-md bg-black/60 border border-white/20 rounded-full px-5 py-2 text-sm text-white/90 shadow-xl flex items-center gap-3">
            <span className="text-lg">🧪</span>
            {pipetteContents ? (
              <span>
                Pipette holding <strong style={{ color: pipetteContents.color }}>{pipetteContents.volume}mL of {pipetteContents.chemicalId}</strong> — click beaker to deposit
              </span>
            ) : (
              <span>Pipette ready — click a beaker to draw liquid</span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
