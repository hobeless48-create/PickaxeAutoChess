// src/core/units/Unit.ts

import type { FSMState } from '../fsm/UnitFSM';
import type { Hex } from '../hex/HexGrid';
import type { Modifier } from '../stats/ModifierPipeline';

export interface UnitStats {
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
}

export interface FullUnitStats {
    hp: number;
    atk: number;
    def: number;
    mdef: number;
    ap: number;
    manaRegen: number;
    critChance: number;
    critDamage: number;
    damageReduction: number;
    finalDamage: number;
    lifesteal: number;
}

export class Unit {
    public id: string;
    public name: string;
    public cost: number;
    public faction: string;
    public traits: string[];
    public totalDamageDealt: number = 0;
    public totalDamageTaken: number = 0;
    public origin: string;
    public skill?: {
        name: string;
        desc: string;
        manaInfo: string;
    };
    
    // Position (optionally initialized)
    public hex!: Hex;
    public isOnBench: boolean = false;
    public benchSlotIndex: number = -1;
    public isDragging: boolean = false;
    
    // Stats & State
    public starLevel: number = 1;
    public state: FSMState = 'Idle';
    public baseStats: FullUnitStats;
    public currentHP: number;
    public maxHP: number;
    public mana: number = 0;
    public maxMana: number = 100;
    
    // Facility Properties
    public isFacility: boolean = false;
    public facilityType?: 'Offensive' | 'Support' | 'Resource';
    public facilityName?: string;
    public totalConstructionRounds: number = 2;
    public constructionRoundsRemaining: number = 0;
    
    // Backwards Compatibility fields
    public damageAmpModifier: number = 0;
    public damageReductionModifier: number = 0;
    public lifestealPercent: number = 0;

    public effectiveDEF: number = 0;
    public effectiveMDEF: number = 0;
    public effectiveATK: number = 0;
    public effectiveAP: number = 0;
    public effectiveManaRegen: number = 0;
    public effectiveCritChance: number = 0.10;
    public effectiveCritDamage: number = 0.75;
    public effectiveDamageReduction: number = 0.0;
    public effectiveFinalDamage: number = 0.0;
    public effectiveLifesteal: number = 0.0;
    
    public baseAttackSpeed: number = 0.65;
    public effectiveAttackSpeed: number = 0.65;
    public attackRange: number = 1;
    public equippedItems: string[] = [];
    
    public modifiers: Modifier[] = [];
    public targetId: string | null = null;
    public attackCooldown: number = 0;
    public moveCooldown: number = 0;

    // Item passive internal tracking
    public stormchargedAttackCount: number = 0;
    public berserkerGlaiveStacks: number = 0;
    public titansResolveStacks: number = 0;
    public vanguardsVowTriggered: boolean = false;

    constructor(
        id: string,
        name: string,
        cost: number,
        faction: string,
        traits: string[],
        baseStats: UnitStats
    ) {
        this.id = id;
        this.name = name;
        this.cost = cost;
        this.faction = faction;
        this.origin = faction; // Save original faction/origin (e.g. Human, Dragon)
        this.traits = traits;
        this.baseStats = {
            hp: baseStats.hp,
            atk: baseStats.atk,
            def: baseStats.def,
            mdef: baseStats.mdef,
            ap: baseStats.ap || 0,
            manaRegen: baseStats.manaRegen || 0,
            critChance: baseStats.critChance !== undefined ? baseStats.critChance : 0.10,
            critDamage: baseStats.critDamage !== undefined ? baseStats.critDamage : 0.75,
            damageReduction: baseStats.damageReduction || 0.0,
            finalDamage: baseStats.finalDamage || 0.0,
            lifesteal: baseStats.lifesteal || 0.0
        };
        this.maxHP = baseStats.hp;
        this.currentHP = baseStats.hp;
    }
}
