/* eslint-disable */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { isMobileDevice } from '../../utils/isMobile'

const MOVE_SPEED = 4       // units per second
const LOOK_SPEED = 0.0015   // mouse sensitivity
const TOUCH_LOOK_SPEED = 0.005 // touch sensitivity
const EYE_HEIGHT = 1.75
const BOUNDS = { minX: -5.5, maxX: 5.5, minZ: -4.0, maxZ: 4.0 }

export default function PlayerControls() {
  const { camera, gl } = useThree()

  const keys = useRef({})
  const isPointerLocked = useRef(false)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const frontVector = useRef(new THREE.Vector3())
  const sideVector = useRef(new THREE.Vector3())

  // Mobile Touch State
  const isMobile = useRef(isMobileDevice())
  const touchState = useRef({
    moveTouchId: null,
    lookTouchId: null,
    moveOrigin: { x: 0, y: 0 },
    moveVector: { x: 0, y: 0 }, // Normalized joystick output (-1 to 1)
    lastLookPos: { x: 0, y: 0 }
  })

  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, EYE_HEIGHT, 3.5)
    camera.rotation.set(0, 0, 0)
    euler.current.setFromQuaternion(camera.quaternion)

    const canvas = gl.domElement

    // ── Desktop Keyboard ──────────────────────────────────────────────────
    const onKeyDown = (e) => { keys.current[e.code] = true }
    const onKeyUp   = (e) => { keys.current[e.code] = false }

    // ── Desktop Pointer Lock ──────────────────────────────────────────────
    const requestLock = (e) => {
      if (isMobile.current) return
      if (e.button === 0 && !document.pointerLockElement) {
        canvas.requestPointerLock()
      }
    }

    const onLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas
    }

    const onMouseMove = (e) => {
      if (!isPointerLocked.current || isMobile.current) return
      euler.current.y -= e.movementX * LOOK_SPEED
      euler.current.x -= e.movementY * LOOK_SPEED
      euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x))
      camera.quaternion.setFromEuler(euler.current)
    }

    // ── Mobile Touch Controls ──────────────────────────────────────────────
    const handleTouchStart = (e) => {
      if (!isMobile.current) return
      // We don't stop propagation here so onClick events still fire on 3D objects
      const halfWidth = window.innerWidth / 2

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        if (touch.clientX < halfWidth && touchState.current.moveTouchId === null) {
          // Left side: Movement Joystick
          touchState.current.moveTouchId = touch.identifier
          touchState.current.moveOrigin = { x: touch.clientX, y: touch.clientY }
        } else if (touch.clientX >= halfWidth && touchState.current.lookTouchId === null) {
          // Right side: Look control
          touchState.current.lookTouchId = touch.identifier
          touchState.current.lastLookPos = { x: touch.clientX, y: touch.clientY }
        }
      }
    }

    const handleTouchMove = (e) => {
      if (!isMobile.current) return
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        
        // Handle Movement
        if (touch.identifier === touchState.current.moveTouchId) {
          const dx = touch.clientX - touchState.current.moveOrigin.x
          const dy = touch.clientY - touchState.current.moveOrigin.y
          
          // Max joystick radius is 50px
          const maxRadius = 50
          const distance = Math.sqrt(dx * dx + dy * dy)
          const scale = distance > maxRadius ? maxRadius / distance : 1
          
          touchState.current.moveVector.x = (dx * scale) / maxRadius
          touchState.current.moveVector.y = (dy * scale) / maxRadius
        }
        
        // Handle Look
        if (touch.identifier === touchState.current.lookTouchId) {
          const dx = touch.clientX - touchState.current.lastLookPos.x
          const dy = touch.clientY - touchState.current.lastLookPos.y
          
          euler.current.y -= dx * TOUCH_LOOK_SPEED
          euler.current.x -= dy * TOUCH_LOOK_SPEED
          euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x))
          camera.quaternion.setFromEuler(euler.current)
          
          touchState.current.lastLookPos = { x: touch.clientX, y: touch.clientY }
        }
      }
    }

    const handleTouchEnd = (e) => {
      if (!isMobile.current) return
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        
        if (touch.identifier === touchState.current.moveTouchId) {
          touchState.current.moveTouchId = null
          touchState.current.moveVector = { x: 0, y: 0 }
        }
        if (touch.identifier === touchState.current.lookTouchId) {
          touchState.current.lookTouchId = null
        }
      }
    }

    canvas.addEventListener('click', requestLock)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // Touch events (passive: false to allow preventDefault if needed later, but we let clicks pass through)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      canvas.removeEventListener('click', requestLock)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)

      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [camera, gl])

  useFrame((_, delta) => {
    // Determine movement intent (combine keyboard and mobile joystick)
    const k = keys.current
    
    // Desktop keyboard
    let fw = (k['KeyS'] || k['ArrowDown'] ? 1 : 0) - (k['KeyW'] || k['ArrowUp'] ? 1 : 0)
    let sd = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)

    // Mobile joystick overrides keyboard if active
    if (isMobile.current && touchState.current.moveTouchId !== null) {
      sd = touchState.current.moveVector.x
      fw = touchState.current.moveVector.y
    }

    frontVector.current.set(0, 0, fw)
    sideVector.current.set(sd, 0, 0)

    direction.current
      .subVectors(frontVector.current, sideVector.current)
      .normalize()
      .multiplyScalar(MOVE_SPEED)
      .applyEuler(camera.rotation)

    // On mobile, normalize might be weird if length is small, so we scale by magnitude
    if (isMobile.current && touchState.current.moveTouchId !== null) {
      const mag = Math.sqrt(sd*sd + fw*fw)
      direction.current.multiplyScalar(mag)
    }

    velocity.current.x = direction.current.x
    velocity.current.z = direction.current.z

    camera.position.x += velocity.current.x * delta
    camera.position.z += velocity.current.z * delta

    camera.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, camera.position.x))
    camera.position.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, camera.position.z))
    camera.position.y = EYE_HEIGHT
  })

  return null
}
