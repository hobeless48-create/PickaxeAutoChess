# Handoff Report — explorer_ui

**Agent**: explorer_ui  
**Working Directory**: `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_ui`  
**Target Codebase**: `C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess`  
**Date**: 2026-07-22  

---

## 1. Observation

Direct observations from examining the codebase files:

1. **Boot Process (`src/main.ts:30-92`)**:
   - `main.ts` directly instantiates `SceneManager`, `BoardView`, `ParticleSystem`, `UnitView`, `UIOverlay`, `BoardState`, `ShopManager`, `GameLoopManager`, `AncientManager`, `EventBridge`, `ShopUI`, `UnitInspectUI`, `DragControls`, `TickManager`, and starts the render/tick loops on load.
   - Quotation (`src/main.ts:36-42`):
     ```typescript
     const sceneManager = new SceneManager(appDiv);
     const boardView = new BoardView(sceneManager.getScene());
     boardView.renderBoard();
     const particleSystem = new ParticleSystem(sceneManager.getScene());
     const unitView = new UnitView(sceneManager.getScene());
     const uiOverlay = new UIOverlay(appDiv);
     ```
   - No lobby view, screen manager, or screen state machine currently exists in `src/main.ts` or `src/view/`.

2. **3D WebGL Scene & Environment (`src/view/SceneManager.ts:35-76, 87-212`)**:
   - Uses `THREE.PerspectiveCamera(50, aspect, 0.1, 500)` at `(4.68, 16, 18)` looking at `(4.68, 0, 7.5)`.
   - WebGLRenderer with shadows, `ACESFilmicToneMapping`, `EffectComposer` with `BloomEffect` from `postprocessing`.
   - Environment includes 80x80 grass plane, infield patch, stone perimeter walls, 4 corner towers, 6 cherry blossom trees, and 600 falling blossom particles.

3. **Board & Bench Tiles (`src/view/BoardView.ts:21-177`)**:
   - 7 columns × 8 rows (flat-top hexes with `HEX_SIZE = 0.9`).
   - Uses `THREE.ExtrudeGeometry` for 3D extruded hexagon tiles, `THREE.BoxGeometry` for stone platform base and 9 bench slot boxes, and `THREE.BoxHelper` for slot outlines.
   - `BOARD_Z_OFFSET = 3` shifts board forward to avoid bottom UI overlap.

4. **Unit Rendering & Voxel Models (`src/view/UnitView.ts:21-120` & `src/view/VoxelModelFactory.ts:6-568`)**:
   - Quotation (`src/view/UnitView.ts:24-27`):
     ```typescript
     const validImages = ['vanguard_squire', 'archer_apprentice', 'royal_shieldbearer', 'spellscribe', 'cavalry_captain', 'high_commander'];
     const normalized = (modelName || '').toLowerCase().replace(/\s+/g, '_');
     if (validImages.includes(normalized)) { ... }
     ```
   - If `modelName` is in `validImages`, builds a flat 2D `ShapeGeometry` hexagon mesh displaying PNG artwork from `/assets/concepts/${normalized}.png`.
   - If not in `validImages`, delegates to `VoxelModelFactory.createVoxelUnit(modelName)`, creating multi-box 3D voxel models (`buildVanguardSquire`, `buildArcherApprentice`, `buildCinderDragon`, `buildRoyalShieldbearer`, `buildSpellscribe`, `buildCavalryCaptain`, `buildHighCommander`).

5. **Raycasting & Dragging (`src/view/DragControls.ts:86-133, 158-178, 180-238`)**:
   - Uses `THREE.Raycaster` to intersect `interactiveTiles` (`tileMeshes`).
   - Dragging uses ground plane `new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)`.
   - Top `#sell-zone` DOM overlay detects mouse release at `event.clientY <= 56` to sell player units.

6. **Assets (`public/assets/concepts/`)**:
   - Files present: `archer_apprentice.png`, `cavalry_captain.png`, `high_commander.png`, `royal_shieldbearer.png`, `spellscribe.png`, `vanguard_squire.png`.
   - Unit catalog (`units_catalog.json`) defines 36 total units.

---

## 2. Logic Chain

