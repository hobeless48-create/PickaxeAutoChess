# Part 2: Gameplay Mechanics & Lifecycle Blueprint

This document specifies the round loop timelines, player economic scaling, matchmaking parameters, and construction details of Aetheria.

---

## 1. Game Rounds & Phase Loop

Matches progress through Stages, each split into Preparation, Combat, and Resolution phases:

```
[Preparation Phase] ──> [Matchmaking / Transition] ──> [Combat Phase] ──> [Resolution / Payout]
        ▲                                                                        │
        └────────────────────────── Next Round Start ────────────────────────────┘
```

1.  **Preparation Phase (30s):** Players spend gold, level up, refresh shops, place/move units on their half of the board ($4 \times 8$ grid), and drag items onto units from the inventory.
2.  **Matchmaking Phase (2s):** Opponents are paired. The camera pans to the combat view, and the opponent's units are cloned and mirrored on the top half ($4 \times 8$ grid).
3.  **Combat Phase (40s max):** Units act autonomously. Input is locked.
    *   **Overtime Acceleration:**
        *   *At 20 seconds remaining:* All units gain **double Attack Speed** (multiplier $\times 2.0$).
        *   *At 10 seconds remaining:* All units gain **double Damage** (+100% Damage Amplification) and **+50% CC Resistance**.
        *   *At 0 seconds remaining:* Combat terminates. Both players take tie-breaker damage.
4.  **Resolution Phase (3s):** Deducts HP from the loser, awards streak and interest gold, resets units back to their starting hex coordinates, and clears the arena.

---

## 2. Stages and Round Structure

*   **Stage 1 (PVE Tutorial):** Contains **4 rounds** (1-1, 1-2, 1-3, 1-4) against weak monsters to accumulate components.
*   **Stages 2 and Beyond:** Each stage contains exactly **7 rounds** (e.g. 2-1 through 2-7):
    *   **Rounds 1–6 (PVP):** Direct battles against other players or player clones.
    *   **Round 7 (PVE Boss):** Encounter against a Boss. Defeating them drops 2 Item Removers and components.

---

## 3. Player Economy & XP Tables

*   **Shop Reroll Cost:** Exactly 2 Gold.
*   **XP Progression Table & Shop Roll Probabilities:**
    *   **Level 1 ──> 2 (0 XP):** 1-Cost: 100% | 2-Cost: 0% | 3-Cost: 0% | 4-Cost: 0% | 5-Cost: 0%
    *   **Level 2 ──> 3 (2 XP):** 1-Cost: 75% | 2-Cost: 25% | 3-Cost: 0% | 4-Cost: 0% | 5-Cost: 0%
    *   **Level 3 ──> 4 (6 XP):** 1-Cost: 50% | 2-Cost: 30% | 3-Cost: 20% | 4-Cost: 0% | 5-Cost: 0%
    *   **Level 4 ──> 5 (10 XP):** 1-Cost: 38% | 2-Cost: 35% | 3-Cost: 25% | 4-Cost: 2% | 5-Cost: 0%
    *   **Level 5 ──> 6 (20 XP):** 1-Cost: 25% | 2-Cost: 43% | 3-Cost: 27% | 4-Cost: 5% | 5-Cost: 0%
    *   **Level 6 ──> 7 (36 XP):** 1-Cost: 20% | 2-Cost: 30% | 3-Cost: 39% | 4-Cost: 10% | 5-Cost: 1%
    *   **Level 7 ──> 8 (56 XP):** 1-Cost: 15% | 2-Cost: 20% | 3-Cost: 30% | 4-Cost: 30% | 5-Cost: 5%
    *   **Level 8 ──> 9 (80 XP):** 1-Cost: 10% | 2-Cost: 15% | 3-Cost: 25% | 4-Cost: 35% | 5-Cost: 15%
    *   **Level 9 ──> 10 (100 XP):** 1-Cost: 5% | 2-Cost: 10% | 3-Cost: 20% | 4-Cost: 30% | 5-Cost: 35%

### Interest Income Rules:
*   $\ge 10$ Gold = **+1 Gold** interest.
*   $\ge 20$ Gold = **+2 Gold** interest.
*   $\ge 30$ Gold = **+3 Gold** interest.
*   $\ge 40$ Gold = **+5 Gold** interest (Max interest cap).

### Win/Loss Streak Tiers:
*   2 Round Streak: **+1 Gold**
*   3 Round Streak: **+2 Gold**
*   4 Round Streak: **+2 Gold**
*   5+ Round Streak: **+4 Gold**

---

## 4. Dynamic Lobby Matchmaking

To prevent repeating matchups while avoiding pairing gridlocks:
*   **7–8 Players Alive:** Exclusion list = **last 3 opponents** (cannot fight them).
*   **5–6 Players Alive:** Exclusion list = **last 2 opponents**.
*   **3–4 Players Alive:** Exclusion list = **last 1 opponent**.
*   **2 Players Alive:** Exclusion list = **0 opponents**.
*   **Scouting UI:** The sidebar HUD marks **exactly 3 potential opponents** with a cross-swords icon, selected randomly from the allowed matchmaking pool.

---

## 5. Player Health Damage Formula

Loser takes damage:

$$\text{HP Lost} = \text{Winner Player Level} + \sum (\text{Survivor Cost Base Damage} \times \text{Star Level})$$

### Survivor Cost Base Damage Table:
*   **1-Cost Mobs:** 1 base damage.
*   **2-Cost Mobs:** 1 base damage.
*   **3-Cost Mobs:** 2 base damage.
*   **4-Cost Mobs:** 2 base damage.
*   **5-Cost Mobs:** 3 base damage.

---

## 6. The Facility System

Expensive structures built on the board acting as stationary, high-health tank structures:
*   **Construction Phase:** Costs 10-15 Gold. Once placed, requires a **2-3 round delay** to construct (holographic placeholder, no active properties).
*   **Facility Tiers:** Can be upgraded to **Level 3**.
*   **Capacity Limit:** Max **3 active Facilities** per board.
*   **Facility Types:**
    1.  *Offensive:* Slow, single-target weapon. Deals **0 base damage**, instead dealing a percentage of the target's Max Health (mitigated by the target's Defense values).
    2.  *Support:* Emits passive stat-enhancing aura buffs.
    3.  *Resource:* Grants gold or XP rewards at round end.
*   **Destruction Penalty:** If a Facility is destroyed, the player takes direct player damage immediately based on the number of surviving units they currently have on the board:
    *   **Level 1 Facility:** `Math.floor(survivors / 3) * 1` Player Damage.
    *   **Level 2 Facility:** `Math.floor(survivors / 3) * 3` Player Damage.
    *   **Level 3 Facility:** `Math.floor(survivors / 4) * 6` Player Damage.
