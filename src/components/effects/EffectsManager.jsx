/* eslint-disable */
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import useLabStore from '../../store/useLabStore'
import BubbleEffect from './BubbleEffect'
import SteamEffect from './SteamEffect'
import FireEffect from './FireEffect'
import SmokeEffect from './SmokeEffect'
import VaporDriftEffect from './VaporDriftEffect'
import PrecipitateEffect from './PrecipitateEffect'
import ColorShiftEffect from './ColorShiftEffect'
import SpatterEffect from './SpatterEffect'
import { DizzinessEffect } from './ScreenEffects'
import { updateAirQuality } from '../../systems/safetyManager'

// performance.md: Effect budget system — enforces 60 FPS target
// Adaptive quality degrades gracefully under load
const QUALITY_THRESHOLDS = { high: 55, mid: 40 }
const EFFECT_BUDGET = {
  high: { maxParticles: 200, steam: true,  volumetrics: true,  maxBeakerEffects: 4 },
  mid:  { maxParticles: 100, steam: true,  volumetrics: false, maxBeakerEffects: 3 },
  low:  { maxParticles: 50,  steam: false, volumetrics: false, maxBeakerEffects: 2 },
}

// FPS sampler — samples every 90 frames for stability
function useFPSAdaptiveQuality() {
  const fpsHistory  = useRef([])
  const qualityRef  = useRef('high')
  const frameCount  = useRef(0)
  const lastTime    = useRef(performance.now())

  useFrame(() => {
    frameCount.current++
    if (frameCount.current < 90) return

    const now     = performance.now()
    const elapsed = (now - lastTime.current) / 1000
    const fps     = frameCount.current / elapsed

    frameCount.current = 0
    lastTime.current   = now

    fpsHistory.current.push(fps)
    if (fpsHistory.current.length > 5) fpsHistory.current.shift()

    const avg = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length

    if (avg >= QUALITY_THRESHOLDS.high)     qualityRef.current = 'high'
    else if (avg >= QUALITY_THRESHOLDS.mid) qualityRef.current = 'mid'
    else                                    qualityRef.current = 'low'
  })

  return qualityRef
}

export default function EffectsManager() {
  const beakers         = useLabStore(state => state.beakers)
  const airQuality      = useLabStore(state => state.airQuality)
  const setAirQuality   = useLabStore(state => state.setAirQuality)
  const currentReactions= useLabStore(state => state.currentReactions)
  const inFumeHood      = useLabStore(state => state.inFumeHood)

  const airQualityRef = useRef(airQuality)
  airQualityRef.current = airQuality

  const qualityRef = useFPSAdaptiveQuality()

  // Air quality update — runs in useFrame, not setState per tick (react.md)
  useFrame((_, delta) => {
    const newAQ = updateAirQuality(currentReactions, inFumeHood, airQualityRef.current, delta)
    if (Math.abs(newAQ - airQualityRef.current) > 0.1) {
      setAirQuality(newAQ)
    }
  })

  const quality = qualityRef.current
  const budget  = EFFECT_BUDGET[quality] ?? EFFECT_BUDGET.high

  return (
    <>
      {beakers.slice(0, budget.maxBeakerEffects).map(beaker => {
        const { reactionResult, position, totalVolume, mixedColor, contents } = beaker
        if (!reactionResult || totalVolume === 0) return null

        const type      = reactionResult.type
        const intensity = reactionResult.intensity || 0
        const worldPos  = [position[0], position[1] + 0.18, position[2]]

        return (
          <group key={beaker.id}>
            {/* BUBBLES */}
            {(type === 'acid_carbonate' || type === 'acid_metal' ||
              type === 'catalytic_decomposition' || type === 'neutralization_violent') &&
              totalVolume > 0 && (
              <BubbleEffect
                position={[position[0], position[1] + 0.05, position[2]]}
                intensity={Math.min(intensity, budget.maxParticles / 20)}
                color={type === 'catalytic_decomposition' ? '#ffffff' : '#e0f0ff'}
                foamMode={type === 'catalytic_decomposition' && intensity >= 9}
              />
            )}

            {/* GENTLE BUBBLES */}
            {type === 'neutralization_gentle' && totalVolume > 0 && (
              <BubbleEffect
                position={[position[0], position[1] + 0.05, position[2]]}
                intensity={Math.min(3, intensity)}
                color="#e0f0ff"
              />
            )}

            {/* STEAM — only if budget allows */}
            {budget.steam &&
              (type === 'neutralization_violent' || type === 'dangerous_dilution' || beaker.temperature > 70) && (
              <SteamEffect
                position={worldPos}
                temperature={beaker.temperature}
                intensity={intensity}
              />
            )}

            {/* FIRE + SMOKE */}
            {type === 'flammable_vapor' && reactionResult.isFire && (
              <>
                <FireEffect position={worldPos} intensity={intensity} />
                <SmokeEffect
                  position={[worldPos[0], worldPos[1] + 0.3, worldPos[2]]}
                  intensity={intensity}
                  color="#444444"
                />
              </>
            )}

            {/* VAPOR DRIFT — volumetric when budget allows, sprite fallback otherwise */}
            {(type === 'volatile_exposure' || reactionResult.visualEffects?.includes('vapor_drift')) && (
              budget.volumetrics ? (
                <VaporDriftEffect position={worldPos} chemicalColor={mixedColor} />
              ) : (
                <SteamEffect position={worldPos} temperature={50} intensity={2} />
              )
            )}

            {/* PRECIPITATE */}
            {type === 'precipitation' && reactionResult.precipitateFormed && (
              <PrecipitateEffect
                position={[position[0], position[1] + 0.01, position[2]]}
                precipitateColor={reactionResult.precipitateColor || '#1e88e5'}
                amount={totalVolume}
              />
            )}

            {/* COLOR SHIFT */}
            {reactionResult.colorChange && (
              <ColorShiftEffect
                position={[position[0], position[1] + 0.16, position[2]]}
                fromColor={contents.length > 1 ? contents[contents.length - 2]?.color : '#ffffff'}
                toColor={reactionResult.colorChange}
                duration={type === 'indicator_response' ? 0.5 : 1.2}
              />
            )}

            {/* SPATTER */}
            {type === 'dangerous_dilution' && (
              <SpatterEffect
                position={[position[0], position[1] + 0.18, position[2]]}
                color={mixedColor}
              />
            )}
          </group>
        )
      })}

      {/* Camera dizziness effect (lives inside Canvas) */}
      <DizzinessEffect />
    </>
  )
}
