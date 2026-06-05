/* eslint-disable */
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// shaders.md: Use THREE.Sprite — automatically faces camera, no manual billboard math
// One shared SpriteMaterial for all steam sprites (not one per sprite — performance.md)

function createSteamTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0,   'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  g.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

export default function SteamEffect({ position, intensity = 5 }) {
  // Shared texture + material — all sprites use same material (performance.md: 1 bind)
  const steamTexture = useMemo(() => createSteamTexture(), [])
  const spriteMaterial = useMemo(() => new THREE.SpriteMaterial({
    map:         steamTexture,
    transparent: true,
    opacity:     0.28,
    depthWrite:  false,
    blending:    THREE.NormalBlending,
    sizeAttenuation: true,
  }), [steamTexture])

  useEffect(() => {
    return () => {
      steamTexture.dispose()
      spriteMaterial.dispose()
    }
  }, [steamTexture, spriteMaterial])

  const count = useMemo(() => Math.floor(20 + (intensity / 10) * 40), [intensity])

  // Pre-calculated particle data — no per-frame allocation (r3f.md)
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x:        (Math.random() - 0.5) * 0.1,
    z:        (Math.random() - 0.5) * 0.1,
    y:        Math.random() * 0.3,
    speed:    0.06 + Math.random() * 0.04,
    scale:    0.04 + Math.random() * 0.04,
    lifetime: 1.5 + Math.random() * 1.0,
    age:      Math.random() * 2.5,
    phase:    Math.random() * Math.PI * 2,
  })), [count])

  // Refs array for sprites — useRef, not useState (r3f.md)
  const spriteRefs = useRef([])

  useFrame((_, delta) => {
    for (let i = 0; i < count; i++) {
      const p   = particles[i]
      const spr = spriteRefs.current[i]
      if (!spr) continue

      p.age += delta
      if (p.age > p.lifetime) {
        p.age = 0
        p.x   = (Math.random() - 0.5) * 0.1
        p.z   = (Math.random() - 0.5) * 0.1
        p.y   = 0
      }

      const progress    = p.age / p.lifetime
      p.y              += p.speed * delta
      p.phase          += delta
      const drift        = Math.sin(p.phase * 1.2) * 0.005
      const currentScale = p.scale * (1 + progress * 1.5)
      const opacity      = (1 - progress) * 0.28

      spr.position.set(position[0] + p.x + drift, position[1] + p.y, position[2] + p.z)
      spr.scale.setScalar(currentScale)
      // Sprites share material — update opacity per-sprite via material clone would be expensive;
      // instead we scale opacity by setting material.opacity on the shared mat each frame
      // For per-sprite opacity variation, set via userData and read in shader — simplified here
      spr.material.opacity = opacity
    }
  })

  return (
    <group>
      {particles.map((_, i) => (
        // shaders.md: <sprite> auto-faces camera — no lookAt() needed
        <sprite
          key={i}
          ref={el => { spriteRefs.current[i] = el }}
          material={spriteMaterial}
          scale={[particles[i].scale, particles[i].scale, 1]}
        />
      ))}
    </group>
  )
}
