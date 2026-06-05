# Code Standards and Conventions

## 1. Directory Structure
```text
/src
  /components
    /effects     # All visual effects and particles
    /equipment   # Interactive 3D props (Beakers, Hotplates)
    /ui          # All 2D HTML/Tailwind overlays
  /store         # Zustand state slices
  /systems       # Non-React logic (physics, thermodynamics)
  /data          # Static JSON definitions
```

## 2. Naming Conventions
- React Components: PascalCase (`EffectsManager.jsx`).
- Logic/Systems/Hooks: camelCase (`temperatureEngine.js`, `useLabStore.js`).
- CSS Classes: BEM or standard Tailwind.
- Constants: UPPER_SNAKE_CASE (`MAX_TEMPERATURE`).

## 3. Comments and Documentation
- Every complex calculation must have a comment explaining the real-world physics/math it approximates.
- Document expected input ranges for custom hooks and components.

## 4. Linting and TypeScript
- Ensure code passes standard ESLint configurations for React.
- If using TypeScript, strictly type Zustand stores and Three.js custom components to prevent property drift.
