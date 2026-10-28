# Original User Request

## 2026-07-22T10:23:05Z

Refactor Pickaxe AutoChess to use a 2D card/sprite presentation layer on a textured hex grid, implement the lobby entry page, complete the remaining unit roster/synergies, and polish the aesthetics.

Working directory: `C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess`
Integrity mode: `development`

## Requirements

### R1. Pre-Game Lobby Screen
* The game must boot to a clean, modern lobby page showing options to start the game, configure settings, or view the unit/synergy compendium.
* Clicking "Start Game" transitions the user smoothly to the gameplay board.

### R2. 2D Sprite-Based Visuals & Grid
* Replace Three.js `.glb` model loading with a 2D image/sprite layout.
* Units on the board and bench must be rendered as 2D cards or billboard sprites.
* Hex tiles on the grid must use beautiful 2D styled card/image backgrounds instead of generic 3D geometries.

### R3. Roster & Synergies Realization
* Align the simulation core to support the full list of 61 units and all origins/traits (including summoning, resurrection, and stacking multipliers) specified in the templates.

### R4. Facility Integration
* Implement the interactive Facility System: players can purchase stationary defenses/tank structures that construct over 2-3 rounds and apply unique abilities (Offensive, Support, Resource) with destruction HP penalties.

### R5. UI/UX & Premium Aesthetics
* The interface must look visually premium with smooth transitions, modern typography, glassmorphism card styling, and clean status overlays.

## Acceptance Criteria

### Game Lifecycle
- [ ] Game starts in a lobby interface, not directly in combat.
- [ ] Transitioning from lobby to gameplay keeps all states (gold, level, inventory) clean.

### Graphics & Presentation
- [ ] No 3D model GLTF loading errors; units render as 2D sprites.
- [ ] Grid hexes display textured 2D image representations.

### Systems Verification
- [ ] All 61 units can be spawned or upgraded via shop card purchases.
- [ ] Combat simulation applies correct damage mitigation formulas, lifesteal, and overtime multipliers.
- [ ] Facilities can be purchased, construct over rounds, and apply correct behaviors.
- [ ] Project compiles with `npm run build` with zero TypeScript errors.

## 2026-07-22T15:34:11Z

Implement the next phase of Pickaxe AutoChess gameplay mechanics, item passive systems, drag control enhancements, and compendium upgrades.

Working directory: `C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess`
Integrity mode: `development`

## Requirements

### R1. Starting Level & Scoreboard
* Set player starting level to 3 on game start and reset.
* Remake the right-side matchup panel to display the remaining health of both "Player (You)" and "Opponent (AI)".

### R2. Rebalanced Player Damage
* Implement the damage formula on round victory/loss: `Loser HP Lost = Winner Player Level + number of surviving units on the board`.

### R3. Completed Item Passives
* Implement custom passive triggers and status modifiers for all 36 completed item recipes (e.g. Sage's Spear basic attack mana, Guinsoo attack speed stacking, Sunfire Cape burn aura, Sterak's shield).

### R4. Facility Construction Placeholders
* Render under-construction facilities as interactive dummy/holographic placeholders that can be dragged and repositioned.
* When clicked, display an inspector overlay showing details: facility name under construction, construction stage, and remaining rounds.

### R5. Mid-Combat Blocks & Dragging Snapping
* Block equipping items onto units during Combat and Resolution phases (return item to inventory if attempted).
* Optimize `DragControls.ts` collision/snapping logic to eliminate unit lag-back issues.

### R6. UI Previews & Recalculations
* Show a floating combined item preview when dragging one component over another in the inventory.
* Trigger instant unit stat recalculations immediately upon unit combine/star upgrade so stats do not show as 0 in the inspect menu.
* Fix compendium filters to display all 25 synergies (Origins and Classes) with a dropdown/floating selector overlay to avoid UI clutter.

## Acceptance Criteria

### Mechanics & Systems
- [ ] Player starts at level 3 and resets to level 3.
- [ ] Game round loss/win damages player/AI HP based on `Winner Level + surviving units count`.
- [ ] Dragging items onto units during combat is ignored, leaving the item safely in inventory.
- [ ] Complete item recipes successfully apply their described passive effects during combat.

### UI & UX
- [ ] Matchup panel shows both players' HP and updates dynamically.
- [ ] Dragging components over each other displays a preview overlay of the resulting combined item.
- [ ] Unit description stats are populated immediately after star level upgrades.
- [ ] Compendium synergy list shows a drop-down selector and covers all 25 synergies (Origins and Classes).
- [ ] Dragging units is smooth with no random snapbacks.
- [ ] Project builds cleanly via `npm run build`.

