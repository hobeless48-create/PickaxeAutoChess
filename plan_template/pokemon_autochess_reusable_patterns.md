# Reusable Patterns from Pokemon Auto Chess

This document highlights the key designs, code structures, and patterns from the open-source **Pokemon Auto Chess** template that we can adapt or leverage for **PickaxeAutoChess**.

---

## 1. Simulation and Tick Execution Core

In Pokemon Auto Chess (`app/core/simulation.ts`), combat runs as a decoupled state simulation:
*   **State Separation:** The simulation classes inherit from Colyseus schema classes. Game logic, entity states, and active buffs are updated purely as state properties.
*   **Timeouts & Cooldowns:** Entities track cooldown tick timers locally (e.g. `attackInterval` or `skillCooldown`).
*   **Command Queue:** Unit moves, actions, and effects queue up commands (`SimulationCommand`) executed in sequence.

> [!TIP]
> **Aetheria Adaptation:** Implement the `TickManager` to step over active `Unit` entities, decrement their FSM state cooldowns, and apply ticks sequentially without relying on browser render rates.

---

## 2. Decoupled Board and Navigation Geometry

In Pokemon Auto Chess (`app/core/board.ts`):
*   **Board Storage:** Cells are stored in a simple 1D array (`rows * columns`) index-accessed via `y * columns + x`.
*   **Decoupled Entities:** Entities contain reference positions (`positionX`, `positionY`), and the board cell holds a reference to the entity.
*   **Dynamic Board Effects:** The board tracks overlays (`boardEffects`) per cell (e.g., healing zones, hazard zones). Entities gain/lose these effects dynamically when swapping cells.

> [!NOTE]
> **Aetheria Adaptation:** We will use a flat array structure for the board grid, but compute distances using **Cube Axial coordinates (q, r, s)** instead of Cartesian coordinates.

---

## 3. Entity Buff & Stat Pipeline

In Pokemon Auto Chess (`app/core/pokemon-entity.ts`):
*   **Base vs. Modified Stats:** Keeps distinct variables for base stats (`baseAtk`, `baseDef`) and recalculates effective values dynamically to avoid compounding value drift.
*   **Effect Triggers:** Uses a typed set (`effects = new SetSchema<EffectEnum>()`) to quickly run checks during attack, damage, or death events (e.g. `has(EffectEnum.IMMUNITY_BOARD_EFFECTS)`).

> [!IMPORTANT]
> **Aetheria Adaptation:** Our `ModifierPipeline.ts` uses a list of active `Modifier` structs. Every tick, we'll sweep expired durations and compute values dynamically using the cumulative formula:
> `(Base + Sum(Flats)) * (1 + Sum(Percents) / 100)`

---

## 4. Decoupled Communication Model

Pokemon Auto Chess relies on Colyseus schema mutations to sync state changes automatically to client visuals.
*   **State Diffs:** Clients watch state fields for updates rather than direct calls.
*   **Event Bridges:** In a decoupled core-to-view design, our `EventBus` emits events (e.g. `UNIT_MOVED`, `DAMAGE_APPLIED`) to let the visual layer (Three.js) interpolate models and animate graphics smoothly.
