import React, { memo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import useLabStore, { useShowPerf } from '../../store/useLabStore'

// This component sits INSIDE the Canvas
export const PerfMonitorCanvas = memo(function PerfMonitorCanvas() {
  const { gl } = useThree()
  const fpsRef = useRef(0)
  const frameTimesRef = useRef([])
  const showPerf = useLabStore(s => s.showPerfMonitor)

  useFrame(() => {
    if (!showPerf) return
    const now = performance.now()
    frameTimesRef.current.push(now)
    // Keep last 60 frames
    if (frameTimesRef.current.length > 60) frameTimesRef.current.shift()
    if (frameTimesRef.current.length > 1) {
      const elapsed = now - frameTimesRef.current[0]
      fpsRef.current = Math.round((frameTimesRef.current.length - 1) / (elapsed / 1000))
    }
    // Write to a DOM element directly (no setState — no re-render)
    const el = document.getElementById('perf-fps')
    if (el) el.textContent = `${fpsRef.current} fps`
    const drawEl = document.getElementById('perf-draw')
    if (drawEl) drawEl.textContent = `${gl.info.render.calls} draw calls`
    const memEl = document.getElementById('perf-mem')
    if (memEl && performance.memory) {
      memEl.textContent = `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB`
    }
  })

  return null  // no JSX — DOM writes above handle display
})

// HTML overlay (outside Canvas)
export const PerfMonitor = memo(function PerfMonitor() {
  const show = useShowPerf()
  if (!show) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50
                    backdrop-blur-md bg-black/60 border border-white/10
                    rounded-xl px-4 py-2 font-mono text-xs text-green-400
                    flex gap-4 pointer-events-none">
      <span id="perf-fps">-- fps</span>
      <span id="perf-draw">-- draw calls</span>
      <span id="perf-mem">-- MB</span>
    </div>
  )
})
