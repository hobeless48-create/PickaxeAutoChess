// src/core/items/LootOrbSystem.ts

export interface LootOrb {
    id: string;
    type: 'gray' | 'blue' | 'gold';
    position: { x: number; z: number };
    content: {
        gold?: number;
        unitCost?: number;
        itemComponent?: string;
        spatula?: boolean;
        fullItem?: string;
    };
}

export class LootOrbSystem {
    private activeOrbs: LootOrb[] = [];

    /**
     * Generates dynamic loot orbs for PvE rounds (Stage 1-1, 1-2, 1-3, 2-7, etc.).
     */
    public spawnPvELootOrbs(stage: number, _round: number): LootOrb[] {
        const spawned: LootOrb[] = [];
        const count = stage === 1 ? 2 : 3;

        for (let i = 0; i < count; i++) {
            const rand = Math.random();
            let type: 'gray' | 'blue' | 'gold' = 'gray';
            if (rand > 0.85) type = 'gold';
            else if (rand > 0.5) type = 'blue';

            const orb: LootOrb = {
                id: `orb-${Date.now()}-${i}`,
                type,
                position: { x: (Math.random() - 0.5) * 6, z: (Math.random() - 0.5) * 4 },
                content: {}
            };

            if (type === 'gray') {
                if (Math.random() > 0.5) orb.content.gold = Math.floor(Math.random() * 3) + 2;
                else orb.content.unitCost = 1;
            } else if (type === 'blue') {
                if (Math.random() > 0.4) orb.content.itemComponent = 'BF Sword';
                else orb.content.gold = 6;
            } else {
                if (Math.random() > 0.5) orb.content.spatula = true;
                else orb.content.fullItem = 'Rabadon\'s Deathcap';
            }

            spawned.push(orb);
            this.activeOrbs.push(orb);
        }

        return spawned;
    }

    public claimOrb(id: string): LootOrb | undefined {
        const idx = this.activeOrbs.findIndex(o => o.id === id);
        if (idx !== -1) {
            const [orb] = this.activeOrbs.splice(idx, 1);
            return orb;
        }
        return undefined;
    }

    public getActiveOrbs(): LootOrb[] {
        return this.activeOrbs;
    }

    public clear(): void {
        this.activeOrbs = [];
    }
}
