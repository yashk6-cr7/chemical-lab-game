import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

// Pre-allocated — no allocations inside useFrame
const _target   = new THREE.Vector3()
const _camPos   = new THREE.Vector3()
const _offset   = new THREE.Vector3()

const CAMERA_TARGET_OFFSET = new THREE.Vector3(0, 1.3, 0)
const CAMERA_DISTANCE = 2.4
const CAMERA_HEIGHT_OFFSET = 0.5
const CAMERA_MIN_DIST = 1.0
const CAMERA_MAX_DIST = 4.0

export default function ThirdPersonCamera() {
  const { camera } = useThree()
  const { rapier, world } = useRapier()

  useFrame(() => {
    const { characterPos, cameraYaw, cameraPitch } = useLabStore.getState()

    // Base target inside character head
    _target.set(characterPos.x, characterPos.y, characterPos.z).add(CAMERA_TARGET_OFFSET)

    // Add a right-shoulder offset relative to the camera's yaw
    const rightX = Math.cos(cameraYaw)
    const rightZ = -Math.sin(cameraYaw)
    _target.x += rightX * 0.65
    _target.z += rightZ * 0.65

    const r = Math.max(CAMERA_MIN_DIST, Math.min(CAMERA_MAX_DIST, CAMERA_DISTANCE))
    
    // Apply pitch using spherical coordinates around the target
    _offset.set(
      Math.sin(cameraYaw + Math.PI) * r * Math.cos(cameraPitch),
      CAMERA_HEIGHT_OFFSET - Math.sin(cameraPitch) * r,
      Math.cos(cameraYaw + Math.PI) * r * Math.cos(cameraPitch)
    )

    _camPos.copy(_target).add(_offset)

    // Raycast to prevent clipping through walls
    const rayDir = _camPos.clone().sub(_target).normalize()
    const maxDist = _target.distanceTo(_camPos)
    
    // Start ray 0.5m away from target to avoid hitting the player's own capsule (radius 0.3m)
    const rayStartOffset = 0.5
    if (maxDist > rayStartOffset) {
      const rayOrigin = _target.clone().add(rayDir.clone().multiplyScalar(rayStartOffset))
      const ray = new rapier.Ray(rayOrigin, rayDir)
      const hit = world.castRay(ray, maxDist - rayStartOffset, true)

      if (hit && hit.collider) {
        const hitDistFromTarget = rayStartOffset + hit.timeOfImpact
        const safeDist = Math.max(rayStartOffset, hitDistFromTarget - 0.2)
        _camPos.copy(_target).add(rayDir.multiplyScalar(safeDist))
      }
    }

    // Smooth follow
    camera.position.lerp(_camPos, 0.1)

    // Look at target
    camera.lookAt(_target)
  })

  return null
}
