import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

export const FLAME_COLORS = {
  NaCl:    { primary: '#FFA500', secondary: '#FFD700', name: 'Sodium — yellow-orange' },
  CuSO4:   { primary: '#00CED1', secondary: '#00FF7F', name: 'Copper — blue-green' },
  KMnO4:   { primary: '#9370DB', secondary: '#DA70D6', name: 'Potassium — lilac' },
  CaCO3:   { primary: '#DC143C', secondary: '#FF6347', name: 'Calcium — brick red' },
  HCl:     { primary: '#FFD700', secondary: '#FFA500', name: 'Sodium trace — pale yellow' },
  NaOH:    { primary: '#FFD700', secondary: '#FFA500', name: 'Sodium trace — pale yellow' },
  default: { primary: '#FF4500', secondary: '#FF6347', name: 'No characteristic color' },
}

const PARTICLE_COUNT = 120

export function FlameTestEffect() {
  const flameTestChemicalId = useLabStore(s => s.flameTestChemicalId)
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const bunsenPos = useMemo(() => new THREE.Vector3(-2, 0.8, 0), [])

  const colors = useMemo(() => {
    const c = FLAME_COLORS[flameTestChemicalId] || FLAME_COLORS.default
    return { primary: new THREE.Color(c.primary), secondary: new THREE.Color(c.secondary) }
  }, [flameTestChemicalId])

  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle: (i / PARTICLE_COUNT) * Math.PI * 2,
    speed: 0.5 + Math.random() * 2.5,
    life: Math.random(),
    size: 0.03 + Math.random() * 0.08,
    phase: Math.random() * Math.PI * 2,
    radius: 0.1 + Math.random() * 0.4,
  })), [])

  const colorAttr = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const c = i % 2 === 0 ? colors.primary : colors.secondary
      arr[i*3] = c.r; arr[i*3+1] = c.g; arr[i*3+2] = c.b
    }
    return new THREE.InstancedBufferAttribute(arr, 3)
  }, [colors])

  useEffect(() => {
    return () => {
      meshRef.current?.geometry?.dispose()
      meshRef.current?.material?.dispose()
    }
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current || !flameTestChemicalId) return
    const t = clock.getElapsedTime()

    particles.forEach((p, i) => {
      p.life = (p.life + 0.008) % 1
      const h = p.life * p.speed * 2
      const r = p.radius * (1 - p.life * 0.7)
      dummy.position.set(
        bunsenPos.x + Math.cos(p.angle + t * 0.5) * r,
        bunsenPos.y + h,
        bunsenPos.z + Math.sin(p.angle + t * 0.5) * r,
      )
      const s = p.size * (1 - p.life)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!flameTestChemicalId) return null

  return (
    <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorAttr.array, 3]} />
      </sphereGeometry>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
