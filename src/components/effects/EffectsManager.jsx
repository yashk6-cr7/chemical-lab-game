/* eslint-disable */
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLabStore from '../../store/useLabStore'
import BubbleEffect from './BubbleEffect'
import SteamEffect from './SteamEffect'
import FireEffect from './FireEffect'
import SmokeEffect from './SmokeEffect'
import VaporDriftEffect from './VaporDriftEffect'
import PrecipitateEffect from './PrecipitateEffect'
import ColorShiftEffect from './ColorShiftEffect'
import SpatterEffect from './SpatterEffect'
import { DizzinessEffect } from './ScreenEffects'
import { updateAirQuality } from '../../systems/safetyManager'

// performance.md: Effect budget system — enforces 60 FPS target
const QUALITY_THRESHOLDS = { high: 55, mid: 40 }
const EFFECT_BUDGET = {
  high: { maxParticles: 200, steam: true,  volumetrics: true,  maxBeakerEffects: 4 },
  mid:  { maxParticles: 100, steam: true,  volumetrics: false, maxBeakerEffects: 3 },
  low:  { maxParticles: 50,  steam: false, volumetrics: false, maxBeakerEffects: 2 },
}

function useFPSAdaptiveQuality() {
  const fpsHistory  = useRef([])
  const qualityRef  = useRef('high')
  const frameCount  = useRef(0)
  const lastTime    = useRef(performance.now())

  useFrame(() => {
    frameCount.current++
    if (frameCount.current < 90) return
    const now     = performance.now()
    const elapsed = (now - lastTime.current) / 1000
    const fps     = frameCount.current / elapsed
    frameCount.current = 0
    lastTime.current   = now
    fpsHistory.current.push(fps)
    if (fpsHistory.current.length > 5) fpsHistory.current.shift()
    const avg = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
    if (avg >= QUALITY_THRESHOLDS.high)     qualityRef.current = 'high'
    else if (avg >= QUALITY_THRESHOLDS.mid) qualityRef.current = 'mid'
    else                                    qualityRef.current = 'low'
  })

  return qualityRef
}

// Custom ShaderMaterial for Explosions
const explosionMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uIntensity: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    
    // Simplex 3D Noise 
    // by Ian McEwan, Ashima Arts
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 1.0/7.0;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      
      // Calculate noise based on position and time
      float noise = snoise(position * 8.0 + uTime * 3.0);
      
      // Displace vertices along normal to create fireball shape
      vec3 newPosition = position + normal * noise * 0.15;
      
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uIntensity;
    
    void main() {
      // Create a gradient from white (hot center) to yellow/orange to dark red (edges)
      float dist = length(vPosition);
      
      vec3 colorInner = vec3(1.0, 1.0, 0.8); // White-yellow core
      vec3 colorMid = vec3(1.0, 0.5, 0.0);   // Orange
      vec3 colorOuter = vec3(0.2, 0.0, 0.0); // Dark red/smoke
      
      // Interpolate based on radius and time to simulate expansion cooling
      float mixRatio = clamp((dist * 3.0) + (uTime * 1.5), 0.0, 1.0);
      
      vec3 finalColor = mix(colorInner, colorMid, smoothstep(0.0, 0.5, mixRatio));
      finalColor = mix(finalColor, colorOuter, smoothstep(0.5, 1.0, mixRatio));
      
      // Fade out over time
      float opacity = max(0.0, 1.0 - uTime * 1.2) * uIntensity;
      
      gl_FragColor = vec4(finalColor, opacity);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

// Explosion flash — high quality GLSL shader fireball
function ExplosionEffect({ position, intensity = 10 }) {
  const meshRef = useRef()
  const timeRef = useRef(0)
  const [alive, setAlive] = useState(true)

  useFrame((_, delta) => {
    if (!meshRef.current || !alive) return
    timeRef.current += delta
    const t = timeRef.current
    
    // Expand and update shader uniforms
    const scale = Math.min(t * 12, 4.0) * (intensity / 10)
    meshRef.current.scale.setScalar(scale)
    
    // Clone material on first frame to prevent sharing uniforms among multiple explosions
    if (t < delta * 2) {
      meshRef.current.material = explosionMaterial.clone()
    }
    
    if (meshRef.current.material.uniforms) {
      meshRef.current.material.uniforms.uTime.value = t
      meshRef.current.material.uniforms.uIntensity.value = Math.max(0, 1 - t * 1.2)
    }
    
    if (t > 1.2) setAlive(false)
  })

  if (!alive) return null

  return (
    <group position={position}>
      {/* GLSL Fireball */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 64, 64]} />
        <primitive object={explosionMaterial} attach="material" />
      </mesh>
      {/* Shockwave ring */}
      <ExplosionRing position={[0, 0, 0]} intensity={intensity} />
      {/* Point light flash */}
      <pointLight color="#ff8800" intensity={intensity * 5} distance={5} decay={2} />
    </group>
  )
}

