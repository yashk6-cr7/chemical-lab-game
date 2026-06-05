/* eslint-disable */
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'

// performance.md: Adaptive quality hook — monitors FPS and returns quality level
// Components read this and adjust particle counts, shadow quality, effect complexity

const THRESHOLDS = { high: 55, mid: 40 }

/**
 * useAdaptiveQuality — returns a ref containing current quality level string.
 * Use a ref (not state) so quality changes don't trigger React re-renders.
 * Components read qualityRef.current inside useFrame loops instead.
 *
 * Quality levels: 'high' | 'mid' | 'low'
 *
 * Usage:
 *   const qualityRef = useAdaptiveQuality()
 *   useFrame(() => {
 *     const budget = BUDGETS[qualityRef.current]
 *   })
 */
export function useAdaptiveQuality() {
  const qualityRef  = useRef('high')
  const frameCount  = useRef(0)
  const lastTime    = useRef(performance.now())
  const history     = useRef([])

  useFrame(() => {
    frameCount.current++
    // Sample every 90 frames (~1.5s at 60fps) for stable averaging
    if (frameCount.current < 90) return

    const now     = performance.now()
    const elapsed = (now - lastTime.current) / 1000
    const fps     = frameCount.current / Math.max(elapsed, 0.001)

    frameCount.current = 0
    lastTime.current   = now

    // Keep rolling average of last 5 samples (5 * 1.5s = 7.5s window)
    history.current.push(fps)
    if (history.current.length > 5) history.current.shift()

    const avg = history.current.reduce((a, b) => a + b, 0) / history.current.length

    if (avg >= THRESHOLDS.high)     qualityRef.current = 'high'
    else if (avg >= THRESHOLDS.mid) qualityRef.current = 'mid'
    else                            qualityRef.current = 'low'
  })

  return qualityRef
}
