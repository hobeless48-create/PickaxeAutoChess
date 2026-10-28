# Pickaxe AutoChess Core Simulation Analysis Report

**Target Milestones**:
- Milestone 3 (M3): Complete 61-Unit Roster & Synergies Realization (R3)
- Milestone 4 (M4): Interactive Facility System (R4)

**Working Directory**: `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_core`  
**Project Directory**: `C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess`

---

## 1. Executive Summary

This report presents an exhaustive audit and architectural breakdown of the core game simulation layer (`src/core/`) of the Pickaxe AutoChess refactor codebase. The investigation evaluates state representation, catalog completeness, combat tick engine, skill execution, synergy pipelines, item management, and facility system readiness.

### Key Discoveries:
1. **Roster Definition (M3)**: `src/core/data/units_catalog.json` currently contains exactly **60 unit definitions** across 10 origins. The **61st unit** is missing—specifically, the 5-cost legendary unit for the **Ancient** faction (referenced as a missing 5-cost slot in `AncientManager.ts`).
2. **Synergy Engine (M3)**: Base synergy counting and initial stat modification pipelines exist in `SynergyManager.ts`, but advanced mechanics—including **Summoning** (Demonic Pact, Beast Tamer, Elemental Fairy, Dragon Egg), **Resurrection** (Necropolis Undead death-interception), **Stacking Multipliers** (Vanguard Berserkers, Rangers, Chrono Scholar per-tick acceleration), and **Overtime Multipliers**—are incomplete or unhandled in combat ticks.
3. **Combat Simulation & Tick Engine (M3)**: `TickManager.ts` provides a stable 20 Hz tick loop, and `CombatEngine.ts` implements a percentage-based defense mitigation formula `raw * (100 / (100 + DEF))`, damage amplification, damage reduction, and lifesteal. However, status effect duration processing (Stun, Silence, Disarm, Plague) and per-attack mana generation are not automated.
4. **Interactive Facility System (M4)**: Basic unit flags (`isFacility`, `facilityType`, `constructionRoundsRemaining`) and basic end-of-round resolution (Architect construction tick reductions, Resource payouts, and survivor-scaled destruction penalties in `GameLoopManager.ts`) exist. However, **Facility Shop integration**, **Facility catalog definitions**, **Support facility aura/pulse abilities**, and **Facility capacity management** in `ShopManager.ts` are missing.

---

## 2. Core Game Simulation Overview (`src/core/`)

The core simulation layer is organized into 11 sub-modules under `src/core/`:

```
src/core/
├── board/         # BoardState.ts, GameLoopManager.ts
├── combat/        # CombatEngine.ts
├── data/          # units_catalog.json, synergies_catalog.json, item_descriptions.json, recipes.json
├── events/        # EventBus.ts
├── fsm/           # UnitFSM.ts
├── hex/           # HexGrid.ts
├── shop/          # ShopManager.ts
├── skills/        # SkillRegistry.ts
├── stats/         # SynergyManager.ts, ModifierPipeline.ts, ItemManager.ts, AncientManager.ts
├── tick/          # TickManager.ts
└── units/         # Unit.ts, UnitFactory.ts
```

### Module Responsibilities & Flow:
- **`TickManager.ts`**: Runs 20 Hz (50 ms per tick) loop with drift correction. Emits ticks to drive state updates.
- **`UnitFSM.ts`**: Implements state transitions: `Idle` → `Searching` → `Moving`/`Attacking` → `Casting` / `Stunned` → `Dying` → `Dead`.
- **`HexGrid.ts`**: Provides flat-top hexagonal coordinate math, axial-to-cube conversion, $O(1)$ Manhattan hex distance calculation, neighbor discovery, and 2D world projection (`hexToWorld`).
- **`BoardState.ts`**: Manages hex grid placement (rows 4–7 for player), 9-slot bench, item inventory, unit lookup, 3-copy automatic star-tier upgrades (1★ → 2★ → 3★), and unit selling/movement.
- **`GameLoopManager.ts`**: Orchestrates 4 game phases (`Preparation` → `Matchmaking` → `Combat` → `Resolution`). Handles board snapshots for deterministic round resets, opponent board cloning, damage calculations to player HP, and loot drops.
- **`ModifierPipeline.ts`**: Standardizes stat calculations via flat and percentage modifiers (`HP`, `ATK`, `DEF`, `MDEF`, `AP`, `AttackSpeed`, `CritChance`, `CritDamage`, `DamageReduction`, `FinalDamage`, `Lifesteal`).

