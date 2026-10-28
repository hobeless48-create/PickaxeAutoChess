## 2026-07-22T10:25:12Z
You are worker_m3, an implementation worker subagent for the Pickaxe AutoChess project.

Your Working Directory: C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m3
Project Codebase Directory: C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective: Implement Milestone 3 (Complete 61-Unit Roster & Synergies Realization - R3).

Refer to the exploration findings in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_core\analysis.md` and `handoff.md`.

Detailed Tasks:
1. **61-Unit Roster Realization**:
   - Update `src/core/data/units_catalog.json` (or `units_catalog.ts` if converted) to add the missing 61st unit ("Relic Titan" / 5-cost Ancient legendary unit). Verify all 10 origins have complete unit sets totaling exactly 61 units.
   - Ensure shop distribution, shop rolls, and unit spawning support all 61 units.

2. **Reactive Synergies & Skill Realization**:
   - Update `src/core/data/SynergyManager.ts` and `src/core/combat/` / `src/core/skills/` to implement reactive synergy mechanics and abilities across all traits:
     - **Summoning**: Demonic Pit Lord summon on 3 ally deaths, Beast Tamer wolf summons at combat start, Dragon Egg hatch, Fairy Golem merge during prep phase.
     - **Resurrection**: Necropolis Undead death interception and revive with partial HP.
     - **Stacking Multipliers & Decay**: Vanguard Berserker stacking attack power, Ranger 3-second attack speed stacking, Chrono Scholar attack speed bursts, active stack decay outside combat.
     - **Overtime Multipliers**: Apply anti-heal and escalating damage scaling after 25 seconds of combat.

3. **Combat Engine & Calculations**:
   - Update `src/core/combat/CombatEngine.ts`:
     - Implement per-attack mana generation (10 mana per attack swing, defender mana gain on damage taken).
     - Ensure damage mitigation formula `mitigated = raw * (100 / (100 + DEF))`, lifesteal, damage amp, and reduction apply correctly.
     - Automate status effect duration ticks (Stun, Silence, Disarm, Plague).

4. **Verification**:
   - Run `npx tsx src/test_core.ts` (if test script exists) and `npm run build` using terminal command in `PickaxeAutoChess` to ensure zero TypeScript errors.
   - Document changes in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m3\changes.md`.
   - Write your handoff report to `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m3\handoff.md`.
   - Send a message to parent (`88435c29-740c-4875-945f-e66011cea9fd`) with build/test results and summary of changes.
