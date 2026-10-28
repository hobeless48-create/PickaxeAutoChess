# Pickaxe AutoChess

Pickaxe AutoChess is a browser based auto battler built with TypeScript, Vite, and Three.js. It includes a hex board, unit shop and roster, combat simulation, unit skills, synergies, facilities, and game UI.

## Requirements

- Node.js 20 or newer
- npm (included with Node.js)
- A modern desktop browser with WebGL support

## Install and run

Open PowerShell in this folder and run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. The development server supports hot reload while you edit files under `src/`.

## Build and preview

```powershell
npm run build
npm run preview
```

The build runs the TypeScript compiler and creates the production site in `dist/`. The preview command serves that build locally.

## Project layout

- `src/main.ts` starts the application and connects the game state to the view.
- `src/core/` contains game state, hex grid logic, units, shops, combat, skills, stats, and data.
- `src/view/` contains the rendered board, unit interactions, shop, lobby, and overlays.
- `public/` contains static assets.

The lobby and in-game UI provide the current play flow. `../PROJECT.md` contains the broader architecture and milestone notes for this project.
