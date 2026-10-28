// src/core/board/BoardState.ts

import { hexDistance } from '../hex/HexGrid';
import type { Hex } from '../hex/HexGrid';
import { Unit } from '../units/Unit';
import { UnitFactory } from '../units/UnitFactory';
import { ItemManager } from '../stats/ItemManager';
import { bus } from '../events/EventBus';

export class BoardState {
    public width: number = 8;
    public height: number = 8;
    private units: Map<string, Unit> = new Map();
    private benchSlots: (Unit | null)[] = [null, null, null, null, null, null, null, null, null];
    public itemInventory: string[] = [];
    private onUnitUpgradeCallback?: (oldIds: string[], newUnit: Unit) => void;

    public onUnitUpgrade(cb: (oldIds: string[], newUnit: Unit) => void): void {
        this.onUnitUpgradeCallback = cb;
    }

    public reset(): void {
        this.units.clear();
        this.benchSlots = [null, null, null, null, null, null, null, null, null];
        this.itemInventory = [];
    }

    public addUnit(unit: Unit, hex: Hex): void {
        unit.hex = hex;
        unit.isOnBench = false;
        unit.benchSlotIndex = -1;
        this.units.set(unit.id, unit);

        // Perform 3-copy star upgrade check
        this.checkStarUpgrades(unit.name, unit.starLevel);
    }

    public addUnitToBench(unit: Unit): boolean {
        const freeIndex = this.benchSlots.indexOf(null);
        if (freeIndex !== -1) {
            unit.isOnBench = true;
            unit.benchSlotIndex = freeIndex;
            this.benchSlots[freeIndex] = unit;
            this.units.set(unit.id, unit);

            // Perform 3-copy star upgrade check
            this.checkStarUpgrades(unit.name, unit.starLevel);
            return true;
        }
        return false; // Bench is full
    }

    public getBenchSlots(): (Unit | null)[] {
        return this.benchSlots;
    }

    public addItemToInventory(itemName: string): boolean {
        this.itemInventory.push(itemName);
        return true;
    }

    public useItemRemover(unitId: string): boolean {
        const unit = this.units.get(unitId);
        if (!unit) return false;

        // Match all item mods regardless of format (component: 2 segments, completed: 3 segments)
        const itemMods = unit.modifiers.filter(m => m.id.startsWith('item|'));
        if (itemMods.length === 0) return false;

        console.log(`[Remover] Detaching ${itemMods.length} item modifiers from unit ${unit.name}`);

        // Recover item names: components have ID "item|Name" (2 parts),
        // completed items have a header sentinel "item|Name|header" (3 parts).
        const returnedNames = new Set<string>();
        for (const mod of itemMods) {
            const parts = mod.id.split('|');
            if (parts.length === 2) {
                // Component modifier: parts[1] is the full component name
                returnedNames.add(parts[1]);
            } else if (parts.length === 3 && parts[2] === 'header') {
                // Completed item header: parts[1] is the full result name
                returnedNames.add(parts[1]);
            }
            // Stat-detail mods (3 parts, non-header) are skipped — already covered by header
        }

        for (const name of returnedNames) {
            this.addItemToInventory(name);
        }

        // Evict all item modifiers from unit
        unit.modifiers = unit.modifiers.filter(m => !m.id.startsWith('item|'));
        unit.equippedItems = [];
        return true;
    }

