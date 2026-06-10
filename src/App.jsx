import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { ACESFilmicToneMapping } from 'three'

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
import { DustMotesEffect } from './components/effects/DustMotesEffect'

// Phase 9 3D
import { TitrationSetup } from './components/equipment/TitrationSetup'
import { Pipette } from './components/equipment/Pipette'
import { MysterySubstance } from './components/chemicals/MysterySubstance'
import { FlameTestEffect } from './components/effects/FlameTestEffect'

// UI — Phase 1-6 (always visible, eager)
import EnterOverlay from './components/ui/EnterOverlay'
import ChemicalInfoPanel from './components/ui/ChemicalInfoPanel'
import Crosshair from './components/ui/Crosshair'
import HotplateUI from './components/ui/HotplateUI'

// UI — Phase 7 (eager — safety is critical)
import SafetyGearPanel from './components/ui/SafetyGearPanel'
import AirQualityMeter from './components/ui/AirQualityMeter'
import ConsequenceDisplay from './components/ui/ConsequenceDisplay'
import { SafetyDashboardTrigger } from './components/ui/SafetyDashboard'

// UI — Phase 8 (eager)
import { DepthModeSelector } from './components/ui/DepthModeSelector'
import { WhatHappenedPanel } from './components/ui/WhatHappenedPanel'
import { LogbookTrigger } from './components/ui/DiscoveryLogbook'

// UI — Phase 9 (eager for small components, lazy for heavy panels)
import { MysteryPanel } from './components/ui/MysteryPanel'
import { TitrationPanel } from './components/ui/TitrationPanel'
import { PipetteIndicator } from './components/ui/PipetteIndicator'
import { NotebookTrigger } from './components/ui/LabNotebook'

// Lazy-loaded heavy panels — only mount when opened
const SafetyDashboard  = lazy(() => import('./components/ui/SafetyDashboard'))
const DiscoveryLogbook = lazy(() => import('./components/ui/DiscoveryLogbook').then(m => ({ default: m.DiscoveryLogbook })))
const LabNotebook      = lazy(() => import('./components/ui/LabNotebook').then(m => ({ default: m.LabNotebook })))

// Audio system
import {
  initAudio, startAmbient, setVolumes, resumeAudio,
  startSmokeAlarm, stopSmokeAlarm, playBubbling, startFire, stopFire, setFireIntensity
} from './systems/audioSystem'
import { loadLogbookFromStorage } from './systems/logbook'

import ErrorBoundary from './components/ErrorBoundary'
import useLabStore from './store/useLabStore'
import './index.css'

