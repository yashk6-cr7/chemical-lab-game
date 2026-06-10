import React, { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLabStore, { useOnboarding } from '../../store/useLabStore'

const SCREENS = [
  { emoji: '🧪', headline: "You're in a chemistry lab.", sub: "Touch everything.", btn: "Got it →" },
  { emoji: '⚠️', headline: "Nothing here can hurt you.", sub: "But consequences are real. No gloves? Feel what happens.", btn: "Understood →" },
  { emoji: '📦', headline: "Start with the shelf.", sub: "Pick up a bottle. Pour it into a beaker. See what happens next.", btn: "Let's go →" },
]

export const OnboardingFlow = memo(function OnboardingFlow() {
  const complete = useOnboarding()
  const [screen, setScreen] = useState(0)

  const handleNext = useCallback(() => {
    if (screen < SCREENS.length - 1) {
      setScreen(s => s + 1)
    } else {
      try { localStorage.setItem('lab-onboarding-done', '1') } catch {}
      useLabStore.getState().setOnboardingComplete()
    }
  }, [screen])

  if (complete) return null

  const s = SCREENS[screen]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center
                    bg-black/80 backdrop-blur-sm pointer-events-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6 text-center max-w-sm px-6"
        >
          <span className="text-7xl">{s.emoji}</span>

          <h1 className="text-white text-3xl font-bold leading-tight">
            {s.headline}
          </h1>

          <p className="text-white/60 text-lg leading-relaxed">
            {s.sub}
          </p>

          {/* Progress dots */}
          <div className="flex gap-2">
            {SCREENS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i === screen ? 'bg-white' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="px-8 py-3 bg-white text-black font-semibold rounded-2xl
                       text-lg hover:bg-white/90 transition-colors mt-4"
          >
            {s.btn}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
})
