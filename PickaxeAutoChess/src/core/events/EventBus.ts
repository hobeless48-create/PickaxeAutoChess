// src/core/events/EventBus.ts

import type { Hex } from '../hex/HexGrid';

export type GameEvent =
    | { type: 'UNIT_MOVED';     unitId: string; from: Hex; to: Hex }
    | { type: 'ATTACK_START';   unitId: string; targetId: string }
    | { type: 'DAMAGE_APPLIED'; unitId: string; amount: number; damageType: 'physical' | 'magic' | 'true' }
    | { type: 'UNIT_DIED';      unitId: string }
    | { type: 'SKILL_CAST';     unitId: string; skillId: string }
    | { type: 'SHIELD_APPLIED'; unitId: string; amount: number }
    | { type: 'ROUND_START' }
    | { type: 'ROUND_END';      winnerId: 'player' | 'enemy' }
    | { type: 'INVENTORY_CHANGED' }
    | { type: 'BOARD_UNITS_CHANGED' };

export type Listener<T extends GameEvent> = (event: T) => void;

export class EventBus {
    private listeners: Map<string, Listener<any>[]> = new Map();

    public on<T extends GameEvent>(type: T['type'], cb: Listener<T>): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(cb);
    }

    public emit(event: GameEvent): void {
        const list = this.listeners.get(event.type);
        if (list) {
            for (const cb of list) {
                cb(event);
            }
        }
    }
}

export const bus = new EventBus();
