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
const QUALITY_THRESHOLDS = { high: 55, mid: 40 }
const EFFECT_BUDGET = {
  high: { maxParticles: 200, steam: true,  volumetrics: true,  maxBeakerEffects: 4 },
  mid:  { maxParticles: 100, steam: true,  volumetrics: false, maxBeakerEffects: 3 },
  low:  { maxParticles: 50,  steam: false, volumetrics: false, maxBeakerEffects: 2 },
}

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

// Explosion flash — a quick white-orange shockwave ball that expands and fades
function ExplosionEffect({ position, intensity = 10 }) {
  const meshRef = useRef()
  const timeRef = useRef(0)
  const [alive, setAlive] = useState(true)

  useFrame((_, delta) => {
    if (!meshRef.current || !alive) return
    timeRef.current += delta
    const t = timeRef.current
    // Expand fast then fade
    const scale = Math.min(t * 8, 2.5) * (intensity / 10)
    const opacity = Math.max(0, 1 - t * 2.5)
    meshRef.current.scale.setScalar(scale)
    meshRef.current.material.opacity = opacity
    if (t > 0.8) setAlive(false)
  })

  if (!alive) return null

  return (
    <group position={position}>
      {/* Core flash */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color="#ffdd44"
          transparent
          opacity={1}
          depthWrite={false}
          blending={3} // AdditiveBlending
        />
      </mesh>
      {/* Shockwave ring */}
      <ExplosionRing position={[0, 0, 0]} intensity={intensity} />
      {/* Point light flash */}
      <pointLight color="#ff6600" intensity={intensity * 3} distance={3} decay={2} />
    </group>
  )
}

function ExplosionRing({ position, intensity }) {
  const meshRef = useRef()
  const timeRef = useRef(0)
  const [alive, setAlive] = useState(true)

  useFrame((_, delta) => {
    if (!meshRef.current || !alive) return
    timeRef.current += delta
    const t = timeRef.current
    const scale = t * 5 * (intensity / 10)
    const opacity = Math.max(0, 0.8 - t * 2)
    meshRef.current.scale.setScalar(scale)
    meshRef.current.material.opacity = opacity
    if (t > 0.5) setAlive(false)
  })

  if (!alive) return null

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.08, 0.14, 32]} />
      <meshBasicMaterial
        color="#ff8800"
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={3}
        side={2}
      />
    </mesh>
  )
}

