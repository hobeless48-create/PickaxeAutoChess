# UI & Presentation Layer Analysis Report

**Project**: Pickaxe AutoChess Refactor  
**Agent**: explorer_ui  
**Working Directory**: `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_ui`  
**Target Codebase**: `C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess`  
**Date**: 2026-07-22  

---

## Executive Summary

This report presents a thorough analysis of the UI and presentation layer of **Pickaxe AutoChess** to prepare for two core refactoring milestones:
1. **Milestone 1 (M1) — Pre-Game Lobby Screen (R1)**: Modern Pre-Game Lobby with "Start Game", "Settings", and "Compendium" views, establishing a clean view state machine and isolated state transitions for player resources (gold, level, inventory, HP, stage/round).
2. **Milestone 2 (M2) — 2D Sprite Presentation Layer & Textured Hex Grid (R2)**: Transitioning from the current hybrid 3D extruded hexes and 3D voxel box models to a crisp, high-performance 2D card/sprite presentation layer on a textured 2D hex grid with 2D billboard card sprites, tile highlights, and smooth drag-and-drop raycasting.

---

## 1. Current Codebase & Architecture Overview

### 1.1 Application Boot Sequence (`src/main.ts`)
Currently, `src/main.ts` immediately instantiates all core game managers, 3D render objects, and UI overlays on window load:
- **Rendering**: `SceneManager(appDiv)` creates a Three.js WebGL renderer, perspective camera, ambient & directional lighting, arena backdrop geometry (stone walls, blossom trees, blossom particle drift), and `EffectComposer` with `BloomEffect`.
- **Board View**: `BoardView(sceneManager.getScene())` builds 56 3D extruded hexagon tiles (`ExtrudeGeometry`), stone base platform, dividing plank, and 9 bench slot boxes (`BoxGeometry`).
- **Units & Visuals**: `UnitView` spawns unit visual representations, either as flat 2D hexagon tokens (`validImages` = `vanguard_squire`, `archer_apprentice`, `royal_shieldbearer`, `spellscribe`, `cavalry_captain`, `high_commander`) or 3D multi-box voxel models via `VoxelModelFactory`.
- **Core Managers**: Instantiates `BoardState`, `ShopManager`, `GameLoopManager`, `AncientManager`.
- **UI Panels**:
  - `ShopUI(appDiv, shopManager, boardState)` creates HUD header (`#game-hud`), tabbed left panel (`#left-tabbed-panel`), matchup panel, shop deck popup (`#shop-deck`), floating shop button (`#shop-toggle-btn`), and floating tooltips.
  - `DragControls` appends top `#sell-zone` DOM overlay and handles 3D raycasting.
  - `UnitInspectUI` appends right-side unit inspection panel.
- **Game Loops**: Starts a 20Hz `TickManager` deterministic combat loop and Three.js `requestAnimationFrame` render loop.

### 1.2 Identified Architectural Limitation
The application currently lacks a **Screen State Machine**. There is no separation between menu/lobby state and active gameplay state. Upon loading `index.html`, all UI elements, 3D WebGL rendering, and core state loops initialize synchronously into the battle board state.

---

## 2. Milestone 1 (M1): Pre-Game Lobby UI & State Architecture

### 2.1 View State Machine Design
To support M1, we introduce a top-level **`ScreenManager`** (or `UIManager`) with screen states:
- `LOBBY`: Pre-Game Lobby UI (Default screen on boot).
- `SETTINGS`: Settings Modal/View (Audio, graphics quality, game toggles).
- `COMPENDIUM`: Compendium View (Unit catalog, traits/synergies index, item recipes & base stats).
- `GAMEPLAY`: Active AutoChess game board state.

```
                  ┌──────────────┐
                  │    BOOT      │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    LOBBY     │
                  └──────┬───────┘
     ┌───────────────────┼───────────────────┐
     ▼                   ▼                   ▼
┌──────────┐       ┌───────────┐       ┌──────────┐
│ SETTINGS │       │COMPENDIUM │       │ GAMEPLAY │
└──────────┘       └───────────┘       └──────────┘
```

### 2.2 Pre-Game Lobby Screen UI Layout (R1)
The Lobby screen should feature a sleek, modern esports aesthetic (dark glassmorphism, glowing gold accents, animated ambient background):
1. **Header / Title Bar**: Pickaxe AutoChess title logo, version badge, player profile preview.
2. **Main Navigation Cards / Buttons**:
   - **⚔️ START GAME**: Large primary call-to-action button to initiate match.
   - **📖 COMPENDIUM**: Opens compendium browser (Units, Synergies, Item Recipes).
   - **⚙️ SETTINGS**: Opens settings modal (Audio, Visual Quality, Keybindings).
