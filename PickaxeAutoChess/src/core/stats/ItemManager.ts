// src/core/stats/ItemManager.ts

import { Unit } from '../units/Unit';
import type { Modifier } from './ModifierPipeline';
import recipesRaw from '../data/recipes.json';

export interface ItemRecipe {
    result: string;
    componentA: string;
    componentB: string;
    stats: Record<string, number>;
}

const recipes: ItemRecipe[] = recipesRaw as unknown as ItemRecipe[];

export class ItemManager {
    private static components: Record<string, Modifier> = {
        'Blunt Sword': { id: 'item|Blunt Sword', source: 'item', type: 'percent', statType: 'ATK', value: 10, duration: -1 },
        'Bow':         { id: 'item|Bow',         source: 'item', type: 'percent', statType: 'AttackSpeed', value: 10, duration: -1 },
        'Chestplate':  { id: 'item|Chestplate',  source: 'item', type: 'flat',    statType: 'DEF', value: 20, duration: -1 },
        'Mana Crystal':{ id: 'item|Mana Crystal',source: 'item', type: 'flat',    statType: 'ManaRegen', value: 6, duration: -1 },
        'Magic Orb':   { id: 'item|Magic Orb',   source: 'item', type: 'percent', statType: 'AP', value: 10, duration: -1 },
        'Cloak':       { id: 'item|Cloak',       source: 'item', type: 'flat',    statType: 'MDEF', value: 20, duration: -1 },
        'Dagger':      { id: 'item|Dagger',      source: 'item', type: 'percent', statType: 'CritChance', value: 10, duration: -1 },
        'Belt':        { id: 'item|Belt',        source: 'item', type: 'flat',    statType: 'HP', value: 150, duration: -1 },
        // Ancient Unique Items (permanent, no recipe combining)
        'Relic Shard':     { id: 'ancient|Relic Shard',     source: 'item', type: 'flat',    statType: 'HP', value: 25, duration: -1 },
        'Timeworn Amulet': { id: 'ancient|Timeworn Amulet', source: 'item', type: 'flat',    statType: 'DEF', value: 8, duration: -1 },
        "Crown of Eons":  { id: 'ancient|Crown of Eons',  source: 'item', type: 'percent', statType: 'ATK', value: 15, duration: -1 },
        "Scepter of Ages":{ id: 'ancient|Scepter of Ages',source: 'item', type: 'percent', statType: 'ATK', value: 20, duration: -1 },
        'Ark of Eternity': { id: 'ancient|Ark of Eternity',source: 'item', type: 'flat',    statType: 'HP', value: 500, duration: -1 }
    };

    public static attachComponent(unit: Unit, componentName: string): void {
        // Special handling for Ancient items: apply multiple stat modifiers
        if (componentName === 'Timeworn Amulet') {
            if (unit.equippedItems.length >= 3) { console.warn('[ItemManager] Unit ' + unit.name + ' already has 3 items!'); return; }
            unit.modifiers.push({ id: 'ancient|Timeworn Amulet|DEF', source: 'item', type: 'flat', statType: 'DEF', value: 8, duration: -1 });
            unit.modifiers.push({ id: 'ancient|Timeworn Amulet|MDEF', source: 'item', type: 'flat', statType: 'MDEF', value: 8, duration: -1 });
            unit.equippedItems.push(componentName);
            return;
        }
        if (componentName === 'Ark of Eternity') {
            if (unit.equippedItems.length >= 3) { console.warn('[ItemManager] Unit ' + unit.name + ' already has 3 items!'); return; }
            unit.modifiers.push({ id: 'ancient|Ark of Eternity|HP', source: 'item', type: 'flat', statType: 'HP', value: 500, duration: -1 });
            unit.modifiers.push({ id: 'ancient|Ark of Eternity|DEF', source: 'item', type: 'flat', statType: 'DEF', value: 20, duration: -1 });
            unit.modifiers.push({ id: 'ancient|Ark of Eternity|MDEF', source: 'item', type: 'flat', statType: 'MDEF', value: 20, duration: -1 });
            unit.modifiers.push({ id: 'ancient|Ark of Eternity|DMG', source: 'item', type: 'percent', statType: 'FinalDamage', value: 25, duration: -1 });
            unit.equippedItems.push(componentName);
            return;
        }
        // Scepter of Ages gives both ATK and AP
        if (componentName === "Scepter of Ages") {
            if (unit.equippedItems.length >= 3) { console.warn('[ItemManager] Unit ' + unit.name + ' already has 3 items!'); return; }
            unit.modifiers.push({ id: 'ancient|Scepter of Ages|ATK', source: 'item', type: 'percent', statType: 'ATK', value: 20, duration: -1 });
            unit.modifiers.push({ id: 'ancient|Scepter of Ages|AP', source: 'item', type: 'percent', statType: 'AP', value: 20, duration: -1 });
            unit.equippedItems.push(componentName);
            return;
        }
        const mod = this.components[componentName];
        if (!mod) return;

        if (unit.equippedItems.length >= 3) {
            console.warn(`[ItemManager] Unit ${unit.name} already has 3 items!`);
            return;
        }

        // Only look at single-component (not completed-item) modifiers for combining.
        // Completed-item mods have IDs like "item|RecipeName|ATK"; component mods are "item|ComponentName".
        const existingComponents = unit.modifiers.filter(
            m => m.id.startsWith('item|') && m.id.split('|').length === 2
        );
        let combined = false;

        for (const existing of existingComponents) {
            // Safe: everything after the first "item|" is the full component name (no further splitting)
            const cleanName = existing.id.slice(5); // length of "item|"
            const recipe = recipes.find(r =>
                (r.componentA === componentName && r.componentB === cleanName) ||
                (r.componentB === componentName && r.componentA === cleanName)
            );

            if (recipe) {
                unit.modifiers = unit.modifiers.filter(m => m.id !== existing.id);
                const idx = unit.equippedItems.indexOf(cleanName);
                if (idx !== -1) {
                    unit.equippedItems.splice(idx, 1);
                }
                this.applyCompletedItem(unit, recipe);
                combined = true;
                break;
            }
        }

        if (!combined) {
            unit.modifiers.push({ ...mod, id: `item|${componentName}` });
            unit.equippedItems.push(componentName);
        }
    }