    public useItemReforger(unitId: string): boolean {
        const unit = this.units.get(unitId);
        if (!unit) return false;

        const itemMods = unit.modifiers.filter(m => m.id.startsWith('item|'));
        if (itemMods.length === 0) return false;

        console.log(`[Reforger] Reforging items on unit ${unit.name}`);

        const componentsPool = ['Blunt Sword', 'Bow', 'Chestplate'];
        const completedPool = [
            "Sovereign's Edge", "Sage's Spear", "Aether Blade", "Colossus Sunderer"
        ];

        // Collect original item names (same logic as useItemRemover)
        const originalNames: string[] = [];
        for (const mod of itemMods) {
            const parts = mod.id.split('|');
            if (parts.length === 2) {
                originalNames.push(parts[1]);
            } else if (parts.length === 3 && parts[2] === 'header') {
                originalNames.push(parts[1]);
            }
        }

        for (const name of originalNames) {
            const isCompleted = completedPool.includes(name);
            const replacement = isCompleted
                ? completedPool[Math.floor(Math.random() * completedPool.length)]
                : componentsPool[Math.floor(Math.random() * componentsPool.length)];
            this.addItemToInventory(replacement);
            console.log(`[Reforger] Reforged: ${name} -> ${replacement}`);
        }

        // Evict all item modifiers from unit
        unit.modifiers = unit.modifiers.filter(m => !m.id.startsWith('item|'));
        unit.equippedItems = [];
        return true;
    }

    public combineInventoryItems(indexA: number, indexB: number): boolean {
        const itemA = this.itemInventory[indexA];
        const itemB = this.itemInventory[indexB];
        if (!itemA || !itemB || indexA === indexB) return false;

        // Try combining on a scratch unit to see if a recipe exists
        const mockUnit = new Unit('dummy', 'Dummy', 1, 'Human', [], { hp: 100, atk: 0, def: 0, mdef: 0 });
        ItemManager.attachComponent(mockUnit, itemA);
        ItemManager.attachComponent(mockUnit, itemB);

        // Look for the header sentinel that applyCompletedItem always pushes.
        // ID format: "item|{ResultName}|header"
        const headerMod = mockUnit.modifiers.find(
            m => m.id.startsWith('item|') && m.id.endsWith('|header')
        );

        if (headerMod) {
            const cleanResultName = headerMod.id.split('|')[1]; // safe: always 3 parts

            // Remove components from inventory (higher index first to preserve offsets)
            const first  = Math.max(indexA, indexB);
            const second = Math.min(indexA, indexB);
            this.itemInventory.splice(first, 1);
            this.itemInventory.splice(second, 1);

            this.itemInventory.push(cleanResultName);
            console.log(`[Inventory Combine] ${itemA} + ${itemB} -> ${cleanResultName}`);
            return true;
        }

        return false;
    }

    public attachInventoryItem(itemIndex: number, unitId: string): boolean {
        const item = this.itemInventory[itemIndex];
        const unit = this.units.get(unitId);
        if (!item || !unit) return false;

        // Special consumable checks
        if (item === 'Item Remover') {
            const success = this.useItemRemover(unitId);
            if (success) {
                this.itemInventory.splice(itemIndex, 1);
                return true;
            }
            return false;
        }

        if (item === 'Item Reforger') {
            const success = this.useItemReforger(unitId);
            if (success) {
                this.itemInventory.splice(itemIndex, 1);
                return true;
            }
            return false;
        }

        ItemManager.attachComponent(unit, item);
        this.itemInventory.splice(itemIndex, 1);
        return true;
    }

    public getBoardUnitsCount(): number {
        let count = 0;
        for (const u of this.units.values()) {
            if (u.faction === 'player' && !u.isOnBench && u.state !== 'Dead') {
                count++;
            }
        }
        return count;
    }

    public moveUnitToBoard(unitId: string, hex: Hex, maxCapacity: number = 9): boolean {
        const unit = this.units.get(unitId);
        if (!unit) return false;

        // Friendly board constraint (rows 4-7)
        if (hex.r < 4 || hex.r > 7) return false;

        if (this.isHexOccupied(hex)) return false;

        if (unit.isOnBench) {
            const currentOnBoard = this.getBoardUnitsCount();
            if (currentOnBoard >= maxCapacity) {
                console.warn(`[BoardState] Board is full! Level is ${maxCapacity}, units on board: ${currentOnBoard}`);
                return false;
            }
            this.benchSlots[unit.benchSlotIndex] = null;
            unit.isOnBench = false;
            unit.benchSlotIndex = -1;
        }

        unit.hex = hex;
        return true;
    }

