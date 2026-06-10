/* eslint-disable */
/**
 * PlayerControls — stable FPS camera
 *
 * Root cause of tilt: mixing camera.quaternion + camera.rotation causes
 * Three.js internal sync to introduce Z roll. Fix: use camera.rotation
 * exclusively with YXZ order and force z=0 every frame.
 *
 * Root cause of hallucination: normalize() on zero vector → NaN.
 * Fix: length check before normalize.
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { isMobileDevice } from '../../utils/isMobile'
import { setPointerLocked } from '../../systems/pointerLock'

const MOVE_SPEED       = 4.5
const LOOK_SPEED       = 0.0018
const TOUCH_LOOK_SPEED = 0.004
const EYE_HEIGHT       = 1.75
const MAX_PITCH        = Math.PI / 2.2   // ~80 deg — never fully vertical
const BOUNDS           = { minX: -5.5, maxX: 5.5, minZ: -4.0, maxZ: 4.0 }

// Pre-allocated vectors — NEVER create new THREE objects inside useFrame
const _move  = new THREE.Vector3()
const _fwd   = new THREE.Vector3()
const _right = new THREE.Vector3()
const _UP    = new THREE.Vector3(0, 1, 0)

export default function PlayerControls() {
  const { camera, gl } = useThree()

  const keys     = useRef({})
  const isLocked = useRef(false)
  const yaw      = useRef(0)   // Y rotation (left/right)
  const pitch    = useRef(0)   // X rotation (up/down)

  const isMobile = useRef(isMobileDevice())
  const touch = useRef({
    moveTouchId: null,
    lookTouchId: null,
    moveOrigin:  { x: 0, y: 0 },
    moveDelta:   { x: 0, y: 0 }, // -1..1 normalized joystick
    lastLookPos: { x: 0, y: 0 },
  })

  useEffect(() => {
    // ── Init ────────────────────────────────────────────────────────────
    camera.rotation.order = 'YXZ'  // MUST be set — default XYZ causes gimbal tilt
    camera.position.set(0, EYE_HEIGHT, 3.5)
    camera.rotation.set(0, 0, 0)
    yaw.current   = 0
    pitch.current = 0

    const canvas = gl.domElement

    // Keyboard
    const onKeyDown = (e) => { keys.current[e.code] = true  }
    const onKeyUp   = (e) => { keys.current[e.code] = false }

    // Pointer lock — desktop only
    const onCanvasClick = () => {
      if (isMobile.current) return
      if (!document.pointerLockElement) canvas.requestPointerLock()
    }

    const onLockChange = () => {
      const locked = document.pointerLockElement === canvas
      isLocked.current = locked
      setPointerLocked(locked)
      if (!locked) keys.current = {}  // clear all keys on unlock
    }

    // Mouse look — only accumulate, apply once in useFrame
    const onMouseMove = (e) => {
      if (!isLocked.current || isMobile.current) return
      yaw.current   -= e.movementX * LOOK_SPEED
      pitch.current -= e.movementY * LOOK_SPEED
      pitch.current  = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current))
    }

    // Touch controls — mobile
    const halfW = () => window.innerWidth / 2

    const onTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.clientX < halfW() && touch.current.moveTouchId === null) {
          touch.current.moveTouchId = t.identifier
          touch.current.moveOrigin  = { x: t.clientX, y: t.clientY }
          touch.current.moveDelta   = { x: 0, y: 0 }
        } else if (t.clientX >= halfW() && touch.current.lookTouchId === null) {
          touch.current.lookTouchId = t.identifier
          touch.current.lastLookPos = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]

        if (t.identifier === touch.current.moveTouchId) {
          const dx   = t.clientX - touch.current.moveOrigin.x
          const dy   = t.clientY - touch.current.moveOrigin.y
          const maxR = 55
          const dist = Math.sqrt(dx * dx + dy * dy)
          const s    = dist > maxR ? maxR / dist : 1
          touch.current.moveDelta = { x: (dx * s) / maxR, y: (dy * s) / maxR }
        }

        if (t.identifier === touch.current.lookTouchId) {
          const dx = t.clientX - touch.current.lastLookPos.x
          const dy = t.clientY - touch.current.lastLookPos.y
          yaw.current   -= dx * TOUCH_LOOK_SPEED
          pitch.current -= dy * TOUCH_LOOK_SPEED
          pitch.current  = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current))
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
        if (t.identifier === touch.current.lookTouchId) {
          touch.current.lookTouchId = null
        }
      }
    }

    canvas.addEventListener('click', onCanvasClick)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    window.addEventListener('touchstart',  onTouchStart,  { passive: true })
    window.addEventListener('touchmove',   onTouchMove,   { passive: true })
    window.addEventListener('touchend',    onTouchEnd,    { passive: true })
    window.addEventListener('touchcancel', onTouchEnd,    { passive: true })

    return () => {
      canvas.removeEventListener('click', onCanvasClick)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
      window.removeEventListener('touchstart',  onTouchStart)
      window.removeEventListener('touchmove',   onTouchMove)
      window.removeEventListener('touchend',    onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [camera, gl])

  useFrame((_, delta) => {
    // ── 1. Apply camera rotation ─────────────────────────────────────────
    // Use camera.rotation directly — never touch camera.quaternion
    // Force z=0 every frame to PREVENT any roll/tilt from accumulating
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current
    camera.rotation.z = 0  // ← this single line kills all camera tilt

    // ── 2. Movement gate ─────────────────────────────────────────────────
    const mobile   = isMobile.current
    const canMove  = mobile ? touch.current.moveTouchId !== null : isLocked.current
    if (!canMove) return

    // Gather input axes (-1..1)
    const k  = keys.current
    let sd = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)
    let fw = (k['KeyS'] || k['ArrowDown']  ? 1 : 0) - (k['KeyW'] || k['ArrowUp']   ? 1 : 0)

    if (mobile) {
      sd = touch.current.moveDelta.x
      fw = touch.current.moveDelta.y
    }

    // ── KEY FIX: never normalize a zero vector → prevents NaN teleport ───
    const len = Math.sqrt(sd * sd + fw * fw)
    if (len < 0.001) return

    // Get camera's flat forward / right vectors (ignore pitch so you don't fly)
    camera.getWorldDirection(_fwd)
    _fwd.y = 0
    _fwd.normalize()

    _right.crossVectors(_fwd, _UP).normalize()

    // Combine strafe + forward, scale by joystick magnitude (analog feel)
    const speed = MOVE_SPEED * Math.min(len, 1.0)
    const inv   = 1 / len
    _move
      .copy(_fwd).multiplyScalar(-fw * inv * speed)   // forward/back
      .addScaledVector(_right, sd * inv * speed)       // left/right

    // Clamp delta to avoid teleport on lag spikes / tab switches
    const dt = Math.min(delta, 0.05)

    camera.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, camera.position.x + _move.x * dt))
    camera.position.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, camera.position.z + _move.z * dt))
    camera.position.y = EYE_HEIGHT  // locked to eye height always
  })

  return null
}