    private static applyCompletedItem(unit: Unit, recipe: ItemRecipe): void {
        console.log(`[Item Combine] Combined into: ${recipe.result}`);
        unit.equippedItems.push(recipe.result);

        // Push a "header" sentinel so useItemRemover/Reforger can identify the completed item by name.
        // ID format: "item|{ResultName}|header" — three pipe-separated segments.
        unit.modifiers.push({
            id: `item|${recipe.result}|header`,
            source: 'item',
            type: 'flat',
            statType: 'HP',   // zero-value sentinel, does not affect stats
            value: 0,
            duration: -1
        });
        
        for (const [statName, val] of Object.entries(recipe.stats)) {
            let statType: string | null = null;
            let type: 'flat' | 'percent' = 'percent';

            if (statName.includes('AttackSpeed') || statName.includes('Speed')) {
                statType = 'AttackSpeed';
            } else if (statName.includes('Physical Attack') || statName.includes('ATK')) {
                statType = 'ATK';
            } else if (statName.includes('Magic Attack') || statName.includes('AP')) {
                statType = 'AP';
            } else if (statName === 'DEF' || statName.includes('Defense')) {
                statType = 'DEF';
                type = 'flat';
            } else if (statName === 'MDEF') {
                statType = 'MDEF';
                type = 'flat';
            } else if (statName === 'Critical Chance') {
                statType = 'CritChance';
            } else if (statName === 'HP') {
                statType = 'HP';
                type = 'flat';
            } else if (statName === 'Mana Regen') {
                statType = 'ManaRegen';
                type = 'flat';
            }

            if (statType) {
                // ID format: "item|{ResultName}|{StatType}" — three segments, no ambiguity
                unit.modifiers.push({
                    id: `item|${recipe.result}|${statType}`,
                    source: 'item',
                    type: type,
                    statType: statType,
                    value: val,
                    duration: -1
                });
            }
        }

        // Apply item-specific passive stat modifiers
        if (recipe.result === "Sovereign's Edge") {
            unit.modifiers.push({
                id: `item|Sovereign's Edge|Lifesteal`,
                source: 'item',
                type: 'flat',
                statType: 'Lifesteal',
                value: 0.15,
                duration: -1
            });
        } else if (recipe.result === 'Vampiric Greatsword') {
            unit.modifiers.push({
                id: `item|Vampiric Greatsword|Lifesteal`,
                source: 'item',
                type: 'flat',
                statType: 'Lifesteal',
                value: 0.15,
                duration: -1
            });
        } else if (recipe.result === "Archmage's Crown") {
            unit.modifiers.push({
                id: `item|Archmage's Crown|FinalDamage`,
                source: 'item',
                type: 'flat',
                statType: 'FinalDamage',
                value: 0.20,
                duration: -1
            });
        } else if (recipe.result === 'Ruinous Edge') {
            unit.modifiers.push({
                id: `item|Ruinous Edge|CritDamage`,
                source: 'item',
                type: 'flat',
                statType: 'CritDamage',
                value: 0.25,
                duration: -1
            });
        } else if (recipe.result === "Marksman's Longbow") {
            unit.attackRange += 1;
        }
    }
}
