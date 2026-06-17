/* eslint-disable */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'

const CO2_COUNT = 400

export default function CO2SprayEffect({ nozzleRef }) {
  const isSpraying = useLabStore(state => state.isSpraying)
  const characterYaw = useLabStore(state => state.characterYaw)
  const meshRef = useRef()
  const particles = useRef([])

  // Initialize particles
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    particles.current = Array.from({ length: CO2_COUNT }, () => ({
      active: false,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0,
      scale: 0,
      rotation: Math.random() * Math.PI * 2,
    }))
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const camera = state.camera

    // Emit new particles when spraying
    if (isSpraying) {
      const nozzlePos = nozzleRef?.current
        ? new THREE.Vector3().setFromMatrixPosition(nozzleRef.current.matrixWorld)
        : camera.position.clone().add(
            new THREE.Vector3(0.25, -0.15, -0.5).applyQuaternion(camera.quaternion)
          )

      // Spray direction = character forward
      const yaw = characterYaw + Math.PI
      const sprayDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)

      // Emit ~3 particles per frame for longer, denser smoke
      let emitted = 0
      for (let i = 0; i < CO2_COUNT && emitted < 3; i++) {
        const p = particles.current[i]
        if (!p.active) {
          p.active = true
          p.position.copy(nozzlePos)
          p.life = 0
          p.maxLife = 2.0 + Math.random() * 2.0 // Linger for 2 to 4 seconds

          // Cone spread (wider cone for smoke)
          const spread = 0.4
          const angle = Math.random() * spread - spread / 2
          const angle2 = Math.random() * spread - spread / 2
          const vel = sprayDir.clone()
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
            .applyAxisAngle(new THREE.Vector3(1, 0, 0), angle2)
            .multiplyScalar(3.0 + Math.random() * 2.0)

          p.velocity.copy(vel)
          p.scale = 0.01
          emitted++
        }
      }
    }

    // Update all particles
    let anyActive = false
    for (let i = 0; i < CO2_COUNT; i++) {
      const p = particles.current[i]
      if (!p.active) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      p.life += delta
      if (p.life >= p.maxLife) {
        p.active = false
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      anyActive = true
      const t = p.life / p.maxLife

      // Move particle
      p.position.addScaledVector(p.velocity, delta)
      
      // Drag slows it down drastically after initial burst
      p.velocity.multiplyScalar(0.95)
      
      // Gravity (CO2 is heavier than air, so it sinks slowly)
      p.velocity.y -= delta * 0.4

      // Scale: grows huge, fades at very end
      const growPhase = Math.min(1, t * 5)
      const fadePhase = Math.max(0, 1 - Math.pow(t, 2))
      p.scale = growPhase * fadePhase * (0.1 + t * 0.3) // Expand up to 0.4 scale

      p.rotation += delta * 0.5 // Slow spin

      dummy.position.copy(p.position)
      dummy.rotation.set(p.rotation, p.rotation, p.rotation)
      dummy.scale.setScalar(Math.max(0.001, p.scale))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.visible = anyActive || isSpraying
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, CO2_COUNT]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#f8fbff"
        transparent
        opacity={0.35}
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </instancedMesh>
  )
}
