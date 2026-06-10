import { memo } from 'react'
import { motion } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

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

export const LogbookTrigger = memo(function LogbookTrigger() {
  const show = useLabStore(s => s.showLogbook)
  if (show) return null
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05, x: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => useLabStore.getState().setShowLogbook(true)}
      className="fixed right-6 bottom-24 z-30 w-12 h-12 bg-white/10 hover:bg-white/20
                 border border-white/20 rounded-full flex items-center justify-center
                 shadow-lg shadow-black/50 backdrop-blur-md transition-colors pointer-events-auto"
      title="Open Logbook"
    >
      <span className="text-xl">📓</span>
    </motion.button>
  )
})

export const NotebookTrigger = memo(function NotebookTrigger() {
  const show = useLabStore(s => s.labNotebook.show)
  if (show) return null
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05, x: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => useLabStore.getState().setShowNotebook(true)}
      className="fixed right-6 bottom-40 z-30 w-12 h-12 bg-white/10 hover:bg-white/20
                 border border-amber-900/40 rounded-full flex items-center justify-center
                 shadow-lg shadow-black/50 backdrop-blur-md transition-colors pointer-events-auto"
      title="Open Lab Notebook"
    >
      <span className="text-xl">📝</span>
    </motion.button>
  )
})