export default function EffectsManager() {
  const beakers         = useLabStore(state => state.beakers)
  const airQuality      = useLabStore(state => state.airQuality)
  const setAirQuality   = useLabStore(state => state.setAirQuality)
  const currentReactions= useLabStore(state => state.currentReactions)
  const inFumeHood      = useLabStore(state => state.inFumeHood)
  const setFireActive   = useLabStore(state => state.setFireActive)
  const extinguishFire  = useLabStore(state => state.extinguishFire)

  const airQualityRef = useRef(airQuality)
  airQualityRef.current = airQuality

  // Track explosion triggers per beaker to avoid re-triggering every frame
  const explosionTriggeredRef = useRef({})
  const [activeExplosions, setActiveExplosions] = useState([])

  const qualityRef = useFPSAdaptiveQuality()

  // Air quality update
  useFrame((_, delta) => {
    const newAQ = updateAirQuality(currentReactions, inFumeHood, airQualityRef.current, delta)
    if (Math.abs(newAQ - airQualityRef.current) > 0.1) {
      setAirQuality(newAQ)
    }
  })

  // Fire/explosion consequence side-effects
  useEffect(() => {
    beakers.forEach(beaker => {
      const rr = beaker.reactionResult
      if (!rr) return

      // Trigger fire store state when reaction is a fire
      if (rr.isFire) {
        setFireActive(beaker.id, rr.intensity)
      }

      // Trigger explosion flash for extremely violent reactions only once per beaker
      const isExplosive = rr.isExplosive ||
        rr.type === 'catalytic_decomposition' ||
        (rr.type === 'dangerous_dilution' && rr.intensity >= 9) ||
        (rr.type === 'neutralization_violent' && rr.intensity >= 9)

      if (isExplosive && !explosionTriggeredRef.current[beaker.id]) {
        explosionTriggeredRef.current[beaker.id] = true
        const pos = [beaker.position[0], beaker.position[1] + 0.25, beaker.position[2]]
        setActiveExplosions(prev => [...prev, { id: Date.now(), position: pos, intensity: rr.intensity }])
        // Clear flag after 3 seconds so re-adding same chemical re-triggers
        setTimeout(() => { explosionTriggeredRef.current[beaker.id] = false }, 3000)
      }

      // Reset fire if no longer active
      if (!rr.isFire) {
        extinguishFire()
      }
    })
  }, [beakers])

  const quality = qualityRef.current
  const budget  = EFFECT_BUDGET[quality] ?? EFFECT_BUDGET.high

  // Helper: should this reaction show bubbles?
  const isBubbly = (type) => [
    'acid_carbonate', 'acid_carbonate_strong', 'acid_carbonate_gentle',
    'acid_metal', 'catalytic_decomposition',
    'neutralization_violent', 'neutralization_gentle',
    'clock_reaction',
  ].includes(type)

  // Helper: should this reaction show fire?
  const isOnFire = (rr) => rr.isFire || rr.type === 'flammable_vapor' && rr.isFire

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

            {/* ── BUBBLES for all bubbly reaction types ── */}
            {isBubbly(type) && totalVolume > 0 && (
              <BubbleEffect
                position={[position[0], position[1] + 0.05, position[2]]}
                intensity={Math.min(intensity, budget.maxParticles / 20)}
                color={type === 'catalytic_decomposition' ? '#ffffff' : '#e0f0ff'}
                foamMode={type === 'catalytic_decomposition' && intensity >= 8}
              />
            )}

            {/* ── STEAM: violent/hot reactions and beakers above 70°C ── */}
            {budget.steam && (
              (type === 'neutralization_violent' ||
               type === 'dangerous_dilution' ||
               type === 'acid_metal' ||
               beaker.temperature > 70) && (
                <SteamEffect
                  position={worldPos}
                  temperature={beaker.temperature}
                  intensity={intensity}
                />
              )
            )}

            {/* ── FIRE + SMOKE: any reaction with isFire flag ── */}
            {reactionResult.isFire && (
              <>
                <FireEffect position={worldPos} intensity={intensity} />
                <SmokeEffect
                  position={[worldPos[0], worldPos[1] + 0.3, worldPos[2]]}
                  intensity={Math.min(intensity, 8)}
                  color={type === 'dangerous_dilution' ? '#cccccc' : '#444444'}
                />
              </>
            )}

            {/* ── FIRE for flammable vapors even before full ignition ── */}
            {type === 'flammable_vapor' && !reactionResult.isFire && intensity > 4 && (
              <VaporDriftEffect position={worldPos} chemicalColor="#fffde7" />
            )}

            {/* ── ACID FUMES: white vapor for H₂SO₄ and HCl ── */}
            {(type === 'acid_fuming' || type === 'acid_decomposing' ||
              reactionResult.visualEffects?.includes('acid_fumes') ||
              reactionResult.visualEffects?.includes('dense_fumes')) && (
              <SteamEffect
                position={worldPos}
                temperature={200}
                intensity={Math.min(intensity + 2, 10)}
              />
            )}

            {/* ── WHITE SMOKE: HCl + NH₃ ── */}
            {type === 'smoke_reaction' && (
              <SmokeEffect
                position={[worldPos[0], worldPos[1] + 0.1, worldPos[2]]}
                intensity={6}
                color="#f0f0f0"
              />
            )}

            {/* ── MILKY PRECIPITATION: Na₂S₂O₃ clock reaction ── */}
            {type === 'clock_reaction' && reactionResult.precipitateFormed && (
              <PrecipitateEffect
                position={[position[0], position[1] + 0.01, position[2]]}
                precipitateColor="#ffffcc"
                amount={totalVolume}
              />
            )}

            {/* ── VAPOR DRIFT for volatile chemicals ── */}
            {(type === 'volatile_exposure' ||
              reactionResult.visualEffects?.includes('vapor_drift')) && (
              budget.volumetrics
                ? <VaporDriftEffect position={worldPos} chemicalColor={mixedColor} />
                : <SteamEffect position={worldPos} temperature={50} intensity={2} />
            )}

            {/* ── PRECIPITATE ── */}
            {reactionResult.precipitateFormed && type === 'precipitation' && (
              <PrecipitateEffect
                position={[position[0], position[1] + 0.01, position[2]]}
                precipitateColor={reactionResult.precipitateColor || '#1e88e5'}
                amount={totalVolume}
              />
            )}

            {/* ── COLOR SHIFT ── */}
            {reactionResult.colorChange && (
              <ColorShiftEffect
                position={[position[0], position[1] + 0.16, position[2]]}
                fromColor={contents.length > 1 ? contents[contents.length - 2]?.color : '#ffffff'}
                toColor={reactionResult.colorChange}
                duration={type === 'indicator_response' ? 0.5 : 1.2}
              />
            )}

            {/* ── SPATTER: acid+water violent dilution ── */}
            {type === 'dangerous_dilution' && (
              <SpatterEffect
                position={[position[0], position[1] + 0.18, position[2]]}
                color={mixedColor}
              />
            )}

          </group>
        )
      })}

      {/* ── EXPLOSIONS ── Rendered outside beaker loop, managed by state */}
      {activeExplosions.map(exp => (
        <ExplosionEffect
          key={exp.id}
          position={exp.position}
          intensity={exp.intensity}
        />
      ))}

      {/* Camera dizziness effect */}
      <DizzinessEffect />
    </>
  )
}
