## 2026-07-22T10:25:12Z
Objective: Implement Milestone 1 (Pre-Game Lobby Screen - R1) and Milestone 2 (2D Sprite Presentation Layer & Textured Hex Grid - R2).

Refer to the exploration findings in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_ui\analysis.md` and `handoff.md`.

Detailed Tasks:
1. **Milestone 1 (Lobby Screen & State Architecture)**:
   - Implement `ScreenManager.ts` under `src/view/` to handle screen states (`LOBBY`, `SETTINGS`, `COMPENDIUM`, `GAMEPLAY`).
   - Modify `src/main.ts` and HTML/CSS overlay components (`UIOverlay.ts`, `UnitInspectUI.ts`, `style.css`) to boot into a clean, modern pre-game lobby with "Start Game", "Settings", and "Compendium" options.
   - Implement the Compendium view to browse units, traits, and item recipes.
   - Ensure clicking "Start Game" transitions smoothly into gameplay and resets all state cleanly (`BoardState`, `ShopManager`, `GameLoopManager`, `AncientManager`, `UnitView`, `UIOverlay`).

2. **Milestone 2 (2D Sprite Presentation Layer & Textured Hex Grid)**:
   - Refactor `src/view/BoardView.ts` to replace 3D extruded hexagon geometries and stone platform boxes with flat 2D textured hexagon meshes on `y=0` and a 2D bench tray.
   - Refactor `src/view/UnitView.ts` and `src/view/VoxelModelFactory.ts` to render 2D billboard card sprites (`THREE.Sprite` or flat quads) for all units on board and bench. Display unit artwork, cost border colors, star level indicators, and HP/status bars.
   - Implement a dynamic 2D canvas texture fallback generator in `UnitView.ts` so all 61 units (including those without pre-rendered PNG artwork in `public/assets/concepts/`) render crisp, beautiful 2D unit card sprites.
   - Ensure `src/view/DragControls.ts` ground plane raycasting (`THREE.Raycaster`) works flawlessly with the 2D hex grid tiles on `y=0`.

3. **Verification**:
   - Run `npm run build` using terminal command in `PickaxeAutoChess` to ensure zero TypeScript errors.
   - Document changes in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m1_m2\changes.md`.
   - Write your handoff report to `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m1_m2\handoff.md`.
   - Send a message to parent (`88435c29-740c-4875-945f-e66011cea9fd`) with build status and summary of changes.
