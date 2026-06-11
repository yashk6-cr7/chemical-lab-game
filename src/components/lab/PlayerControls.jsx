/* eslint-disable */
/**
 * PlayerControls — Third-Person Character Movement
 *
 * Moves the CHARACTER position in the store.
 * ThirdPersonCamera reads that position and follows.
 *
 * Desktop: WASD moves, mouse drag rotates character yaw
 * Mobile:  Left joystick moves, right drag rotates yaw
 */
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { isMobileDevice } from '../../utils/isMobile'
import useLabStore from '../../store/useLabStore'

const MOVE_SPEED = 4.0
const LOOK_SPEED = 0.004
const TOUCH_LOOK_SPEED = 0.006
const BOUNDS    = { minX: -5.2, maxX: 5.2, minZ: -3.8, maxZ: 3.8 }
const MAX_DELTA = 0.05

// Pre-allocated — never create inside useFrame
const _fwd   = new THREE.Vector3()
const _right = new THREE.Vector3()
const _move  = new THREE.Vector3()
const _UP    = new THREE.Vector3(0, 1, 0)
const _yawQ  = new THREE.Quaternion()

export default function PlayerControls() {
  const keys    = useRef({})
  const camYaw  = useRef(Math.PI)       // camera orbit angle
  const camPitch = useRef(0)            // camera pitch angle
  const charYaw = useRef(Math.PI)       // character facing direction
  const isMobile = useRef(isMobileDevice())

  const touch = useRef({
    moveTouchId: null, lookTouchId: null,
    moveOrigin: { x: 0, y: 0 },
    moveDelta: { x: 0, y: 0 },
    lastLookPos: { x: 0, y: 0 },
  })

  // Mouse drag state (desktop — no pointer lock needed for 3rd person!)
  const mouse = useRef({ dragging: false, lastX: 0, lastY: 0 })

  useEffect(() => {
    const onKeyDown = (e) => { keys.current[e.code] = true }
    const onKeyUp   = (e) => { keys.current[e.code] = false }

    // Desktop: right mouse button drag to rotate, or pointer lock!
    const onMouseDown = (e) => {
      if (e.button === 2) { // right click
        mouse.current.dragging = true
        mouse.current.lastX = e.clientX
        mouse.current.lastY = e.clientY
        e.preventDefault()
      } else if (e.button === 0 && !isMobile.current) {
        if (document.pointerLockElement !== document.body && e.target.tagName === 'CANVAS') {
          document.body.requestPointerLock()
        }
      }
    }
    const onMouseUp   = (e) => { if (e.button === 2) mouse.current.dragging = false }
    const onMouseMove = (e) => {
      if (isMobile.current) return
      
      if (document.pointerLockElement === document.body) {
        camYaw.current -= e.movementX * LOOK_SPEED
        camPitch.current -= e.movementY * LOOK_SPEED
      } else if (mouse.current.dragging) {
        const dx = e.clientX - mouse.current.lastX
        const dy = e.clientY - mouse.current.lastY
        camYaw.current -= dx * LOOK_SPEED
        camPitch.current -= dy * LOOK_SPEED
        mouse.current.lastX = e.clientX
        mouse.current.lastY = e.clientY
      }
      // Clamp pitch so camera doesn't flip over head
      camPitch.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, camPitch.current))
    }
    const onContextMenu = (e) => e.preventDefault()

    // Touch
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
          camPitch.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, camPitch.current))
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
    const mobile = isMobile.current

    // Gather input
    const k = keys.current
    let sd = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)
    let fw = (k['KeyS'] || k['ArrowDown']  ? 1 : 0) - (k['KeyW'] || k['ArrowUp']   ? 1 : 0)

    if (mobile) {
      sd = touch.current.moveDelta.x
      fw = touch.current.moveDelta.y
    }

    // Update store camera yaw/pitch every frame so camera can read it
    const store = useLabStore.getState()
    store.setCameraYaw(camYaw.current)
    store.setCameraPitch(camPitch.current)

    if (fw === 0 && sd === 0) return

    const len = Math.sqrt(sd*sd + fw*fw)
    if (len < 0.001) return

    const mag    = Math.min(len, 1.0)
    const invLen = 1 / len

    // Build movement directions RELATIVE to camera's facing direction
    _fwd.set(Math.sin(camYaw.current), 0, Math.cos(camYaw.current))
    _right.crossVectors(_fwd, _UP).normalize()

    // Combine forward + strafe
    _move
      .copy(_fwd).multiplyScalar(-fw * invLen * MOVE_SPEED * mag)
      .addScaledVector(_right, sd * invLen * MOVE_SPEED * mag)

    // Update character position in store
    const { characterPos, setCharacterPos } = useLabStore.getState()
    const newX = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, characterPos.x + _move.x * dt))
    const newZ = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, characterPos.z + _move.z * dt))

    // Auto-update character yaw to face movement direction visually
    if (Math.abs(fw) > 0.1 || Math.abs(sd) > 0.1) {
      const moveAngle = Math.atan2(_move.x, _move.z)
      
      let diff = moveAngle - charYaw.current
      while (diff >  Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      
      charYaw.current += diff * Math.min(1, dt * 10)
      useLabStore.getState().setCharacterYaw(charYaw.current)
    }

    setCharacterPos({ x: newX, y: 0, z: newZ })
  })

  return null
}
