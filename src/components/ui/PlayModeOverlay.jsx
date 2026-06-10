import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribePointerLock } from '../../systems/pointerLock'
import { isMobileDevice } from '../../utils/isMobile'

const IS_MOBILE = isMobileDevice()

// ── Mobile: always-visible joystick legend at bottom ─────────────────────────
function MobileHint() {
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="flex items-center gap-4 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-2.5">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-7 h-7 rounded-full border-2 border-white/40 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
          </div>
          <span className="text-white/40 text-[9px] font-medium mt-0.5">Move</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center gap-0.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <path d="M5 9l7-7 7 7"/><path d="M5 15l7 7 7-7"/>
          </svg>
          <span className="text-white/40 text-[9px] font-medium mt-0.5">Look</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg leading-none">👆</span>
          <span className="text-white/40 text-[9px] font-medium mt-0.5">Tap item</span>
        </div>
      </div>
    </div>
  )
}

// ── Desktop: Click-to-play overlay + ESC pill ─────────────────────────────────
function DesktopOverlay() {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    return subscribePointerLock(setLocked)
  }, [])

  return (
    <>
      <AnimatePresence>
        {!locked && (
          <motion.div
            key="click-to-play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex flex-col items-center gap-5 select-none"
            >
              {/* Crosshair icon */}
              <div className="w-20 h-20 rounded-full border-2 border-white/40 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.85)" stroke="none"/>
                  <line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/>
                </svg>
              </div>

              <div className="text-center">
                <p className="text-white text-2xl font-bold tracking-tight mb-1">Click to Play</p>
                <p className="text-white/45 text-sm">Your pointer will be captured by the game</p>
              </div>

              {/* Controls grid */}
              <div className="grid grid-cols-2 gap-x-10 gap-y-2.5 mt-1">
                {[
                  ['W A S D', 'Move'],
                  ['Mouse', 'Look around'],
                  ['E', 'Pick up item'],
                  ['Q / Right-click', 'Put down'],
                  ['F', 'Pour chemical'],
                  ['ESC', 'Pause / cursor'],
                ].map(([key, action]) => (
                  <div key={key} className="flex items-center gap-3">
                    <kbd className="px-2.5 py-0.5 bg-white/12 text-white text-xs font-bold rounded-md border border-white/20 min-w-[52px] text-center whitespace-nowrap">
                      {key}
                    </kbd>
                    <span className="text-white/55 text-xs">{action}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ESC hint when locked */}
      <AnimatePresence>
        {locked && (
          <motion.div
            key="esc-hint"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1">
              <kbd className="text-white/50 text-[10px] font-bold bg-white/10 rounded px-1.5 py-0.5 border border-white/20">ESC</kbd>
              <span className="text-white/35 text-[10px]">to pause</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function PlayModeOverlay() {
  if (IS_MOBILE) return <MobileHint />
  return <DesktopOverlay />
}