1. **Observation**: `main.ts` directly creates 3D WebGL scene objects, HUD, shop UI, sell zone, and tick loop at startup without screen state checks.
   - **Reasoning**: To support Milestone 1 (Pre-Game Lobby UI with Start Game, Settings, and Compendium views), a `ScreenManager` must wrap application startup, defaulting to `LOBBY` state and isolating gameplay UI/loops until "Start Game" is triggered.
   - **Reasoning for State Transition**: Clicking "Start Game" requires invoking `boardState.reset()`, `shopManager.reset()`, `gameLoop.reset()`, `ancientManager.reset()`, `unitView.removeAllUnits()`, and `uiOverlay.removeAllHPBars()` so starting gold (20g), level (1), HP (100), and stage/round (1-1) are completely clean.

2. **Observation**: `BoardView.ts` extruded 3D hexes and `VoxelModelFactory.ts` 3D voxel box models consume significant render geometry and clash with a flat 2D presentation style.
   - **Reasoning**: For Milestone 2 (2D Sprite & Textured Hex Grid), `BoardView` can be refactored to render flat 2D hexagon meshes with high-definition tile textures, while `UnitView` replaces 3D voxel box meshes with 2D Billboard Card Sprites (`THREE.Sprite` or camera-facing quads) containing unit art, cost border frames, and star level indicators.
   - **Reasoning for Raycasting**: Raycasting in `DragControls.ts` relies on `THREE.Raycaster.intersectObjects(interactiveTiles)`. Switching tile meshes from 3D extruded boxes to 2D flat hexagon planes on `y = 0` retains 100% raycasting precision with zero breaking changes to drag-and-drop logic.

3. **Observation**: Only 6 unit concept PNG files exist in `public/assets/concepts/`, whereas `units_catalog.json` contains 36 units.
   - **Reasoning**: A dynamic 2D canvas card texture generator can generate fallback 2D card textures on-the-fly for units without concept PNG artwork, ensuring complete coverage across all 36 units.

---

## 3. Caveats

- **No Source Code Modified**: In accordance with explorer role instructions, no source files in `PickaxeAutoChess/src/` were edited.
- **2D Asset Coverage**: 6 unit concept art PNGs exist in `public/assets/concepts/`. Implementing dynamic fallback card textures (HTML5 Canvas 2D) is recommended for the remaining 30 units in the catalog.
- **Performance Consideration**: Replacing 3D extruded hexes and voxel boxes with 2D billboard sprites and 2D flat textured hexes will significantly improve rendering performance and framerates across low-end devices.

---

## 4. Conclusion

1. **Milestone 1 (M1 - Lobby Screen)**:
   - Introduce `ScreenManager.ts` managing `LOBBY`, `SETTINGS`, `COMPENDIUM`, and `GAMEPLAY` screen states.
   - Create clean DOM views for Lobby, Settings, and Compendium.
   - Wire "Start Game" to perform a clean state reset across `BoardState`, `ShopManager`, `GameLoopManager`, `AncientManager`, `UnitView`, and `UIOverlay`.

2. **Milestone 2 (M2 - 2D Presentation & Hex Grid)**:
   - Refactor `BoardView.ts` to use flat 2D textured hexagon meshes and a 2D bench tray.
   - Refactor `UnitView.ts` to use 2D Billboard Card Sprites with star level overlays and dynamic canvas fallbacks for missing artwork.
   - Preserve `DragControls.ts` raycasting against flat 2D hex tiles.

---

## 5. Verification Method

To verify these findings independently:
1. **Inspect Target Files**:
   - `PickaxeAutoChess/src/main.ts` (lines 30-90) — verify immediate game loop boot sequence.
   - `PickaxeAutoChess/src/view/BoardView.ts` (lines 38-176) — verify extruded 3D hex geometry & stone base.
   - `PickaxeAutoChess/src/view/UnitView.ts` (lines 21-120) — verify `validImages` check and voxel fallback call.
   - `PickaxeAutoChess/src/view/VoxelModelFactory.ts` (lines 6-568) — verify 3D voxel box model construction.
   - `PickaxeAutoChess/src/view/DragControls.ts` (lines 86-133, 180-238) — verify ground plane raycasting and top sell zone logic.
2. **Project Test / Build Command**:
   - Run `npm run build` in `C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess` using PowerShell to confirm current build status.
3. **Invalidation Conditions**:
   - If `main.ts` already contains screen state switching logic, M1 state isolation is already implemented (currently false).
   - If `BoardView.ts` already uses flat 2D hexes, M2 grid work is already complete (currently false).
