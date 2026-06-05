# Three.js Fundamentals

## Math & Vectors
- Always reuse math objects. Avoid `new THREE.Quaternion()` in loops. Use `.set()`, `.copy()`, and `.lerp()`.
- Be aware of Euler order. Three.js defaults to 'XYZ'. If you experience gimbal lock, consider 'YXZ' for first-person cameras.
- Prefer Quaternions over Eulers for complex 3D rotations.

## Rendering & Lighting
- Tone Mapping is critical for realistic lighting. Use `ACESFilmicToneMapping`.
- Use `PointLight` and `SpotLight` sparingly due to high GPU cost. Default to a strong `Environment` map (HDRI) for base illumination.
- Avoid updating `ShadowMap` every frame for static objects. Set `castShadow` and `receiveShadow` only on necessary elements.

## Post-Processing
- Use `@react-three/postprocessing` instead of standard Three.js EffectComposer.
- `Bloom` must have a properly calibrated `luminanceThreshold` (usually > 0.8) to prevent the entire screen from glowing.
- Disable `NormalPass` in EffectComposer if SSAO or advanced depth effects aren't used.
