import { memo, useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

const MOTE_COUNT = 300

export const DustMotesEffect = memo(function DustMotesEffect() {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const enableDust = useLabStore(s => s.dustMotesEnabled !== false) // default true

  const motes = useMemo(() => Array.from({ length: MOTE_COUNT }, () => ({
    x: -1 + Math.random() * 2,
    y: 0.5 + Math.random() * 2.5,
    z: -3 + Math.random() * 1.5,
    vx: (Math.random() - 0.5) * 0.0015,
    vy: (Math.random() - 0.5) * 0.0008,
    vz: (Math.random() - 0.5) * 0.001,
    phase: Math.random() * Math.PI * 2,
  })), [])

  useEffect(() => {
    return () => {
      meshRef.current?.geometry?.dispose()
      meshRef.current?.material?.dispose()
    }
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current || !enableDust) return
    const t = clock.getElapsedTime()

    for (let i = 0; i < MOTE_COUNT; i++) {
      const m = motes[i]
      // Slow drift + gentle sine wobble — uTime pattern, no setState
      m.x += m.vx + Math.sin(t * 0.3 + m.phase) * 0.0003
      m.y += m.vy + Math.sin(t * 0.2 + m.phase * 1.3) * 0.0002
      m.z += m.vz

      // Wrap within window light volume
      if (m.x < -1.5) m.x = 1.5
      if (m.x > 1.5)  m.x = -1.5
      if (m.y < 0.3)  m.y = 3.0
      if (m.y > 3.2)  m.y = 0.3
      if (m.z < -4.5) m.z = -1.5
      if (m.z > -1.5) m.z = -4.5

      dummy.position.set(m.x, m.y, m.z)
      dummy.scale.setScalar(0.008 + Math.sin(t + m.phase) * 0.002)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!enableDust) return null

  return (
    <instancedMesh ref={meshRef} args={[null, null, MOTE_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color="#FFE8C0"
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </instancedMesh>
  )
})