    public moveUnitToBench(unitId: string, slotIndex: number): boolean {
        const unit = this.units.get(unitId);
        if (!unit || slotIndex < 0 || slotIndex >= 9 || this.benchSlots[slotIndex] !== null) return false;

        if (unit.isOnBench) {
            this.benchSlots[unit.benchSlotIndex] = null;
        }

        unit.isOnBench = true;
        unit.benchSlotIndex = slotIndex;
        this.benchSlots[slotIndex] = unit;
        return true;
    }

    public removeUnit(unitId: string): void {
        const unit = this.units.get(unitId);
        if (unit) {
            if (unit.isOnBench) {
                this.benchSlots[unit.benchSlotIndex] = null;
            }
            this.units.delete(unitId);
        }
    }

    public getUnit(unitId: string): Unit | undefined {
        return this.units.get(unitId);
    }

    public getAllUnits(): Unit[] {
        return Array.from(this.units.values());
    }

    // Scan for nearest enemy using O(1) hex distance checks
    public findNearestEnemy(sourceUnit: Unit, sourceFaction: string): Unit | null {
        let nearest: Unit | null = null;
        let minDistance = Infinity;

        for (const unit of this.units.values()) {
            if (unit.faction !== sourceFaction && unit.state !== 'Dead' && unit.state !== 'Dying' && !unit.isOnBench) {
                const dist = hexDistance(sourceUnit.hex, unit.hex);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = unit;
                }
            }
        }
        return nearest;
    }

    public isHexOccupied(hex: Hex): boolean {
        for (const unit of this.units.values()) {
            if (!unit.isOnBench && unit.hex.q === hex.q && unit.hex.r === hex.r && unit.state !== 'Dead' && unit.state !== 'Dying') {
                return true;
            }
        }
        return false;
    }

    private checkStarUpgrades(unitName: string, starLevel: number): void {
        if (starLevel >= 3) return; // Already max tier

        const matches = Array.from(this.units.values()).filter(
            u => u.name === unitName && u.starLevel === starLevel && u.faction === 'player'
        );

        if (matches.length >= 3) {
            console.log(`[Upgrade] Found 3 copies of ${unitName} at ${starLevel}★. Upgrading...`);

            // Check position context of first copy to swap upgraded unit into
            const targetHex = matches[0].hex;
            const targetIsOnBench = matches[0].isOnBench;
            const targetBenchSlot = matches[0].benchSlotIndex;

            const matchIds = matches.map(m => m.id);

            // Evict old copies
            for (const id of matchIds) {
                this.removeUnit(id);
            }

            // Spawn upgraded unit
            const nextStar = starLevel + 1;
            const newId = `player-upgraded-${unitName}-${Date.now()}`;
            
            const upgradedUnit = UnitFactory.createUnit(unitName, newId, nextStar);
            if (!upgradedUnit) {
                console.error(`Failed to create upgraded unit: ${unitName}`);
                return;
            }

            upgradedUnit.faction = 'player';

            if (targetIsOnBench) {
                upgradedUnit.isOnBench = true;
                upgradedUnit.benchSlotIndex = targetBenchSlot;
                this.benchSlots[targetBenchSlot] = upgradedUnit;
                this.units.set(upgradedUnit.id, upgradedUnit);
                // BUG 5 FIX: also check if this bench upgrade triggers a further star-up
                // (e.g. three 2★ units already present → auto-upgrades to 3★)
                this.checkStarUpgrades(upgradedUnit.name, upgradedUnit.starLevel);
            } else {
                this.addUnit(upgradedUnit, targetHex);
            }

            if (this.onUnitUpgradeCallback) {
                this.onUnitUpgradeCallback(matchIds, upgradedUnit);
            }

            bus.emit({ type: 'BOARD_UNITS_CHANGED' });
        }
    }
}
