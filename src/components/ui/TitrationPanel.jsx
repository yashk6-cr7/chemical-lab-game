import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

export const TitrationPanel = memo(function TitrationPanel() {
  const titration = useLabStore(state => state.titration)
  const updateTitration = useLabStore(state => state.updateTitration)

  return (
    <AnimatePresence>
      {titration.isActive && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-4 bottom-24 z-30 w-64 backdrop-blur-md bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl pointer-events-auto"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-white font-bold flex items-center gap-2">
              🧪 Titration
            </h3>
            <button 
              onClick={() => updateTitration({ isActive: false })}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>Volume added:</span>
              <span className="font-mono font-bold text-cyan-400">{titration.volumeAdded.toFixed(1)} mL</span>
            </div>
            
            {/* Progress bar */}
            <div className="h-4 bg-black/50 rounded-full overflow-hidden mt-2 relative border border-white/10">
              <div 
                className="absolute top-0 left-0 h-full bg-cyan-500/80 transition-all duration-200"
                style={{ width: `${(titration.volumeAdded / 50) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-right text-gray-500 mt-1">50 mL total</div>
          </div>

          <div className="flex justify-between items-center bg-black/30 rounded-lg p-2 border border-white/5">
            <span className="text-sm text-gray-300">Drop mode:</span>
            <button 
              onClick={() => updateTitration({ dropMode: !titration.dropMode })}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${titration.dropMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-300'}`}
            >
              {titration.dropMode ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center italic">Scroll wheel to add drops manually</p>

          <AnimatePresence>
            {titration.endpointReached && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mt-2 bg-pink-500/20 border border-pink-500/40 rounded-lg p-2 text-center"
              >
                <span className="text-pink-400 font-bold text-sm">● Endpoint Reached!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
