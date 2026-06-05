# UI Design and Aceternity

## HTML Overlays
- R3F is designed to work seamlessly with React DOM. Overlay your HTML UI on top of the `<Canvas>` wrapper.
- Use `pointer-events-none` on overlay containers to ensure the user can still interact with the 3D scene underneath, and enable `pointer-events-auto` only on the specific buttons/panels.

## Aceternity UI
- Aceternity provides robust, complex Tailwind/Framer combinations.
- Integrate Aceternity components for heroic/impressive UI sections (e.g., the introductory screen, data dashboards, or scientific readouts).
- Ensure Aceternity components do not cause layout shifts (CLS) that interrupt the canvas experience.

## Theming
- Keep the UI color palette synchronized with the 3D scene's lighting. Use CSS variables defined in `:root` and read them in both standard React components and R3F materials.