// ── Shared hover light ───────────────────────────────────────────────────────
function HoverLight() {
  const hoverLight = useLabStore(state => state.hoverLight)
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

// ── Interaction hints ────────────────────────────────────────────────────────
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

// ── Air quality simulation ────────────────────────────────────────────────────
function AirQualitySimulator() {
  const airQuality     = useLabStore(state => state.airQuality)
  const setAirQuality  = useLabStore(state => state.setAirQuality)
  const currentReactions = useLabStore(state => state.currentReactions)
  const inFumeHood     = useLabStore(state => state.inFumeHood)

  // Smoke alarm sound driven by air quality
  useEffect(() => {
    if (airQuality < 30) {
      startSmokeAlarm()
    } else if (airQuality > 40) {
      stopSmokeAlarm()
    }
  }, [airQuality])

  useEffect(() => {
    const interval = setInterval(() => {
      const hasVolatile = currentReactions.some(r => r.producesGas || r.isVolatile)
      if (hasVolatile && !inFumeHood) {
        setAirQuality(Math.max(0, airQuality - 0.8))
      } else if (airQuality < 100) {
        setAirQuality(Math.min(100, airQuality + (inFumeHood ? 3 : 0.4)))
      }
    }, 500)
    return () => clearInterval(interval)
  }, [airQuality, currentReactions, inFumeHood, setAirQuality])

  return null
}

// ── Reaction audio bridge ────────────────────────────────────────────────────
// Watches currentReactions and fires procedural audio accordingly
function ReactionAudioBridge() {
  const currentReactions = useLabStore(state => state.currentReactions)
  const isFireActive     = useLabStore(state => state.isFireActive)
  const fireIntensity    = useLabStore(state => state.fireIntensity)
  const audioEnabled     = useLabStore(state => state.audioEnabled)

  // Bubbling sound on reactions
  useEffect(() => {
    if (!audioEnabled || !currentReactions.length) return
    const maxIntensity = Math.max(...currentReactions.map(r => r.intensity || 1))
    if (maxIntensity > 0) playBubbling(Math.min(maxIntensity, 10))
  }, [currentReactions.length, audioEnabled]) // only trigger when count changes

  // Fire sound
  useEffect(() => {
    if (!audioEnabled) return
    if (isFireActive) {
      startFire(fireIntensity || 5)
    } else {
      stopFire()
    }
    return () => stopFire()
  }, [isFireActive, audioEnabled])

  useEffect(() => {
    if (isFireActive && audioEnabled) setFireIntensity(fireIntensity)
  }, [fireIntensity, isFireActive, audioEnabled])

  return null
}

// ── Bench stain bridge ───────────────────────────────────────────────────────
// When a pour happens, record a stain on the bench at the beaker position
function BenchStainBridge() {
  const beakers         = useLabStore(state => state.beakers)
  const addBenchStain   = useLabStore(state => state.addBenchStain)
  const addScorchMark   = useLabStore(state => state.addScorchMark)
  const isFireActive    = useLabStore(state => state.isFireActive)
  const fireBeakerId    = useLabStore(state => state.fireBeakerId)

  // Watch beaker totalVolume — on increase, add stain
  useEffect(() => {
    beakers.forEach(b => {
      if (b.totalVolume > 0 && b.reactionResult) {
        addBenchStain({
          x: b.position[0] + (Math.random() - 0.5) * 0.15,
          z: b.position[2] + (Math.random() - 0.5) * 0.1,
          radius: 0.08 + Math.random() * 0.12,
          color: b.mixedColor || '#aaaaaa',
          opacity: 0.35 + Math.random() * 0.2,
        })
      }
    })
  }, [beakers.map(b => b.totalVolume).join(',')]) // trigger when volumes change

  // Fire leaves scorch mark
  useEffect(() => {
    if (!isFireActive || !fireBeakerId) return
    const beaker = beakers.find(b => b.id === fireBeakerId)
    if (!beaker) return
    const timer = setTimeout(() => {
      addScorchMark({ x: beaker.position[0], z: beaker.position[2], radius: 0.25 })
    }, 5000)
    return () => clearTimeout(timer)
  }, [isFireActive, fireBeakerId])

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [isEntered, setIsEntered] = useState(false)
  const beakers = useLabStore(state => state.beakers)

  const handleEnter = useCallback(() => setIsEntered(true), [])

  // Load logbook from storage on startup
  useEffect(() => {
    const saved = loadLogbookFromStorage()
    if (saved.length > 0) {
      useLabStore.setState({ logbookEntries: saved })
    }
  }, [])

  // Phase 9: Spawn Mystery Substance
  useEffect(() => {
    const timer = setTimeout(() => {
      useLabStore.getState().spawnMysterySubstance()
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Phase 10: Audio — init on first user interaction (autoplay policy)
  useEffect(() => {
    const handler = () => {
      initAudio()
      startAmbient()
      resumeAudio()
      // Sync volumes from store
      const s = useLabStore.getState()
      setVolumes({ master: s.masterVolume, effects: s.effectsVolume, ambient: s.ambientVolume })
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])

  // Phase 10: Volume sync subscription (atomic, no shallow)
  useEffect(() => {
    return useLabStore.subscribe(state => {
      setVolumes({
        master: state.masterVolume,
        effects: state.effectsVolume,
        ambient: state.ambientVolume,
      })
    })
  }, [])

  // Phase 10: Weather changes randomly every 5–15 minutes
  useEffect(() => {
    const scheduleWeather = () => {
      const delay = (5 + Math.random() * 10) * 60 * 1000
      const tid = setTimeout(() => {
        const options = ['clear', 'clear', 'cloudy', 'rain'] // weighted clear
        useLabStore.getState().setWeather(options[Math.floor(Math.random() * options.length)])
        scheduleWeather()
      }, delay)
      return tid
    }
    const tid = scheduleWeather()
    return () => clearTimeout(tid)
  }, [])

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen relative bg-black overflow-hidden">

        {/* ── 3D Canvas ── */}
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

            <FireExtinguisher />

            {/* Phase 9 Equipment */}
            <TitrationSetup />
            <Pipette />
            <MysterySubstance />
          </Physics>

          {/* Held bottle follows camera */}
          <ChemicalPickup />

          {/* Shared hover light */}
          <HoverLight />

          {/* Reaction visual effects */}
          <EffectsManager />
          <FlameTestEffect />

          {/* Phase 10: Dust motes in window light */}
          <DustMotesEffect />

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

        {/* ── 2D UI Layer ── */}

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
            <SafetyDashboardTrigger />
            <Suspense fallback={null}>
              <SafetyDashboard />
            </Suspense>

            <InteractionHint />
            <ScreenEffects />
            <AirQualitySimulator />

            {/* ── Phase 8 UI ── */}
            <DepthModeSelector />
            <WhatHappenedPanel />
            <LogbookTrigger />
            <Suspense fallback={null}>
              <DiscoveryLogbook />
            </Suspense>

            {/* ── Phase 9 UI ── */}
            <MysteryPanel />
            <TitrationPanel />
            <PipetteIndicator />
            <NotebookTrigger />
            <Suspense fallback={null}>
              <LabNotebook />
            </Suspense>

            {/* ── Phase 10 bridges (no visual output, just side effects) ── */}
            <ReactionAudioBridge />
            <BenchStainBridge />
          </>
        )}

      </div>
    </ErrorBoundary>
  )
}
