import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
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
import Player from './components/lab/Player'
import ThirdPersonCamera from './components/lab/ThirdPersonCamera'
import SafetyGearStation from './components/lab/SafetyGearStation'

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
import PlayModeOverlay from './components/ui/PlayModeOverlay'
import MobileActionBar from './components/ui/MobileActionBar'
import ChemicalInfoPanel from './components/ui/ChemicalInfoPanel'
import Crosshair from './components/ui/Crosshair'
import HotplateUI from './components/ui/HotplateUI'

// UI — Phase 7 (eager — safety is critical)
import SafetyGearPanel from './components/ui/SafetyGearPanel'
import AirQualityMeter from './components/ui/AirQualityMeter'
import ConsequenceDisplay from './components/ui/ConsequenceDisplay'

// UI — Phase 8 (eager)
import { DepthModeSelector } from './components/ui/DepthModeSelector'
import { WhatHappenedPanel } from './components/ui/WhatHappenedPanel'

// UI — Phase 9 (eager for small components, lazy for heavy panels)
import { MysteryPanel } from './components/ui/MysteryPanel'
import { TitrationPanel } from './components/ui/TitrationPanel'
import { PipetteIndicator } from './components/ui/PipetteIndicator'

// Triggers for lazy-loaded panels
import { SafetyDashboardTrigger, LogbookTrigger, NotebookTrigger } from './components/ui/Triggers'

// Lazy-loaded heavy panels — only mount when opened
const SafetyDashboard  = lazy(() => import('./components/ui/SafetyDashboard'))
const DiscoveryLogbook = lazy(() => import('./components/ui/DiscoveryLogbook').then(m => ({ default: m.DiscoveryLogbook })))
const LabNotebook      = lazy(() => import('./components/ui/LabNotebook').then(m => ({ default: m.LabNotebook })))

// UI — Phase 11
import { OnboardingFlow } from './components/ui/OnboardingFlow'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { PerfMonitor, PerfMonitorCanvas } from './components/ui/PerfMonitor'
import { COLORBLIND_FILTERS } from './utils/colorblindFilters'

// Audio system
import {
  initAudio, startAmbient, setVolumes, resumeAudio,
  startSmokeAlarm, stopSmokeAlarm, playBubbling, startFire, stopFire, setFireIntensity
} from './systems/audioSystem'
import { loadLogbookFromStorage } from './systems/logbook'

import ErrorBoundary from './components/ErrorBoundary'
import useLabStore from './store/useLabStore'
import { isMobileDevice } from './utils/isMobile'
import './index.css'

