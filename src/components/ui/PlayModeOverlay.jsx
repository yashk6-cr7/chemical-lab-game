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

function DesktopHint() {
  return (
    <div className="fixed bottom-6 left-6 z-30 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {[
            ['W A S D', 'Move'],
            ['Right-Click Drag', 'Look around'],
            ['Left-Click', 'Interact / Pick up'],
            ['Q', 'Put down'],
            ['F', 'Pour chemical'],
          ].map(([key, action]) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white/10 text-white text-[10px] font-bold rounded min-w-[36px] text-center border border-white/20">
                {key}
              </kbd>
              <span className="text-white/70 text-xs font-medium">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlayModeOverlay() {
  if (IS_MOBILE) return <MobileHint />
  return <DesktopHint />
}
