## 2026-07-22T15:36:16Z
<USER_REQUEST>
You are a Worker subagent for Pickaxe AutoChess Phase 2 requirements (Milestone M8).

Working Directory: C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m8
Project Path: C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess

Read `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_phase2\handoff.md` and `C:\Users\s0846\Desktop\Files\Pickaxe\PROJECT.md` for full context and specifications.

Your tasks (M8):
1. **Under-Construction Facility Holographic Placeholders (R4)**:
   - In `src/view/UnitView.ts`, when rendering a facility with `constructionRoundsRemaining > 0`, apply semi-transparent holographic styling (`opacity: 0.5`, cyan/amber tinted border or glow styling).

2. **Facility Construction Inspector Overlay (R4)**:
   - In `src/view/UnitInspectUI.ts`, when an under-construction facility is clicked/inspected, render a dedicated overlay showing facility details: Facility Name under construction, Construction Stage (e.g. Stage 1/3), and Remaining Rounds counter (`X/Y rounds remaining`).

3. **Drag Controls Collision & Snapping Optimization (R5)**:
   - Fix unit lag-back during drag: set `unit.isDragging = true` in `DragControls.ts` on drag start and `false` on drag release/drop.
   - In `src/main.ts` `startRenderLoop()`, skip position lerping/updating for units while `unit.isDragging` is true, eliminating positional fight between mouse pointer and main render loop.

4. **Star Upgrade Instant Stat Recalculation (R6)**:
   - Fix 0-stat issue after star upgrade:
     - In `src/core/units/UnitFactory.ts`, initialize `effectiveATK = scaledStats.atk`, `effectiveDEF = scaledStats.def`, `effectiveMDEF = scaledStats.mdef`, `effectiveAP = scaledStats.ap`, `effectiveManaRegen = scaledStats.manaRegen`, `effectiveAttackSpeed = unit.baseAttackSpeed`.
     - In `src/core/board/BoardState.ts` `checkStarUpgrades()`, emit `bus.emit({ type: 'BOARD_UNITS_CHANGED' })` so synergy & stat recalculation (`recalculateAndApplySynergies`) fires immediately upon unit upgrade.

5. **25 Synergies Selector Dropdown (R6)**:
   - In `src/view/ScreenManager.ts` (and `ShopUI.ts`/compendium UI), update compendium synergies display to feature a dropdown / floating selector overlay allowing users to filter between "All Synergies (25)", "Origins (12)", and "Classes (13)", with live search filter and threshold details to eliminate UI clutter.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

After completing code modifications:
1. Run `npx tsc --noEmit` and `npm run build` to verify clean compilation with zero TypeScript errors.
2. Write a detailed handoff report in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m8\handoff.md`.
3. Notify the parent orchestrator via `send_message`.
</USER_REQUEST>
