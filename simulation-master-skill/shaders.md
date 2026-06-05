# Custom Shaders (GLSL)

## ShaderMaterial vs CustomShaderMaterial
- Prefer `CSM` (`three-custom-shader-material`) if you need your shader to react to standard Three.js lighting, shadows, and environment maps.
- Use `shaderMaterial` from `@react-three/drei` for unlit, highly stylized, or purely mathematical visual effects.

## GLSL Optimization
- Avoid conditionals (`if/else`) inside fragment shaders whenever possible. Use `step()`, `smoothstep()`, and `mix()` instead.
- Precalculate values in the vertex shader and pass them via `varying` to the fragment shader if the calculation doesn't require pixel-perfect precision.

## Uniforms
- Update uniforms via `ref.current.material.uniforms.uTime.value = time` inside `useFrame`. Do NOT trigger a React re-render to update a uniform.
