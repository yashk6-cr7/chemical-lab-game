/* eslint-disable */
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore from '../../store/useLabStore'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// ─────────────────────────────────────────────
// 2D CSS Screen Consequence Overlay
// Used OUTSIDE the Canvas element
// ─────────────────────────────────────────────
export function ScreenEffects() {
  const consequenceQueue = useLabStore(state => state.consequenceQueue)
  const airQuality = useLabStore(state => state.airQuality)
  const eyeExposureActive = useLabStore(state => state.eyeExposureActive)
  const isFireActive = useLabStore(state => state.isFireActive)

  // Derive active effect types from consequence queue
  const hasFire = isFireActive || consequenceQueue.some(e => e.type === 'fire_hazard')
  const hasExplosion = consequenceQueue.some(e => e.type === 'explosion')
  const hasEyeExposure = eyeExposureActive || consequenceQueue.some(e => e.type === 'eye_exposure')
  const hasSkinExposure = consequenceQueue.some(e => e.type === 'skin_exposure')
  const hasCrack = consequenceQueue.some(e => e.type === 'beaker_crack')
  const hasOverflow = consequenceQueue.some(e => e.type === 'overflow')

  const airQualityOpacity = airQuality < 50 ? Math.min(0.55, (50 - airQuality) / 80) : 0
  const blurAmount = airQuality < 40
    ? ((40 - airQuality) / 40) * 5  // 0px at 40%, 5px at 0%
    : 0

  return (
    <>
      {/* ── Air quality blur on canvas wrapper (CSS, not shader) ── */}
      {blurAmount > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            backdropFilter: `blur(${blurAmount}px)`,
            transition: 'backdrop-filter 1s ease',
          }}
        />
      )}

      {/* ── Eye Exposure: Aggressive red vignette + chromatic aberration ── */}
      <AnimatePresence>
        {hasEyeExposure && (
          <>
            {/* Red vignette — 3 pulses then slow fade */}
            <motion.div
              key="eye-vignette"
              className="absolute inset-0 pointer-events-none z-[55]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0.4, 0.85, 0.4, 0.85, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1] }}
              style={{
                background: 'radial-gradient(ellipse at center, transparent 20%, rgba(180,0,0,0.85) 100%)',
              }}
            />
            {/* Chromatic aberration via CSS filter */}
            <motion.div
              key="chromatic-aber"
              className="absolute inset-0 pointer-events-none z-[56] mix-blend-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0, 0.4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.15) 70%, transparent 100%)',
                filter: 'blur(2px)',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Air Quality: Yellow vignette builds as quality drops ── */}
      <AnimatePresence>
        {airQualityOpacity > 0 && (
          <motion.div
            key="air-vignette"
            className="absolute inset-0 pointer-events-none z-[40]"
            animate={{ opacity: [airQualityOpacity * 0.7, airQualityOpacity, airQualityOpacity * 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'radial-gradient(ellipse at center, transparent 35%, rgba(160,140,0,0.65) 100%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Fire: Animated flame border + warning ── */}
      <AnimatePresence>
        {hasFire && (
          <>
            <motion.div
              key="fire-edge"
              className="absolute inset-0 pointer-events-none z-[45]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.7, 0.4, 0.8, 0.35, 0.65, 0.3] }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              transition={{ duration: 0.4, repeat: Infinity }}
              style={{
                background: 'radial-gradient(ellipse at center, transparent 45%, rgba(220,70,0,0.7) 100%)',
                boxShadow: 'inset 0 0 80px rgba(255,100,0,0.4)',
              }}
            />
            <motion.div
              key="fire-warning"
              className="absolute top-1/4 left-0 right-0 pointer-events-none z-[46] flex justify-center"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <div style={{ background: 'rgba(120,0,0,0.85)', border: '2px solid #ef4444', borderRadius: 16, padding: '12px 28px', textAlign: 'center' }}>
                <div style={{ color: '#fca5a5', fontSize: 28, fontWeight: 900 }}>🔥 FIRE!</div>
                <div style={{ color: '#fecaca', fontSize: 13, marginTop: 4 }}>Use the fire extinguisher on the wall!</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Explosion: White flash + shockwave ring + screen shake ── */}
      <AnimatePresence>
        {hasExplosion && (
          <>
            <motion.div
              key="explosion-flash"
              className="absolute inset-0 pointer-events-none z-[70]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ background: 'white' }}
            />
            <motion.div
              key="explosion-ring"
              className="absolute inset-0 pointer-events-none z-[68] flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.1 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0.1, 2.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div style={{ width: 300, height: 300, borderRadius: '50%', border: '8px solid rgba(255,140,0,0.8)', boxShadow: '0 0 60px 20px rgba(255,80,0,0.5)' }} />
            </motion.div>
            <motion.div
              key="explosion-warning"
              className="absolute top-1/3 left-0 right-0 pointer-events-none z-[69] flex justify-center"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-30, 0, 0, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
            >
              <div style={{ background: 'rgba(120,50,0,0.92)', border: '2px solid #f97316', borderRadius: 16, padding: '16px 32px', textAlign: 'center' }}>
                <div style={{ color: '#fdba74', fontSize: 36, fontWeight: 900 }}>💥 EXPLOSION!</div>
                <div style={{ color: '#fed7aa', fontSize: 14, marginTop: 6 }}>Violent chemical reaction!</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Skin Exposure: Corner burn effects on both lower corners ── */}
      <AnimatePresence>
        {hasSkinExposure && (
          <>
            <motion.div
              key="hand-burn-left"
              className="fixed bottom-0 left-0 w-52 h-52 pointer-events-none z-[50]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0.3, 0.6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              style={{
                background: 'radial-gradient(circle at bottom left, rgba(255,80,0,0.65), transparent 70%)',
              }}
            />
            <motion.div
              key="hand-burn-right"
              className="fixed bottom-0 right-0 w-52 h-52 pointer-events-none z-[50]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0.3, 0.6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, delay: 0.1 }}
              style={{
                background: 'radial-gradient(circle at bottom right, rgba(255,80,0,0.65), transparent 70%)',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Beaker Crack: White flash ── */}
      <AnimatePresence>
        {hasCrack && (
          <motion.div
            key="crack-flash"
            className="absolute inset-0 pointer-events-none z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: 'white' }}
          />
        )}
      </AnimatePresence>

      {/* ── Overflow: Blue-white bottom spill effect ── */}
      <AnimatePresence>
        {hasOverflow && (
          <motion.div
            key="overflow-spill"
            className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-[48]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: [0, 0.5, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              background: 'linear-gradient(to top, rgba(100,180,255,0.4), transparent)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Critical air quality overlay ── */}
      <AnimatePresence>
        {airQuality <= 10 && (
          <motion.div
            key="critical-air"
            className="absolute inset-0 pointer-events-none z-[55] flex items-center justify-center"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div className="text-center">
              <div className="text-red-400 text-2xl font-black uppercase tracking-widest drop-shadow-lg">
                ☣ Lab Unsafe
              </div>
              <div className="text-red-300 text-sm mt-1 drop-shadow">
                Critical vapour level — use fume hood
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─────────────────────────────────────────────
// Dizziness effect — CSS canvas sway (inside Canvas)
// Uses CSS transform on the canvas DOM element
// — does NOT touch camera.rotation.z which is locked to 0 by PlayerControls
// ─────────────────────────────────────────────
export function DizzinessEffect() {
  const airQuality = useLabStore(state => state.airQuality)
  const { gl } = useThree()
  const timeRef = useRef(0)
  const rollRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta

    let targetRoll = 0
    if (airQuality < 30) {
      const severity  = (30 - airQuality) / 30
      const amplitude = (0.3 + severity * 1.5) // degrees
      const frequency = 0.4 + severity * 0.4
      targetRoll = Math.sin(timeRef.current * frequency * Math.PI * 2) * amplitude
    }

    // Smooth lerp towards target roll
    rollRef.current += (targetRoll - rollRef.current) * Math.min(1, delta * 5)

    // Apply via CSS transform on the canvas element — zero camera conflicts
    if (Math.abs(rollRef.current) > 0.01) {
      gl.domElement.style.transform = `rotate(${rollRef.current.toFixed(3)}deg)`
      gl.domElement.style.transformOrigin = 'center center'
    } else {
      gl.domElement.style.transform = ''
    }
  })

  return null
}
