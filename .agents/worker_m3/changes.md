# Milestone 3 Implementation Changes — worker_m3

## Summary of Changes

### 1. 61-Unit Roster Realization
- **`src/core/data/units_catalog.json`**:
  - Added the missing 61st unit: `"Relic Titan"` (5-cost Ancient legendary unit, Runesmith / Architect traits, 1200 HP, 95 ATK, 60 DEF, 50 MDEF, skill: `"Titan's Judgment"`).
  - Confirmed exactly 61 units total across all 10 origins (6 units in 9 origins + 7 units in Ancient origin including 5-cost Relic Titan).
- **`src/core/skills/SkillRegistry.ts`**:
  - Registered execution handler for `"Relic Titan"` skill `"Titan's Judgment"` (300%/450%/750% ATK physical damage AoE, 300/500/900 HP shield, 2s stun).
- **`src/core/stats/AncientManager.ts`**:
  - Updated 5-cost Ancient unit reward in `CHEST_TIERS` (Primordial Ark) from placeholder to `"Relic Titan"`.
- **`src/core/shop/ShopManager.ts`**:
  - Automatically loads full 61-unit catalog, supporting rolling and purchasing of 5-cost Relic Titan.

### 2. Reactive Synergies & Skill Realization
- **`src/core/stats/SynergyManager.ts`**:
  - Implemented `handleCombatStart()`:
    - **Demonic Pact (3)**: Sacrifices lowest-HP Demon at combat start to transfer +20% ATK & AP to all living Demons.
    - **Beast Tamer (2/3/4)**: Summons 1 or 2 Tamed Wolf companions (500/750 HP, 40 ATK, on-hit stun, +33% AS at T4).
    - **Elemental Fairy (3/5/7)**: Summons Elemental Golem (1200 HP, 40 ATK) and applies enemy AS slow (15%/33%).
    - **Chrono Scholar (4)**: Grants +20 starting mana to allies and delays enemy mana regen by 2s (40 ticks).
    - **Runesmith (2/4)**: Grants 15% Max HP frontline shield (+33% reflect at T4).
    - **Gladiators (2)**: Grants 15% Max HP shield if no adjacent allies at combat start.
  - Implemented `handleUnitDeath()`:
    - **Demonic Pact (6)**: Summons Lesser Pit Lord (1000 HP, 80 ATK) upon 3 allied deaths.
    - **Necropolis Undead (3/6/9)**: Intercepts ally death and resurrects units (1st ally at T3, 1st & 2nd at T6, board-wide reanimation cycle at T9).
  - Implemented `handleCombatTick()`:
    - **Vanguard Berserkers (3/5/7)**: Dynamic missing HP AS & ATK scaling (+1% AS per 2% missing HP at T3; +1% AS & +0.5% ATK per 1% missing HP at T5; 3s Death Immunity at 20% HP at T7).
    - **Rangers (4/6)**: Every 3s (60 ticks), adds +15% (T4) or +25% (T6) AS stack (up to 5 stacks).
    - **Chrono Scholar (2/6)**: Every 6s (120 ticks), adds +15% AS stack (up to 3 stacks); emergency 2.5s time freeze stun at <20% HP (T6).
    - **Elemental Fairy (7)**: Every 5s (100 ticks), triggers Tidal Wave dealing 150 Magic Damage & 33% MDEF shred.
    - **Overtime Multipliers (after 25s / 500 ticks)**: Applies 50% anti-heal and +10% Damage Amplification per second to all units.
  - Implemented `handlePreparationPhase()`:
    - Resets temporary combat stacks and flags outside combat.
    - **Demonic Pact (9)**: Sacrifices 5 Player HP for Great Demon Lord (1500 HP, 120 ATK) on bench.
    - **Draconic Zealots (3/5/7/9)**: Spawns Golden Dragon Egg, increments hatch charges (+1/+2 per round), hatches after 4 rounds into Cinder Hatchling, Wyvern Rider, or Cinder Dragon.
    - **Elemental Fairy (5/7)**: Merges adjacent Fairy units into Elemental Golem during prep phase (+20%/+40% base stats per merged Fairy).

### 3. Combat Engine & Calculations
- **`src/core/combat/CombatEngine.ts`**:
  - Implemented defense mitigation formula `mitigated = raw * (100 / (100 + DEF))` in `resolveDamage`.
  - Added defender mana gain on damage taken (10% of post-mitigation damage, max 20 mana per hit).
  - Added Vanguard Berserker 7 `DeathImmunity` check preventing HP from dropping below 1 during immunity window.
  - Added Anti-Heal lifesteal scaling.
  - Added `processUnitStatusTicks()` to automatically decrement modifier durations, apply Plague 1% max HP true damage/s, and purge expired status effects (Stun, Silence, Disarm, Plague).
- **`src/main.ts`**:
  - Updated basic attack mana generation to 10 mana per swing.
  - Integrated `SynergyManager` reactive hooks for phase changes, combat start, combat ticks, preparation phase, and unit deaths.
  - Integrated `processUnitStatusTicks()` in main combat tick loop.

### 4. Verification Suite
- **`src/test_core.ts`**:
  - Added test assertions for 61-unit roster audit, Relic Titan instantiation, defender mana gain on damage taken, and status effect duration ticks.
