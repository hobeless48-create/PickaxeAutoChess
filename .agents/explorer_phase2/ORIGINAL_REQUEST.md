## 2026-07-22T15:34:55Z

You are an Explorer agent for Pickaxe AutoChess Phase 2 requirements.

Working Directory: C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_phase2
Project Path: C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess

Your mission is to perform a thorough investigation of the codebase for Phase 2 requirements (R1-R6) and produce a detailed handoff report in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_phase2\handoff.md`.

Investigate the following areas in detail:
1. M6 (R1 & R2): Starting Level 3, HP Scoreboard & Rebalanced Damage
   - Locate where player level is initialized and reset (should be level 3).
   - Locate the matchup panel UI (`UIOverlay.ts` or similar) and how Player (You) and Opponent (AI) HP are stored, rendered, and updated.
   - Locate round victory/loss damage handling in core combat/FSM logic, and document how to implement `Loser HP Lost = Winner Player Level + number of surviving units on the board`.

2. M7 (R3, R5, R6): Completed Item Passives, Combat Block & Combine Preview
   - Locate item definitions, 36 completed item recipes, item passive triggers, and status modifiers. Detail what exists and what needs to be implemented for all 36 completed items.
   - Locate where item equip logic is processed in core/view. Document how to block equipping items onto units during Combat and Resolution phases and return the item safely to inventory.
   - Locate inventory drag logic and document how to render a floating combined item preview overlay when dragging one component item over another component item in the inventory.

3. M8 (R4, R5, R6): Construction Placeholders, Drag Snapping, Stat Recalc & Synergies Selector
   - Locate facility construction logic and `BoardView.ts` facility rendering. Document how to render under-construction facilities as interactive dummy/holographic drag placeholders and display an inspector overlay showing facility details (name, stage, remaining rounds) when clicked.
   - Analyze `DragControls.ts` collision/snapping logic to identify the root cause of unit lag-back and document the optimization steps.
   - Locate unit combine / star level upgrade logic (e.g. `bench.ts`, `board.ts`, `UnitEntity.ts`) and inspect UI stat calculation. Explain why stats show 0 after upgrade and how to trigger instant stat recalculation.
   - Locate compendium synergy list in `UnitInspectUI.ts` or related files and document how to transform the 25 synergies (Origins and Classes) list into a dropdown/floating selector overlay.

Write your findings clearly with exact file paths, line numbers, and actionable code suggestions in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_phase2\handoff.md`. Communicate your progress via `send_message` when done.