3. **Background Presentation**:
   - Option A: Ambient Three.js 3D camera pan over the cherry blossom arena (running `SceneManager` in low-intensity ambient background mode).
   - Option B: Stylized 2D CSS background with particle effects.

### 2.3 Compendium View Structure
The Compendium allows players to inspect all game content outside of active matches:
- **Units Tab**: Grid of unit cards (36 total catalog units). Filters by Faction, Cost (1g - 5g), and Traits. Clicking a card displays skill details, base stats (HP, ATK, DEF, MDEF, AS, Mana), and artwork.
- **Synergies Tab**: All 14 traits/synergies catalog (e.g. Royal Guard, Chrono Scholar, Runesmith, Mercenary) detailing tier thresholds and stat bonuses.
- **Item Recipes Tab**: Matrix of basic components (Blunt Sword, Bow, Chestplate) and completed item recipes + stats.

### 2.4 Clean Gameplay Board State Transition Protocol
When the user clicks **"Start Game"**, the application must transition cleanly from `LOBBY` to `GAMEPLAY`:
1. **DOM Visibility Management**:
   - Hide Lobby container (`display: none`).
   - Unhide Gameplay UI elements (`#game-hud`, `#left-tabbed-panel`, `#shop-toggle-btn`, `#sell-zone`).
2. **Core Logic State Reset**:
   - `boardState.reset()`: Purges player/enemy units, bench slots, snapshots, and item inventory.
   - `shopManager.reset()`: Resets gold to starting value (20g), level to 1, XP to 0, rolls initial shop choices.
   - `gameLoop.reset()`: Resets player HP to 100, stage to 1, round to 1, phase to `'Preparation'`, timer to 30s.
   - `ancientManager.reset()`: Resets Ancient stack counter and chest availability.
3. **Visual View Reset**:
   - `unitView.removeAllUnits()`: Removes all active unit meshes/sprites from Three.js scene.
   - `uiOverlay.removeAllHPBars()`: Clears all floating HTML HP/mana bar wrappers.
4. **Tick & Render Loop Activation**:
   - Start `TickManager` 20Hz loop.
   - Re-enable `DragControls` event listeners.

---

## 3. Milestone 2 (M2): 2D Sprite & Textured Hex Grid Presentation Layer

### 3.1 Replacing 3D Extruded Geometry & Voxel Models
Currently:
- `BoardView.ts` uses `THREE.ExtrudeGeometry` for 3D hex tiles, `THREE.BoxGeometry` for stone platform base and bench slots, and `THREE.BoxHelper` for bench borders.
- `UnitView.ts` & `VoxelModelFactory.ts` construct multi-box 3D voxel models when unit images are missing.

**Refactored 2D Presentation Architecture**:
1. **Textured 2D Hex Grid**:
   - Replace 3D extruded tiles with flat 2D Hexagon meshes (`THREE.MeshStandardMaterial` or `MeshBasicMaterial` using flat `ShapeGeometry` or `PlaneGeometry`).
   - Apply high-definition 2D textures to tiles:
     - Player Hex Tiles (Teal/Blue textured hexes).
     - Enemy Hex Tiles (Crimson/Red textured hexes).
     - Hover & Dragover highlight textures/glow borders (`#38bdf8` cyan glow for valid hexes).
   - Replace 3D bench boxes with a flat 2D Bench Tray mesh with 9 styled slot textures.
2. **2D Billboard Card / Sprite Unit Presentation Layer**:
   - Instead of 3D voxel box models, units are rendered as **2D Card Sprites** (`THREE.Sprite` or `THREE.Mesh` plane facing camera):
     - **Card Front**: High-res concept art portrait (`/assets/concepts/${unit_name}.png`).
     - **Cost Frame Border**: Color-coded border matching unit cost (1g Grey, 2g Green, 3g Blue, 4g Purple, 5g Gold).
     - **Star Level Display**: Floating star indicators (★1, ★2, ★3).
     - **Status / Health Bar Integration**: Clean 2D overhead HP/Mana bar synced to screen coordinates via `UIOverlay`.
   - **Micro-Animations for 2D Cards**:
     - *Idle*: Gentle vertical floating bob (`Math.sin(t * 3.0) * 0.05`) + subtle scale breathing.
     - *Walk/Move*: Smooth position interpolation (`lerp`) with a gentle tilt toward movement direction.
     - *Attack/Skill*: Brief scale pop + forward lunge (`lungeFactor * 0.4`), spawning spark/ring particles via `ParticleSystem`.
     - *Die*: Scale shrink down to 0 + fade opacity to 0 over 0.5s.

