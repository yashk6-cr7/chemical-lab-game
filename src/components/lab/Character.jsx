import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

// Pre-allocated
const _pos   = new THREE.Vector3()
const _euler = new THREE.Euler(0, 0, 0, 'YXZ')

/**
 * Character — third-person visible avatar
 * Renders a simple humanoid whose mesh updates to show worn safety gear.
 * All geometry is procedural — no external asset needed.
 */
export default function Character() {
  const groupRef  = useRef()
  const bobRef    = useRef(0)
  const prevPos   = useRef({ x: 0, z: 0 })
  const armSwingRef = useRef(0)

  const characterPos = useLabStore(s => s.characterPos)
  const characterYaw = useLabStore(s => s.characterYaw)
  const safetyGear   = useLabStore(s => s.safetyGear)
  const heldChemical = useLabStore(s => s.heldChemical)

  const { coat, goggles, gloves } = safetyGear

  // Smooth interpolated position to avoid jitter
  const smoothPos = useRef(new THREE.Vector3(0, 0, 3))

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Target position from store
    _pos.set(characterPos.x, 0, characterPos.z)

    // Smooth lerp so character doesn't snap
    smoothPos.current.lerp(_pos, Math.min(1, delta * 20))

    // Speed for bob/arm swing
    const dx = smoothPos.current.x - prevPos.current.x
    const dz = smoothPos.current.z - prevPos.current.z
    const speed = Math.sqrt(dx * dx + dz * dz) / Math.max(delta, 0.001)
    prevPos.current.x = smoothPos.current.x
    prevPos.current.z = smoothPos.current.z

    // Bob when moving
    const moving = speed > 0.3
    if (moving) bobRef.current += delta * 10
    const bob = moving ? Math.sin(bobRef.current) * 0.03 : 0

    // Arm swing when moving
    if (moving) armSwingRef.current += delta * 8

    groupRef.current.position.set(smoothPos.current.x, bob, smoothPos.current.z)

    // Rotate to face movement direction
    _euler.y = characterYaw + Math.PI  // +PI so character faces away from camera
    groupRef.current.rotation.y = characterYaw + Math.PI
  })

  // Materials — memoised so they don't rebuild every render
  const skinMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5cba7', roughness: 0.8 }), [])
  const trouserMat= useMemo(() => new THREE.MeshStandardMaterial({ color: '#2c3e50', roughness: 0.9 }), [])
  const shirtMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2980b9', roughness: 0.8 }), [])
  const coatMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8f9fa', roughness: 0.6 }), [])
  const goggleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2c3e50', roughness: 0.3, metalness: 0.4 }), [])
  const goggleLensMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#74b9ff', transparent: true, opacity: 0.6, roughness: 0.1 }), [])
  const gloveMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f39c12', roughness: 0.7 }), [])
  const hairMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2c2c2c', roughness: 1.0 }), [])
  const bootMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 }), [])

  return (
    <group ref={groupRef}>

      {/* ── LEGS ── */}
      {/* Left leg */}
      <mesh position={[-0.1, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
        <primitive object={trouserMat} attach="material" />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.1, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
        <primitive object={trouserMat} attach="material" />
      </mesh>
      {/* Left boot */}
      <mesh position={[-0.1, 0.1, 0.04]} castShadow>
        <boxGeometry args={[0.14, 0.12, 0.22]} />
        <primitive object={bootMat} attach="material" />
      </mesh>
      {/* Right boot */}
      <mesh position={[0.1, 0.1, 0.04]} castShadow>
        <boxGeometry args={[0.14, 0.12, 0.22]} />
        <primitive object={bootMat} attach="material" />
      </mesh>

      {/* ── TORSO ── */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
        <primitive object={coat ? coatMat : shirtMat} attach="material" />
      </mesh>

      {/* Lab coat overlay (slightly larger, visible over shirt) */}
      {coat && (
        <>
          {/* Coat front panels */}
          <mesh position={[-0.12, 1.05, 0.2]}>
            <boxGeometry args={[0.16, 0.6, 0.04]} />
            <primitive object={coatMat} attach="material" />
          </mesh>
          <mesh position={[0.12, 1.05, 0.2]}>
            <boxGeometry args={[0.16, 0.6, 0.04]} />
            <primitive object={coatMat} attach="material" />
          </mesh>
          {/* Coat collar */}
          <mesh position={[0, 1.38, 0.15]}>
            <boxGeometry args={[0.28, 0.12, 0.08]} />
            <primitive object={coatMat} attach="material" />
          </mesh>
        </>
      )}

      {/* ── ARMS ── */}
      {/* Left arm */}
      <mesh position={[-0.32, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.075, 0.45, 4, 8]} />
        <primitive object={coat ? coatMat : shirtMat} attach="material" />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.32, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <primitive object={gloves ? gloveMat : skinMat} attach="material" />
      </mesh>

      {/* Right arm — raised when holding bottle */}
      <mesh position={[0.32, heldChemical ? 1.15 : 1.05, heldChemical ? -0.15 : 0]} castShadow>
        <capsuleGeometry args={[0.075, 0.45, 4, 8]} />
        <primitive object={coat ? coatMat : shirtMat} attach="material" />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.32, heldChemical ? 0.82 : 0.72, heldChemical ? -0.2 : 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <primitive object={gloves ? gloveMat : skinMat} attach="material" />
      </mesh>

      {/* ── HEAD ── */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.175, 16, 16]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.73, -0.03]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <primitive object={hairMat} attach="material" />
      </mesh>

      {/* ── GOGGLES ── */}
      {goggles && (
        <group position={[0, 1.63, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
          {/* Left lens */}
          <mesh position={[-0.07, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
            <primitive object={goggleLensMat} attach="material" />
          </mesh>
          {/* Right lens */}
          <mesh position={[0.07, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
            <primitive object={goggleLensMat} attach="material" />
          </mesh>
          {/* Frame */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.19, 0.07, 0.03]} />
            <primitive object={goggleMat} attach="material" />
          </mesh>
          {/* Strap */}
          <mesh position={[0, 0, -0.1]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.32, 0.04, 0.02]} />
            <primitive object={goggleMat} attach="material" />
          </mesh>
        </group>
      )}

      {/* Shadow circle on floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} depthWrite={false} />
      </mesh>
    </group>
  )
}
