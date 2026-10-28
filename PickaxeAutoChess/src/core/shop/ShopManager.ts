import unitsCatalogRaw from '../data/units_catalog.json';
import facilityCatalogRaw from '../data/facility_catalog.json';
import { UnitFactory } from '../units/UnitFactory';
import { SynergyManager } from '../stats/SynergyManager';
import { BoardState } from '../board/BoardState';
import { Unit } from '../units/Unit';

export interface ShopCard {
    id?: string;
    name: string;
    cost: number;
    faction: string;
    traits: string[];
}

export interface FacilityShopCard {
    id?: string;
    name: string;
    facilityType: 'Offensive' | 'Support' | 'Resource';
    cost: number;
    constructionRounds: number;
    traits: string[];
    desc: string;
    icon: string;
}

const fullPool = unitsCatalogRaw as ShopCard[];
const facilityPool = facilityCatalogRaw as FacilityShopCard[];

export class ShopManager {
    public gold: number = 20; // Starting gold
    public level: number = 3;
    public xp: number = 0;
    public currentShop: (ShopCard | null)[] = [null, null, null, null, null];
    public currentFacilityShop: (FacilityShopCard | null)[] = [null, null, null];

    // XP requirements: Level 1 -> 2: 2, 2 -> 3: 6, 3 -> 4: 10, etc.
    private xpTable: Record<number, number> = {
        1: 2,
        2: 6,
        3: 10,
        4: 20,
        5: 36,
        6: 56,
        7: 80,
        8: 100,
        9: 9999
    };

    // Rolling percentages by level: [1-cost, 2-cost, 3-cost, 4-cost, 5-cost]
    private rollProbabilities: Record<number, number[]> = {
        1: [1.00, 0.00, 0.00, 0.00, 0.00],
        2: [0.75, 0.25, 0.00, 0.00, 0.00],
        3: [0.50, 0.30, 0.20, 0.00, 0.00],
        4: [0.38, 0.35, 0.25, 0.02, 0.00],
        5: [0.25, 0.43, 0.27, 0.05, 0.00],
        6: [0.20, 0.30, 0.39, 0.10, 0.01],
        7: [0.15, 0.20, 0.30, 0.30, 0.05],
        8: [0.10, 0.15, 0.25, 0.35, 0.15],
        9: [0.05, 0.10, 0.20, 0.30, 0.35]
    };

    private pool: ShopCard[] = fullPool;

    public buyXP(): boolean {
        if (this.gold >= 4 && this.level < 9) {
            this.gold -= 4;
            this.addXP(4);
            return true;
        }
        return false;
    }

    public reset(): void {
        this.gold = 20;
        this.level = 3;
        this.xp = 0;
        this.currentShop = [null, null, null, null, null];
        this.currentFacilityShop = [null, null, null];
        this.rollShop();
    }

    public addXP(amount: number): void {
        if (this.level >= 9) return;
        this.xp += amount;
        
        while (true) {
            const req = this.xpTable[this.level];
            if (req !== undefined && this.xp >= req) {
                this.xp -= req;
                this.level++;
            } else {
                break;
            }
        }
    }

    public getNextXPNeeded(): number {
        return this.xpTable[this.level] || 9999;
    }

    public reroll(): boolean {
        if (this.gold >= 2) {
            this.gold -= 2;
            this.rollShop();
            return true;
        }
        return false;
    }

    public rollShop(): void {
        const probs = this.rollProbabilities[this.level] || [1, 0, 0, 0, 0];
        for (let i = 0; i < 5; i++) {
            const rand = Math.random();
            let costTier = 1;
            let sum = 0;
            
            for (let t = 0; t < probs.length; t++) {
                sum += probs[t];
                if (rand <= sum) {
                    costTier = t + 1;
                    break;
                }
            }

            // Find unit in pool matching chosen cost tier
            const choices = this.pool.filter(u => u.cost === costTier);
            if (choices.length > 0) {
                const pick = choices[Math.floor(Math.random() * choices.length)];
                this.currentShop[i] = { ...pick, id: `card-${Date.now()}-${i}` };
            } else {
                // Fallback to lowest cost tier
                this.currentShop[i] = { ...this.pool[0], id: `card-${Date.now()}-${i}` };
            }
        }

        this.rollFacilityShop();
    }

    public rollFacilityShop(): void {
        for (let i = 0; i < 3; i++) {
            const pick = facilityPool[Math.floor(Math.random() * facilityPool.length)];
            this.currentFacilityShop[i] = { ...pick, id: `fac-card-${Date.now()}-${i}` };
        }
    }

    public getFacilityCapacityLimit(boardState: BoardState): number {
        const activeTraits = SynergyManager.calculateSynergies(boardState.getAllUnits());
        const architects = activeTraits.get('Architect') || 0;
        // Base capacity 3, increased to 4 at Architect (4) synergy
        return architects >= 4 ? 4 : 3;
    }

    public getPlayerFacilityCount(boardState: BoardState): number {
        let count = 0;
        for (const unit of boardState.getAllUnits()) {
            if (unit.faction === 'player' && unit.isFacility && unit.state !== 'Dead') {
                count++;
            }
        }
        return count;
    }

