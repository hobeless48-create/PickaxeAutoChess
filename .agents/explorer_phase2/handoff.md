# Handoff Report: Pickaxe AutoChess Phase 2 Architecture & Requirements Investigation

## 1. Observation

This investigation examined the entire Pickaxe AutoChess codebase located at `C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess` covering Phase 2 requirements (R1–R6, Milestones M6, M7, and M8). The findings are based on direct source code analysis across core engine state, combat FSM, UI overlays, and 3D presentation modules.

### Key File Locations & Direct Code Quotes:

1. **Player Level Initialization & Reset Bug**:
   - `src/core/shop/ShopManager.ts:32`: `public level: number = 3;` (Default starting level initialized to 3).
   - `src/core/shop/ShopManager.ts:76`: `this.level = 1;` inside `reset()` (Resets player level to 1 instead of level 3 upon game start/reset).
   - `src/view/ShopUI.ts:304`: `xpProgressDiv.innerText = 'Lvl 1 (0/2 XP)';` (Hardcoded string default before `updateHUD` call).

2. **Matchup Panel & Player/Opponent HP Tracking**:
   - `src/core/board/GameLoopManager.ts:17`: `public playerHP: number = 100;` (Only player HP is tracked; no opponent/AI HP property exists).
   - `src/view/ShopUI.ts:166-188`:
     ```typescript
     matchupPanel.innerHTML = `
         <div style="font-size: 13px; font-weight: bold; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 4px; margin-bottom: 8px;">Matchups</div>
         <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
             <div style="color: #10b981; font-weight: bold;">🛡️ Player (You)</div>
             <div style="color: #ef4444; font-weight: bold;">⚔️ Opponent (AI)</div>
         </div>
     `;
     ```
     (Matchup panel renders static participant names with no numerical HP counters or dynamic update bindings).

3. **Round Victory/Loss Damage Handling**:
   - `src/core/board/GameLoopManager.ts:221-226`:
     ```typescript
     const baseDamage = 15;
     const multiplier = this.stage >= 8 ? 2 : 1;
     const damageApplied = baseDamage * multiplier;
     this.playerHP = Math.max(0, this.playerHP - damageApplied);
     ```
     (Round damage currently uses flat 15 base damage and only damages the player on loss; no damage is applied to the AI opponent when the player wins).

4. **Item Definitions, Recipes & Stat Pipeline**:
   - `src/core/data/recipes.json`: Defines 36 completed item recipes using 8 component items (`Blunt Sword`, `Bow`, `Chestplate`, `Mana Crystal`, `Magic Orb`, `Cloak`, `Dagger`, `Belt`).
   - `src/core/data/item_descriptions.json`: Contains display descriptions and passive effect summaries for all components and 36 completed items.
   - `src/core/stats/ItemManager.ts:101-154`: `applyCompletedItem()` attaches flat/percent stat modifiers to units from `recipe.stats`. However, **combat passive triggers** (e.g. Sunfire burn, Thornmail reflect, Warmog HP regen, Vampiric lifesteal, Zephyr banish) are absent from `CombatEngine.ts`.

5. **Item Equip Handling & Phase Constraints**:
   - `src/view/DragControls.ts:291-327`: `onDropItem` detects drop over tiles/units and calls `this.boardState.attachInventoryItem(itemIndex, targetUnit.id)` without checking `this.gameLoop.phase`. Items can currently be equipped during Combat and Resolution phases.

6. **Inventory Drag & Combine Mechanics**:
   - `src/view/ShopUI.ts:728-737`: `ondrop` in `updateInventoryView` calls `this.boardState.combineInventoryItems(dragIndex, actualIndex)`. However, during `ondragover`/`ondragenter`, no visual overlay or preview tooltip is shown to indicate what item will be formed.

7. **Facility Construction Visuals & Inspection**:
   - `src/core/shop/ShopManager.ts:182`: `constructionRoundsRemaining` set on purchased facility.
   - `src/view/UIOverlay.ts:105-130`: Renders a top HUD badge (`🏗️ X/Y rounds`).
   - `src/view/UnitView.ts:263-298`: `spawnUnit` creates 2D card sprite without checking if the facility is under construction (renders standard fully-built appearance).

