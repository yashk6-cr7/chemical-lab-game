/* eslint-disable */
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'
import { useEffect, useState, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// 2D screen consequence overlay - used OUTSIDE Canvas
export function ScreenEffects() {
  const pendingConsequences = useLabStore(state => state.pendingConsequences)
  const processNextConsequence = useLabStore(state => state.processNextConsequence)
  const airQuality = useLabStore(state => state.airQuality)
  const depthMode = useLabStore(state => state.depthMode)

  const [activeEffects, setActiveEffects] = useState([])
  const timerRef = useRef(null)

  // Pull from queue and display
  useEffect(() => {
    if (pendingConsequences.length > 0) {
      const next = pendingConsequences[0]
      setActiveEffects(prev => {
        // Avoid duplicates by type
        if (prev.find(e => e.type === next.type)) return prev
        return [...prev, { ...next, id: Date.now() }]
      })
      processNextConsequence()

      // Auto-remove after duration
      timerRef.current = setTimeout(() => {
        setActiveEffects(prev => prev.filter(e => e.type !== next.type))
      }, (next.duration || 3) * 1000)
    }
  }, [pendingConsequences.length])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const airQualityOpacity = airQuality < 50 
    ? Math.min(0.6, (50 - airQuality) / 80) 
    : 0

  const hasFire = activeEffects.some(e => e.type === 'fire_hazard')
  const hasEyeExposure = activeEffects.some(e => e.type === 'eye_exposure')
  const hasSkinExposure = activeEffects.some(e => e.type === 'skin_exposure')
  const hasCrack = activeEffects.some(e => e.type === 'beaker_crack')

  return (
    <>
      {/* Red Vignette — Eye Exposure */}
      <AnimatePresence>
        {hasEyeExposure && (
          <motion.div
            key="eye-vignette"
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.4, 0.7, 0.4], transition: { duration: 2, repeat: 1 } }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, rgba(180,0,0,0.75) 100%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Yellow Pulse — Air Quality */}
      <AnimatePresence>
        {airQualityOpacity > 0 && (
          <motion.div
            key="air-vignette"
            className="absolute inset-0 pointer-events-none z-40"
            animate={{ opacity: [airQualityOpacity * 0.7, airQualityOpacity, airQualityOpacity * 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(180,160,0,0.6) 100%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Fire Edge */}
      <AnimatePresence>
        {hasFire && (
          <motion.div
            key="fire-edge"
            className="absolute inset-0 pointer-events-none z-45"
            animate={{ opacity: [0.3, 0.6, 0.3, 0.7, 0.4] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(220,80,0,0.65) 100%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Hand/Skin Indicator */}
      <AnimatePresence>
        {hasSkinExposure && (
          <motion.div
            key="hand-indicator"
            className="absolute bottom-8 right-8 pointer-events-none z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.8, 0, 0.8, 0], scale: [0.8, 1, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <div className="w-16 h-16 rounded-lg bg-red-600/50 border border-red-400 flex items-center justify-center text-white text-2xl">
              ✋
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crack Flash */}
      <AnimatePresence>
        {hasCrack && (
          <motion.div
            key="crack-flash"
            className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: 'white' }}
          />
        )}
      </AnimatePresence>

      {/* Consequence message popups */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {activeEffects.map(effect => (
            <motion.div
              key={effect.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`px-4 py-3 rounded-xl shadow-2xl max-w-sm text-center backdrop-blur-md border ${
                effect.severity >= 5 ? 'bg-red-950/90 border-red-500 text-red-200' :
                effect.severity >= 3 ? 'bg-orange-950/90 border-orange-500 text-orange-200' :
                'bg-gray-900/90 border-gray-600 text-gray-200'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-60">
                {effect.severity >= 5 ? '⚠️ SAFETY HAZARD' : effect.severity >= 3 ? '⚡ WARNING' : '📋 NOTE'}
              </div>
              <div className="text-sm leading-relaxed">
                {depthMode === 'complex' ? effect.message.complex :
                 depthMode === 'moderate' ? effect.message.moderate :
                 effect.message.easy}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Air quality indicator */}
      <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-1 pointer-events-none">
        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Air Quality</div>
        <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(0, airQuality)}%`,
              backgroundColor: airQuality > 60 ? '#4ade80' : airQuality > 30 ? '#facc15' : '#f87171'
            }}
          />
        </div>
        <div className="text-[9px] font-mono text-gray-500">{Math.round(airQuality)}%</div>
      </div>
    </>
  )
}

// Dizziness effect — camera sway driven by airQuality (must be inside Canvas)
export function DizzinessEffect() {
  const airQuality = useLabStore(state => state.airQuality)
  const { camera } = useThree()
  const timeRef = useRef(0)
  const basePosRef = useRef(null)

  useFrame((_, delta) => {
    if (!basePosRef.current) {
      basePosRef.current = camera.position.clone()
    }

    timeRef.current += delta

    if (airQuality < 20) {
      const amplitude = airQuality < 10 ? 0.04 : 0.015
      const frequency = airQuality < 10 ? 0.8 : 0.5
      camera.rotation.z = Math.sin(timeRef.current * frequency * Math.PI * 2) * amplitude
    } else {
      camera.rotation.z *= 0.9 // slowly recover
    }
  })

  return null
}
