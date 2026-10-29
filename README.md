# Pickaxe AutoChess

A browser auto-battler where you buy units, arrange a hex-board formation, combine upgrades, and let the army fight automatically. The game uses TypeScript, Three.js, and Vite; the playable app is in [PickaxeAutoChess/](PickaxeAutoChess/).

## Goal

Build a stronger army than the AI while protecting your player HP. Win a round by eliminating the enemy board; surviving units damage the opposing HP total.

Both sides start with 100 HP. The overall target is to reduce the AI to zero before your own HP reaches zero. **Current prototype limitation:** HP and round-result banners are implemented, but the round loop does not stop at zero HP or show a separate final match-over screen. Return to the lobby and start a new game to reset.

## Run it

Requirements: Node.js 22.12 or newer, npm, Git for cloning, and a modern desktop browser with WebGL support.

Open PowerShell and run:

```powershell
git clone https://github.com/hobeless48-create/PickaxeAutoChess.git
cd PickaxeAutoChess/PickaxeAutoChess
npm install
npm run dev
```

The repeated folder name is intentional: the first is the repository, and the second is the app directory containing `package.json`. If you already cloned the repository, run `cd PickaxeAutoChess` from its root.

Open the local URL printed by Vite. The playable mode runs locally against generated AI opponents; no account or API key is needed.

## How to play

1. Open the lobby and choose **Start Game**. A fresh game begins with **20 gold**, **level 3**, and an empty board.
2. Open the shop and buy units. Purchases go to the bench when space is available.
3. During **Preparation**, drag units from the bench onto your half of the board: rows 4–7 in the code's zero-based coordinates. Your level limits board deployment; facilities also occupy board spaces.
4. Put durable units toward the enemy and damage dealers behind them. Inspect units to read their range, skills, origin, and class.
5. Watch the synergy panel. Fielding units with shared origins or classes activates the bonuses listed in the Compendium.
6. Buy matching copies for star upgrades, equip items during Preparation, or invest in XP and facilities. Keep some gold for interest instead of spending every round.
7. When the timer expires, matchmaking leads into **Combat**. Units move, attack, generate mana, and cast skills automatically.
8. Read the round-result banner, collect income, and rebuild your formation for the next Preparation phase. Continue adapting as later stages add stronger AI opponents.

The lobby's **Compendium** contains unit, synergy, and item references. Use it when deciding which purchases work together.

## Controls

| Interaction | What it does |
| --- | --- |
| Click a shop card | Buy that unit or facility if you can afford it |
| Drag a friendly unit | Move between the bench and legal board hexes during Preparation |
| Drag a unit to the sell area | Sell it for the displayed refund |
| Click a unit | Inspect its stats and abilities |
| Drag an inventory item onto a unit | Equip or combine items during Preparation |
| Reroll | Spend 2 gold to refresh the shop |
| Buy XP | Spend 4 gold for 4 XP |
| Lobby / menu controls | Read the Compendium, change settings, or return to the lobby |

Placement dragging and item equipping are restricted to Preparation. Inspecting units remains available in other phases.

## Current play loop

**Shop → place and upgrade → automatic battle → resolve HP and rewards → shop again.**

| Phase | Base timer | What happens |
| --- | --- | --- |
| Preparation | 30 seconds | Buy, position, sell, equip, and improve the army |
| Matchmaking | 2 seconds | Save the formation and prepare the opponent |
| Combat | Up to 40 seconds | Autonomous combat; it can finish early when resolved |
| Resolution | 3 seconds | Apply the round result and HP changes |

A stage contains seven rounds. After round seven, the next stage begins at round one. Friendly combat units recover between rounds and their saved formation is restored.

## Rules notes

- **Economy:** the normal round income starts at 5 gold, plus 1 per 10 gold saved, capped at 5 interest before trait effects. Winning and streaks can add bonuses; some synergies change the economy.
- **Level and capacity:** start at level 3 and gain 2 XP when returning to Preparation. Buying XP accelerates leveling, up to level 9, and improves board deployment capacity and shop odds.
- **Star upgrades:** three copies of the same unit at the same star level combine automatically. Three 1-star units make a 2-star unit; three 2-star units make a 3-star unit.
- **Bench:** nine reserve slots hold units that are not fighting. A full bench can prevent another purchase from being placed.
- **Synergies:** origin and class thresholds count distinct deployed unit names, so duplicate copies do not stack the same trait count. Buying a unit is not enough if it remains on the bench.
- **Damage to player HP:** on a loss, damage is the AI stage plus surviving enemy board entities. On a win, damage to the AI is your player level plus surviving friendly board entities. Destroyed facilities can impose an additional loss penalty.
- **Facilities:** use the facility shop for offensive, support, and resource structures. They need construction rounds before becoming active; Architect bonuses can change construction and capacity.
- **Items:** components combine into completed items. Read the combination preview and item description before dropping them onto a unit. Combat-phase equipping is blocked.
- **AI scaling:** the AI's generated army grows with stage, up to seven enemies, and can draw from higher-cost units as stages advance.

The current lobby exposes a local AI game. Online multiplayer and persistent campaign saving are not part of this playable flow.

## Useful files

- [PROJECT.md](PROJECT.md) — architecture and milestone notes.
- [Game loop](PickaxeAutoChess/src/core/board/GameLoopManager.ts) — phases, timers, AI spawning, HP damage, and round progression.
- [Board state](PickaxeAutoChess/src/core/board/BoardState.ts) — placement, bench slots, items, and star upgrades.
- [Shop](PickaxeAutoChess/src/core/shop/ShopManager.ts) — purchases, XP, shop odds, and income.
- [Combat engine](PickaxeAutoChess/src/core/combat/CombatEngine.ts) — automatic combat.
- [Unit catalog](PickaxeAutoChess/src/core/data/units_catalog.json) and [synergy catalog](PickaxeAutoChess/src/core/data/synergies_catalog.json) — roster data.
- [Lobby and Compendium](PickaxeAutoChess/src/view/ScreenManager.ts) — entry screens and reference panels.
- [Application entry point](PickaxeAutoChess/src/main.ts) — connects rules, rendering, and UI.

## Checks and production build

Run from the app directory, `PickaxeAutoChess/` inside the repository:

```powershell
npm run build
npm run preview
```

The build runs TypeScript checks and writes the static site to `PickaxeAutoChess/dist/` relative to the repository root. Preview serves that build locally. There is no `npm test` script in the current app manifest.

For a manual check, start a new game, buy and deploy units, finish a round, test a three-copy upgrade, and confirm that returning to the lobby and starting again resets the game.
