# Particle Systems

## InstancedMesh vs Points
- **Low to Medium Count (0 - 5000):** Use `InstancedMesh`. It allows you to assign unique 3D geometries (like bubbles or sparks) and individually color them using `setColorAt()`.
- **High Count (5000+):** Use `<Points>` and a custom `ShaderMaterial`. Pass positions and sizes via `BufferAttribute`. 

## Particle Lifecycles
- Do not create and destroy meshes. This causes garbage collection stutter.
- **Pool Particles:** Pre-allocate all particles. When a particle "dies", move it out of view (e.g., `y = -9999`) or set its scale to 0. When a new particle is needed, reset a "dead" particle.

## Compute Shaders
- For extremely complex particle simulations (e.g., fluid dynamics with >100,000 particles), utilize WebGPU compute shaders or FBO (Frame Buffer Object) techniques in WebGL to calculate positions on the GPU instead of the CPU.
