import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'

// ui.md: Glassmorphism base styling + Aceternity UI animations (framer-motion for HTML only)
const glassStyles = "bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"

export default function HotplateUI() {
  const showHotplateUI = useLabStore(state => state.showHotplateUI)
  const setShowHotplateUI = useLabStore(state => state.setShowHotplateUI)
  const hotplate = useLabStore(state => state.hotplate)
  const setHotplateTemp = useLabStore(state => state.setHotplateTemp)
  const toggleHotplate = useLabStore(state => state.toggleHotplate)

  return (
    <AnimatePresence>
      {showHotplateUI && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`absolute top-1/2 -translate-y-1/2 right-4 sm:top-auto sm:translate-y-0 sm:bottom-24 sm:left-1/2 sm:-translate-x-1/2 w-72 sm:w-80 rounded-2xl p-4 sm:p-6 ${glassStyles} text-white font-sans`}
          style={{ zIndex: 50 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight">Hotplate Control</h2>
            <button 
              onClick={() => setShowHotplateUI(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Power Toggle */}
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl">
              <span className="font-medium text-white/80">Power</span>
              <button
                onClick={toggleHotplate}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  hotplate.isOn ? 'bg-red-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    hotplate.isOn ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="font-medium text-white/80">Target Temp</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                    {Math.round(hotplate.targetTemp)}
                  </span>
                  <span className="text-white/50 font-medium">°C</span>
                </div>
              </div>
              
              <div className="relative pt-2">
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={hotplate.targetTemp}
                  onChange={(e) => setHotplateTemp(Number(e.target.value))}
                  disabled={!hotplate.isOn}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-opacity ${
                    !hotplate.isOn ? 'opacity-50 grayscale' : 'opacity-100'
                  }`}
                  style={{
                    background: `linear-gradient(to right, #4b5563 0%, #ef4444 ${(hotplate.targetTemp / 500) * 100}%, #1f2937 ${(hotplate.targetTemp / 500) * 100}%, #1f2937 100%)`
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-white/40 font-medium px-1">
                <span>0°C</span>
                <span>250°C</span>
                <span>500°C</span>
              </div>
            </div>

            {/* Surface Temperature Readout */}
            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-sm text-white/60">Surface Temp</span>
              <span className={`text-sm font-mono ${hotplate.targetTemp > 50 ? 'text-red-400' : 'text-blue-300'}`}>
                {Math.round(hotplate.targetTemp > 0 ? hotplate.targetTemp : 22)}°C
              </span>
            </div>
            {hotplate.targetTemp > 50 && (
              <div className="text-xs text-red-400/80 mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Caution: Hot Surface
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