    public canBuyFacility(boardState: BoardState): boolean {
        return this.getPlayerFacilityCount(boardState) < this.getFacilityCapacityLimit(boardState);
    }

    public buyFacility(index: number, boardState: BoardState): Unit | null {
        const card = this.currentFacilityShop[index];
        if (!card) return null;

        if (this.gold < card.cost) {
            console.warn(`[Shop] Not enough gold to buy facility ${card.name} (${card.cost}g required, have ${this.gold}g).`);
            return null;
        }

        if (!this.canBuyFacility(boardState)) {
            console.warn(`[Shop] Facility capacity limit reached (${this.getPlayerFacilityCount(boardState)}/${this.getFacilityCapacityLimit(boardState)}).`);
            return null;
        }

        const facilityUnit = UnitFactory.createFacilityFromCatalog(card.name, `player-facility-${Date.now()}-${index}`);
        if (!facilityUnit) return null;

        facilityUnit.faction = 'player';

        // Try placing on board first (rows 4-7, columns 0-7)
        let placed = false;
        for (let r = 4; r <= 7; r++) {
            for (let q = 0; q < 8; q++) {
                const hex = { q, r };
                if (!boardState.isHexOccupied(hex)) {
                    boardState.addUnit(facilityUnit, hex);
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }

        // Fallback to bench if board is full
        if (!placed) {
            placed = boardState.addUnitToBench(facilityUnit);
        }

        if (placed) {
            this.gold -= card.cost;
            this.currentFacilityShop[index] = null;
            console.log(`[Shop] Purchased facility: ${facilityUnit.name}`);
            return facilityUnit;
        } else {
            console.warn(`[Shop] Could not place facility on board or bench!`);
            return null;
        }
    }

    public buyUnit(index: number): ShopCard | null {
        const card = this.currentShop[index];
        if (card && this.gold >= card.cost) {
            this.gold -= card.cost;
            this.currentShop[index] = null;
            return card;
        }
        return null;
    }

    public addRoundGold(
        win: boolean,
        streak: number,
        activeTraits?: Map<string, number>,
        roundNum?: number,
        boardUnits?: any[]
    ): void {
        // Base income
        let payout = 5;

        // Interest calculation: +1g per 10g saved
        const nobles = activeTraits?.get('Noble') || 0;
        let interestCap = 5;
        if (nobles >= 6) {
            interestCap = 8; // Maxes at 8g interest for 70g Noble cap
        }
        
        const interest = Math.min(interestCap, Math.floor(this.gold / 10));
        payout += interest;

        // Noble permanent HP scaling
        if (nobles >= 6 && boardUnits) {
            const hpGrant = nobles >= 9 ? 10 : 2.5; // +20 HP per 2 interest (Tier 9) -> 10 HP/interest; +5 HP per 2 interest (Tier 6) -> 2.5 HP/interest
            const totalHpToGrant = Math.floor(interest * hpGrant);
            if (totalHpToGrant > 0) {
                for (const unit of boardUnits) {
                    if (unit.faction === 'player' && unit.origin === 'Noble') {
                        unit.modifiers.push({
                            id: `synergy-noble-permanent-hp-${Date.now()}`,
                            source: 'synergy',
                            type: 'flat',
                            statType: 'HP',
                            value: totalHpToGrant,
                            duration: -1
                        });
                        unit.maxHP += totalHpToGrant;
                        unit.currentHP += totalHpToGrant;
                        console.log(`[Noble Synergy] Granted permanent +${totalHpToGrant} HP to ${unit.name}`);
                    }
                }
            }
        }

        // Noble (9): gain 25% of total gold balance at round end
        if (nobles >= 9) {
            const nobleGoldBonus = Math.floor(this.gold * 0.25);
            payout += nobleGoldBonus;
            console.log(`[Noble Synergy] Level 9: +25% gold balance bonus of +${nobleGoldBonus}g`);
        }

        // Noble (3): +1 Gold at end of even rounds
        if (nobles >= 3 && roundNum && roundNum % 2 === 0) {
            payout += 1;
            console.log(`[Noble Synergy] Level 3: even round +1 gold bonus`);
        }

        // Streak calculations
        if (streak >= 5) payout += 4;
        else if (streak >= 3) payout += 2;
        else if (streak >= 2) payout += 1;

        if (win) payout += 1; // Round win bonus

        this.gold += payout;
    }

    /**
     * Calculate the sell refund for a unit.
     * 1★  → full cost (e.g. 2g unit → 2g refund)
     * 2★  → cost × 3 − 1  (3 copies spent − 1)
     * 3★  → cost × 9 − 1  (9 copies spent − 1)
     */
    public sellRefund(cost: number, starLevel: number): number {
        if (starLevel === 2) return Math.max(0, cost * 3 - 1);
        if (starLevel >= 3) return Math.max(0, cost * 9 - 1);
        return cost; // 1★ full refund
    }

    public addGold(amount: number): void {
        this.gold += amount;
    }
}