---

## 3. Detailed Data & Synergy Analysis (`src/core/data/` & `src/core/stats/`)

### 3.1 Unit Catalog Audit (Target: 61 Units)
`src/core/data/units_catalog.json` contains **60 units** divided evenly into 10 Origins (6 units per origin):

| Origin | 1-Cost | 2-Cost | 3-Cost | 4-Cost | 5-Cost | Total Units |
|---|---|---|---|---|---|---|
| **Human** | Vanguard Squire, Archer Apprentice | Royal Shieldbearer | Spellscribe | Cavalry Captain | High Commander | 6 |
| **Ancient** | Relic Squire, Tomb Raider | Ancient Scribe, Stone Protector | Runecarver | Relic Colossus | **MISSING** | **5** *(Needs 5-cost unit)* |
| **Noble** | Merchant Guard | Tax Collector | Aristocrat Duelist, Royal Alchemist | Gilded Baron | Noble Duchess | 6 |
| **Dwarven Forge** | Apprentice Blacksmith | Dwarven Cannoneer | Forge Mason, Ironbound Sentry | Shieldbreaker Berserker | Master Runesmith | 6 |
| **Demonic Pact** | Cultist Initiate | Blood Zealot | Shadow Warlock | Underworld Pitlord, Demon Summoner | Lord of Torment | 6 |
| **Magic Tower** | Tower Novice | Frost Wielder | Storm Warden, Arcane Illusionist | Battle Mage | High Archmage | 6 |
| **Sylvan Elves** | Leaf Ranger | Forest Guardian, Shrine Priestess | Wind Dancer | Elder Druid | Elf Monarch | 6 |
| **Necropolis Undead** | Crypt Skeleton | Wandering Ghost | Plague Bearer, Grave Keeper | Reaper of Souls | Lich Lord | 6 |
| **Draconic Zealots** | Fire Breeder, Cinder Hatchling | Wyvern Rider | Dragon Priest | Scale Zealot | Cinder Dragon | 6 |
| **Elemental Fairy** | Sprout Sprite, Ember Pixie | Wave Sylph | Pebble Gnome | Gale Sylph | Primordial Fairy Queen | 6 |
| **TOTAL** | **15** | **14** | **14** | **10** | **7** *(Target: 8)* | **60** |

#### Missing 61st Unit Requirement:
To reach the required 61-unit roster for Milestone 3, a **5-cost Ancient unit** (e.g. `Relic Titan` / `Ancient Overlord`) must be added to `units_catalog.json`. This completes the 5-cost pool (8 units) and fulfills the code comment in `AncientManager.ts`:
`// 2-star 5-cost... there's no 5-cost Ancient unit yet`

---

### 3.2 Trait & Synergy Realization Matrix (M3 Requirements)

The catalog defines 10 Origins and 15 Class/Combat Traits. Below is the implementation status of all synergy threshold mechanics in `SynergyManager.ts`, `CombatEngine.ts`, and `GameLoopManager.ts`:

