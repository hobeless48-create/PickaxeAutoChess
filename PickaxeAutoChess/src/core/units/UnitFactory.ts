// src/core/units/UnitFactory.ts

import { Unit } from './Unit';
import unitsCatalogRaw from '../data/units_catalog.json';
import facilityCatalogRaw from '../data/facility_catalog.json';

interface CatalogEntry {
    name: string;
    cost: number;
    faction: string;
    traits: string[];
    baseStats: {
        hp: number;
        atk: number;
        def: number;
        mdef: number;
        ap?: number;
        manaRegen?: number;
        critChance?: number;
        critDamage?: number;
        damageReduction?: number;
        finalDamage?: number;
        lifesteal?: number;
    };
    skill: {
        name: string;
        desc: string;
        manaInfo: string;
    };
}

export interface FacilityCatalogEntry {
    name: string;
    facilityType: 'Offensive' | 'Support' | 'Resource';
    cost: number;
    constructionRounds: number;
    traits: string[];
    baseStats: {
        hp: number;
        atk: number;
        def: number;
        mdef: number;
        ap?: number;
        manaRegen?: number;
        critChance?: number;
        critDamage?: number;
        damageReduction?: number;
        finalDamage?: number;
        lifesteal?: number;
    };
    attackRange?: number;
    icon: string;
    desc: string;
}

const catalog: CatalogEntry[] = unitsCatalogRaw as CatalogEntry[];
const facilityCatalog: FacilityCatalogEntry[] = facilityCatalogRaw as FacilityCatalogEntry[];

export class UnitFactory {
    static createUnit(name: string, id: string, starLevel: number = 1): Unit | null {
        const entry = catalog.find(u => u.name === name);
        if (!entry) return null;

        const scale = Math.pow(1.8, starLevel - 1);
        const rawBase = entry.baseStats;
        const scaledStats = {
            hp: Math.round(rawBase.hp * scale),
            atk: Math.round(rawBase.atk * scale),
            def: Math.round(rawBase.def * scale),
            mdef: Math.round(rawBase.mdef * scale),
            ap: Math.round((rawBase.ap || 0) * scale),
            manaRegen: rawBase.manaRegen || 0,
            critChance: rawBase.critChance !== undefined ? rawBase.critChance : 0.10,
            critDamage: rawBase.critDamage !== undefined ? rawBase.critDamage : 0.75,
            damageReduction: rawBase.damageReduction || 0.0,
            finalDamage: rawBase.finalDamage || 0.0,
            lifesteal: rawBase.lifesteal || 0.0
        };

        const unit = new Unit(id, entry.name, entry.cost, entry.faction, entry.traits, scaledStats);
        unit.state = 'Idle';
        unit.starLevel = starLevel;
        unit.skill = entry.skill;

        unit.effectiveATK = scaledStats.atk;
        unit.effectiveDEF = scaledStats.def;
        unit.effectiveMDEF = scaledStats.mdef;
        unit.effectiveAP = scaledStats.ap;
        unit.effectiveManaRegen = scaledStats.manaRegen;
        unit.effectiveAttackSpeed = unit.baseAttackSpeed;

        let startingMana = 0;
        let maxMana = 100;
        if (entry.skill && entry.skill.manaInfo) {
            const match = entry.skill.manaInfo.match(/\((\d+)\/(\d+)\)/);
            if (match) {
                startingMana = parseInt(match[1], 10);
                maxMana = parseInt(match[2], 10);
            }
        }
        unit.mana = startingMana;
        unit.maxMana = maxMana;

        // Set attackRange based on traits/class
        if (entry.traits.includes('Rangers')) {
            unit.attackRange = 4;
        } else if (
            entry.traits.includes('Magic Tower') ||
            entry.traits.includes('Plague Alchemist') ||
            entry.traits.includes('Chrono Scholar') ||
            entry.traits.includes('Card Gamblers')
        ) {
            unit.attackRange = 3;
        } else {
            unit.attackRange = 1;
        }

        return unit;
    }

    // Keep backwards compatibility wrappers
    static createSquire(id: string, starLevel: number = 1): Unit {
        return this.createUnit('Vanguard Squire', id, starLevel)!;
    }

    static createArcherApprentice(id: string, starLevel: number = 1): Unit {
        return this.createUnit('Archer Apprentice', id, starLevel)!;
    }

    static getFacilityCatalog(): FacilityCatalogEntry[] {
        return facilityCatalog;
    }

    static createFacilityFromCatalog(name: string, id: string, starLevel: number = 1): Unit | null {
        const entry = facilityCatalog.find(f => f.name === name);
        if (!entry) return null;

        const scale = Math.pow(1.5, starLevel - 1);
        const scaledStats = {
            hp: Math.round(entry.baseStats.hp * scale),
            atk: Math.round(entry.baseStats.atk * scale),
            def: Math.round(entry.baseStats.def * scale),
            mdef: Math.round(entry.baseStats.mdef * scale),
            ap: 0,
            manaRegen: 0,
            critChance: entry.baseStats.critChance || 0,
            critDamage: entry.baseStats.critDamage || 0,
            damageReduction: 0,
            finalDamage: 0,
            lifesteal: 0
        };

        const unit = new Unit(id, entry.name, entry.cost, 'Architect', entry.traits || ['Architect'], scaledStats);
        unit.effectiveATK = scaledStats.atk;
        unit.effectiveDEF = scaledStats.def;
        unit.effectiveMDEF = scaledStats.mdef;
        unit.effectiveAP = scaledStats.ap;
        unit.effectiveManaRegen = scaledStats.manaRegen;
        unit.effectiveAttackSpeed = unit.baseAttackSpeed;

        unit.isFacility = true;
        unit.facilityType = entry.facilityType;
        unit.facilityName = entry.name;
        unit.totalConstructionRounds = entry.constructionRounds;
        unit.constructionRoundsRemaining = entry.constructionRounds;
        unit.starLevel = starLevel;
        unit.attackRange = entry.attackRange || (entry.facilityType === 'Offensive' ? 3 : 0);
        return unit;
    }

    static createFacility(type: 'Offensive' | 'Support' | 'Resource', id: string, starLevel: number = 1, constructionDelay: number = 2): Unit {
        // Try finding a catalog entry matching type
        const match = facilityCatalog.find(f => f.facilityType === type);
        if (match) {
            const fac = this.createFacilityFromCatalog(match.name, id, starLevel)!;
            fac.constructionRoundsRemaining = constructionDelay;
            fac.totalConstructionRounds = constructionDelay;
            return fac;
        }

        const stats = {
            hp: 1000 * starLevel,
            atk: 0,
            def: 50 * starLevel,
            mdef: 50 * starLevel,
            ap: 0,
            manaRegen: 0,
            critChance: 0,
            critDamage: 0,
            damageReduction: 0,
            finalDamage: 0,
            lifesteal: 0
        };
        const traits = ['Architect'];
        const unit = new Unit(id, `${type} Facility`, 12, 'Architect', traits, stats);
        unit.effectiveATK = stats.atk;
        unit.effectiveDEF = stats.def;
        unit.effectiveMDEF = stats.mdef;
        unit.effectiveAP = stats.ap;
        unit.effectiveManaRegen = stats.manaRegen;
        unit.effectiveAttackSpeed = unit.baseAttackSpeed;
        unit.isFacility = true;
        unit.facilityType = type;
        unit.facilityName = `${type} Facility`;
        unit.totalConstructionRounds = constructionDelay;
        unit.constructionRoundsRemaining = constructionDelay;
        unit.starLevel = starLevel;
        unit.attackRange = type === 'Offensive' ? 3 : 0;
        return unit;
    }
}