const IS_MOBILE = isMobileDevice()

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
    extinguisher: IS_MOBILE ? 'Tap to pick up fire extinguisher' : 'Press E • Right-click to spray',
    eyewash:  IS_MOBILE ? 'Tap to use eyewash station'      : 'Press E to use eyewash station',
    shower:   IS_MOBILE ? 'Tap to activate emergency shower' : 'Press E to activate emergency shower',
  }
  const hint = HINTS[hoverTarget]
  if (!hint) return null
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-2 text-white/80 text-sm font-medium flex items-center gap-2">
        {IS_MOBILE && <span className="text-base">👆</span>}
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
export default function Lab() {
  const [showSettings, setShowSettings] = useState(false)
  // Adaptive DPR: start at 1 on mobile, 1.5 on desktop. PerformanceMonitor will lower it further if needed.
  const [dpr, setDpr] = useState(() => IS_MOBILE ? 1 : Math.min(window.devicePixelRatio, 1.5))
  const [showFX, setShowFX] = useState(!IS_MOBILE) // postprocessing OFF on mobile by default
  const beakers  = useLabStore(state => state.beakers)
  const settings = useLabStore(state => state.settings)

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
      <div 
        className={`w-screen h-screen relative bg-black overflow-hidden ${settings.highContrast ? 'high-contrast-mode' : ''}`}
        style={{ filter: COLORBLIND_FILTERS[settings.colorblindMode] || 'none' }}
      >
        <PerfMonitor />
        {/* Settings Trigger */}
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20
                     border border-white/20 rounded-full flex items-center justify-center
                     text-white/60 hover:text-white transition-colors"
          aria-label="Settings"
        >
          ⚙️
        </button>
        <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

        <PlayModeOverlay />
        <MobileActionBar />
        <OnboardingFlow />

        {/* ── 3D Canvas ── */}
        <Canvas
          frameloop="always"
          shadows={!IS_MOBILE}          // shadows OFF on mobile — biggest perf win
          dpr={dpr}                      // adaptive DPR
          camera={{ fov: settings.fov || 72, near: 0.1, far: IS_MOBILE ? 30 : 100 }}
          gl={{
            antialias: !IS_MOBILE,       // antialias OFF on mobile
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: false,
            alpha: false,
            stencil: false,
            toneMapping: ACESFilmicToneMapping
          }}
          className="w-full h-full"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Auto-lower DPR / disable FX if FPS drops below 45 */}
          <PerformanceMonitor
            onDecline={() => {
              setDpr(r => Math.max(0.75, r - 0.25))
              if (!IS_MOBILE) setShowFX(false)
            }}
            onIncline={() => {
              if (!IS_MOBILE) setDpr(r => Math.min(1.5, r + 0.25))
            }}
            flipflops={3}
            factor={0.5}
          />
          <Lighting />
          <Room />

          {/* Physics — lower timestep on mobile saves ~30% CPU */}
          <Physics
            gravity={[0, -9.81, 0]}
            timeStep={IS_MOBILE ? 1/30 : 1/60}
            interpolate={!IS_MOBILE}
          >
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

            {/* ── Third-Person Player System ── */}
            <Player />
          </Physics>

          {/* Held bottle follows camera */}
          <ChemicalPickup />

          {/* Shared hover light */}
          <HoverLight />

          {/* Reaction visual effects */}
          <EffectsManager />
          <FlameTestEffect />

          {/* Phase 10: Dust motes — desktop only (expensive particle system) */}
          {!IS_MOBILE && <DustMotesEffect />}

          {/* Camera dizziness — desktop only (CSS transform sway) */}
          {!IS_MOBILE && <DizzinessEffect />}

          {/* ── Third-Person Camera System ── */}
          <ThirdPersonCamera />
          
          {/* Physical Safety Gear */}
          <SafetyGearStation />

          {/* Perf monitor (canvas parts) */}
          <PerfMonitorCanvas />

          {/* Postprocessing — desktop only, auto-disabled if FPS drops */}
          {showFX && (
            <EffectComposer disableNormalPass>
              <Bloom
                luminanceThreshold={0.85}
                luminanceSmoothing={0.2}
                intensity={0.4}
                height={IS_MOBILE ? 200 : 480}
                mipmapBlur
              />
              <Vignette offset={0.4} darkness={0.4} eskil={false} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          )}
        </Canvas>

        {/* ── 2D UI Layer — always shown, no gate ── */}
        <ChemicalInfoPanel />
        <Crosshair />
        <HotplateUI />

        {/* ── Phase 7 UI ── */}
        <SafetyGearPanel />
        <AirQualityMeter />
        <ConsequenceDisplay />
        <SafetyDashboardTrigger />
        <Suspense fallback={null}><SafetyDashboard /></Suspense>

        <InteractionHint />
        <ScreenEffects />
        <AirQualitySimulator />

        {/* ── Phase 8 UI ── */}
        <DepthModeSelector />
        <WhatHappenedPanel />
        <LogbookTrigger />
        <Suspense fallback={null}><DiscoveryLogbook /></Suspense>

        {/* ── Phase 9 UI ── */}
        <MysteryPanel />
        <TitrationPanel />
        <PipetteIndicator />
        <NotebookTrigger />
        <Suspense fallback={null}><LabNotebook /></Suspense>

        {/* ── Phase 10 bridges ── */}
        <ReactionAudioBridge />
        <BenchStainBridge />

      </div>
    </ErrorBoundary>
  )
}