8. **Unit Lag-Back During Drag Snapping**:
   - `src/view/DragControls.ts:196`: `unitMesh.position.copy(intersectPoint)` sets mesh position during dragging in `onMouseMove`.
   - `src/main.ts:488-518`: `sceneManager.startRenderLoop` executes concurrently every frame and calls `unitView.updatePosition(unit.id, unit.hex, deltaTime)` or lerps bench slots, continuously fighting `DragControls` mouse position.

9. **Unit Upgrade Stat Recalc & 0 Stats Issue**:
   - `src/core/units/Unit.ts:74-83`: Constructor defaults `effectiveATK = 0`, `effectiveDEF = 0`, `effectiveMDEF = 0`, `effectiveAP = 0`, `effectiveManaRegen = 0`.
   - `src/core/units/UnitFactory.ts:80`: `new Unit(...)` creates unit with `baseStats` but leaves `effective...` properties initialized to `0`.
   - `src/core/board/BoardState.ts:290-340`: `checkStarUpgrades()` replaces 3 units with an upgraded unit, but does **not** emit `BOARD_UNITS_CHANGED`.
   - Result: `recalculateAndApplySynergies()` in `main.ts:156` never runs after upgrade, leaving effective stats at 0.

10. **Synergies Catalog Display**:
    - `src/view/ScreenManager.ts:530-571`: `renderSynergiesCatalog` displays all 25 synergies (Origins and Classes) in a single long scrolling grid without filtering, dropdowns, or category tabs.

---

## 2. Logic Chain

### M6: Starting Level 3, Scoreboard & Damage Rebalance
- **Step 1**: In `ShopManager.ts`, setting `this.level = 1` inside `reset()` overrides the class property default (`public level: number = 3`), forcing all reset games to start at Level 1. Changing line 76 to `this.level = 3;` ensures player level initializes and resets at Level 3.
- **Step 2**: The top right Matchup Panel (`ShopUI.ts:166-188`) currently contains static text labels. Adding `opponentHP: number = 100` to `GameLoopManager.ts` and dynamic HTML elements (`#matchup-player-hp` and `#matchup-opponent-hp`) updated inside `ShopUI.updateHUD()` enables live dual HP scoreboard rendering.
- **Step 3**: Rebalancing damage requires updating `resolveRound()` in `GameLoopManager.ts`. Rather than a flat 15 damage, damage must be computed as `Damage = Winner Level + Surviving Units on Board`.
  - When Player loses: `playerHP -= (Opponent Level + enemySurvivors)`.
  - When Player wins: `opponentHP -= (Player Level + playerSurvivors)`.

### M7: Completed Item Passives, Combat Block & Combine Preview
- **Step 1**: The 36 completed item recipes in `recipes.json` map base component combinations. Passive combat triggers (such as Sunfire burn, Thornmail reflection, Warmog HP regeneration, Vampiric lifesteal, Zephyr banish) must be implemented in `CombatEngine.ts` tick and event hooks.
- **Step 2**: Blocking item equipping during non-Preparation phases requires a phase check in `DragControls.ts:291` (`onDropItem`). If `gameLoop.phase !== 'Preparation'`, the drop is aborted, a notification is displayed, and the item remains safely in inventory.
- **Step 3**: Inventory item drag combine preview requires adding `ondragover` / `ondragenter` handlers to inventory cells in `ShopUI.ts`. When dragging item `A` over item `B`, `BoardState.combineInventoryItems` logic can be simulated to check if a valid recipe exists, displaying a floating preview overlay showing the result item card.