| Trait Name | Thresholds | Current Code Implementation | Missing / Required Realization |
|---|---|---|---|
| **Human** | 3 / 5 / 7 | Level-scaling HP/ATK/AP implemented in `SynergyManager.ts`. Tier 7 grants +20% Max HP & +10% Damage Amp to Humans, +50% bonus to non-Humans. | Fully functional. |
| **Ancient** | 2 / 4 / 5 / 6 | Stack system & cashout managed via `AncientManager.ts`. Death stacks & lose-streak multipliers fully active. | Fully functional. |
| **Noble** | 3 / 6 / 9 | Gold balance amp (max 40%/100%), even-round gold (+1), 25% total gold bonus at Tier 9, interest-scaled permanent HP additions in `ShopManager.ts`. | Fully functional. |
| **Dwarven Forge** | 3 / 6 / 9 | Item effectiveness (+25%/50%/100%) and Tier 9 bonus DEF/MDEF per equipped item. Ornate Masterwork item transformation in `ItemManager.ts`. | Fully functional. |
| **Demonic Pact** | 3 / 6 / 9 | Basic stat buffs (+20%/30%/40% ATK/AP) implemented in `SynergyManager.ts`. | **Missing**: Stat sacrifice of lowest-HP Demon at start (3), summoning **Lesser Pit Lord** on 3 allied deaths (6), and 5 Player HP sacrifice for **Great Demon Lord** (9). |
| **Magic Tower** | 3 / 6 / 9 | Basic AP stat buffs implemented. | **Missing**: Caster proximity heal (10% AP) on skill cast (3), global charge pool accumulating skill casts to trigger meteor cascades (6 / 9). |
| **Sylvan Elves** | 3 / 6 / 9 | Crit Chance buffs implemented. | **Missing**: Attack dodge chance (10%/20%), crit-damage heal on lowest HP ally (6), and excess Crit Chance >100% conversion to Crit Damage (1:5 ratio) at Tier 9. |
| **Necropolis Undead** | 3 / 6 / 9 | +10% Lifesteal at Tier 6 implemented. | **Missing**: Death interception & resurrection for 1st ally as Skeleton Soldier (3), 1st & 2nd allies (6), and board-wide reanimation cycle (9). |
| **Draconic Zealots** | 3 / 5 / 7 / 9 | +15% ATK at Tier 5 implemented. | **Missing**: Golden Dragon Egg bench spawning & 4-round hatching timer (3/5), evolution to Elder Wyvern (7), and Legendary Cinder-Dragon true damage/CC immunity (9). |
| **Elemental Fairy** | 3 / 5 / 7 | Enemy attack speed slow (15%/33%) partially handled. | **Missing**: Elemental Golem unit summoning (3), prep phase adjacent Fairy merging (+20%/40% stats & passive doubling per merged Fairy) (5/7), and 5s Tidal Wave MDEF shred (7). |
| **Architect** | 2 / 4 / 6 | -1 Construction round tick (2), +1 facility capacity (4), and destruction HP penalty negation (6) implemented in `GameLoopManager.ts`. | **Missing**: Adjacent ally HP regen (3%/s at Tier 4), +40 DEF/MDEF & doubled attack rates for facilities at Tier 6. |
| **Mercenary** | 2 / 4 / 6 | +15% Damage Amp at Tier 4 implemented. | **Missing**: Bounty Box drops on win (2), prep phase free temporary high-tier shop unit (4), item component on win & +5% lifesteal per equipped item (6). |
| **Royal Guard** | 2 / 4 / 6 | Static trait present. | **Missing**: Highest-cost unit / King protection buffs, damage sharing (15%/25%), and King death enrage (+100% ATK, 33% DR). |
| **Plague Alchemist** | 2 / 4 / 6 | Basic stat present. | **Missing**: Auto-attack Plague application (1% max HP True Dmg/s, 33% anti-heal) (2), death spread (4), 33% DEF/MDEF shred & 30% damage lifesteal (6). |
| **Chrono Scholar** | 2 / 4 / 6 | Static trait present. | **Missing**: 6s stacking AS (+15%, max 3) (2), +20 start mana / 2s enemy mana delay (4), and 2.5s time freeze on emergency <20% HP (6). |
| **Gladiators** | 2 / 4 / 6 | +10% Damage Amp at Tier 2 implemented. | **Missing**: Isolated start shield (15% max HP) (2), execution at <15% HP (4), and execution at <25% HP with +50 mana refund (6). |
| **Rogues** | 2 / 4 / 6 | +15% Crit Damage at Tier 2 implemented. | **Missing**: Backline leap at combat start (2), crit DEF shred (33%) (4), and 1s stealth on crit (6). |
| **High Clerics** | 2 / 4 / 6 | Static trait present. | **Missing**: +20% incoming heal/shield boost (2), 6s holy pulse (8% max HP heal) (4), and holy pulse shield (10% max HP) (6). |
| **Cavalry Knight** | 2 / 4 | Static trait present. | **Missing**: +50% movement speed, charge attack (10% max HP physical dmg + 1 hex knockback) (2), charge 1.5s stun & 33% DEF shred (4). |
| **Beast Tamer** | 2 / 3 / 4 | Static trait present. | **Missing**: Tamed Wolf companion spawn (500 HP, 40 ATK) (2), wolf stun (0.5s) (3), second wolf spawn & +33% AS (4). |
| **Runesmith** | 2 / 4 | Static trait present. | **Missing**: Frontline start shield (15% max HP) (2), 33% basic attack damage reflection while shielded (4). |
| **Card Gamblers** | 1 / 3 | Static trait present. | **Missing**: Round-start random card draw mechanics (Wildcard, Gold Rush, Fortune). |
| **Doom Harbingers**| 2 / 4 | +10% Damage Amp at Tier 2 implemented. | **Missing**: +5% ATK on kill (2), execution at <15% HP & 33% missing HP heal (4). |
| **Vanguard Berserkers**| 3 / 5 / 7 | Dynamic hook reserved. | **Missing**: Per-tick missing HP AS scaling (+1% per 2% missing HP at T3; +1% AS & +0.5% ATK per 1% missing HP at T5), and 3s death immunity at 20% HP (7). |
| **Rangers** | 2 / 4 / 6 | +15/35/60% AS implemented in `SynergyManager.ts`. | **Missing**: +1 Hex attack range (2), 3s stacking AS (+15%/+25%) (4/6), and crit True Damage (+33%) (6). |

