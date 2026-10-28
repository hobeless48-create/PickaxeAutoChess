# Project Progress Tracker - Pickaxe AutoChess

This file is a persistent record of the project state to allow seamless handoffs across session limits and model boundaries.

## Completed Milestones
- **M1: Pre-Game Lobby Screen:** Integrated lobby state machine with custom settings and compendium views.
- **M2: 2D Sprite Presentation & Hex Grid:** Swapped Three.js 3D GLTF loaders for high-performance 2D Canvas-generated card sprites and textured hex tiles.
- **M3: 61-Unit Roster & Synergies:** Fully defined all 61 units and their class/origin passive behaviors.
- **M4: Interactive Facility System:** Added purchasable structures, placement checks, active support/offensive/resource behaviors, and destruction penalties.
- **M5: Refactoring Cleanliness:** Decoupled skill casting into `SkillRegistry.ts`. The project compiles cleanly with `npm run build`.
- **Phase 2 Complete:** Level 3 starting, opponent HP scoreboard, survivors damage calculation, 36 completed item passives, item combine previews, immediate star upgrades, and smooth drag snapped controls.

## Active Goals (Phase 3 Bug Fixes & Improvements)
1. **Facility Duplication Fixes:** Resolve facility hologram duplication and duplicate HP bars during placement or post-construction ticks.
2. **Infinite Attack Range Facilities:** Restrict facilities from moving. Offensive facilities target nearest targets with infinite range (`99`) standing still; Support/Resource remain in `Idle`.
3. **Ancient Disappear Bug:** Save all player units (`faction !== 'enemy'`) in snapshots so Ancient units and facilities are never cleared on combat transition.
4. **Compendium Item Passives:** Display detailed passive text from `item_descriptions.json` on the compendium cards.
5. **Lesser Duplicator:** Fully implement duplication functionality on 1/2/3-cost bench units.
