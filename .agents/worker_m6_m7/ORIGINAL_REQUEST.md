## 2026-07-22T15:36:16Z
You are a Worker subagent for Pickaxe AutoChess Phase 2 requirements (Milestones M6 and M7).

Working Directory: C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m6_m7
Project Path: C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess

Read `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\explorer_phase2\handoff.md` and `C:\Users\s0846\Desktop\Files\Pickaxe\PROJECT.md` for full context and specifications.

Your tasks (M6 & M7):
1. **Starting Level 3 & Reset (R1)**:
   - In `src/core/shop/ShopManager.ts:76`, fix `reset()` so it sets `this.level = 3;` (was set to 1).
   - In `src/view/ShopUI.ts`, update default XP display to `Lvl 3 (0/10 XP)`. Ensure player level is 3 on game boot and reset.

2. **Dual HP Scoreboard (R1)**:
   - In `src/core/board/GameLoopManager.ts`, add `public opponentHP: number = 100;` and reset `opponentHP = 100` in `reset()`.
   - In `src/view/ShopUI.ts`, update `#matchup-panel` HTML to include dynamic HP counter elements `#matchup-player-hp` and `#matchup-opponent-hp` for Player (You) and Opponent (AI). Update `ShopUI.updateHUD()` to update both HP displays dynamically.

3. **Rebalanced Round Damage (R2)**:
   - In `src/core/board/GameLoopManager.ts` `resolveRound()`, replace flat 15 damage with formula: `Damage = Winner Level + surviving board units count`.
   - On player loss: `playerHP = Math.max(0, playerHP - (stage + enemySurvivors))`.
   - On player win: `opponentHP = Math.max(0, opponentHP - (shopManager ? shopManager.level : 3) + playerSurvivors)`.

4. **Block Mid-Combat Item Equips (R5)**:
   - In `src/view/DragControls.ts` `onDropItem`, check `if (this.gameLoop.phase !== 'Preparation')`. If in Combat or Resolution phase, abort item equipping, emit `INVENTORY_CHANGED`, display a user warning notification, and return the item safely to inventory.

5. **Inventory Item Combine Floating Preview (R6)**:
   - In `src/view/ShopUI.ts` `updateInventoryView()`, attach `ondragover` / `ondragenter` / `ondragleave` handlers to inventory cells.
   - Look up recipe combinations in `recipes.json` between the dragged component item and hovered component item.
   - If a valid recipe exists, display a floating DOM item combine preview overlay showing resulting completed item name, icon, and stat modifiers.

6. **36 Completed Item Passives (R3)**:
   - Implement/verify passive triggers and status modifiers for all 36 completed item recipes defined in `src/core/data/recipes.json` and `src/core/data/item_descriptions.json`.
   - Add status modifier and combat event triggers in `src/core/stats/ItemManager.ts`, `src/core/combat/CombatEngine.ts`, and `src/core/units/Unit.ts` for all 36 completed items (lifesteal, attack speed stacks, damage reflection, burn aura, shield triggers, mana regeneration, DEF/MDEF shred, banish, anti-heal).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

After completing code modifications:
1. Run `npx tsc --noEmit` and `npm run build` to verify clean compilation with zero TypeScript errors.
2. Write a detailed handoff report in `C:\Users\s0846\Desktop\Files\Pickaxe\.agents\worker_m6_m7\handoff.md`.
3. Notify the parent orchestrator via `send_message`.
