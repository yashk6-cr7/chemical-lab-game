# Volumetric Rendering

## Raymarching Techniques
- Use Raymarching inside a custom fragment shader bound to a simple bounding geometry (like a Box or Sphere) for rendering clouds, thick smoke, or chemical gas.
- Sample a 3D noise texture (or calculate 3D noise in the shader) along the ray path.

## Performance Limits
- Volumetric rendering is extremely heavy. Always provide a fallback (like stacked 2D billboards) for lower-end devices.
- Limit the number of ray steps based on distance and device capabilities. Use early termination (break the loop once opacity reaches 1.0).

## Lighting Volumetrics
- To make volumetrics look real, implement scattering. Sample a secondary ray toward the light source at each step to determine shadow density.
- Fake the scattering with a depth map and additive blending if true volumetric scattering is too expensive.
