import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { ACESFilmicToneMapping } from 'three'
import { shallow } from 'zustand/shallow'
import Lighting from './components/lab/Lighting'
import Room from './components/lab/Room'
import Bench from './components/lab/Bench'
import FumeHood from './components/lab/FumeHood'
import SafetyCorner from './components/lab/SafetyCorner'
import PlayerControls from './components/lab/PlayerControls'
import EnterOverlay from './components/ui/EnterOverlay'
import ChemicalShelf from './components/chemicals/ChemicalShelf'
import Beaker from './components/equipment/Beaker'
import ChemicalInfoPanel from './components/ui/ChemicalInfoPanel'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

import useLabStore from './store/useLabStore'
import ChemicalPickup from './components/chemicals/ChemicalPickup'
import Crosshair from './components/ui/Crosshair'
import EffectsManager from './components/effects/EffectsManager'
import { ScreenEffects } from './components/effects/ScreenEffects'

// Single shared hover light — replaces per-bottle point lights (performance.md: max 4 hover lights)
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

export default function App() {
  const [isEntered, setIsEntered] = useState(false)
  // Use shallow selector — prevents re-render when unrelated state changes (react.md)
  const beakers = useLabStore(state => state.beakers, shallow)

  const handleEnter = useCallback(() => setIsEntered(true), [])

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen relative bg-black">

        {/* 2D UI Overlays — always outside Canvas (ui.md: HTML overlays on top of canvas) */}
        {!isEntered && <EnterOverlay onEnter={handleEnter} />}
        {isEntered && <ChemicalInfoPanel />}
        {isEntered && <Crosshair />}
        {isEntered && <ScreenEffects />}

        {/* 3D Scene — Canvas always mounted so pointer lock can attach */}
        {/* frameloop="always" required for continuous simulation (r3f.md: simulation needs always) */}
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

          {/* Physics world — wraps all objects that use RigidBody/Colliders */}
          <Physics gravity={[0, -9.81, 0]}>
            <Bench />
            <FumeHood />
            <SafetyCorner />

            {/* Chemical Shelf */}
            <ChemicalShelf />

            {/* Beakers from store */}
            <group>
              {beakers.map(beaker => (
                <Beaker key={beaker.id} beaker={beaker} />
              ))}
            </group>
          </Physics>

          {/* Held bottle follows camera */}
          <ChemicalPickup />

          {/* Single shared hover light — replaces 20 per-bottle lights */}
          <HoverLight />

          {/* Reaction visual effects */}
          <EffectsManager />

          {/* Player controls */}
          <PlayerControls />

          {/* Postprocessing — STRICT ORDER per shaders.md:
              1. SSAO (ambient occlusion, before bloom)
              2. Bloom (light bleed)
              3. Vignette (edge darkening)
              4. ToneMapping (always last) */}
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
      </div>
    </ErrorBoundary>
  )
}
