# Water and Ocean Simulation

## Gerstner Waves
- For large bodies of liquid or oceans, implement Gerstner Waves in the vertex shader. They provide realistic peaks and troughs compared to simple sine waves.
- Sum 3 to 4 Gerstner waves with different directions, frequencies, and amplitudes.

## Edge Intersection (Foam)
- Use the `gl_FragCoord.z` and compare it against the scene depth texture to detect where the water surface intersects with solid objects (like a beaker wall or shore).
- Map a foam texture or simply increase the brightness based on this depth difference.

## Refraction and Reflection
- Use `MeshPhysicalMaterial` with `transmission: 1.0`, `thickness`, and `ior` for basic contained liquids.
- For oceans, use SSR (Screen Space Reflections) or a planar reflection camera mapping.
