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
  const upperArmLRef = useRef(null)
  const upperArmRRef = useRef(null)
  const upperLegLRef = useRef(null)
  const upperLegRRef = useRef(null)

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

    // Animation
    if (isMoving.current) {
      walkPhaseRef.current += dt * 8
      const t = walkPhaseRef.current
      const swing = Math.sin(t) * 0.3
      const armSwing = Math.sin(t) * 0.25
      const bobY = Math.abs(Math.sin(t)) * 0.02

      if (upperLegLRef.current) upperLegLRef.current.rotation.x = swing
      if (upperLegRRef.current) upperLegRRef.current.rotation.x = -swing
      if (upperArmLRef.current) upperArmLRef.current.rotation.x = -armSwing
      if (upperArmRRef.current) upperArmRRef.current.rotation.x = armSwing
      if (bodyGroupRef.current) bodyGroupRef.current.position.y = bobY
    } else {
      // Reset animations
      if (upperLegLRef.current) upperLegLRef.current.rotation.x = THREE.MathUtils.lerp(upperLegLRef.current.rotation.x, 0, dt * 10)
      if (upperLegRRef.current) upperLegRRef.current.rotation.x = THREE.MathUtils.lerp(upperLegRRef.current.rotation.x, 0, dt * 10)
      if (upperArmLRef.current) upperArmLRef.current.rotation.x = THREE.MathUtils.lerp(upperArmLRef.current.rotation.x, 0, dt * 10)
      if (upperArmRRef.current) upperArmRRef.current.rotation.x = THREE.MathUtils.lerp(upperArmRRef.current.rotation.x, 0, dt * 10)
      if (bodyGroupRef.current) bodyGroupRef.current.position.y = THREE.MathUtils.lerp(bodyGroupRef.current.position.y, 0, dt * 10)
    }
  })

  // Materials
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#C68642', roughness: 0.7, metalness: 0.0 }), [])
  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1B2A4A', roughness: 0.85, metalness: 0.0 }), [])
  const trousersMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2C2C2C', roughness: 0.8, metalness: 0.0 }), [])
  const shoeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1A1A1A', roughness: 0.9 }), [])
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1C0A00', roughness: 0.9 }), [])
  const coatMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#F0F0F0', roughness: 0.6 }), [])
  const goggleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.4, metalness: 0.3 }), [])
  const lensMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#004499', transparent: true, opacity: 0.5, depthWrite: false }), [])
  const gloveMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4A90D9', roughness: 0.5 }), [])

  // Geometries for dispose
  useEffect(() => {
    return () => {
      skinMat.dispose(); shirtMat.dispose(); trousersMat.dispose(); shoeMat.dispose(); hairMat.dispose();
      coatMat.dispose(); goggleMat.dispose(); lensMat.dispose(); gloveMat.dispose();
    }
  }, [skinMat, shirtMat, trousersMat, shoeMat, hairMat, coatMat, goggleMat, lensMat, gloveMat])

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
          {/* Head & Neck */}
          <group position={[0, 1.49, 0]}>
            {/* Neck */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.07, 0.12]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.13, 0]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Hair */}
            <mesh position={[0, 0.13, 0]}>
              <sphereGeometry args={[0.135, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <primitive object={hairMat} attach="material" />
            </mesh>
            {/* Goggles */}
            {safetyGear.goggles && (
              <group position={[0, 0.15, 0.12]}>
                <mesh position={[-0.05, 0, 0]}>
                  <torusGeometry args={[0.045, 0.015, 8, 16]} />
                  <primitive object={goggleMat} attach="material" />
                </mesh>
                <mesh position={[0.05, 0, 0]}>
                  <torusGeometry args={[0.045, 0.015, 8, 16]} />
                  <primitive object={goggleMat} attach="material" />
                </mesh>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.06, 0.015, 0.015]} />
                  <primitive object={goggleMat} attach="material" />
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
            )}
          </group>

          {/* Torso */}
          <group position={[0, 1.14, 0]}>
            <mesh>
              <boxGeometry args={[0.42, 0.52, 0.22]} />
              <primitive object={shirtMat} attach="material" />
            </mesh>
            {/* Lab Coat Overlay on Torso */}
            {safetyGear.coat && (
              <mesh position={[0, 0, 0.01]}>
                <boxGeometry args={[0.46, 0.54, 0.24]} />
                <primitive object={coatMat} attach="material" />
              </mesh>
            )}
          </group>

          {/* Hips */}
          <mesh position={[0, 0.84, 0]}>
            <boxGeometry args={[0.38, 0.18, 0.20]} />
            <primitive object={trousersMat} attach="material" />
          </mesh>

          {/* Left Arm (Pivot at shoulder y=1.37) */}
          <group ref={upperArmLRef} position={[-0.24, 1.37, 0]} rotation={[0, 0, 0.25]}>
            {/* Upper Arm */}
            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.30]} />
              <primitive object={safetyGear.coat ? coatMat : shirtMat} attach="material" />
            </mesh>
            {/* Lower Arm */}
            <mesh position={[0, -0.43, 0]} rotation={[0, 0, -0.10]}>
              <cylinderGeometry args={[0.06, 0.05, 0.28]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.59, 0]} rotation={[0, 0, -0.10]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <primitive object={safetyGear.gloves ? gloveMat : skinMat} attach="material" />
            </mesh>
          </group>

          {/* Right Arm */}
          <group ref={upperArmRRef} position={[0.24, 1.37, 0]} rotation={[0, 0, -0.25]}>
            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.30]} />
              <primitive object={safetyGear.coat ? coatMat : shirtMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.43, 0]} rotation={[0, 0, 0.10]}>
              <cylinderGeometry args={[0.06, 0.05, 0.28]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.59, 0]} rotation={[0, 0, 0.10]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <primitive object={safetyGear.gloves ? gloveMat : skinMat} attach="material" />
            </mesh>
          </group>

          {/* Left Leg (Pivot at hip y=0.75) */}
          <group ref={upperLegLRef} position={[-0.12, 0.75, 0]}>
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.09, 0.08, 0.38]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.57, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.36]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.73, 0.04]}>
              <boxGeometry args={[0.12, 0.08, 0.22]} />
              <primitive object={shoeMat} attach="material" />
            </mesh>
          </group>

          {/* Right Leg */}
          <group ref={upperLegRRef} position={[0.12, 0.75, 0]}>
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.09, 0.08, 0.38]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.57, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.36]} />
              <primitive object={trousersMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.73, 0.04]}>
              <boxGeometry args={[0.12, 0.08, 0.22]} />
              <primitive object={shoeMat} attach="material" />
            </mesh>
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
