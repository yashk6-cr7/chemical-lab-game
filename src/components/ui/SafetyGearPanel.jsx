import { useEffect } from 'react'
import { motion } from 'framer-motion'
import useLabStore from '../../store/useLabStore'
import { shallow } from 'zustand/shallow'

export default function SafetyGearPanel() {
  const safetyGear = useLabStore(state => state.safetyGear, shallow)
  const toggleCoat = useLabStore(state => state.toggleCoat)
  const toggleGoggles = useLabStore(state => state.toggleGoggles)
  const toggleGloves = useLabStore(state => state.toggleGloves)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      switch(e.key) {
        case '1': toggleCoat(); break;
        case '2': toggleGoggles(); break;
        case '3': toggleGloves(); break;
        default: break;
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleCoat, toggleGoggles, toggleGloves])

  const renderItem = (name, hotkey, isOn, toggleFn, iconSvg, activeColorStr, activeBorderStr) => {
    return (
      <motion.button
        onClick={toggleFn}
        whileTap={{ scale: 0.95 }}
        animate={isOn ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`flex items-center gap-4 w-full p-3 rounded-xl border transition-all duration-300 ${
          isOn 
            ? `${activeColorStr} ${activeBorderStr} shadow-[0_0_15px_rgba(255,255,255,0.1)]` 
            : 'bg-transparent border-transparent hover:bg-white/5'
        }`}
      >
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
          isOn ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40'
        }`}>
          {iconSvg}
        </div>
        
        <div className="flex-1 text-left">
          <div className={`font-semibold text-sm transition-colors ${isOn ? 'text-white' : 'text-white/40'}`}>
            {name}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/30 font-mono mt-0.5">
            Press [{hotkey}]
          </div>
        </div>
        
        <div className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
          isOn ? 'bg-white/20 text-white' : 'bg-black/30 text-white/30'
        }`}>
          {isOn ? 'ON' : 'OFF'}
        </div>
      </motion.button>
    )
  }

  // Icons
  const coatIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M4 8l8-5 8 5v13h-16z" />
      <path d="M8 8v13" />
      <path d="M16 8v13" />
    </svg>
  )

  const gogglesIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <rect x="4" y="8" width="6" height="8" rx="2" />
      <rect x="14" y="8" width="6" height="8" rx="2" />
      <path d="M10 12h4" />
    </svg>
  )

  const glovesIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 11V5a2 2 0 0 0-4 0v4" />
      <path d="M12 9V3a2 2 0 0 0-4 0v6" />
      <path d="M8 10V4a2 2 0 0 0-4 0v7a8 8 0 0 0 16 0v-4a2 2 0 0 0-4 0v4" />
    </svg>
  )

  return (
    <div className="absolute top-6 left-6 w-64 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl z-40 select-none">
      <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 px-2 flex justify-between items-center">
        <span>Safety Gear</span>
        <span className="w-2 h-2 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
      </div>
      
      <div className="flex flex-col gap-2">
        {renderItem("Lab Coat", "1", safetyGear.coat, toggleCoat, coatIcon, "bg-blue-500/10", "border-blue-400/30")}
        {renderItem("Goggles", "2", safetyGear.goggles, toggleGoggles, gogglesIcon, "bg-cyan-500/10", "border-cyan-400/30")}
        {renderItem("Gloves", "3", safetyGear.gloves, toggleGloves, glovesIcon, "bg-green-500/10", "border-green-400/30")}
      </div>
    </div>
  )
}
