import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

export default function ChemicalInfoPanel() {
  const selectedChemical = useLabStore(state => state.selectedChemical)
  const setSelectedChemical = useLabStore(state => state.setSelectedChemical)

  if (!selectedChemical) return null

  const renderPropertyBadge = (label, isActive) => (
    <div className={`text-xs px-2 py-1 rounded border font-medium text-center ${isActive ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-gray-800/50 border-gray-700 text-gray-500'}`}>
      {label}
    </div>
  )

  // Open Everything — show richest available description
  const getDescription = () => {
    return selectedChemical.moderateDescription
      || selectedChemical.complexDescription
      || selectedChemical.easyDescription
      || selectedChemical.description
      || ''
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-2 left-2 right-2 sm:bottom-6 sm:left-6 sm:right-auto sm:w-80 max-h-[95vh] bg-[#111111]/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-y-auto flex flex-col z-50 text-gray-100"
      >
        {/* Header / Color Swatch */}
        <div className="relative h-24 p-6 flex flex-col justify-end" style={{ backgroundColor: `${selectedChemical.color}20` }}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: selectedChemical.labelColor }} />
          <button 
            onClick={() => setSelectedChemical(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white bg-black/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
          
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold leading-none tracking-tight">{selectedChemical.name}</h2>
            <div className="font-mono text-sm px-2 py-1 bg-black/40 rounded shadow-inner border border-white/10">
              {selectedChemical.formula}
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 flex flex-col gap-5">
          
          {/* Properties Grid */}
          <div className="grid grid-cols-3 gap-2">
            {renderPropertyBadge('Flammable', selectedChemical.isFlammable)}
            {renderPropertyBadge('Acid', selectedChemical.isAcid)}
            {renderPropertyBadge('Base', selectedChemical.isBase)}
            {renderPropertyBadge('Volatile', selectedChemical.isVolatile)}
            {renderPropertyBadge('Oxidizer', selectedChemical.isOxidizer)}
            <div className="text-xs px-2 py-1 rounded border bg-gray-800/50 border-gray-700 text-gray-300 font-medium text-center flex items-center justify-center capitalize">
              {selectedChemical.state}
            </div>
          </div>

          {/* pH Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span>pH Level</span>
              <span style={{ color: selectedChemical.pH < 7 ? '#ef4444' : selectedChemical.pH > 7 ? '#3b82f6' : '#22c55e' }}>
                {selectedChemical.pH.toFixed(1)}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full overflow-hidden w-full bg-gradient-to-r from-red-500 via-green-500 to-blue-600 shadow-inner">
              <div 
                className="absolute top-0 h-full w-1 bg-white shadow-[0_0_4px_rgba(0,0,0,0.8)]"
                style={{ left: `${(selectedChemical.pH / 14) * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>

          {/* Hazard Level */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span>Hazard Severity</span>
              <span>{selectedChemical.hazardLevel} / 5</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <div 
                  key={level} 
                  className={`h-2 flex-1 rounded-sm transition-all duration-300 ${level <= selectedChemical.hazardLevel ? 'opacity-100 shadow-[0_0_8px_rgba(0,0,0,0.5)]' : 'opacity-20'}`}
                  style={{ backgroundColor: selectedChemical.hazardLevel >= 4 ? '#ef4444' : selectedChemical.hazardLevel >= 3 ? '#f97316' : '#22c55e' }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="p-3 bg-black/40 rounded-lg border border-gray-800/50 shadow-inner">
            <p className="text-sm text-gray-300 leading-relaxed min-h-[4rem]">
              {getDescription()}
            </p>
          </div>
          
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
