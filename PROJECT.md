# Project: Pickaxe AutoChess Refactor

## Architecture
Pickaxe AutoChess is a Web-based auto-battler built with TypeScript and Vite.
- Core Simulation (`src/core/`): Pure logic handling state machine (FSM), hex grid logic, unit stats/skills/traits, shop generation, combat ticks, and facility systems.
- Presentation View Layer (`src/view/`): Rendering layer for board, hex grid, unit sprites/cards, drag controls, UI overlays, and particle effects.
- User Interface (`src/view/` / DOM overlays): Modern glassmorphism UI for Lobby, Shop, Unit Inspect, Compendium, Facility Management, and Game Over/Victory overlays.

## Code Layout
- `src/main.ts`: Application entry point, state initialization, game loop, lobby-to-combat FSM bridge.
- `src/core/`:
  - `board/`: Hex board, tile grid, unit placement, bench management.
  - `combat/`: Combat simulation engine, tick manager, damage formulas, mitigation, lifesteal, overtime multipliers, summoning/resurrection logic.
  - `data/`: Unit definitions, 61-unit roster, origin/class trait definitions, facility definitions.
  - `fsm/`: Game state machine (Lobby, Planning, Combat, Results).
  - `hex/`: Hexagon coordinate math and pathfinding.
  - `shop/`: Shop pool, roll odds, tier distribution, facility shop.
  - `skills/`: Unit skill execution engine, area-of-effect, status effects, stacking multipliers.
  - `stats/`: Unit stat calculation, trait bonuses, item bonuses.
  - `units/`: Unit entity representation, inventory, star levels.
- `src/view/`:
  - `SceneManager.ts`: Main scene canvas manager (2D/3D presentation layer).
  - `BoardView.ts`: Hex grid rendering (textured 2D card/tiles).
  - `UnitView.ts`: 2D card / billboard sprite rendering for board and bench units.
  - `DragControls.ts`: User drag-and-drop interaction for units and facilities.
  - `ShopUI.ts`: Shop overlay UI, card purchasing, facility purchasing.
  - `UnitInspectUI.ts`: Unit detail modal and compendium viewer.
  - `UIOverlay.ts`: Lobby UI, top bar (gold, level, round), combat status, settings.

## Milestones

| # | Name | Scope & Deliverables | Dependencies | Status |
|---|------|----------------------|--------------|--------|
| 1 | M1: Pre-Game Lobby Screen | Boot to clean modern lobby page (Start Game, Settings, Compendium). State cleanliness on transition. | None | DONE |
| 2 | M2: 2D Sprite Presentation Layer & Hex Grid | Replace 3D GLTF model rendering with 2D card/sprite presentation. Textured 2D hex tiles. | None | DONE |
| 3 | M3: 61-Unit Roster & Synergies Realization | Complete 61-unit definitions, all origins/traits, summoning, resurrection, damage formulas, lifesteal. | None | DONE |
| 4 | M4: Interactive Facility System | Facility purchase, 2-3 round construction cycle, abilities (Offensive, Support, Resource), destruction HP penalty. | M3 | DONE |
| 5 | M5: UI/UX Polish & Build Verification | Glassmorphism aesthetics, smooth transitions, status overlays, zero TypeScript errors on `npm run build`. | M1, M2, M3, M4 | DONE |
| 6 | M6: Starting Level 3, HP Scoreboard & Rebalanced Damage | Player starting level 3, reset level 3, matchup panel displays Player & AI HP, damage formula: Winner Level + surviving units. | M5 | DONE |
| 7 | M7: 36 Completed Item Passives, Combat Block & Combine Preview | All 36 item passives/triggers/modifiers, block combat item equips, floating inventory combine preview overlay. | M5 | DONE |
| 8 | M8: Construction Placeholders, Drag Snapping, Stat Recalc & Synergies Dropdown | Interactive holographic facility placeholders with inspector, drag snapping fix, instant star stat recalc, 25 synergies selector. | M5 | DONE |
| 9 | M9: Integration Polish, Build Verification & Audit | E2E integration verification, clean build (`npm run build`), review, challenger & forensic audit. | M6, M7, M8 | DONE |


## Interface Contracts
- **Lobby ↔ FSM**: `GameFSM.transitionTo(GameState.PLANNING)` on "Start Game". State (gold, level, inventory) reset or initialized cleanly at level 3.
- **BoardView ↔ Core Board**: `BoardView.render(boardState)` updates 2D textured hex grid, unit sprites, and holographic construction placeholders based on core hex coordinates.
- **Unit ↔ Skill/Trait/Item System**: `UnitEntity` triggers skills, trait passives, and completed item passives (triggers, status modifiers) registered in core combat tick. Instant stat recalc on star upgrade/combine.
- **Facility ↔ Board/Combat**: Facilities occupy hex tiles, show holographic drag placeholders during construction with detail inspection overlay, advance construction counters each round, activate unique abilities, and subtract player HP on destruction.

