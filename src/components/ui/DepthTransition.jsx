import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Crossfades children when depthKey changes.
 * mode="wait" ensures exit completes before enter — clean morph, not overlap.
 */
export const DepthTransition = memo(function DepthTransition({ depthKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={depthKey}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
})
