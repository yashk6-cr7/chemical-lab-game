/* eslint-disable */
import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Effect, BlendFunction } from 'postprocessing'
import { Uniform, Vector2 } from 'three'

// shaders.md: Extend Effect class from 'postprocessing' for proper EffectComposer integration
// This replaces the previous broken approach of a standalone render pass

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2  uCenter;

  void mainImage(
    const in vec4  inputColor,
    const in vec2  uv,
    out vec4       outputColor
  ) {
    vec2  offset  = uv - uCenter;
    float dist    = length(offset);
    // smoothstep mask — heat distortion fades with distance from source (shaders.md: use smoothstep)
    float mask    = 1.0 - smoothstep(0.0, 0.35, dist);

    // Distortion: sine waves on both axes, scaled by intensity and mask
    vec2 distortion = vec2(
      sin(uv.y * 20.0 + uTime * 3.0),
      cos(uv.x * 15.0 + uTime * 2.5)
    ) * uIntensity * mask * 0.008;

    outputColor = texture2D(inputBuffer, uv + distortion);
  }
`

// shaders.md: proper Effect class — integrates natively with EffectComposer pipeline
export class HeatShimmerEffect extends Effect {
  constructor({ intensity = 0.0, center = new Vector2(0.5, 0.35) } = {}) {
    super('HeatShimmerEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ['uTime',      new Uniform(0)],
        ['uIntensity', new Uniform(intensity)],
        ['uCenter',    new Uniform(center)],
      ]),
    })
  }

  // Called each frame by EffectComposer — no React useFrame needed here
  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('uTime').value += deltaTime
  }

  setIntensity(v) { this.uniforms.get('uIntensity').value = v }
  setCenter(v)    { this.uniforms.get('uCenter').value    = v }
}

// React wrapper — used inside <EffectComposer> as <HeatShimmer intensity={0.5} center={...} />
export function HeatShimmer({ intensity = 0, center }) {
  const centerVec = useMemo(() => new Vector2(
    center?.x ?? 0.5,
    center?.y ?? 0.35
  ), [center?.x, center?.y])

  const effect = useMemo(
    () => new HeatShimmerEffect({ intensity, center: centerVec }),
    // Only recreate if center actually changes (stable useMemo — shaders.md)
    [centerVec]
  )

  // Update intensity via setter — no new Effect() created (performance.md)
  useEffect(() => {
    effect.setIntensity(intensity)
  }, [intensity, effect])

  // Dispose on unmount
  useEffect(() => {
    return () => { effect.dispose() }
  }, [effect])

  return <primitive object={effect} dispose={null} />
}
