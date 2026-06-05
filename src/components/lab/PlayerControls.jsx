/* eslint-disable */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MOVE_SPEED = 4       // units per second
const LOOK_SPEED = 0.0015   // mouse sensitivity
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

  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, EYE_HEIGHT, 3.5)
    camera.rotation.set(0, 0, 0)
    euler.current.setFromQuaternion(camera.quaternion)

    // ── Keyboard ──────────────────────────────────────────────────
    const onKeyDown = (e) => { keys.current[e.code] = true }
    const onKeyUp   = (e) => { keys.current[e.code] = false }

    // ── Pointer Lock ──────────────────────────────────────────────
    const canvas = gl.domElement

    const requestLock = (e) => {
      // Only lock on LEFT click and only if not already locked
      if (e.button === 0 && !document.pointerLockElement) {
        canvas.requestPointerLock()
      }
    }

    const onLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas
    }

    const onMouseMove = (e) => {
      if (!isPointerLocked.current) return
      euler.current.y -= e.movementX * LOOK_SPEED
      euler.current.x -= e.movementY * LOOK_SPEED
      // Clamp pitch so player can't look upside-down
      euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x))
      camera.quaternion.setFromEuler(euler.current)
    }

    canvas.addEventListener('click', requestLock)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      canvas.removeEventListener('click', requestLock)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [camera, gl])

  useFrame((_, delta) => {
    const k = keys.current

    const fw = (k['KeyS'] || k['ArrowDown'] ? 1 : 0) - (k['KeyW'] || k['ArrowUp'] ? 1 : 0)
    const sd = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)

    frontVector.current.set(0, 0, fw)
    sideVector.current.set(sd, 0, 0)

    direction.current
      .subVectors(frontVector.current, sideVector.current)
      .normalize()
      .multiplyScalar(MOVE_SPEED)
      .applyEuler(camera.rotation)

    velocity.current.x = direction.current.x
    velocity.current.z = direction.current.z

    camera.position.x += velocity.current.x * delta
    camera.position.z += velocity.current.z * delta

    camera.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, camera.position.x))
    camera.position.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, camera.position.z))
    camera.position.y = EYE_HEIGHT
  })

  return null  // No drei PointerLockControls — we manage everything manually
}
