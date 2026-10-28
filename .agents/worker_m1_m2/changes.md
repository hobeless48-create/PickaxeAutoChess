# Changes Log — Milestone 1 & Milestone 2 Implementation

**Worker**: worker_m1_m2  
**Date**: 2026-07-22  
**Target Codebase**: `C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess`  

---

## Summary of Changes

### Milestone 1 (Pre-Game Lobby Screen - R1)
1. **Implemented `src/view/ScreenManager.ts`**:
   - Manages top-level application view states: `LOBBY`, `SETTINGS`, `COMPENDIUM`, `GAMEPLAY`.
   - Boots into a sleek, modern Pre-Game Lobby by default featuring options for "Start Game", "Compendium", and "Settings".
   - Built **Settings Modal** allowing toggle of audio, graphics quality, grid glow, and listing control bindings.
   - Built **Compendium Browser**:
     - **Units Catalog Tab**: Browse all 36 catalog units with Faction and Cost filters, unit art/card previews, base stats, and skill details.
     - **Synergies Tab**: Browse all 14 traits/origins with active threshold levels and bonus descriptions.
     - **Item Recipes Tab**: Matrix of basic components and completed item recipes.
   - Built `startGame()` state transition sequence:
     - Invokes clean resets: `boardState.reset()`, `shopManager.reset()`, `gameLoop.reset()`, `ancientManager.reset()`, `unitView.removeAllUnits()`, `uiOverlay.removeAllHPBars()`, `unitInspectUI.hide()`.
     - Hides menu overlays and activates gameplay HUD and UI overlays.
     - Rolls initial shop cards and updates HUD.
   - Added top-left `⚙️ Menu` button during gameplay to allow returning to Lobby.

2. **Added Core Logic & View Reset Methods**:
   - `src/core/board/BoardState.ts`: Added `public reset(): void` to clear units map, reset bench slots array, and clear item inventory.
   - `src/core/shop/ShopManager.ts`: Added `public reset(): void` to reset gold to 20, level to 1, xp to 0, current shop to nulls, and roll initial shop choices.
   - `src/core/board/GameLoopManager.ts`: Added `public reset(): void` to reset phase to 'Preparation', timer to 30s, playerHP to 100, stage to 1, round to 1, streaks to 0, and clear board snapshots.
   - `src/view/UIOverlay.ts`: Added `public removeAllHPBars(): void` to clear all floating HTML HP bar wrappers.
   - `src/view/UnitView.ts`: Added `public removeAllUnits(): void` to clear all active unit billboard card sprites from the Three.js scene.

---

### Milestone 2 (2D Sprite Presentation Layer & Textured Hex Grid - R2)
1. **Refactored `src/view/BoardView.ts`**:
   - Replaced 3D extruded hexagon geometries (`THREE.ExtrudeGeometry`) and 3D stone box platform with flat 2D textured hexagon meshes on `y = 0.005`.
   - Generated crisp dynamic canvas textures for player hex tiles (teal/blue textured hexes), enemy hex tiles (crimson/red textured hexes), and 2D bench tray slots.
   - Rendered 9 flat 2D bench slot meshes on `y = 0.005` below the player board.
   - Positioned flat gold dividing plank on `y = 0.008` between player and enemy sides.
   - Kept `BOARD_Z_OFFSET = 3` and `getBenchZ()` static coordinate calculations intact.

2. **Refactored `src/view/UnitView.ts`**:
   - Replaced 3D voxel box models with **2D Billboard Card Sprites** (`THREE.Sprite`).
   - Implemented **Dynamic 2D Canvas Card Texture Generator** (`getOrCreateCardTexture`):
     - Renders crisp 256x320 2D unit card textures in memory for all units (including all 36 catalog units lacking pre-rendered concept art PNGs).
     - Color-coded cost frame borders (1g Grey, 2g Green, 3g Blue, 4g Purple, 5g Gold).
     - Faction-themed gradient background.
     - Concept art image portrait if present in `/assets/concepts/`, with automatic high-res procedural emblem fallback if missing.
     - Gold cost badge (`🪙 Xg`), star level indicators (★1, ★★2, ★★★3), and trait badges.
     - Cached textures in `Map<string, THREE.CanvasTexture>` for performance.
   - Added micro-animations for 2D card sprites: idle floating bob, walking hop bob, attack/cast forward lunge, death scale-shrink/fade.

3. **Refactored `src/view/VoxelModelFactory.ts`**:
   - Converted into a clean stub returning empty THREE.Group instances, delegating all unit presentation to `UnitView` 2D card billboard sprites.

4. **Refactored `src/view/DragControls.ts`**:
   - Ground plane raycasting (`THREE.Raycaster`) works against flat 2D hex tiles on `y = 0.005` and ground plane `y = 0`.
   - Added hover/dragover tile highlight glowing effect (`#38bdf8` cyan glow) when dragging units over valid hex tiles.
   - Elevated dragged 2D unit card sprite to `y = 0.75` during mouse drag.

5. **Updated `src/main.ts` & `src/style.css`**:
   - Instantiated `ScreenManager` to control boot state (`LOBBY`) and view switching.
   - Updated unit spawn calls to pass star level to `UnitView`.
   - Added custom scrollbar styles, glassmorphism panel styles, and button animations in `style.css`.

---

## File Modification Summary

| File | Status | Description |
|---|---|---|
| `src/view/ScreenManager.ts` | Created | Screen State Machine (LOBBY, SETTINGS, COMPENDIUM, GAMEPLAY) & UI views |
| `src/view/BoardView.ts` | Modified | Flat 2D textured hex grid & 2D bench tray slots |
| `src/view/UnitView.ts` | Modified | 2D Billboard Card Sprites & Dynamic Canvas Texture Fallback Generator |
| `src/view/VoxelModelFactory.ts` | Modified | Replaced 3D voxel box factory with lightweight stub |
| `src/view/DragControls.ts` | Modified | Flat tile raycasting, hover highlights, 2D drag elevation |
| `src/view/UIOverlay.ts` | Modified | Added `removeAllHPBars()` method |
| `src/core/board/BoardState.ts` | Modified | Added `reset()` method |
| `src/core/shop/ShopManager.ts` | Modified | Added `reset()` method |
| `src/core/board/GameLoopManager.ts` | Modified | Added `reset()` method |
| `src/main.ts` | Modified | Boot sequence delegated to `ScreenManager`, updated unit star level spawns |
| `src/style.css` | Modified | Added Lobby, Compendium, scrollbar, and UI button styles |
