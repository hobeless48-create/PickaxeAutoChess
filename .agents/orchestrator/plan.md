# Orchestration Plan: Pickaxe AutoChess Refactor

## Objectives
Transform Pickaxe AutoChess codebase to meet all requirements defined in `ORIGINAL_REQUEST.md`:
- R1: Pre-Game Lobby Screen
- R2: 2D Sprite-Based Visuals & Hex Grid Presentation Layer
- R3: 61-Unit Roster & Synergies Realization (Summoning, Resurrection, Stacking Multipliers, Lifesteal, Mitigation)
- R4: Interactive Facility System (2-3 Round Construction, Unique Abilities, Destruction Penalty)
- R5: Premium UI/UX Polish & `npm run build` TypeScript Verification (zero errors)

## Milestone Breakdown & Dependency Graph

```
M1 (Lobby Screen R1) ──────────┐
                              ├─► M5 (UI/UX Polish & Build Verification R5)
M2 (2D Sprites & Grid R2) ────┤
                              │
M3 (61-Unit Roster & Syn R3) ─┤
                              │
M4 (Facility System R4) ──────┘
```

| Milestone | Name | Scope & Key Deliverables | Dependencies |
|-----------|------|--------------------------|--------------|
| **M1** | Pre-Game Lobby Screen | Clean modern lobby page, Start Game, Settings, Compendium views, state persistence | None |
| **M2** | 2D Sprite Visuals & Grid | Replace 3D GLTF models with 2D card/billboard sprites, textured 2D hex grid tiles | None |
| **M3** | 61-Unit Roster & Synergies | Implement complete 61 units, all origins/traits, summoning, resurrection, stacking multipliers, combat formulas | None |
| **M4** | Interactive Facility System | Facility purchase UI/tab, 2-3 round construction cycle, abilities (offensive/support/resource), destruction HP penalty | M3 |
| **M5** | UI/UX & Build Verification | Glassmorphic UI polish, status overlays, full TypeScript compilation verification (`npm run build`) | M1, M2, M3, M4 |

## Execution Methodology

For each milestone, execute the Project Pattern iteration loop:
1. **Explorer Investigation**: Dispatch `teamwork_preview_explorer` to analyze affected files and detail required changes.
2. **Worker Implementation**: Dispatch `teamwork_preview_worker` with detailed implementation guidelines and mandatory integrity rules.
3. **Reviewer Evaluation**: Dispatch `teamwork_preview_reviewer` to review code quality, edge cases, and layout compliance.
4. **Challenger Verification**: Dispatch `teamwork_preview_challenger` to run build checks, unit tests, and verify system integration.
5. **Forensic Audit**: Dispatch `teamwork_preview_auditor` for non-negotiable integrity verification.
6. **Gate Evaluation**: Proceed only when all checks pass and audit is clean.

# Orchestration Plan: Pickaxe AutoChess Phase 2 Mechanics & Polish

## Objectives
Implement Phase 2 gameplay mechanics, item passive systems, drag control enhancements, and compendium upgrades defined in `ORIGINAL_REQUEST.md`:
- R1: Starting Level 3 & Matchup Scoreboard (Player & AI HP display)
- R2: Rebalanced Player Damage (`Winner Level + surviving units count`)
- R3: 36 Completed Item Passives (custom triggers & status modifiers)
- R4: Facility Construction Holographic Placeholders & Detail Inspector Overlay
- R5: Mid-Combat Item Equip Blocking & Optimized Drag Snapping (eliminate unit lag-back)
- R6: Inventory Item Combine Floating Preview, Instant Star Stat Recalculation, 25 Synergies Selector Dropdown

## Milestone Breakdown & Dependency Graph

```
M6 (Starting Level & HP Damage R1, R2) ───┐
                                          ├─► M9 (Integration, Polish, Build & Audit)
M7 (Item Passives & Combine Preview R3, R5, R6) ┤
                                          │
M8 (Facility Placeholders, Snapping & UI R4, R5, R6) ┘
```

| Milestone | Name | Scope & Key Deliverables | Dependencies |
|-----------|------|--------------------------|--------------|
| **M6** | Starting Level & Scoreboard & Damage | Start & reset at level 3, matchup panel displays Player & AI HP, damage formula: Winner Level + surviving units | M5 |
| **M7** | 36 Item Passives & Combat Block & Combine Preview | All 36 completed item passives, triggers, status modifiers, block mid-combat item equips, floating inventory combine preview | M5 |
| **M8** | Facility Holographic Placeholders, Snapping & UI | Interactive dummy/holographic facility placeholders + inspector, fix drag snapping unit lag-back, instant star stat recalc, 25 synergies compendium dropdown | M5 |
| **M9** | Integration Polish & Build Verification & Audit | E2E integration verification, clean build (`npm run build`), reviewer pass, challenger verification, forensic audit | M6, M7, M8 |

## Execution Methodology

For each milestone, execute the Project Pattern iteration loop:
1. **Explorer Investigation**: Dispatch `teamwork_preview_explorer` to analyze affected core and view files.
2. **Worker Implementation**: Dispatch `teamwork_preview_worker` with detailed implementation guidelines and mandatory integrity rules.
3. **Reviewer Evaluation**: Dispatch `teamwork_preview_reviewer` to verify code quality, edge cases, and layout compliance.
4. **Challenger Verification**: Dispatch `teamwork_preview_challenger` to run build checks and test harness verification.
5. **Forensic Audit**: Dispatch `teamwork_preview_auditor` for non-negotiable integrity verification.
6. **Gate Evaluation**: Proceed only when all checks pass and audit is clean.