---

## 4. Combat Simulation & Skill Engine (`src/core/combat/` & `src/core/skills/`)

### 4.1 Damage Mitigation & Formula Integrity
In `src/core/combat/CombatEngine.ts`, damage calculation is implemented as:

$$\text{Mitigated Damage} = \text{Raw Damage} \times \left( \frac{100}{100 + \text{DEF}} \right)$$

$$\text{Final Damage} = \text{Mitigated Damage} \times (1 + \text{Attacker.DamageAmp}) \times (1 - \text{Target.DamageReduction})$$

$$\text{Lifesteal Healed} = \text{Final Damage} \times \text{Attacker.LifestealPercent}$$

- **True Damage**: Ignores DEF/MDEF and applies directly to `currentHP`.
- **Offensive Facilities**: Deal % Max HP damage (`1★ = 5%`, `2★ = 8%`, `3★ = 12%`) mitigated by target DEF.

### 4.2 Status Effects & State Engine
`src/core/fsm/UnitFSM.ts` handles unit state transitions. Currently, skills apply temporary stat modifiers or status flags (`Stun`, `Disarmed`, `ManaPause`, `ReflectDamage`) to `unit.modifiers`.

#### Gaps in Combat Tick Processing:
1. **Mana Generation**: Auto-attacks do not automatically grant mana (~10 mana per attack) nor generate mana upon taking damage ($10\% \text{ of damage taken}$).
2. **Status Effect Ticks**: Status modifiers currently rely on integer `duration` values (e.g. 30, 40, 80 frames), but there is no unified tick update loop in `CombatEngine.ts` to decrement durations, purge expired modifiers, or enforce FSM constraints (e.g. preventing movement during Stun or attack generation during Disarm).
3. **Overtime Multipliers**: There is no scaling overtime damage multiplier or healing reduction trigger when combat exceeds 25 seconds.

### 4.3 Skill Execution Engine (`src/core/skills/SkillRegistry.ts`)
`SkillRegistry.ts` contains registration functions for **all 60 current units**. Skills execute cleanly when invoked via `skillRegistry.execute(unitName, context)`.
- Skills query targets using `BoardState.findNearestEnemy`, farthest enemy searches, or board-wide filtering.
- Mana consumption and cast triggers are hooked into unit FSM states (`Casting` → `Searching`/`Attacking`).

---

## 5. Interactive Facility System Architecture (R4 Preparation)

### 5.1 Existing Core Facility Hooks
The codebase has foundational hooks for facilities:
1. **`Unit.ts`**:
   - `isFacility: boolean`
   - `facilityType?: 'Offensive' | 'Support' | 'Resource'`
   - `constructionRoundsRemaining: number`
2. **`UnitFactory.ts`**:
   - `UnitFactory.createFacility(type, id, starLevel, constructionDelay)` initializes a facility unit with high base HP (`1000 * starLevel`), 0 ATK, and 50 DEF/MDEF.