### 3.2 Asset Path Verification & Dynamic Card Generation
- **Existing Concept Art Images** (`public/assets/concepts/`):
  - `archer_apprentice.png`
  - `cavalry_captain.png`
  - `high_commander.png`
  - `royal_shieldbearer.png`
  - `spellscribe.png`
  - `vanguard_squire.png`
- **Dynamic 2D Card Fallback Generator**:
  - The unit catalog (`units_catalog.json`) contains 36 unique units across 6 factions (Human, Ancient, Noble, Dwarven Forge, Demonic Pact, Magic Tower, Sylvan Elves).
  - For units without explicit concept PNG artwork, a **Dynamic 2D Canvas Card Generator** can generate a crisp 2D card texture in memory on-the-fly:
    - Background gradient based on Faction color.
    - Faction/Trait icon symbol centered.
    - Unit name text and cost badge overlay.
    - Clean border matching unit cost.

### 3.3 Raycasting, Drag & Drop (`DragControls.ts`), and Tile Highlighting
- **Raycasting Integrity**:
  - `DragControls.ts` uses `THREE.Raycaster` to intersect `interactiveTiles` (`tileMeshes`).
  - Switching hex tiles from 3D extruded geometry to flat 2D textured hexagon shapes on `y = 0` maintains 100% raycasting precision.
  - The flat dragging plane `plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)` tracks mouse movements across world coordinates `(x, 0, z)`.
- **Tile Highlighting**:
  - When dragging a unit, `DragControls` can highlight valid hexes under cursor by updating tile emissive intensity or overlaying a 2D glow ring mesh.
- **Sell Zone**:
  - `#sell-zone` top overlay handles unit selling (`event.clientY <= 56`), refunding gold based on star level and selling cost.

---

## 4. File-by-File Summary & Impact Matrix

| File Path | Current Role | M1 / M2 Proposed Refactoring Role |
|---|---|---|
| `index.html` | Entry html `<div id="app">` | Add modal containers or maintain clean `#app` root for `ScreenManager` |
| `src/style.css` | Basic full-bleed CSS resets | Add Lobby, Settings, Compendium, and Card UI CSS styles |
| `src/main.ts` | Immediate boot into game state | Delegates boot to `ScreenManager`, initializes `LOBBY` state first |
| `src/view/SceneManager.ts` | 3D WebGL renderer, lights, bloom | Supports ambient background mode for Lobby + 2D presentation mode |
| `src/view/BoardView.ts` | 3D extruded hexes & platform | Renders textured 2D flat hex grid & 2D bench tray |
| `src/view/UnitView.ts` | Spawns flat tokens or voxels | Manages 2D billboard card sprites, animations, and star indicators |
| `src/view/VoxelModelFactory.ts` | Builds 3D multi-box voxel models | Replaced by 2D Billboard Card / Dynamic 2D Card Texture Generator |
| `src/view/DragControls.ts` | Raycasting & unit dragging | Intersects 2D flat hex tiles, handles drag highlights & sell zone |
| `src/view/ShopUI.ts` | HUD header, shop deck, tabs | Shown only in `GAMEPLAY` screen state; updated shop cards UI |
| `src/view/UIOverlay.ts` | Floating HTML HP/Mana bars | Positions HP/Mana bars over 2D card sprites |
| `src/view/UnitInspectUI.ts` | Right-side unit inspector | Shows 2D unit card art, skill descriptions, 10 base stats |
| `src/view/ParticleSystem.ts` | Sparks and skill rings | Retained for 2D combat VFX (sparks, attack impact, skill rings) |
| `src/view/EventBridge.ts` | Bus listeners to view triggers | Triggers 2D card animations and particle spawn on bus events |

---

## 5. Implementation Roadmap Recommendation

1. **Phase 1 (M1 Preparation)**:
   - Implement `ScreenManager.ts` to manage `LOBBY`, `SETTINGS`, `COMPENDIUM`, and `GAMEPLAY` screen states.
   - Build `LobbyView.ts`, `SettingsView.ts`, and `CompendiumView.ts` HTML/CSS UI components.
   - Wire "Start Game" button to clean `resetGame()` sequence and transition to `GAMEPLAY`.
2. **Phase 2 (M2 2D Presentation Layer)**:
   - Update `BoardView.ts` to render 2D textured flat hex tiles and 2D bench tray.
   - Deprecate 3D voxel models in `UnitView.ts` in favor of 2D Billboard Card Sprites.
   - Add dynamic 2D canvas card generator for units lacking dedicated concept art PNGs.
   - Add hover and dragover tile highlight indicators to `DragControls.ts`.

---
*Report compiled by explorer_ui.*
