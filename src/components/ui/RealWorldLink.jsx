import { memo } from 'react'
import { motion } from 'framer-motion'

export const RealWorldLink = memo(function RealWorldLink({ text }) {
  if (!text) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-3"
    >
      <span className="text-xl flex-shrink-0 mt-0.5">🌍</span>
      <p className="text-emerald-200 text-xs leading-relaxed">{text}</p>
    </motion.div>
  )
})
