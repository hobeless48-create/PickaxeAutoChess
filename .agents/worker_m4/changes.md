# Milestone 4 Code Changes - Interactive Facility System (R4)

## Summary of Modifications

### 1. Facility Data & Catalog Integration
- **`src/core/data/facility_catalog.json`**:
  - Created a catalog of stationary defense and support structures spanning 3 categories:
    - **Offensive Facilities**: Ballista Tower (6g, 2 rounds build, long-range % max HP damage), Flame Turret (8g, 3 rounds build, area fire % max HP damage).
    - **Support Facilities**: Healing Totem (6g, 2 rounds build, 2s periodic ally heal), Shield Generator (8g, 2 rounds build, DEF/MDEF + shield aura), Command Post (10g, 3 rounds build, ATK/AP boost aura).
    - **Resource Facilities**: Gold Mine (6g, 2 rounds build, gold payout), Alchemy Lab (8g, 3 rounds build, gold & XP payout).
- **`src/core/units/Unit.ts`**:
  - Added `facilityName` and `totalConstructionRounds` properties for facility metadata and progress tracking.
- **`src/core/units/UnitFactory.ts`**:
  - Added `FacilityCatalogEntry` interface and `getFacilityCatalog()` getter.
  - Implemented `createFacilityFromCatalog(name, id, starLevel)` to build fully configured facility units.
  - Updated `createFacility(type, id, starLevel, constructionDelay)` with catalog fallbacks.

### 2. Facility Construction & Round Cycle
- **`src/core/board/GameLoopManager.ts`**:
  - Maintained round cycle construction decrement logic on `Resolution -> Preparation` transition, applying Architect (2) double-decrement speedup (`-2 rounds`).
  - Updated round resolution to evaluate resource payouts for completed facilities (`constructionRoundsRemaining === 0`).
- **`src/core/combat/CombatEngine.ts`**:
  - Added under-construction inert check (`att.constructionRoundsRemaining > 0`) in `resolveDamage` to ensure unbuilt facilities cannot attack.
  - Implemented `processFacilityCombatTicks` to execute periodic heals (Healing Totem), defense/shield auras (Shield Generator), attack/AP boosts (Command Post), and Architect (4/6) combat bonuses.

### 3. Facility Purchasing & Shop Integration
- **`src/core/shop/ShopManager.ts`**:
  - Added `currentFacilityShop` pool (3 facility card choices).
  - Implemented `rollFacilityShop()`.
  - Implemented `getFacilityCapacityLimit(boardState)` (base limit 3, increased to 4 with Architect 4 synergy).
  - Implemented `getPlayerFacilityCount(boardState)` and `canBuyFacility(boardState)`.
  - Implemented `buyFacility(index, boardState)` enforcing gold costs, facility placement on valid board hexes (rows 4-7) or bench, and capacity limit enforcement.
- **`src/view/ShopUI.ts`**:
  - Integrated Shop sub-header mode toggle tabs: `⚔️ Hero Shop` vs `🏰 Facility Shop (Cap: X/3)`.
  - Implemented 2D facility shop card rendering with category color coding, construction round badges (`🏗️ 2 rounds`), facility icons, descriptions, and purchase event bindings.

### 4. Destruction HP Penalties
- **`src/core/board/GameLoopManager.ts`**:
  - Refactored `resolveRound()` to calculate player HP penalties on round defeat scaled by surviving enemy count (`enemySurvivors`):
    - 1★ Facility: `Math.floor(enemySurvivors / 3) * 1` HP
    - 2★ Facility: `Math.floor(enemySurvivors / 3) * 3` HP
    - 3★ Facility: `Math.floor(enemySurvivors / 4) * 6` HP
  - Architect (6) synergy completely negates facility destruction penalties (`penalty = 0`).

### 5. 2D Presentation & Visual Overlay
- **`src/view/UnitView.ts`**:
  - Updated dynamic 2D canvas texture generator (`getOrCreateCardTexture`) to support facility category colors, `Architect (Facility)` badges, and centered facility icons (🏹, 🔥, 💚, 🛡️, 🚩, ⛏️, 🧪).
- **`src/view/UIOverlay.ts`**:
  - Updated `updateHPBar` to render visual status badges (`🏗️ 1/2 rounds`) above under-construction facilities, hiding them automatically upon construction completion.

### 6. Core Engine Verification
- **`src/test_core.ts`**:
  - Added Section 7 Facility System tests covering facility catalog loading, facility unit creation, shop rolling, facility capacity limit enforcement, support aura healing ticks, and destruction penalty calculations.
