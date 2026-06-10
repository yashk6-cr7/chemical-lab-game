/* eslint-disable */
import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { isMobileDevice } from '../../utils/isMobile'
import { setPointerLocked, isPointerLocked } from '../../systems/pointerLock'
import useLabStore from '../../store/useLabStore'

const MOVE_SPEED     = 4
const LOOK_SPEED     = 0.0015
const TOUCH_LOOK_SPEED = 0.005
const EYE_HEIGHT     = 1.75
const BOUNDS         = { minX: -5.5, maxX: 5.5, minZ: -4.0, maxZ: 4.0 }
const MAX_PITCH      = Math.PI / 2.5

export default function PlayerControls() {
  const { camera, gl } = useThree()

  const keys             = useRef({})
  const isLocked         = useRef(false)
  const euler            = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const velocity         = useRef(new THREE.Vector3())
  const direction        = useRef(new THREE.Vector3())
  const frontVector      = useRef(new THREE.Vector3())
  const sideVector       = useRef(new THREE.Vector3())

  const isMobile = useRef(isMobileDevice())
  const touchState = useRef({
    moveTouchId: null, lookTouchId: null,
    moveOrigin: { x: 0, y: 0 },
    moveVector: { x: 0, y: 0 },
    lastLookPos: { x: 0, y: 0 },
  })

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 3.5)
    camera.rotation.set(0, 0, 0)
    euler.current.setFromQuaternion(camera.quaternion)

    const canvas = gl.domElement

    // ── Keyboard ──────────────────────────────────────────────────────────
    const onKeyDown = (e) => {
      keys.current[e.code] = true

      // ESC already exits pointer lock natively; we handle it in pointerlockchange.
      // E key → interact (handled in ChemicalBottle, Beaker etc. via store)
      if (e.code === 'KeyE' && isLocked.current) {
        useLabStore.getState().triggerInteract?.()
      }
    }
    const onKeyUp = (e) => { keys.current[e.code] = false }

    // ── Pointer Lock ───────────────────────────────────────────────────────
    // Only request lock when the player clicks the CANVAS and is NOT already locked.
    // This separates "enter play mode" from "interact with object".
    const onCanvasClick = () => {
      if (isMobile.current) return
      if (!document.pointerLockElement) {
        canvas.requestPointerLock()
      }
    }

    const onLockChange = () => {
      const locked = document.pointerLockElement === canvas
      isLocked.current = locked
      setPointerLocked(locked) // notify global system
      // Clear keys when exiting lock so player doesn't keep walking
      if (!locked) keys.current = {}
    }

    // Mouse look — only when locked
    const onMouseMove = (e) => {
      if (!isLocked.current || isMobile.current) return
      euler.current.y -= e.movementX * LOOK_SPEED
      euler.current.x -= e.movementY * LOOK_SPEED
      euler.current.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, euler.current.x))
      camera.quaternion.setFromEuler(euler.current)
    }

    // ── Mobile Touch ───────────────────────────────────────────────────────
    const handleTouchStart = (e) => {
      if (!isMobile.current) return
      const halfWidth = window.innerWidth / 2
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.clientX < halfWidth && touchState.current.moveTouchId === null) {
          touchState.current.moveTouchId = t.identifier
          touchState.current.moveOrigin = { x: t.clientX, y: t.clientY }
        } else if (t.clientX >= halfWidth && touchState.current.lookTouchId === null) {
          touchState.current.lookTouchId = t.identifier
          touchState.current.lastLookPos = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const handleTouchMove = (e) => {
      if (!isMobile.current) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchState.current.moveTouchId) {
          const dx = t.clientX - touchState.current.moveOrigin.x
          const dy = t.clientY - touchState.current.moveOrigin.y
          const maxR = 50
          const dist = Math.sqrt(dx * dx + dy * dy)
          const scale = dist > maxR ? maxR / dist : 1
          touchState.current.moveVector.x = (dx * scale) / maxR
          touchState.current.moveVector.y = (dy * scale) / maxR
        }
        if (t.identifier === touchState.current.lookTouchId) {
          const dx = t.clientX - touchState.current.lastLookPos.x
          const dy = t.clientY - touchState.current.lastLookPos.y
          euler.current.y -= dx * TOUCH_LOOK_SPEED
          euler.current.x -= dy * TOUCH_LOOK_SPEED
          euler.current.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, euler.current.x))
          camera.quaternion.setFromEuler(euler.current)
          touchState.current.lastLookPos = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const handleTouchEnd = (e) => {
      if (!isMobile.current) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchState.current.moveTouchId) {
          touchState.current.moveTouchId = null
          touchState.current.moveVector = { x: 0, y: 0 }
        }
        if (t.identifier === touchState.current.lookTouchId) {
          touchState.current.lookTouchId = null
        }
      }
    }

    // Use canvas click (not pointerdown) to enter lock mode
    canvas.addEventListener('click', onCanvasClick)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove',  handleTouchMove,  { passive: true })
    window.addEventListener('touchend',   handleTouchEnd,   { passive: true })
    window.addEventListener('touchcancel',handleTouchEnd,   { passive: true })

    return () => {
      canvas.removeEventListener('click', onCanvasClick)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove',  handleTouchMove)
      window.removeEventListener('touchend',   handleTouchEnd)
      window.removeEventListener('touchcancel',handleTouchEnd)
    }
  }, [camera, gl])

  useFrame((_, delta) => {
    // Movement only when pointer is locked (desktop) or touch joystick is active (mobile)
    const canMove = isMobile.current
      ? touchState.current.moveTouchId !== null
      : isLocked.current

    if (!canMove) return

    const k = keys.current
    let fw = (k['KeyS'] || k['ArrowDown']  ? 1 : 0) - (k['KeyW'] || k['ArrowUp']   ? 1 : 0)
    let sd = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)

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

    if (isMobile.current && touchState.current.moveTouchId !== null) {
      const mag = Math.sqrt(sd * sd + fw * fw)
      direction.current.multiplyScalar(mag)
    }

    velocity.current.x = direction.current.x
    velocity.current.z = direction.current.z

    camera.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, camera.position.x + velocity.current.x * delta))
    camera.position.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, camera.position.z + velocity.current.z * delta))
    camera.position.y = EYE_HEIGHT
  })

  return null
}
