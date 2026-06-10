import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'
import { isMobileDevice } from '../../utils/isMobile'

const IS_MOBILE    = isMobileDevice()
const PICKUP_RANGE = 1.8  // metres

const _charPos = new THREE.Vector3()
const _itemPos = new THREE.Vector3()

// ── Individual gear item ───────────────────────────────────────────────────
function GearItem({ type, position, children, label, icon }) {
  const hoverRef  = useRef(false)
  const glowRef   = useRef(0)
  const meshRef   = useRef()
  const nearRef   = useRef(false)
  const [near, setNear]     = [nearRef, (v) => { nearRef.current = v }]
  const safetyGear = useLabStore(s => s.safetyGear)
  const equipGear  = useLabStore(s => s.equipGear)

  const alreadyWorn = safetyGear[type === 'coat' ? 'coat' : type]

  useFrame((_, delta) => {
    if (!meshRef.current || alreadyWorn) return

    const { characterPos } = useLabStore.getState()
    _charPos.set(characterPos.x, 0, characterPos.z)
    _itemPos.set(position[0], 0, position[2])

    const dist = _charPos.distanceTo(_itemPos)
    const isNear = dist < PICKUP_RANGE

    if (isNear !== nearRef.current) {
      nearRef.current = isNear
      // Trigger re-render via forceUpdate pattern
      meshRef.current.userData.nearChanged = true
    }

    // Glow pulse when near
    const targetGlow = isNear ? 1.0 : 0.0
    glowRef.current += (targetGlow - glowRef.current) * Math.min(1, delta * 6)

    // Float animation
    meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.04

    // Emissive glow on hover/near
    if (meshRef.current.material) {
      meshRef.current.material.emissiveIntensity = glowRef.current * 0.4
    }
  })

  const handleEquip = () => {
    if (!alreadyWorn) equipGear(type)
  }

  // E key support on desktop
  useMemo(() => {
    if (IS_MOBILE) return
    const onKeyDown = (e) => {
      if (e.code === 'KeyE' && nearRef.current && !alreadyWorn) {
        handleEquip()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [alreadyWorn])

  if (alreadyWorn) return null  // item disappears when worn

  return (
    <group position={position}>
      <group
        ref={meshRef}
        onClick={IS_MOBILE ? handleEquip : undefined}
        onPointerOver={() => { hoverRef.current = true }}
        onPointerOut={() =>  { hoverRef.current = false }}
      >
        {children}
      </group>

      {/* Proximity prompt */}
      <Html center distanceFactor={8} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <AnimatePresence>
          {nearRef.current && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 4,  scale: 0.9  }}
              transition={{ duration: 0.18 }}
              style={{
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{label}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                  {IS_MOBILE ? '👆 Tap to wear' : '[ E ] to wear'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Html>
    </group>
  )
}

// ── Lab Coat on a rack ────────────────────────────────────────────────────
function LabCoatStation() {
  const pos = [-4.5, 1.3, 2.5]
  const coatMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f0f0f0', roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0
  }), [])

  return (
    <group>
      {/* Coat rack pole */}
      <mesh position={[-4.5, 0.9, 2.5]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 1.8, 8]} />
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </mesh>
      {/* Horizontal bar */}
      <mesh position={[-4.5, 1.8, 2.5]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </mesh>

      <GearItem type="coat" position={[-4.5, 1.2, 2.5]} label="Lab Coat" icon="🥼">
        {/* Coat body */}
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.5, 0.04]} />
          <primitive object={coatMat} attach="material" />
        </mesh>
        {/* Left sleeve */}
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0, 0.4]} castShadow>
          <boxGeometry args={[0.1, 0.35, 0.04]} />
          <primitive object={coatMat} attach="material" />
        </mesh>
        {/* Right sleeve */}
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.1, 0.35, 0.04]} />
          <primitive object={coatMat} attach="material" />
        </mesh>
        {/* Collar */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.05]} />
          <primitive object={coatMat} attach="material" />
        </mesh>
      </GearItem>
    </group>
  )
}

// ── Goggles on a hook ────────────────────────────────────────────────────
function GogglesStation() {
  const pos = [-4.2, 1.75, -3.2]
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2c3e50', roughness: 0.3, metalness: 0.4, emissive: '#2c3e50', emissiveIntensity: 0
  }), [])
  const lensMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#74b9ff', transparent: true, opacity: 0.7, roughness: 0.1, emissive: '#74b9ff', emissiveIntensity: 0
  }), [])

  return (
    <group>
      {/* Wall hook */}
      <mesh position={[-4.9, 1.78, -3.2]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
      </mesh>

      <GearItem type="goggles" position={pos} label="Safety Goggles" icon="🥽">
        {/* Left lens */}
        <mesh position={[-0.065, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
          <primitive object={lensMat} attach="material" />
        </mesh>
        {/* Right lens */}
        <mesh position={[0.065, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
          <primitive object={lensMat} attach="material" />
        </mesh>
        {/* Frame bridge */}
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.065, 0.035]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        {/* Strap */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[0.3, 0.035, 0.02]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      </GearItem>
    </group>
  )
}

// ── Gloves in a box ──────────────────────────────────────────────────────
function GlovesStation() {
  const pos = [2.5, 1.08, -0.4]
  const gloveMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f39c12', roughness: 0.7, emissive: '#f39c12', emissiveIntensity: 0
  }), [])
  const boxMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3498db', roughness: 0.8
  }), [])

  return (
    <group>
      {/* Dispenser box */}
      <mesh position={[2.5, 1.0, -0.4]} castShadow>
        <boxGeometry args={[0.22, 0.14, 0.14]} />
        <primitive object={boxMat} attach="material" />
      </mesh>
      {/* Label on box */}
      <mesh position={[2.5, 1.0, -0.32]}>
        <planeGeometry args={[0.18, 0.09]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      <GearItem type="gloves" position={pos} label="Safety Gloves" icon="🧤">
        {/* Left glove */}
        <mesh position={[-0.07, 0, 0]} castShadow>
          <sphereGeometry args={[0.06, 10, 10]} />
          <primitive object={gloveMat} attach="material" />
        </mesh>
        {/* Left glove fingers */}
        {[-0.04, -0.01, 0.02, 0.05].map((x, i) => (
          <mesh key={i} position={[-0.07 + x, 0.07, 0]} castShadow>
            <capsuleGeometry args={[0.018, 0.04, 4, 6]} />
            <primitive object={gloveMat} attach="material" />
          </mesh>
        ))}
        {/* Right glove */}
        <mesh position={[0.07, 0, 0]} castShadow>
          <sphereGeometry args={[0.06, 10, 10]} />
          <primitive object={gloveMat} attach="material" />
        </mesh>
        {[-0.04, -0.01, 0.02, 0.05].map((x, i) => (
          <mesh key={i} position={[0.07 + x, 0.07, 0]} castShadow>
            <capsuleGeometry args={[0.018, 0.04, 4, 6]} />
            <primitive object={gloveMat} attach="material" />
          </mesh>
        ))}
      </GearItem>
    </group>
  )
}

// ── Main export ───────────────────────────────────────────────────────────
export default function SafetyGearStation() {
  return (
    <>
      <LabCoatStation />
      <GogglesStation />
      <GlovesStation />
    </>
  )
}
