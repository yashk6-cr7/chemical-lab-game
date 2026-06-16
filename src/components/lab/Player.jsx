import { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { isMobileDevice } from '../../utils/isMobile'
import useLabStore from '../../store/useLabStore'

const MOVE_SPEED = 4.0
const LOOK_SPEED = 0.004
const TOUCH_LOOK_SPEED = 0.006
const MAX_DELTA = 0.05

// Pre-allocated vectors for physics and movement
const _fwd = new THREE.Vector3()
const _right = new THREE.Vector3()
const _move = new THREE.Vector3()
const _UP = new THREE.Vector3(0, 1, 0)

const BENCH_INTERACTION_POSITIONS = [
  new THREE.Vector3(0, 0, 1.4),    // Front of main bench
  new THREE.Vector3(0, 0, -1.4),   // Back of main bench
  new THREE.Vector3(-4.0, 0, -2.0) // Secondary bench
]
const INTERACTION_RADIUS = 1.4

export default function Player() {
  const rigidBodyRef = useRef(null)

  // Character part refs for animation
  const bodyGroupRef = useRef(null)
  const characterGroupRef = useRef(null)
  const headRef = useRef(null)
  const torsoRef = useRef(null)
  const coatTailRef = useRef(null)
  
  const upperArmLRef = useRef(null)
  const lowerArmLRef = useRef(null)
  const upperArmRRef = useRef(null)
  const lowerArmRRef = useRef(null)
  
  const upperLegLRef = useRef(null)
  const lowerLegLRef = useRef(null)
  const upperLegRRef = useRef(null)
  const lowerLegRRef = useRef(null)

  const keys = useRef({})
  const camYaw = useRef(Math.PI)
  const camPitch = useRef(0)
  const isMobile = useRef(isMobileDevice())

  const walkPhaseRef = useRef(0)
  const isMoving = useRef(false)

  const safetyGear = useLabStore(s => s.safetyGear)
  const nearBench = useLabStore(s => s.nearBench)

  const touch = useRef({
    moveTouchId: null, lookTouchId: null,
    moveOrigin: { x: 0, y: 0 },
    moveDelta: { x: 0, y: 0 },
    lastLookPos: { x: 0, y: 0 },
  })

  const mouse = useRef({ dragging: false, lastX: 0, lastY: 0 })

  useEffect(() => {
    const onKeyDown = (e) => { keys.current[e.code] = true }
    const onKeyUp   = (e) => { keys.current[e.code] = false }

    const onMouseDown = (e) => {
      if (e.button === 2 || e.target.tagName === 'CANVAS') {
        mouse.current.dragging = true
        mouse.current.lastX = e.clientX
        mouse.current.lastY = e.clientY
      }
    }
    const onMouseUp   = (e) => { mouse.current.dragging = false }
    const onMouseMove = (e) => {
      if (isMobile.current) return
      
      if (mouse.current.dragging) {
        const dx = e.clientX - mouse.current.lastX
        const dy = e.clientY - mouse.current.lastY
        camYaw.current -= dx * LOOK_SPEED
        camPitch.current -= dy * LOOK_SPEED
        mouse.current.lastX = e.clientX
        mouse.current.lastY = e.clientY
      }
      camPitch.current = Math.max(-0.1, Math.min(0.7, camPitch.current))
    }
    const onContextMenu = (e) => e.preventDefault()

    const halfW = () => window.innerWidth / 2
    const onTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.clientX < halfW() && touch.current.moveTouchId === null) {
          touch.current.moveTouchId = t.identifier
          touch.current.moveOrigin  = { x: t.clientX, y: t.clientY }
          touch.current.moveDelta   = { x: 0, y: 0 }
        } else if (t.clientX >= halfW() && touch.current.lookTouchId === null) {
          touch.current.lookTouchId  = t.identifier
          touch.current.lastLookPos  = { x: t.clientX, y: t.clientY }
        }
      }
    }
    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touch.current.moveTouchId) {
          const dx = t.clientX - touch.current.moveOrigin.x
          const dy = t.clientY - touch.current.moveOrigin.y
          const maxR = 55
          const dist = Math.sqrt(dx*dx + dy*dy)
          const s = dist > maxR ? maxR/dist : 1
          touch.current.moveDelta = { x: (dx*s)/maxR, y: (dy*s)/maxR }
        }
        if (t.identifier === touch.current.lookTouchId) {
          const dx = t.clientX - touch.current.lastLookPos.x
          const dy = t.clientY - touch.current.lastLookPos.y
          camYaw.current -= dx * TOUCH_LOOK_SPEED
          camPitch.current -= dy * TOUCH_LOOK_SPEED
          camPitch.current = Math.max(-0.1, Math.min(0.7, camPitch.current))
          touch.current.lastLookPos = { x: t.clientX, y: t.clientY }
        }
      }
    }
    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touch.current.moveTouchId) {
          touch.current.moveTouchId = null
          touch.current.moveDelta   = { x: 0, y: 0 }
        }
        if (t.identifier === touch.current.lookTouchId) touch.current.lookTouchId = null
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup',   onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('touchstart',  onTouchStart,  { passive: true })
    window.addEventListener('touchmove',   onTouchMove,   { passive: true })
    window.addEventListener('touchend',    onTouchEnd,    { passive: true })
    window.addEventListener('touchcancel', onTouchEnd,    { passive: true })

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup',   onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('touchstart',  onTouchStart)
      window.removeEventListener('touchmove',   onTouchMove)
      window.removeEventListener('touchend',    onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_DELTA)
    const store = useLabStore.getState()
    
    // Publish camera rotation to store
    store.setCameraYaw(camYaw.current)
    store.setCameraPitch(camPitch.current)

    if (!rigidBodyRef.current) return

    // Input gathering
    const k = keys.current
    let sd = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)
    let fw = (k['KeyS'] || k['ArrowDown']  ? 1 : 0) - (k['KeyW'] || k['ArrowUp']   ? 1 : 0)

    if (isMobile.current) {
      sd = touch.current.moveDelta.x
      fw = touch.current.moveDelta.y
    }

    isMoving.current = (fw !== 0 || sd !== 0)

    // Physics movement
    const linvel = rigidBodyRef.current.linvel()
    
    if (isMoving.current) {
      const len = Math.sqrt(sd*sd + fw*fw)
      const mag = Math.min(len, 1.0)
      const invLen = 1 / len

      _fwd.set(Math.sin(camYaw.current), 0, Math.cos(camYaw.current))
      _right.crossVectors(_fwd, _UP).normalize()

      _move
        .copy(_fwd).multiplyScalar(-fw * invLen * MOVE_SPEED * mag)
        .addScaledVector(_right, sd * invLen * MOVE_SPEED * mag)

      rigidBodyRef.current.setLinvel({ x: _move.x, y: linvel.y, z: _move.z }, true)

      // Character facing direction
      if (characterGroupRef.current) {
        const moveAngle = Math.atan2(_move.x, _move.z)
        const currentY = characterGroupRef.current.rotation.y
        const deltaAngle = (moveAngle + Math.PI) - currentY
        const normalizedDelta = ((deltaAngle + Math.PI) % (2 * Math.PI)) - Math.PI
        characterGroupRef.current.rotation.y += normalizedDelta * 10 * dt
      }
    } else {
      // Decelerate quickly if no input
      rigidBodyRef.current.setLinvel({ x: linvel.x * 0.5, y: linvel.y, z: linvel.z * 0.5 }, true)
    }

    // Update store position for camera and interaction zones
    const pos = rigidBodyRef.current.translation()
    store.setCharacterPos({ x: pos.x, y: pos.y, z: pos.z })

    // Interaction zone check
    const pVec = new THREE.Vector3(pos.x, 0, pos.z)
    const near = BENCH_INTERACTION_POSITIONS.some(bp => pVec.distanceTo(bp) < INTERACTION_RADIUS)
    if (store.nearBench !== near) {
      store.setNearBench(near)
    }

    // Advanced Animation System
    if (isMoving.current) {
      walkPhaseRef.current += dt * 10
      const t = walkPhaseRef.current
      const walkCycle = Math.sin(t)
      const walkCycleAbs = Math.abs(Math.sin(t))
      const walkCycleFast = Math.sin(t * 2)

      // Torso bob and sway
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = walkCycleAbs * 0.05
        bodyGroupRef.current.rotation.z = walkCycle * 0.02
        bodyGroupRef.current.rotation.y = walkCycle * 0.05
      }

      // Head counters torso sway
      if (headRef.current) {
        headRef.current.rotation.y = -walkCycle * 0.05
        headRef.current.rotation.z = -walkCycle * 0.02
      }

      // Coat tails flap
      if (coatTailRef.current) {
        coatTailRef.current.rotation.x = -0.1 - walkCycleFast * 0.05
      }

      // Legs with knee bending
      if (upperLegLRef.current) upperLegLRef.current.rotation.x = walkCycle * 0.4
      if (upperLegRRef.current) upperLegRRef.current.rotation.x = -walkCycle * 0.4
      if (lowerLegLRef.current) lowerLegLRef.current.rotation.x = walkCycle > 0 ? walkCycle * 0.3 : 0
      if (lowerLegRRef.current) lowerLegRRef.current.rotation.x = walkCycle < 0 ? -walkCycle * 0.3 : 0

      // Arms swing
      if (upperArmLRef.current) upperArmLRef.current.rotation.x = -walkCycle * 0.3
      if (upperArmRRef.current) upperArmRRef.current.rotation.x = walkCycle * 0.3
      if (lowerArmLRef.current) lowerArmLRef.current.rotation.x = -0.1 + walkCycleAbs * 0.1
      if (lowerArmRRef.current) lowerArmRRef.current.rotation.x = -0.1 + walkCycleAbs * 0.1

    } else {
      // Idle Animation
      walkPhaseRef.current += dt * 2
      const t = walkPhaseRef.current
      const breatheCycle = Math.sin(t)

      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = THREE.MathUtils.lerp(bodyGroupRef.current.position.y, breatheCycle * 0.01, dt * 5)
        bodyGroupRef.current.rotation.set(0, 0, 0)
      }
      if (torsoRef.current) {
        torsoRef.current.scale.set(1, 1 + breatheCycle * 0.02, 1 + breatheCycle * 0.02)
      }
      if (headRef.current) headRef.current.rotation.set(0, 0, 0)
      if (coatTailRef.current) coatTailRef.current.rotation.x = THREE.MathUtils.lerp(coatTailRef.current.rotation.x, -0.05, dt * 5)

      // Smooth return to neutral
      if (upperLegLRef.current) upperLegLRef.current.rotation.x = THREE.MathUtils.lerp(upperLegLRef.current.rotation.x, 0, dt * 10)
      if (upperLegRRef.current) upperLegRRef.current.rotation.x = THREE.MathUtils.lerp(upperLegRRef.current.rotation.x, 0, dt * 10)
      if (lowerLegLRef.current) lowerLegLRef.current.rotation.x = THREE.MathUtils.lerp(lowerLegLRef.current.rotation.x, 0, dt * 10)
      if (lowerLegRRef.current) lowerLegRRef.current.rotation.x = THREE.MathUtils.lerp(lowerLegRRef.current.rotation.x, 0, dt * 10)
      
      if (upperArmLRef.current) upperArmLRef.current.rotation.x = THREE.MathUtils.lerp(upperArmLRef.current.rotation.x, 0, dt * 10)
      if (upperArmRRef.current) upperArmRRef.current.rotation.x = THREE.MathUtils.lerp(upperArmRRef.current.rotation.x, 0, dt * 10)
      if (lowerArmLRef.current) lowerArmLRef.current.rotation.x = THREE.MathUtils.lerp(lowerArmLRef.current.rotation.x, -0.1, dt * 10)
      if (lowerArmRRef.current) lowerArmRRef.current.rotation.x = THREE.MathUtils.lerp(lowerArmRRef.current.rotation.x, -0.1, dt * 10)
    }
  })

  // Highly stylized aesthetic materials
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#E0AC69', roughness: 0.5, metalness: 0.1 }), [])
  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2B3A67', roughness: 0.9, metalness: 0.0 }), [])
  const trousersMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1A1A1D', roughness: 0.8, metalness: 0.0 }), [])
  const shoeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.6 }), [])
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2D1B13', roughness: 0.8 }), [])
  const coatMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FDFDFD', roughness: 0.7, metalness: 0.05 }), [])
  const beltMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#444444', roughness: 0.5 }), [])
  const goggleStrapMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.7 }), [])
  const goggleFrameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#DDDDDD', roughness: 0.3, metalness: 0.8 }), [])
  const lensMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#0088ff', transmission: 0.9, opacity: 1, transparent: true, roughness: 0.1, metalness: 0.1, ior: 1.5, thickness: 0.05 }), [])
  const gloveMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3B82F6', roughness: 0.4, metalness: 0.1 }), [])

  // Geometries for dispose
  useEffect(() => {
    return () => {
      skinMat.dispose(); shirtMat.dispose(); trousersMat.dispose(); shoeMat.dispose(); hairMat.dispose();
      coatMat.dispose(); beltMat.dispose(); goggleStrapMat.dispose(); goggleFrameMat.dispose(); lensMat.dispose(); gloveMat.dispose();
    }
  }, [skinMat, shirtMat, trousersMat, shoeMat, hairMat, coatMat, beltMat, goggleStrapMat, goggleFrameMat, lensMat, gloveMat])

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      mass={70}
      linearDamping={10}
      angularDamping={100}
      lockRotations
      enabledRotations={[false, false, false]}
      position={[0, 1, 3]} // spawn position
    >
      <CapsuleCollider args={[0.5, 0.35]} position={[0, 0.85, 0]} />

      <group ref={characterGroupRef}>
        <group ref={bodyGroupRef}>
          
          {/* ────────────────── HEAD & NECK ────────────────── */}
          <group ref={headRef} position={[0, 1.52, 0]}>
            {/* Neck */}
            <mesh position={[0, -0.06, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.1]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Head Sphere */}
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.13, 32, 32]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Jaw / Lower Face */}
            <mesh position={[0, 0.04, 0.03]}>
              <boxGeometry args={[0.2, 0.12, 0.18]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Hair - Stylized Swoosh */}
            <mesh position={[0, 0.18, -0.02]} rotation={[-0.1, 0, 0]}>
              <boxGeometry args={[0.28, 0.1, 0.28]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.12, -0.12]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.26, 0.15, 0.1]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            {/* Ears */}
            <mesh position={[-0.13, 0.08, 0]}>
              <boxGeometry args={[0.04, 0.06, 0.06]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            <mesh position={[0.13, 0.08, 0]}>
              <boxGeometry args={[0.04, 0.06, 0.06]} />
              <primitive object={skinMat} attach="material" />
            </mesh>

            {/* Goggles (Detailed) */}
            {safetyGear.goggles && (
              <group position={[0, 0.1, 0.12]}>
                {/* Strap */}
                <mesh position={[0, 0, -0.15]}>
                  <cylinderGeometry args={[0.135, 0.135, 0.04, 32]} />
                  <primitive object={goggleStrapMat} attach="material" />
                </mesh>
                {/* Frames */}
                <mesh position={[-0.06, 0, 0]} rotation={[0, 0.1, 0]}>
                  <boxGeometry args={[0.1, 0.07, 0.04]} />
                  <primitive object={goggleFrameMat} attach="material" />
                </mesh>
                <mesh position={[0.06, 0, 0]} rotation={[0, -0.1, 0]}>
                  <boxGeometry args={[0.1, 0.07, 0.04]} />
                  <primitive object={goggleFrameMat} attach="material" />
                </mesh>
                {/* Bridge */}
                <mesh position={[0, 0, 0.01]}>
                  <boxGeometry args={[0.04, 0.02, 0.02]} />
                  <primitive object={goggleFrameMat} attach="material" />
                </mesh>
                {/* Lenses */}
                <mesh position={[-0.06, 0, 0.022]} rotation={[0, 0.1, 0]}>
                  <planeGeometry args={[0.08, 0.05]} />
                  <primitive object={lensMat} attach="material" />
                </mesh>
                <mesh position={[0.06, 0, 0.022]} rotation={[0, -0.1, 0]}>
                  <planeGeometry args={[0.08, 0.05]} />
                  <primitive object={lensMat} attach="material" />
                </mesh>
              </group>
            )}
          </group>

          {/* ────────────────── TORSO ────────────────── */}
          <group ref={torsoRef} position={[0, 1.15, 0]}>
            {/* Chest */}
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.42, 0.35, 0.22]} />
              <primitive object={shirtMat} attach="material" />
            </mesh>
            {/* Stomach / Lower Torso */}
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[0.38, 0.25, 0.2]} />
              <primitive object={shirtMat} attach="material" />
            </mesh>
            {/* Belt */}
            <mesh position={[0, -0.25, 0]}>
              <boxGeometry args={[0.39, 0.05, 0.21]} />
              <primitive object={beltMat} attach="material" />
            </mesh>

            {/* Lab Coat Upper/Main */}
            {safetyGear.coat && (
              <group position={[0, 0, 0]}>
                {/* Main Coat Body */}
                <mesh position={[0, 0.05, 0]}>
                  <boxGeometry args={[0.46, 0.55, 0.26]} />
                  <primitive object={coatMat} attach="material" />
                </mesh>
                {/* Collar */}
                <mesh position={[0, 0.35, -0.05]} rotation={[0.2, 0, 0]}>
                  <boxGeometry args={[0.4, 0.1, 0.2]} />
                  <primitive object={coatMat} attach="material" />
                </mesh>
                {/* Pockets */}
                <mesh position={[-0.12, -0.1, 0.135]}>
                  <boxGeometry args={[0.1, 0.12, 0.01]} />
                  <primitive object={coatMat} attach="material" />
                </mesh>
                <mesh position={[0.12, -0.1, 0.135]}>
                  <boxGeometry args={[0.1, 0.12, 0.01]} />
                  <primitive object={coatMat} attach="material" />
                </mesh>
              </group>
            )}
          </group>

          {/* Lab Coat Tails (Animated Separately) */}
          {safetyGear.coat && (
            <group ref={coatTailRef} position={[0, 0.85, 0]}>
              <mesh position={[0, -0.18, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.48, 0.4, 0.28]} />
                <primitive object={coatMat} attach="material" />
              </mesh>
            </group>
          )}

          {/* ────────────────── HIPS ────────────────── */}
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[0.38, 0.18, 0.2]} />
            <primitive object={trousersMat} attach="material" />
          </mesh>

          {/* ────────────────── LEFT ARM ────────────────── */}
          <group ref={upperArmLRef} position={[-0.26, 1.4, 0]} rotation={[0, 0, 0.1]}>
            {/* Shoulder */}
            <mesh position={[0, -0.02, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <primitive object={safetyGear.coat ? coatMat : shirtMat} attach="material" />
            </mesh>
            {/* Bicep */}
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[0.12, 0.25, 0.12]} />
              <primitive object={safetyGear.coat ? coatMat : shirtMat} attach="material" />
            </mesh>
            
            {/* Elbow Joint & Lower Arm */}
            <group ref={lowerArmLRef} position={[0, -0.32, 0]}>
              {/* Forearm */}
              <mesh position={[0, -0.15, 0]}>
                <boxGeometry args={[0.1, 0.25, 0.1]} />
                <primitive object={safetyGear.coat ? coatMat : skinMat} attach="material" />
              </mesh>
              {/* Hand */}
              <mesh position={[0, -0.32, 0]}>
                <boxGeometry args={[0.08, 0.12, 0.06]} />
                <primitive object={safetyGear.gloves ? gloveMat : skinMat} attach="material" />
              </mesh>
              {/* Thumb */}
              <mesh position={[0.04, -0.3, 0.02]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.03, 0.06, 0.03]} />
                <primitive object={safetyGear.gloves ? gloveMat : skinMat} attach="material" />
              </mesh>
            </group>
          </group>

          {/* ────────────────── RIGHT ARM ────────────────── */}
          <group ref={upperArmRRef} position={[0.26, 1.4, 0]} rotation={[0, 0, -0.1]}>
            <mesh position={[0, -0.02, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <primitive object={safetyGear.coat ? coatMat : shirtMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[0.12, 0.25, 0.12]} />
              <primitive object={safetyGear.coat ? coatMat : shirtMat} attach="material" />
            </mesh>
            
            <group ref={lowerArmRRef} position={[0, -0.32, 0]}>
              <mesh position={[0, -0.15, 0]}>
                <boxGeometry args={[0.1, 0.25, 0.1]} />
                <primitive object={safetyGear.coat ? coatMat : skinMat} attach="material" />
              </mesh>
              <mesh position={[0, -0.32, 0]}>
                <boxGeometry args={[0.08, 0.12, 0.06]} />
                <primitive object={safetyGear.gloves ? gloveMat : skinMat} attach="material" />
              </mesh>
              <mesh position={[-0.04, -0.3, 0.02]} rotation={[0, 0, 0.2]}>
                <boxGeometry args={[0.03, 0.06, 0.03]} />
                <primitive object={safetyGear.gloves ? gloveMat : skinMat} attach="material" />
              </mesh>
            </group>
          </group>

          {/* ────────────────── LEFT LEG ────────────────── */}
          <group ref={upperLegLRef} position={[-0.12, 0.75, 0]}>
            {/* Thigh */}
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[0.14, 0.36, 0.16]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            
            {/* Knee Joint & Lower Leg */}
            <group ref={lowerLegLRef} position={[0, -0.36, 0]}>
              {/* Calf */}
              <mesh position={[0, -0.18, 0]}>
                <boxGeometry args={[0.12, 0.36, 0.14]} />
                <primitive object={trousersMat} attach="material" />
              </mesh>
              {/* Shoe */}
              <mesh position={[0, -0.38, 0.05]}>
                <boxGeometry args={[0.14, 0.1, 0.24]} />
                <primitive object={shoeMat} attach="material" />
              </mesh>
            </group>
          </group>

          {/* ────────────────── RIGHT LEG ────────────────── */}
          <group ref={upperLegRRef} position={[0.12, 0.75, 0]}>
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[0.14, 0.36, 0.16]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            
            <group ref={lowerLegRRef} position={[0, -0.36, 0]}>
              <mesh position={[0, -0.18, 0]}>
                <boxGeometry args={[0.12, 0.36, 0.14]} />
                <primitive object={trousersMat} attach="material" />
              </mesh>
              <mesh position={[0, -0.38, 0.05]}>
                <boxGeometry args={[0.14, 0.1, 0.24]} />
                <primitive object={shoeMat} attach="material" />
              </mesh>
            </group>
          </group>

        </group>
      </group>
      
      {/* Interaction floor ring decal */}
      {!nearBench && (
        <mesh position={[0, 0.01, 1.0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
        </mesh>
      )}
    </RigidBody>
  )
}