### M8: Holographic Placeholders, Drag Optimization, Stat Recalc & Synergy Selector
- **Step 1**: Facilities under construction (`constructionRoundsRemaining > 0`) should render in `UnitView.ts` with semi-transparent holographic materials (`opacity: 0.5`, cyan/amber glow). When clicked, `UnitInspectUI.ts` should display an inspector overlay detailing construction progress, remaining rounds, and facility specifications.
- **Step 2**: Unit lag-back during drag is caused by a race condition: `DragControls.ts` updates mesh position on `mousemove`, while `main.ts:488` `renderLoop` simultaneously lerps the mesh back to `unit.hex`. Adding an `isDragging` flag on the unit permits `renderLoop` to skip lerping while dragging, resolving positional jitter.
- **Step 3**: Star level upgraded units display 0 stats because `UnitFactory.createUnit` does not compute `effective...` stats from `baseStats`, and `BoardState.checkStarUpgrades()` fails to emit `BOARD_UNITS_CHANGED`. Initializing `effective...` stats in `UnitFactory.ts` and emitting `BOARD_UNITS_CHANGED` upon upgrade forces immediate stat recalculation.
- **Step 4**: Transforming the 25 synergies compendium into a dropdown/floating selector overlay requires refactoring `renderSynergiesCatalog` in `ScreenManager.ts` (and `ShopUI.ts`) to include Origin vs. Class category tabs, a searchable dropdown, and threshold detail popups.

---

## 3. Caveats

1. **Read-Only Scope**: This report is strictly an investigation and specification document. No source files within `PickaxeAutoChess/src` were modified.
2. **AI Opponent Level Assumption**: AI opponent level in single-player PvE matches is assumed to equal the current stage number (`gameLoop.stage`), or equal to `shopManager.level` in mirrored matches.
3. **Item Passive Trigger Execution**: Some of the 36 completed item passives (e.g. Zephyr banish at combat start vs Sunfire Cape per-tick burn vs Thornmail hit reflection) touch different phases of `CombatEngine.ts` and require modular event handlers (`COMBAT_START`, `DAMAGE_APPLIED`, `TICK_PROCESS`).

---

## 4. Conclusion & Actionable Implementation Plan

### M6 Action Items:
1. **Starting Level 3**: Update `ShopManager.ts:76` from `this.level = 1;` to `this.level = 3;`. Update default display string in `ShopUI.ts:304` to `Lvl 3 (0/10 XP)`.
2. **HP Scoreboard**:
   - Add `public opponentHP: number = 100;` to `GameLoopManager.ts` and reset it to `100` in `reset()`.
   - Update `#matchup-panel` HTML in `ShopUI.ts:181-187` to display:
     - `🛡️ Player (You): <span id="matchup-player-hp">100</span> HP`
     - `⚔️ Opponent (AI): <span id="matchup-opponent-hp">100</span> HP`
   - Update `ShopUI.updateHUD()` to update both HP spans dynamically.
3. **Rebalanced Round Damage**:
   - Replace lines 221-226 in `GameLoopManager.ts` `resolveRound()` with:
     ```typescript
     const playerSurvivors = this.boardState.getAllUnits().filter(u => u.faction === 'player' && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying').length;
     const enemySurvivors = this.boardState.getAllUnits().filter(u => u.faction === 'enemy' && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying').length;

     if (!playerAlive && enemyAlive) {
         const winnerLevel = this.stage;
         const damage = winnerLevel + enemySurvivors;
         this.playerHP = Math.max(0, this.playerHP - damage);
     } else if (playerAlive && !enemyAlive) {
         const winnerLevel = this.shopManager ? this.shopManager.level : 3;
         const damage = winnerLevel + playerSurvivors;
         this.opponentHP = Math.max(0, this.opponentHP - damage);
     }
     ```

### M7 Action Items:
1. **Phase Check for Item Equip**:
   - In `DragControls.ts:291` (`onDropItem`), add:
     ```typescript
     if (this.gameLoop.phase !== 'Preparation') {
         console.warn('[Item] Items cannot be equipped during combat or resolution phases.');
         bus.emit({ type: 'INVENTORY_CHANGED' });
         return;
     }
     ```
