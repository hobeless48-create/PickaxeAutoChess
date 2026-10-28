## 2026-07-22T10:28:55Z
You are worker_m4, an implementation worker subagent for the Pickaxe AutoChess project.

Your Working Directory: C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m4
Project Codebase Directory: C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective: Implement Milestone 4 (Interactive Facility System - R4).

Refer to the exploration findings in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_core\analysis.md` and `handoff.md`.

Detailed Tasks:
1. **Facility Data & Catalog Integration**:
   - Create `facility_catalog.json` (or typescript definitions under `src/core/data/`) containing stationary defense and support structures across 3 categories:
     - **Offensive Facilities**: Ballista Tower, Flame Turret (high HP, range attacks, percent max HP damage).
     - **Support Facilities**: Healing Totem, Shield Generator, Command Post (auras applying ATK/DEF/shield/regen ticks during combat).
     - **Resource Facilities**: Gold Mine, Alchemy Lab (granting gold/XP bonus payouts at round end resolution).

2. **Facility Construction & Round Cycle**:
   - Implement construction counters: facilities take 2-3 rounds to build (`constructionRoundsRemaining: 2` or `3`).
   - Wire `GameLoopManager.ts` to decrement construction timers on `Resolution -> Preparation` transition (Architect synergy speeds up construction). Under-construction facilities remain inert/non-attacking until construction reaches 0.

3. **Facility Purchasing & Shop Integration**:
   - Integrate facility purchasing tab/panel in `ShopUI.ts` and `ShopManager.ts`.
   - Allow players to roll and purchase facilities, enforce facility placement on valid board hexes, and manage player facility capacity limits.

4. **Destruction HP Penalties**:
   - Implement destruction HP penalty logic: when player facilities are destroyed during combat, calculate survivor-scaled player HP deduction on round loss in `GameLoopManager.ts`.

5. **2D Presentation & Visual Overlay**:
   - Update `UnitView.ts` and `UIOverlay.ts` to render 2D billboard card sprites / icons for facilities with clear construction status badges (`🏗️ 1/3 rounds`) and HP bars.

6. **Verification**:
   - Run `npx tsx src/test_core.ts` (adding tests for facility purchasing/construction) and `npm run build` using terminal command in `PickaxeAutoChess` to ensure zero TypeScript errors.
   - Document changes in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m4\changes.md`.
   - Write your handoff report to `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m4\handoff.md`.
   - Send a message to parent (`88435c29-740c-4875-945f-e66011cea9fd`) with build status and summary of changes.
