# Drone Dreams

Drone Dreams is a finished Vite + Three.js drone-light show demo. It renders 9,600 procedural drones on a 120x80 lattice and plays them in sync with the included `Station13_Remix_Squeepty.mp3` soundtrack.

## Playback

The demo contains 14 runtime scenes covering 15 musical beats. The `Drone Dreams` title scene spans beats 11 and 12.

1. Helix Bloom
2. Stars and Stripes
3. Spiral Strands
4. Arcade Chase
5. Lorenz Attractor
6. Reaction-Diffusion
7. Hopf Fibration
8. Matrix Rain
9. Station 13
10. Space Invaders Attack
11. Drone Dreams title reveal
12. Drone Dreams full rotation
13. Helix Bloom: Return
14. Helix Bloom finale
15. Outro credits

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL, then click to enter so the browser can start audio playback. Add `?scene=2` to the URL to preview a specific runtime scene.

## Build

```bash
npm run build
npm run preview
```

The production build writes to `dist/`, which is intentionally ignored by Git.

## Source Layout

- `src/main.js`: renderer, audio timing, camera motion, transitions, and entry flow
- `src/style.css`: fullscreen canvas and entry overlay styles
- `src/scenes/`: procedural formation modules and shared scene helpers
- `music/`: soundtrack asset imported by Vite