3. **`GameLoopManager.ts`**:
   - **Construction Tick**: Decrements `constructionRoundsRemaining` during `Resolution → Preparation`. Architect (2) increases decrement step from 1 to 2.
   - **Resource Payout**: At round end, active Resource facilities yield `starLevel * 2` Gold and `starLevel * 1` XP.
   - **Destruction Penalty**: If a player facility is destroyed in combat, the player takes HP damage scaled by surviving enemy count:
     - 1★: $\lfloor \text{Survivors} / 3 \rfloor \times 1 \text{ HP}$
     - 2★: $\lfloor \text{Survivors} / 3 \rfloor \times 3 \text{ HP}$
     - 3★: $\lfloor \text{Survivors} / 4 \rfloor \times 6 \text{ HP}$
     - Architect (6) completely negates this penalty ($0\text{ HP}$ damage).

### 5.2 Required Additions for M4 (R4 Interactive Facility System)

To make the Facility System fully interactive in M4, the following core data structures and mechanics must be added:

#### 1. Facility Catalog Definition (`src/core/data/facility_catalog.json`)
A structured catalog defining specific facility variants:
- **Offensive Facilities**: Ballista Tower, Arcane Cannon, Flame Cannon.
- **Support Facilities**: Healing Shrine, Armor Anvil, War Drum Tower.
- **Resource Facilities**: Mining Rig, Gold Vault, Alchemy Laboratory.
Each entry will specify: `name`, `type`, `cost`, `constructionRounds` (default 2–3), `baseStats`, and `abilitySpec`.

#### 2. Facility Shop Pool & Capacity (`src/core/shop/ShopManager.ts`)
- **Facility Roll Odds & Shop Tab**: Separate facility shop slots or dedicated facility shop rolls.
- **Facility Capacity Constraint**: Track `currentFacilities` vs `maxFacilityCapacity` (default 3, increased to 4 with Architect 4).
- **Placement Rules**: Facilities occupy hex tiles (rows 4–7) or dedicated bench/facility slots. Under-construction facilities remain in passive state (`constructionRoundsRemaining > 0`).

#### 3. Active Facility Ability Tick Pipeline
- **Offensive Facilities**: Execute periodic attacks when `constructionRoundsRemaining === 0` and state is active.
- **Support Facilities**: Emit 1-hex or board-wide aura pulses (healing 3% max HP/s with Architect 4, granting armor/shields).
- **Resource Facilities**: Execute round-end gold/XP payouts.

---

## 6. Synthesis & Recommended Implementation Roadmap

To achieve full compliance with M3 and M4 requirements, implementation should follow this phased sequence:

```
[Phase 1: Catalog & 61st Unit]
   ├── Add 5-cost Ancient unit ("Relic Titan") to units_catalog.json
   └── Update AncientManager.ts reward tables to reference 5-cost Ancient unit

[Phase 2: Complex Synergy Realization]
   ├── Implement Summoning Engine (Demonic Pact Pit Lord/Demon Lord, Beast Tamer Wolves, Dragon Egg, Fairy Golem)
   ├── Implement Death Interception & Resurrection Engine (Necropolis Undead)
   ├── Implement Dynamic Combat Ticks (Vanguard Berserkers, Rangers stacking AS, Chrono Scholar, Plague Alchemist)
   └── Add Overtime Multipliers and per-attack Mana Generation in CombatEngine.ts

[Phase 3: Interactive Facility System (R4)]
   ├── Create src/core/data/facility_catalog.json
   ├── Integrate Facility Shop rolling & facility capacity limit in ShopManager.ts
   └── Implement Support Facility active aura/pulse tick loop & Architect (4/6) combat bonuses
```

---

## 7. Verification Method & Test Commands

To verify core simulation integrity and confirm zero errors:

1. **Compilation Check**:
   ```bash
   npm run build
   ```
2. **Core Unit & Synergy Test**:
   ```bash
   npx tsx src/test_core.ts
   ```
3. **Execution Verification**:
   Ensure unit counts, catalog parsing, board state upgrades, and synergy calculations execute without TypeScript errors or unhandled runtime exceptions.
