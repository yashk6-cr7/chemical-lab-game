import { useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { ACESFilmicToneMapping } from 'three'
import { shallow } from 'zustand/shallow'

// Lab scene
import Lighting from './components/lab/Lighting'
import Room from './components/lab/Room'
import Bench from './components/lab/Bench'
import FumeHood from './components/lab/FumeHood'
import SafetyCorner from './components/lab/SafetyCorner'
import PlayerControls from './components/lab/PlayerControls'

// Equipment
import Beaker from './components/equipment/Beaker'
import FireExtinguisher from './components/equipment/FireExtinguisher'

// Chemicals
import ChemicalShelf from './components/chemicals/ChemicalShelf'
import ChemicalPickup from './components/chemicals/ChemicalPickup'

// Effects
import EffectsManager from './components/effects/EffectsManager'
import { ScreenEffects, DizzinessEffect } from './components/effects/ScreenEffects'

// UI — Phase 1-6
import EnterOverlay from './components/ui/EnterOverlay'
import ChemicalInfoPanel from './components/ui/ChemicalInfoPanel'
import Crosshair from './components/ui/Crosshair'
import HotplateUI from './components/ui/HotplateUI'

// UI — Phase 7
import SafetyGearPanel from './components/ui/SafetyGearPanel'
import AirQualityMeter from './components/ui/AirQualityMeter'
import ConsequenceDisplay from './components/ui/ConsequenceDisplay'
import SafetyDashboard, { SafetyDashboardTrigger } from './components/ui/SafetyDashboard'

import ErrorBoundary from './components/ErrorBoundary'
import useLabStore from './store/useLabStore'
import './index.css'

// ── Shared hover light (1 light instead of per-bottle) ─────────────────────────
function HoverLight() {
  const hoverLight = useLabStore(state => state.hoverLight, shallow)
  if (!hoverLight?.active) return null
  return (
    <pointLight
      position={hoverLight.position}
      color={hoverLight.color || '#ffffff'}
      intensity={0.8}
      distance={0.5}
      castShadow={false}
    />
  )
}

// ── Interaction hint overlay (E to use) ───────────────────────────────────────
function InteractionHint() {
  const hoverTarget = useLabStore(state => state.hoverTarget)

  const HINTS = {
    extinguisher: 'Click to pick up fire extinguisher  •  Right-click to spray',
    eyewash: 'Click to use eyewash station',
    shower: 'Click to activate emergency shower',
  }

  const hint = HINTS[hoverTarget]
  if (!hint) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-2 text-white/80 text-sm font-medium">
        {hint}
      </div>
    </div>
  )
}

// ── Air quality simulation (drops when volatile reactions outside fume hood) ───
function AirQualitySimulator() {
  const airQuality = useLabStore(state => state.airQuality)
  const setAirQuality = useLabStore(state => state.setAirQuality)
  const currentReactions = useLabStore(state => state.currentReactions, shallow)
  const inFumeHood = useLabStore(state => state.inFumeHood)

  useEffect(() => {
    const interval = setInterval(() => {
      const hasVolatile = currentReactions.some(r => r.producesGas || r.isVolatile)
      if (hasVolatile && !inFumeHood) {
        setAirQuality(Math.max(0, airQuality - 0.8))
      } else if (airQuality < 100) {
        // Natural recovery
        setAirQuality(Math.min(100, airQuality + (inFumeHood ? 3 : 0.4)))
      }
    }, 500)
    return () => clearInterval(interval)
  }, [airQuality, currentReactions, inFumeHood, setAirQuality])

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [isEntered, setIsEntered] = useState(false)
  const beakers = useLabStore(state => state.beakers, shallow)

  const handleEnter = useCallback(() => setIsEntered(true), [])

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen relative bg-black overflow-hidden">

        {/* ── 3D Canvas — always mounted so pointer lock attaches ── */}
        <Canvas
          frameloop="always"
          shadows
          dpr={[1, 2]}
          camera={{ fov: 72, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: false,
            alpha: false,
            stencil: false,
            toneMapping: ACESFilmicToneMapping
          }}
          className="w-full h-full"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Lighting />
          <Room />

          <Physics gravity={[0, -9.81, 0]}>
            <Bench />
            <FumeHood />
            <SafetyCorner />
            <ChemicalShelf />

            {/* Beakers */}
            <group>
              {beakers.map(beaker => (
                <Beaker key={beaker.id} beaker={beaker} />
              ))}
            </group>

            {/* Fire Extinguisher — Phase 7 interactive */}
            <FireExtinguisher />
          </Physics>

          {/* Held bottle follows camera */}
          <ChemicalPickup />

          {/* Shared hover light */}
          <HoverLight />

          {/* Reaction visual effects */}
          <EffectsManager />

          {/* Camera dizziness from air quality (must be inside Canvas) */}
          <DizzinessEffect />

          {/* Player controls */}
          <PlayerControls />

          {/* Postprocessing */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.85}
              luminanceSmoothing={0.2}
              intensity={0.4}
              radius={0.4}
              mipmapBlur
            />
            <Vignette offset={0.4} darkness={0.4} eskil={false} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Canvas>

        {/* ── 2D UI Layer — always outside Canvas ── */}

        {/* Enter / splash screen */}
        {!isEntered && <EnterOverlay onEnter={handleEnter} />}

        {isEntered && (
          <>
            {/* ── Phase 1-6 UI ── */}
            <ChemicalInfoPanel />
            <Crosshair />
            <HotplateUI />

            {/* ── Phase 7 UI ── */}
            <SafetyGearPanel />
            <AirQualityMeter />
            <ConsequenceDisplay />
            <SafetyDashboard />
            <SafetyDashboardTrigger />

            {/* Interaction hints for emergency equipment */}
            <InteractionHint />

            {/* Screen consequence effects (vignettes, blur, chromatic aberration) */}
            <ScreenEffects />

            {/* Air quality simulator */}
            <AirQualitySimulator />
          </>
        )}

      </div>
    </ErrorBoundary>
  )
}
