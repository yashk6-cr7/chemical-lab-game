import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
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
  const [isNear, setIsNear] = useState(false)
  const safetyGear = useLabStore(s => s.safetyGear)
  const equipGear  = useLabStore(s => s.equipGear)

  const alreadyWorn = safetyGear[type === 'coat' ? 'coat' : type]

  useFrame((_, delta) => {
    if (!meshRef.current || alreadyWorn) return

    const { characterPos } = useLabStore.getState()
    _charPos.set(characterPos.x, 0, characterPos.z)
    _itemPos.set(position[0], 0, position[2])

    const dist = _charPos.distanceTo(_itemPos)
    const near = dist < PICKUP_RANGE

    if (near !== isNear) {
      setIsNear(near)
    }

    // Glow pulse when near
    const targetGlow = near ? 1.0 : 0.0
    glowRef.current += (targetGlow - glowRef.current) * Math.min(1, delta * 6)

    // Emissive glow on hover/near
    if (meshRef.current.material) {
      meshRef.current.material.emissiveIntensity = glowRef.current * 0.4
    }
  })

  // Both Mobile and Desktop: click to equip
  const handleEquip = useCallback((e) => {
    e.stopPropagation()
    if (!alreadyWorn) equipGear(type)
  }, [alreadyWorn, equipGear, type])

  if (alreadyWorn) return null  // item disappears when worn

  return (
    <group position={position}>
      <group
        ref={meshRef}
        onClick={handleEquip}
        onPointerOver={() => { hoverRef.current = true }}
        onPointerOut={() =>  { hoverRef.current = false }}
      >
        {children}
      </group>

      {/* Proximity prompt */}
      <Html center distanceFactor={8} zIndexRange={[100, 0]} style={{ pointerEvents: 'none', position: 'absolute', top: -50 }}>
        <AnimatePresence>
          {isNear && (
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
                  {IS_MOBILE ? '👆 Tap to wear' : '🖱️ Left-Click to wear'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Html>
    </group>
  )
}

// ── Lab Coat Hook ────────────────────────────────────────────────────
function LabCoatHook() {
  const pos = [-5.5, 1.4, 1.0]
  const coatMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f0f0f0', roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0
  }), [])

  return (
    <group position={pos}>
      {/* Wall Hook */}
      <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.3} />
      </mesh>
      {/* Hook end */}
      <mesh position={[0.1, 0.02, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.04, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.3} />
      </mesh>

      <GearItem type="coat" position={[0.12, -0.2, 0]} label="Lab Coat" icon="🥼">
        {/* Coat body hanging */}
        <group position={[0, -0.15, 0.05]}>
          {/* Main coat body */}
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.55, 0.04]} />
            <primitive object={coatMat} attach="material" />
          </mesh>
          {/* Left sleeve */}
          <mesh position={[-0.26, -0.05, 0]} castShadow>
            <boxGeometry args={[0.14, 0.38, 0.04]} />
            <primitive object={coatMat} attach="material" />
          </mesh>
          {/* Right sleeve */}
          <mesh position={[0.26, -0.05, 0]} castShadow>
            <boxGeometry args={[0.14, 0.38, 0.04]} />
            <primitive object={coatMat} attach="material" />
          </mesh>
          {/* Lapels */}
          <mesh position={[-0.08, 0.18, 0.025]}>
            <boxGeometry args={[0.06, 0.18, 0.01]} />
            <meshStandardMaterial color="#E0E0E0" roughness={0.6} />
          </mesh>
          <mesh position={[0.08, 0.18, 0.025]}>
            <boxGeometry args={[0.06, 0.18, 0.01]} />
            <meshStandardMaterial color="#E0E0E0" roughness={0.6} />
          </mesh>
          {/* Pocket */}
          <mesh position={[-0.12, -0.08, 0.022]}>
            <boxGeometry args={[0.1, 0.08, 0.005]} />
            <meshStandardMaterial color="#E8E8E8" roughness={0.6} />
          </mesh>
        </group>
      </GearItem>
    </group>
  )
}

// ── Goggles Station ────────────────────────────────────────────────────
function GogglesStation() {
  const pos = [-5.2, 1.5, 1.0]
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#222222', roughness: 0.4, metalness: 0.3, emissive: '#222222', emissiveIntensity: 0
  }), [])
  const lensMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#004499', transparent: true, opacity: 0.5, roughness: 0.1, depthWrite: false
  }), [])

  return (
    <group position={pos}>
      {/* Wall Hook */}
      <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
      </mesh>

      <GearItem type="goggles" position={[0.1, -0.05, 0]} label="Safety Goggles" icon="🥽">
        <group rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-0.05, 0, 0]} castShadow>
            <torusGeometry args={[0.045, 0.015, 8, 16]} />
            <primitive object={frameMat} attach="material" />
          </mesh>
          <mesh position={[0.05, 0, 0]} castShadow>
            <torusGeometry args={[0.045, 0.015, 8, 16]} />
            <primitive object={frameMat} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 0.015, 0.015]} />
            <primitive object={frameMat} attach="material" />
          </mesh>
          <mesh position={[-0.05, 0, 0]}>
            <circleGeometry args={[0.038, 16]} />
            <primitive object={lensMat} attach="material" />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <circleGeometry args={[0.038, 16]} />
            <primitive object={lensMat} attach="material" />
          </mesh>
        </group>
      </GearItem>
    </group>
  )
}

// ── Glove Box ──────────────────────────────────────────────────────
function GloveBox() {
  const pos = [-4.8, 1.3, 1.0]
  const boxMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3498db', roughness: 0.8
  }), [])

  return (
    <group position={pos}>
      {/* Dispenser box mounted to wall */}
      <mesh position={[0.07, 0, 0]} castShadow>
        <boxGeometry args={[0.14, 0.22, 0.14]} />
        <primitive object={boxMat} attach="material" />
      </mesh>
      {/* Label on box */}
      <mesh position={[0.141, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.09, 0.18]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* Gloves pulling out */}
      <mesh position={[0.14, 0, 0]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[0.08, 0.05]} />
        <meshBasicMaterial color="#4A90D9" side={THREE.DoubleSide} />
      </mesh>

      <GearItem type="gloves" position={[0.2, 0, 0]} label="Safety Gloves" icon="🧤">
        <mesh visible={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
        </mesh>
      </GearItem>
    </group>
  )
}

// ── Main export ───────────────────────────────────────────────────────────
export default function SafetyGearStation() {
  return (
    <>
      <LabCoatHook />
      <GogglesStation />
      <GloveBox />
    </>
  )
}
