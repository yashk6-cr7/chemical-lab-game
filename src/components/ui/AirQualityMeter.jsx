import { memo, useEffect, useRef, useState } from 'react'
import useLabStore from '../../store/useLabStore'
import { motion, AnimatePresence } from 'framer-motion'

const BANDS = [
  { min: 80, max: 100, color: '#4caf50', label: 'Clean', pulse: false },
  { min: 60, max: 80,  color: '#8bc34a', label: 'Mild Fumes', pulse: false },
  { min: 40, max: 60,  color: '#ffc107', label: 'Poor — Use Fume Hood', pulse: false },
  { min: 20, max: 40,  color: '#ff9800', label: 'Dangerous — Evacuate Risk', pulse: false },
  { min: 0,  max: 20,  color: '#f44336', label: 'Critical — Lab Unsafe', pulse: true },
]

function getBand(quality) {
  return BANDS.find(b => quality >= b.min && quality <= b.max) || BANDS[BANDS.length - 1]
}

const AirQualityMeter = memo(function AirQualityMeter() {
  const realQuality = useLabStore(state => state.airQuality)

  // Smooth display value — interpolates toward real value at 200ms intervals
  const displayRef = useRef(realQuality)
  const [displayValue, setDisplayValue] = useState(realQuality)
  const [band, setBand] = useState(getBand(realQuality))

  useEffect(() => {
    const interval = setInterval(() => {
      const current = displayRef.current
      const target = realQuality
      const next = current + (target - current) * 0.15
      const rounded = Math.round(next)
      displayRef.current = next
      setDisplayValue(rounded)
      setBand(getBand(rounded))
    }, 100)
    return () => clearInterval(interval)
  }, [realQuality])

  const isCritical = band.pulse

  return (
    <div className="fixed top-6 right-6 w-56 z-40 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {/* Animated air icon */}
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {[0, 1, 2].map(i => (
              <path
                key={i}
                d={`M3 ${8 + i * 4} Q8 ${6 + i * 4} 13 ${8 + i * 4} Q18 ${10 + i * 4} 21 ${8 + i * 4}`}
                stroke={band.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                style={{
                  animation: `airWave ${1.2 + i * 0.3}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: isCritical ? 1 : 0.7 + i * 0.1,
                }}
              />
            ))}
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Air Quality</div>
          <motion.div
            key={displayValue}
            className="text-xl font-black leading-none"
            style={{ color: band.color }}
            animate={isCritical ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
            transition={isCritical ? { repeat: Infinity, duration: 0.8 } : {}}
          >
            {displayValue}%
          </motion.div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${Math.max(0, displayValue)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ backgroundColor: band.color }}
        />
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={band.label}
          initial={{ opacity: 0, y: 4 }}
          animate={isCritical
            ? { opacity: [1, 0.4, 1], y: 0 }
            : { opacity: 1, y: 0 }
          }
          exit={{ opacity: 0 }}
          transition={isCritical
            ? { opacity: { repeat: Infinity, duration: 0.8 }, y: { duration: 0.2 } }
            : { duration: 0.2 }
          }
          className="text-[10px] font-semibold"
          style={{ color: band.color }}
        >
          {band.label}
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes airWave {
          from { stroke-dashoffset: 0; opacity: 0.6; }
          to { stroke-dashoffset: 10; opacity: 1; }
        }
      `}</style>
    </div>
  )
})

export default AirQualityMeter