2. **Inventory Item Combine Preview Overlay**:
   - In `ShopUI.ts` `updateInventoryView()`, attach `ondragover` / `ondragenter` to inventory cells.
   - Look up recipe using `recipes.json` for dragged item + target cell item.
   - If valid, show a floating DOM tooltip/overlay displaying combined item card preview (Result Name, Icon, Stat Modifiers).
3. **36 Completed Item Passives**:
   - Implement passive trigger logic in `CombatEngine.ts` / `ItemManager.ts`:
     - **Stats & Lifesteal**: Sovereign's Edge, Sage's Spear, Aether Blade, Hero's Crest, Warmog's Armor, Vampiric Greatsword (`lifestealPercent = 0.15`).
     - **On-Hit & Shred**: Colossus Sunderer (5% DEF shred), Shredding Arrow (-50% DEF for 5s), Stinger Bow (33% anti-heal).
     - **Defensive & Reflect**: Thornmail Vest (reflect 20% phys damage), Sunfire Cape (burn 1% max HP/s in 2 hexes), Vanguard's Vow (shield at 40% HP), Gloomward Shroud (15% HP starting shield).
     - **Arcane & Aura**: Aura of Clarity (+2 mana/s aura), Zephyr's Tempest (banish 5s at start), Burning Grimoire (2% max HP burn on skill cast), Static Ward (MDEF aura shred).

### M8 Action Items:
1. **Under-Construction Facility Placeholders**:
   - In `UnitView.ts:273`, if `unit.isFacility && unit.constructionRoundsRemaining > 0`, set sprite material `opacity = 0.5` and apply a cyan/amber holographic border tint.
   - In `UnitInspectUI.ts`, if unit is an under-construction facility, show inspector overlay banner: `🏗️ Under Construction: ${unit.constructionRoundsRemaining}/${unit.totalConstructionRounds} rounds remaining`.
2. **Drag Lag-Back Optimization**:
   - Add `public isDragging: boolean = false` to `Unit.ts` or `DragControls.ts`.
   - Set `unit.isDragging = true` on `mousedown` in `DragControls.ts`, and `false` on `mouseup`.
   - In `main.ts:488` `renderLoop`: `if (unit.isDragging) continue;`.
3. **Star Upgrade Instant Stat Recalculation**:
   - In `UnitFactory.ts:80`, initialize effective stats:
     ```typescript
     unit.effectiveATK = scaledStats.atk;
     unit.effectiveDEF = scaledStats.def;
     unit.effectiveMDEF = scaledStats.mdef;
     unit.effectiveAP = scaledStats.ap;
     unit.effectiveManaRegen = scaledStats.manaRegen;
     unit.effectiveAttackSpeed = unit.baseAttackSpeed;
     ```
   - In `BoardState.ts:336`, add `bus.emit({ type: 'BOARD_UNITS_CHANGED' });` inside `checkStarUpgrades()`.
4. **25 Synergies Selector**:
   - Refactor `renderSynergiesCatalog` in `ScreenManager.ts` to include a dropdown selector with "All Synergies", "Origins (12)", and "Classes (13)", plus a live search filter box.

---

## 5. Verification Method

To verify these implementations independently once completed:
1. **Compilation & Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
2. **Starting Level & Damage Verification**:
   - Launch application, click "START GAME", verify player level HUD displays `Lvl 3 (0/10 XP)`.
   - Win/lose rounds and observe `#matchup-player-hp` and `#matchup-opponent-hp` values in the right matchup panel. Damage taken must equal `Winner Level + surviving units`.
3. **Item Equip & Combine Preview Verification**:
   - Drag item from inventory to unit during Preparation phase -> verify item equips.
   - Advance phase to Combat -> try dragging item onto unit -> verify drag is blocked and item remains in inventory.
   - Drag one component item over another in inventory -> verify floating preview overlay displays the combined item result.
4. **Facility Hologram & Upgrade Verification**:
   - Purchase facility from Shop -> verify visual representation on hex board appears semi-transparent holographic (0.5 opacity).
   - Buy 3 copies of any unit -> verify upgraded 2★ unit inspect panel shows non-zero, correctly scaled ATK/DEF/HP values instantly.
