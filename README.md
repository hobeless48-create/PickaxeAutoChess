# Pickaxe AutoChess

This repository contains the Pickaxe AutoChess web game and its project notes. The playable app is in [`PickaxeAutoChess/`](PickaxeAutoChess/README.md); [`PROJECT.md`](PROJECT.md) describes its architecture and milestones.

## Requirements

- Node.js 20 or newer
- npm (included with Node.js)
- A modern desktop browser with WebGL support

## Install and run

In PowerShell, move into the app folder, install its dependencies, and start Vite:

```powershell
cd PickaxeAutoChess
npm install
npm run dev
```

Open the local URL printed by Vite. The development server supports hot reload while you edit `src/`.

## Build and preview

```powershell
npm run build
npm run preview
```

The build runs the TypeScript compiler and writes the production site to `PickaxeAutoChess/dist/`. The preview command serves that build locally.

## Code layout

- `PickaxeAutoChess/src/main.ts` starts the application and connects the game state to the view.
- `PickaxeAutoChess/src/core/` contains game state, hex grid logic, units, shops, combat, skills, stats, and game data.
- `PickaxeAutoChess/src/view/` contains the board, unit interactions, shop, lobby, and overlays.
- `PickaxeAutoChess/public/` contains static assets.