function ExplosionRing({ position, intensity }) {
  const meshRef = useRef()
  const timeRef = useRef(0)
  const [alive, setAlive] = useState(true)

  useFrame((_, delta) => {
    if (!meshRef.current || !alive) return
    timeRef.current += delta
    const t = timeRef.current
    const scale = t * 15 * (intensity / 10)
    const opacity = Math.max(0, 1.0 - t * 3)
    meshRef.current.scale.setScalar(scale)
    meshRef.current.material.opacity = opacity
    if (t > 0.4) setAlive(false)
  })

  if (!alive) return null

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.08, 0.12, 64]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={1.0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function EffectsManager() {
  const beakers         = useLabStore(state => state.beakers)
  const airQuality      = useLabStore(state => state.airQuality)
  const setAirQuality   = useLabStore(state => state.setAirQuality)
  const currentReactions= useLabStore(state => state.currentReactions)
  const inFumeHood      = useLabStore(state => state.inFumeHood)
  const setFireActive   = useLabStore(state => state.setFireActive)
  const extinguishFire  = useLabStore(state => state.extinguishFire)

  const airQualityRef = useRef(airQuality)
  airQualityRef.current = airQuality

  // Track explosion triggers per beaker to avoid re-triggering every frame
  const explosionTriggeredRef = useRef({})
  const [activeExplosions, setActiveExplosions] = useState([])

  const qualityRef = useFPSAdaptiveQuality()

  // Air quality update
  useFrame((_, delta) => {
    const newAQ = updateAirQuality(currentReactions, inFumeHood, airQualityRef.current, delta)
    if (Math.abs(newAQ - airQualityRef.current) > 0.1) {
      setAirQuality(newAQ)
    }
  })

  // Fire/explosion consequence side-effects
  useEffect(() => {
    beakers.forEach(beaker => {
      const rr = beaker.reactionResult
      if (!rr) return

      // Trigger fire store state when reaction is a fire
      if (rr.isFire) {
        setFireActive(beaker.id, rr.intensity)
      }

      // Trigger explosion flash for extremely violent reactions only once per beaker
      const isExplosive = rr.isExplosive ||
        rr.type === 'catalytic_decomposition' ||
        (rr.type === 'dangerous_dilution' && rr.intensity >= 9) ||
        (rr.type === 'neutralization_violent' && rr.intensity >= 9)

      if (isExplosive && !explosionTriggeredRef.current[beaker.id]) {
        explosionTriggeredRef.current[beaker.id] = true
        const pos = [beaker.position[0], beaker.position[1] + 0.25, beaker.position[2]]
        setActiveExplosions(prev => [...prev, { id: Date.now(), position: pos, intensity: rr.intensity }])
        // Clear flag after 3 seconds so re-adding same chemical re-triggers
        setTimeout(() => { explosionTriggeredRef.current[beaker.id] = false }, 3000)
      }

      // Reset fire if no longer active
      if (!rr.isFire) {
        extinguishFire()
      }
    })
  }, [beakers])

  const quality = qualityRef.current
  const budget  = EFFECT_BUDGET[quality] ?? EFFECT_BUDGET.high

  // Helper: should this reaction show bubbles?
  const isBubbly = (type) => [
    'acid_carbonate', 'acid_carbonate_strong', 'acid_carbonate_gentle',
    'acid_metal', 'catalytic_decomposition',
    'neutralization_violent', 'neutralization_gentle',
    'clock_reaction',
  ].includes(type)

  // Helper: should this reaction show fire?
  const isOnFire = (rr) => rr.isFire || rr.type === 'flammable_vapor' && rr.isFire

  return (
    <>
      {beakers.slice(0, budget.maxBeakerEffects).map(beaker => {
        const { reactionResult, position, totalVolume, mixedColor, contents } = beaker
        if (!reactionResult || totalVolume === 0) return null

        const type      = reactionResult.type
        const intensity = reactionResult.intensity || 0
        const worldPos  = [position[0], position[1] + 0.18, position[2]]

        return (
          <group key={beaker.id}>

            {/* ── BUBBLES for all bubbly reaction types ── */}
            {isBubbly(type) && totalVolume > 0 && (
              <BubbleEffect
                position={[position[0], position[1] + 0.05, position[2]]}
                intensity={Math.min(intensity, budget.maxParticles / 20)}
                color={type === 'catalytic_decomposition' ? '#ffffff' : '#e0f0ff'}
                foamMode={type === 'catalytic_decomposition' && intensity >= 8}
              />
            )}

            {/* ── STEAM: violent/hot reactions and beakers above 70°C ── */}
            {budget.steam && (
              (type === 'neutralization_violent' ||
               type === 'dangerous_dilution' ||
               type === 'acid_metal' ||
               beaker.temperature > 70) && (
                <SteamEffect
                  position={worldPos}
                  temperature={beaker.temperature}
                  intensity={intensity}
                />
              )
            )}

            {/* ── FIRE + SMOKE: any reaction with isFire flag ── */}
            {reactionResult.isFire && (
              <>
                <FireEffect position={worldPos} intensity={intensity} />
                <SmokeEffect
                  position={[worldPos[0], worldPos[1] + 0.3, worldPos[2]]}
                  intensity={Math.min(intensity, 8)}
                  color={type === 'dangerous_dilution' ? '#cccccc' : '#444444'}
                />
              </>
            )}

            {/* ── FIRE for flammable vapors even before full ignition ── */}
            {type === 'flammable_vapor' && !reactionResult.isFire && intensity > 4 && (
              <VaporDriftEffect position={worldPos} chemicalColor="#fffde7" />
            )}

            {/* ── ACID FUMES: white vapor for H₂SO₄ and HCl ── */}
            {(type === 'acid_fuming' || type === 'acid_decomposing' ||
              reactionResult.visualEffects?.includes('acid_fumes') ||
              reactionResult.visualEffects?.includes('dense_fumes')) && (
              <SteamEffect
                position={worldPos}
                temperature={200}
                intensity={Math.min(intensity + 2, 10)}
              />
            )}

            {/* ── WHITE SMOKE: HCl + NH₃ ── */}
            {type === 'smoke_reaction' && (
              <SmokeEffect
                position={[worldPos[0], worldPos[1] + 0.1, worldPos[2]]}
                intensity={6}
                color="#f0f0f0"
              />
            )}

            {/* ── MILKY PRECIPITATION: Na₂S₂O₃ clock reaction ── */}
            {type === 'clock_reaction' && reactionResult.precipitateFormed && (
              <PrecipitateEffect
                position={[position[0], position[1] + 0.01, position[2]]}
                precipitateColor="#ffffcc"
                amount={totalVolume}
              />
            )}

            {/* ── VAPOR DRIFT for volatile chemicals ── */}
            {(type === 'volatile_exposure' ||
              reactionResult.visualEffects?.includes('vapor_drift')) && (
              budget.volumetrics
                ? <VaporDriftEffect position={worldPos} chemicalColor={mixedColor} />
                : <SteamEffect position={worldPos} temperature={50} intensity={2} />
            )}

            {/* ── PRECIPITATE ── */}
            {reactionResult.precipitateFormed && type === 'precipitation' && (
              <PrecipitateEffect
                position={[position[0], position[1] + 0.01, position[2]]}
                precipitateColor={reactionResult.precipitateColor || '#1e88e5'}
                amount={totalVolume}
              />
            )}

            {/* ── COLOR SHIFT ── */}
            {reactionResult.colorChange && (
              <ColorShiftEffect
                position={[position[0], position[1] + 0.16, position[2]]}
                fromColor={contents.length > 1 ? contents[contents.length - 2]?.color : '#ffffff'}
                toColor={reactionResult.colorChange}
                duration={type === 'indicator_response' ? 0.5 : 1.2}
              />
            )}

            {/* ── SPATTER: acid+water violent dilution ── */}
            {type === 'dangerous_dilution' && (
              <SpatterEffect
                position={[position[0], position[1] + 0.18, position[2]]}
                color={mixedColor}
              />
            )}

          </group>
        )
      })}

      {/* ── EXPLOSIONS ── Rendered outside beaker loop, managed by state */}
      {activeExplosions.map(exp => (
        <ExplosionEffect
          key={exp.id}
          position={exp.position}
          intensity={exp.intensity}
        />
      ))}

      {/* Camera dizziness effect */}
      <DizzinessEffect />
    </>
  )
}
