# Phase 3 Bug Fixes & Improvements Plan

This plan addresses several bugs and missing features:
1. **Facility visual duplication & duplicate HP bars:** Prevent duplicate rendering and duplicate HP bars for under-construction facilities by ensuring `BOARD_UNITS_CHANGED` does not spawn duplicate meshes/HP bars.
2. **Facility combat behavior:** Prevent facilities from moving in combat. Give Offensive facilities infinite range (`99`) and target nearest enemies, while keeping Support/Resource facilities stationary in `Idle`.
3. **Disappearing Ancient units:** Change snapshot/restoration check to save all units where `faction !== 'enemy'` to ensure Ancient units and facilities are never evicted at round end.
4. **Item passives in Compendium:** Render the passive name, description, and stats dynamically from `item_descriptions.json` on the Compendium screen.
5. **Lesser Duplicator logic:** Fully implement the use of the Lesser Duplicator consumable on 1/2/3-cost bench units.

## Proposed Changes

### Core Mechanics & Snapshot Resolution

#### [MODIFY] [GameLoopManager.ts](file:///C:/Users/s0846/Desktop/Files/Pickaxe/PickaxeAutoChess/src/core/board/GameLoopManager.ts)
* Change snapshot saving and restoration checks from `unit.faction === 'player'` to `unit.faction !== 'enemy'` so that all player-owned units (including Ancient units and facilities) are correctly preserved and restored.

#### [MODIFY] [BoardState.ts](file:///C:/Users/s0846/Desktop/Files/Pickaxe/PickaxeAutoChess/src/core/board/BoardState.ts)
* In `attachInventoryItem()`, implement `Lesser Duplicator` logic: when used on a 1/2/3-cost bench unit, spawn a 1-star copy of that unit on a free bench slot and remove the duplicator from inventory.

#### [MODIFY] [main.ts](file:///C:/Users/s0846/Desktop/Files/Pickaxe/PickaxeAutoChess/src/main.ts)
* In `BOARD_UNITS_CHANGED` listener:
  * Check if the facility mesh already exists in the scene before spawning a new one to prevent duplicate holograms when repositioning.
  * Check if an HP bar already exists in the DOM for the unit before creating a new one to prevent duplicate HP bars.
* In combat tick loop:
  * Prevent units with `isFacility === true` from entering the `Moving` state.
  * Offensive facilities transition directly from `Searching` to `Attacking` using range `99` (infinite) and lock onto the nearest enemy.
  * Support and Resource facilities remain in `Idle` state during combat.

### UI & Compendium Upgrades

#### [MODIFY] [ScreenManager.ts](file:///C:/Users/s0846/Desktop/Files/Pickaxe/PickaxeAutoChess/src/view/ScreenManager.ts)
* Update the faction filter array in `renderUnitsCatalog()` to include all 10 factions: `['All', 'Human', 'Ancient', 'Noble', 'Dwarven Forge', 'Demonic Pact', 'Magic Tower', 'Sylvan Elves', 'Necropolis Undead', 'Draconic Zealots', 'Elemental Fairy']`.
* Import `item_descriptions.json` in `ScreenManager.ts`.
* In `renderItemsCatalog()`, load and display the item's passive description (`desc`) and stat benefits (`effect`) dynamically.
