// src/core/stats/AncientManager.ts
// Ancient synergy: High-risk cashout system.
// Stacks accumulate from allied deaths + lose streaks.
// At prep phase, if stacks >= a threshold, player chooses: OPEN (spend for rewards) or KEEP (build toward next).

import { bus, type GameEvent } from '../events/EventBus';
import { UnitFactory } from '../units/UnitFactory';
import type { ShopManager } from '../shop/ShopManager';
import type { BoardState } from '../board/BoardState';

export interface AncientChestReward {
    threshold: number;
    name: string;
    desc: string;
    gold: number;
    units: { name: string; starLevel: number }[];
    items: string[];
    extraDuplicators: number;
}

export const CHEST_TIERS: AncientChestReward[] = [
    {
        threshold: 100,  name: 'Relic Coffer',     desc: 'A small relic chest.',
        gold: 4,  units: [{ name: 'Runecarver', starLevel: 1 }],  items: [],  extraDuplicators: 0
    },
    {
        threshold: 200,  name: 'Gilded Reliquary', desc: 'A golden pulsing box.',
        gold: 10, units: [{ name: 'Runecarver', starLevel: 2 }],  items: ["Uxtil's Leap"], extraDuplicators: 2
    },
    {
        threshold: 400,  name: 'Sarcophagus of Kings', desc: 'A grand tomb chest.',
        gold: 20, units: [{ name: 'Relic Colossus', starLevel: 2 }], items: ['Darkest Light'], extraDuplicators: 3
    },
    {
        threshold: 700,  name: 'Vault of Aeons',   desc: 'An ancient power vault.',
        gold: 50, units: [{ name: 'Runecarver', starLevel: 3 }, { name: 'Relic Colossus', starLevel: 2 }],
        items: ["True Uxtil's Leap", 'True Darkest Light'], extraDuplicators: 0
    },
    {
        threshold: 1100, name: 'Primordial Ark',    desc: 'A relic from before time.',
        gold: 90, units: [{ name: 'Relic Titan', starLevel: 2 }], // 2-star 5-cost Relic Titan
        items: ["Helios's Cascade"], extraDuplicators: 0
    },
    {
        threshold: 1500, name: 'Pinnacle',          desc: 'The ultimate relic.',
        gold: 0,  units: [],  items: ['Pinnacle'],  extraDuplicators: 0
    },
];

export class AncientManager {
    public stacks: number = 0;
    private activeTier: number = 0;
    private openedThresholds: Set<number> = new Set();
    private boardState: BoardState;
    private shopManager: ShopManager;


    constructor(boardState: BoardState, shopManager: ShopManager) {
        this.boardState = boardState;
        this.shopManager = shopManager;

        bus.on('UNIT_DIED', (event: GameEvent) => {
            if (event.type !== 'UNIT_DIED') return;
            this.onUnitDied(event.unitId);
        });
    }

    public setTier(tier: number): void {
        this.activeTier = tier;
    }

    private getStacksPerDeath(): number {
        if (this.activeTier >= 6) return 10;
        if (this.activeTier >= 5) return 7;
        if (this.activeTier >= 4) return 5;
        if (this.activeTier >= 2) return 2;
        return 0;
    }

    public getLoseStreakGold(loseStreak: number): number {
        if (this.activeTier < 2) return 0;
        const per = this.activeTier >= 6 ? 15 : (this.activeTier >= 5 ? 10 : (this.activeTier >= 4 ? 7 : 5));
        return loseStreak * per;
    }

    private onUnitDied(unitId: string): void {
        if (this.activeTier < 2) return;
        const unit = this.boardState.getUnit(unitId);
        if (!unit || unit.faction !== 'player') return;
        const per = this.getStacksPerDeath();
        this.stacks += per;
        console.log('[Ancient] Allied died. +' + per + ' stacks. Total: ' + this.stacks);
    }

    public awardLoseStreakGold(loseStreak: number): void {
        if (this.activeTier < 2 || loseStreak <= 0) return;
        const gold = this.getLoseStreakGold(loseStreak);
        this.shopManager.gold += gold;
        console.log('[Ancient] Lose streak ' + loseStreak + ' -> +' + gold + 'g');
        this.stacks += loseStreak * 2;
        console.log('[Ancient] +' + (loseStreak * 2) + ' consolation stacks. Total: ' + this.stacks);
    }

    /** Call at start of Preparation phase to check for chest availability */
    public checkChestAvailability(): AncientChestReward | null {
        if (this.activeTier < 2) return null;
        // Find the LOWEST unclaimed threshold the player has reached
        for (let i = 0; i < CHEST_TIERS.length; i++) {
            const tier = CHEST_TIERS[i];
            if (this.stacks >= tier.threshold && !this.openedThresholds.has(tier.threshold)) {
                return tier;
            }
        }
        return null;
    }

    /** Player chose to OPEN the chest — spend stacks, get rewards */
    public openChest(reward: AncientChestReward): void {
        console.log('[Ancient] === CHEST OPENED: ' + reward.name + ' (' + this.stacks + ' stacks spent) ===');
        this.openedThresholds.add(reward.threshold);

        // Award gold
        this.shopManager.gold += reward.gold;

        // Award units (spawn to bench)
        for (const u of reward.units) {
            const newId = 'ancient-reward-' + u.name + '-' + Date.now();
            const unit = UnitFactory.createUnit(u.name, newId, u.starLevel);
            if (unit) {
                unit.faction = 'player';
                this.boardState.addUnitToBench(unit);
                console.log('[Ancient] Spawned ' + u.name + ' (' + u.starLevel + 'star) to bench');
            }
        }

        // Award duplicators
        for (let d = 0; d < reward.extraDuplicators; d++) {
            this.boardState.addItemToInventory('Lesser Duplicator');
        }

        // Award Ancient items
        for (const item of reward.items) {
            this.boardState.addItemToInventory(item);
            console.log('[Ancient] Item awarded: ' + item);
        }

        // Reset stacks
        this.stacks = 0;

        console.log('[Ancient] Stacks reset to 0');
    }

    /** Player chose to KEEP — continue accumulating */
    public keepChest(): void {
        console.log('[Ancient] Keep stacking... Current: ' + this.stacks);
    }

    public getActiveTier(): number {
        return this.activeTier;
    }

    public reset(): void {
        this.stacks = 0;
        this.openedThresholds.clear();
        this.activeTier = 0;

    }
}
