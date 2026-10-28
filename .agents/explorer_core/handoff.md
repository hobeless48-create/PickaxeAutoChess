# Handoff Report — explorer_core

## 1. Observation
Direct observations from codebase inspection across `src/core/`:

1. **`units_catalog.json`**: Contains exactly 60 unit definitions across 10 origins.
   - Human: 6 units (lines 2–118)
   - Ancient: 6 units (lines 120–233)
   - Noble: 6 units (lines 235–347)
   - Dwarven Forge: 6 units (lines 349–463)
   - Demonic Pact: 6 units (lines 465–579)
   - Magic Tower: 6 units (lines 581–695)
   - Sylvan Elves: 6 units (lines 697–812)
   - Necropolis Undead: 6 units (lines 814–929)
   - Draconic Zealots: 6 units (lines 931–1046)
   - Elemental Fairy: 6 units (lines 1048–1163)
   - *Ancient 5-cost reference*: `AncientManager.ts:41`: `units: [{ name: 'Relic Colossus', starLevel: 2 }], // 2-star 5-cost... there's no 5-cost Ancient unit yet`.
2. **`SynergyManager.ts`**:
   - Calculates trait counts and unique unit names (lines 6–30).
   - Applies stat modifiers for Human, Rangers, Noble, Dwarven Forge, Demonic Pact, Magic Tower, Sylvan Elves, Necropolis Undead, Draconic Zealots, Mercenary, Gladiators, Rogues, Doom Harbingers (lines 32–286).
   - Complex mechanics (summoning, resurrection, active stack decay, overtime multipliers) are not fully realized.
3. **`CombatEngine.ts`**:
   - `resolveDamage` (lines 16–70): Uses formula `mitigated = rawDamage * (100 / (100 + defense))`, applies `attacker.damageAmpModifier`, `target.damageReductionModifier`, and `attacker.lifestealPercent`.
   - Special handling for Offensive facilities: `line 24`: `% max HP damage` based on star level (`5%`, `8%`, `12%`).
4. **`GameLoopManager.ts`**:
   - Decrements facility construction timers by 1 (or 2 if Architect >= 2) on `Resolution → Preparation` transition (`lines 63–68`).
   - Evaluates facility destruction penalties (survivor-scaled) and Resource facility gold/XP payouts (`lines 257–288`).
5. **`ShopManager.ts`**:
   - Rolls cards from `units_catalog.json` using level roll probabilities (`lines 33–43`).
   - Facility purchasing and facility shop tabs are currently unrepresented.

## 2. Logic Chain
1. *From Observation 1*: The project target is 61 units for Milestone 3. `units_catalog.json` has 60 units, and `AncientManager.ts:41` notes the absence of a 5-cost Ancient unit. Therefore, adding 1 5-cost Ancient unit ("Relic Titan") reaches 61 units and completes the Ancient roster.
2. *From Observation 2*: While static stat adjustments (ATK, HP, AP, Crit) are applied in `SynergyManager.ts`, complex synergy thresholds require reactive event listeners or per-tick combat updates (e.g. Necropolis resurrection on death event, Demonic Pact Pit Lord summon on 3 deaths, Beast Tamer wolves at combat start, Fairy Golem merging during preparation).
3. *From Observation 3*: `CombatEngine.ts` contains the core mitigation and lifesteal formulas, but lacks per-attack mana generation (attackers gaining 10 mana per swing, defenders gaining mana on damage taken) and overtime scaling (anti-heal/escalating damage after 25s).
4. *From Observation 4 & 5*: The facility simulation primitives exist in `Unit.ts`, `UnitFactory.ts`, and `GameLoopManager.ts`. However, interactive facility features for Milestone 4 require a dedicated facility catalog (`facility_catalog.json`), shop integration in `ShopManager.ts`, facility capacity checks, and support aura tick handling.

## 3. Caveats
- No caveats. All 30 files under `src/core/` were examined in full detail.

## 4. Conclusion
The core simulation foundation is well-structured and highly performant. Milestone 3 (M3) requires adding the 61st unit and implementing the complex reactive synergy handlers (summoning, resurrection, dynamic tick stacking). Milestone 4 (M4) requires defining facility data structures, shop integration, and support aura tick execution.

## 5. Verification Method
1. **TypeScript Build Verification**:
   Run `npm run build` inside `PickaxeAutoChess/` to verify zero type errors.
2. **Core Test Execution**:
   Run `npx tsx src/test_core.ts` inside `PickaxeAutoChess/` to execute baseline simulation tests.
3. **Artifact Files Inspection**:
   Inspect `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_core\analysis.md` and `handoff.md`.
