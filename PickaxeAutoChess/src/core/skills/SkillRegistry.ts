// src/core/skills/SkillRegistry.ts

import { Unit } from '../units/Unit';
import { BoardState } from '../board/BoardState';
import { resolveDamage } from '../combat/CombatEngine';
import { hexDistance, hexNeighbors } from '../hex/HexGrid';
import { getActualStat } from '../stats/ModifierPipeline';
import { bus } from '../events/EventBus';
import { UnitFactory } from '../units/UnitFactory';

export interface SkillContext {
    caster: Unit;
    target: Unit | null;
    boardState: BoardState;
    shopManager?: any; // Pass shopManager for gold-giving skills like Tax Collector
}

export type SkillExecuteFn = (ctx: SkillContext) => void;

class SkillRegistry {
    private registry: Map<string, SkillExecuteFn> = new Map();

    constructor() {
        this.registerAllSkills();
    }

    public register(unitName: string, fn: SkillExecuteFn): void {
        this.registry.set(unitName, fn);
    }

    public execute(unitName: string, ctx: SkillContext): boolean {
        const fn = this.registry.get(unitName);
        if (!fn) {
            console.warn(`No skill registered for unit: ${unitName}`);
            return false;
        }
        fn(ctx);
        return true;
    }

    private registerAllSkills(): void {
        // --- HUMANS ---
        this.register('Royal Shieldbearer', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'fortify' });
            const shieldAmount = caster.starLevel === 1 ? 220 : (caster.starLevel === 2 ? 380 : 600);
            caster.modifiers.push({
                id: `skill-fortify-shield-${Date.now()}`,
                source: 'skill',
                type: 'flat',
                statType: 'HP',
                value: shieldAmount,
                duration: 80
            });
            caster.currentHP = Math.min(caster.maxHP + shieldAmount, caster.currentHP + shieldAmount);

            for (const ally of boardState.getAllUnits()) {
                if (ally.faction === caster.faction && !ally.isOnBench && ally.id !== caster.id) {
                    if (hexDistance(caster.hex, ally.hex) <= 1) {
                        ally.modifiers.push({
                            id: `skill-fortify-def-${Date.now()}`,
                            source: 'skill',
                            type: 'flat',
                            statType: 'DEF',
                            value: 20,
                            duration: 80
                        });
                        ally.effectiveDEF = getActualStat(ally.baseStats.def, ally.modifiers, 'DEF');
                    }
                }
            }
        });

        this.register('Vanguard Squire', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'shield-bash' });
            const dmgScale = caster.starLevel === 1 ? 1.30 : (caster.starLevel === 2 ? 1.95 : 3.05);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            target.modifiers.push({
                id: `skill-bash-stun-${Date.now()}`,
                source: 'skill',
                type: 'flat',
                statType: 'Stun',
                value: 1,
                duration: 30
            });
        });

        this.register('Archer Apprentice', ({ caster, target, boardState }) => {
            const enemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            let farthestEnemy = target || enemies[0];
            if (!farthestEnemy) return;
            let maxDist = -1;
            for (const enemy of enemies) {
                const d = hexDistance(caster.hex, enemy.hex);
                if (d > maxDist) {
                    maxDist = d;
                    farthestEnemy = enemy;
                }
            }
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'steady-shot' });
            const dmgScale = caster.starLevel === 1 ? 1.50 : (caster.starLevel === 2 ? 2.25 : 3.30);
            resolveDamage(caster, farthestEnemy, caster.baseStats.atk * dmgScale, 'physical');
        });

        this.register('Spellscribe', ({ caster, boardState }) => {
            const allies = boardState.getAllUnits().filter(u => u.faction === caster.faction && !u.isOnBench && u.state !== 'Dead');
            let targetAlly = caster;
            let maxAS = -1;
            for (const ally of allies) {
                if (ally.effectiveAttackSpeed > maxAS) {
                    maxAS = ally.effectiveAttackSpeed;
                    targetAlly = ally;
                }
            }
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'haste-rune' });
            const speedBonus = caster.starLevel === 1 ? 30 : (caster.starLevel === 2 ? 45 : 70);
            targetAlly.modifiers.push({
                id: `skill-haste-rune-${Date.now()}`,
                source: 'skill',
                type: 'percent',
                statType: 'AttackSpeed',
                value: speedBonus,
                duration: 100
            });
            targetAlly.effectiveAttackSpeed = getActualStat(targetAlly.baseAttackSpeed, targetAlly.modifiers, 'AttackSpeed');
        });

        this.register('Cavalry Captain', ({ caster, target, boardState }) => {
            const enemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            let farthestEnemy = target || enemies[0];
            if (!farthestEnemy) return;
            let maxDist = -1;
            for (const enemy of enemies) {
                const d = hexDistance(caster.hex, enemy.hex);
                if (d > maxDist) {
                    maxDist = d;
                    farthestEnemy = enemy;
                }
            }
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'lance-charge' });
            const dmgScale = caster.starLevel === 1 ? 2.60 : (caster.starLevel === 2 ? 3.80 : 5.80);
            resolveDamage(caster, farthestEnemy, caster.baseStats.atk * dmgScale, 'physical');
            
            const neighbors = hexNeighbors(farthestEnemy.hex);
            const targetHex = neighbors.find(n => !boardState.isHexOccupied(n)) || caster.hex;
            const prev = { ...caster.hex };
            caster.hex = targetHex;
            bus.emit({ type: 'UNIT_MOVED', unitId: caster.id, from: prev, to: targetHex });

            for (const enemy of enemies) {
                if (hexDistance(caster.hex, enemy.hex) <= 1 && enemy.id !== farthestEnemy.id) {
                    const nList = hexNeighbors(enemy.hex);
                    const knockHex = nList.find(n => !boardState.isHexOccupied(n));
                    if (knockHex) {
                        const ePrev = { ...enemy.hex };
                        enemy.hex = knockHex;
                        bus.emit({ type: 'UNIT_MOVED', unitId: enemy.id, from: ePrev, to: knockHex });
                    }
                }
            }
        });

        this.register('High Commander', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'commanding-rally' });
            const shieldAmount = caster.starLevel === 1 ? 250 : (caster.starLevel === 2 ? 430 : 800);
            const ampBonus = caster.starLevel === 1 ? 20 : (caster.starLevel === 2 ? 30 : 50);

            for (const ally of boardState.getAllUnits()) {
                if (ally.faction === caster.faction && !ally.isOnBench && ally.state !== 'Dead') {
                    ally.modifiers.push({
                        id: `skill-rally-shield-${Date.now()}`,
                        source: 'skill',
                        type: 'flat',
                        statType: 'HP',
                        value: shieldAmount,
                        duration: 120
                    });
                    ally.currentHP = Math.min(ally.maxHP + shieldAmount, ally.currentHP + shieldAmount);

                    ally.modifiers.push({
                        id: `skill-rally-amp-${Date.now()}`,
                        source: 'skill',
                        type: 'percent',
                        statType: 'FinalDamage',
                        value: ampBonus,
                        duration: 120
                    });
                    ally.effectiveFinalDamage = getActualStat(ally.baseStats.finalDamage, ally.modifiers, 'FinalDamage');
                    ally.damageAmpModifier = ally.effectiveFinalDamage;
                }
            }

            const enemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const enemy of enemies) {
                enemy.modifiers.push({
                    id: `skill-rally-stun-${Date.now()}`,
                    source: 'skill',
                    type: 'flat',
                    statType: 'Stun',
                    value: 1,
                    duration: 20
                });
            }
        });

        // --- ANCIENTS ---
        this.register('Relic Squire', ({ caster }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'warding-seal' });
            const shieldAmt = caster.starLevel === 1 ? 180 : (caster.starLevel === 2 ? 310 : 490);
            caster.modifiers.push({ id: `skill-ward-shield-${Date.now()}`, source: 'skill', type: 'flat', statType: 'HP', value: shieldAmt, duration: 80 });
            caster.currentHP = Math.min(caster.maxHP + shieldAmt, caster.currentHP + shieldAmt);
            caster.modifiers.push({ id: `skill-ward-reflect-${Date.now()}`, source: 'skill', type: 'flat', statType: 'ReflectDamage', value: 15, duration: 80 });
        });

        this.register('Tomb Raider', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'quick-slash' });
            const dmgScale = caster.starLevel === 1 ? 1.40 : (caster.starLevel === 2 ? 2.05 : 3.20);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            caster.mana = Math.min(caster.maxMana, caster.mana + 15);
        });

        this.register('Ancient Scribe', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'time-lock' });
            const dmgScale = caster.starLevel === 1 ? 1.65 : (caster.starLevel === 2 ? 2.45 : 3.85);
            resolveDamage(caster, target, (caster.baseStats.ap || 0) * dmgScale, 'magic');
            target.modifiers.push({ id: `skill-time-lock-${Date.now()}`, source: 'skill', type: 'flat', statType: 'ManaPause', value: 1, duration: 60 });
        });

        this.register('Stone Protector', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'relic-aegis' });
            const defAmt = caster.starLevel === 1 ? 25 : (caster.starLevel === 2 ? 45 : 70);
            caster.modifiers.push({ id: `skill-aegis-def-${Date.now()}`, source: 'skill', type: 'flat', statType: 'DEF', value: defAmt, duration: 100 });
            caster.modifiers.push({ id: `skill-aegis-mdef-${Date.now()}`, source: 'skill', type: 'flat', statType: 'MDEF', value: defAmt, duration: 100 });
            caster.effectiveDEF += defAmt;
            caster.effectiveMDEF += defAmt;
            const tauntEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead');
            for (const e of tauntEnemies) {
                if (hexDistance(e.hex, caster.hex) <= 2) {
                    e.targetId = caster.id;
                }
            }
        });

        this.register('Runecarver', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'runic-cascade' });
            const dmgScale = caster.starLevel === 1 ? 2.10 : (caster.starLevel === 2 ? 3.05 : 4.80);
            const runeEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of runeEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 1) {
                    resolveDamage(caster, e, (caster.baseStats.ap || 0) * dmgScale, 'magic');
                }
            }
        });

        this.register('Relic Colossus', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'colossal-smash' });
            const dmgScale = caster.starLevel === 1 ? 2.55 : (caster.starLevel === 2 ? 3.75 : 5.80);
            const smashEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of smashEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 1) {
                    resolveDamage(caster, e, caster.baseStats.atk * dmgScale, 'physical');
                    e.modifiers.push({ id: `skill-colossus-stun-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 40 });
                }
            }
        });

        this.register('Relic Titan', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'titans-judgment' });
            const dmgScale = caster.starLevel === 1 ? 3.00 : (caster.starLevel === 2 ? 4.50 : 7.50);
            const shieldAmt = caster.starLevel === 1 ? 300 : (caster.starLevel === 2 ? 500 : 900);
            caster.modifiers.push({
                id: `skill-titan-shield-${Date.now()}`,
                source: 'skill',
                type: 'flat',
                statType: 'HP',
                value: shieldAmt,
                duration: 100
            });
            caster.currentHP = Math.min(caster.maxHP + shieldAmt, caster.currentHP + shieldAmt);
            const titanEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of titanEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 1) {
                    resolveDamage(caster, e, caster.baseStats.atk * dmgScale, 'physical');
                    e.modifiers.push({ id: `skill-titan-stun-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 40 });
                }
            }
        });

        // --- NOBLES ---
        this.register('Merchant Guard', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'guarded-cleaves' });
            const dmgScale = caster.starLevel === 1 ? 1.30 : (caster.starLevel === 2 ? 1.95 : 3.05);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            caster.modifiers.push({ id: `skill-guard-def-${Date.now()}`, source: 'skill', type: 'flat', statType: 'DEF', value: 15, duration: 80 });
            caster.effectiveDEF += 15;
        });

        this.register('Tax Collector', ({ caster, target, shopManager }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'gold-extract' });
            const dmgScale = caster.starLevel === 1 ? 1.85 : (caster.starLevel === 2 ? 2.70 : 4.25);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            if (target.currentHP <= 0 && shopManager) {
                shopManager.gold += 1;
                console.log(`[Tax Collector] Killed target! Gained +1 gold. Total: ${shopManager.gold}`);
            }
        });

        this.register('Aristocrat Duelist', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'noble-thrust' });
            const dmgScale = caster.starLevel === 1 ? 2.20 : (caster.starLevel === 2 ? 3.20 : 5.00);
            const ignoreDef = target.effectiveDEF * 0.30;
            target.effectiveDEF -= ignoreDef;
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            target.effectiveDEF += ignoreDef;
        });

        this.register('Royal Alchemist', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'midas-touch' });
            const dmgScale = caster.starLevel === 1 ? 2.10 : (caster.starLevel === 2 ? 3.05 : 4.80);
            resolveDamage(caster, target, (caster.baseStats.ap || 0) * dmgScale, 'magic');
            target.modifiers.push({ id: `skill-midas-stun-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 30 });
        });

        this.register('Gilded Baron', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'bribe' });
            const dmgScale = caster.starLevel === 1 ? 2.50 : (caster.starLevel === 2 ? 3.65 : 5.65);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            target.modifiers.push({ id: `skill-bribe-disarm-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Disarmed', value: 1, duration: 60 });
        });

        this.register('Noble Duchess', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'gilded-blessing' });
            const healPct = caster.starLevel === 1 ? 0.20 : (caster.starLevel === 2 ? 0.35 : 0.70);
            const shieldAmt = caster.starLevel === 1 ? 250 : (caster.starLevel === 2 ? 430 : 800);
            const blessAllies = boardState.getAllUnits().filter(u => u.faction === caster.faction && !u.isOnBench && u.state !== 'Dead');
            for (const ally of blessAllies) {
                const missingHP = ally.maxHP - ally.currentHP;
                const healAmt = Math.round(missingHP * healPct);
                ally.currentHP = Math.min(ally.maxHP, ally.currentHP + healAmt);
                ally.modifiers.push({ id: `skill-blessing-shield-${Date.now()}`, source: 'skill', type: 'flat', statType: 'HP', value: shieldAmt, duration: 100 });
                ally.currentHP = Math.min(ally.maxHP + shieldAmt, ally.currentHP + shieldAmt);
            }
        });

        // --- DWARVES ---
        this.register('Apprentice Blacksmith', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'hammer-strike' });
            const dmgScale = caster.starLevel === 1 ? 1.40 : (caster.starLevel === 2 ? 2.10 : 3.25);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            target.modifiers.push({ id: `skill-hammer-shred-${Date.now()}`, source: 'skill', type: 'percent', statType: 'DEF', value: -25, duration: 80 });
        });

        this.register('Dwarven Cannoneer', ({ caster, target, boardState }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'blackpowder-shell' });
            const dmgScale = caster.starLevel === 1 ? 1.70 : (caster.starLevel === 2 ? 2.50 : 3.90);
            const blastEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of blastEnemies) {
                if (hexDistance(target.hex, e.hex) <= 1) {
                    resolveDamage(caster, e, caster.baseStats.atk * dmgScale, 'physical');
                }
            }
        });

        this.register('Forge Mason', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'fortified-brick' });
            const shieldAmt = caster.starLevel === 1 ? 280 : (caster.starLevel === 2 ? 460 : 750);
            caster.modifiers.push({ id: `skill-mason-shield-${Date.now()}`, source: 'skill', type: 'flat', statType: 'HP', value: shieldAmt, duration: 80 });
            caster.currentHP = Math.min(caster.maxHP + shieldAmt, caster.currentHP + shieldAmt);
            for (const ally of boardState.getAllUnits()) {
                if (ally.faction === caster.faction && !ally.isOnBench && ally.id !== caster.id && hexDistance(caster.hex, ally.hex) <= 1) {
                    ally.modifiers.push({ id: `skill-mason-def-${Date.now()}`, source: 'skill', type: 'flat', statType: 'DEF', value: 30, duration: 80 });
                }
            }
        });

        this.register('Ironbound Sentry', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'iron-will' });
            const dmgRed = caster.starLevel === 1 ? 0.20 : (caster.starLevel === 2 ? 0.30 : 0.45);
            caster.modifiers.push({ id: `skill-iron-red-${Date.now()}`, source: 'skill', type: 'percent', statType: 'DamageReduction', value: dmgRed * 100, duration: 80 });
            const enemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead');
            const sorted = enemies.sort((a, b) => hexDistance(a.hex, caster.hex) - hexDistance(b.hex, caster.hex));
            for (let ti = 0; ti < Math.min(2, sorted.length); ti++) {
                sorted[ti].targetId = caster.id;
            }
        });

        this.register('Shieldbreaker Berserker', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'sunder' });
            const dmgScale = caster.starLevel === 1 ? 2.60 : (caster.starLevel === 2 ? 3.80 : 5.90);
            let bonus = 1.0;
            if (target.modifiers.some(m => m.id.startsWith('item|') && m.statType === 'HP' && m.value > 0)) bonus = 1.5;
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale * bonus, 'physical');
        });

        this.register('Master Runesmith', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'runic-armament' });
            const shieldAmt = caster.starLevel === 1 ? 280 : (caster.starLevel === 2 ? 490 : 900);
            for (const ally of boardState.getAllUnits()) {
                if (ally.faction === caster.faction && !ally.isOnBench && ally.state !== 'Dead') {
                    ally.modifiers.push({ id: `skill-runic-shield-${Date.now()}`, source: 'skill', type: 'flat', statType: 'HP', value: shieldAmt, duration: 100 });
                    ally.currentHP = Math.min(ally.maxHP + shieldAmt, ally.currentHP + shieldAmt);
                    ally.modifiers.push({ id: `skill-runic-reflect-${Date.now()}`, source: 'skill', type: 'percent', statType: 'ReflectDamage', value: 30, duration: 100 });
                }
            }
        });

        // --- DEMONIC PACT ---
        this.register('Cultist Initiate', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'acid-spit' });
            const dmgScale = caster.starLevel === 1 ? 1.30 : (caster.starLevel === 2 ? 1.95 : 3.05);
            resolveDamage(caster, target, (caster.baseStats.ap || 0) * dmgScale, 'magic');
            target.modifiers.push({ id: `skill-acid-shred-${Date.now()}`, source: 'skill', type: 'percent', statType: 'MDEF', value: -25, duration: 80 });
        });

        this.register('Blood Zealot', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'frenzied-strike' });
            const dmgScale = caster.starLevel === 1 ? 1.70 : (caster.starLevel === 2 ? 2.50 : 3.90);
            const dealt = resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            const healAmt = dealt * 0.25;
            caster.currentHP = Math.min(caster.maxHP, caster.currentHP + healAmt);
        });

        this.register('Shadow Warlock', ({ caster, target, boardState }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'doom-edict' });
            const dmgScale = caster.starLevel === 1 ? 2.10 : (caster.starLevel === 2 ? 3.05 : 4.80);
            const dotDmg = (caster.baseStats.ap || 0) * dmgScale;
            resolveDamage(caster, target, dotDmg * 0.5, 'magic');
            if (target.currentHP <= dotDmg * 0.5) {
                const skel = UnitFactory.createUnit("Crypt Skeleton", "skel-" + Date.now());
                if (skel) {
                    skel.faction = caster.faction;
                    boardState.addUnit(skel, { q: target.hex.q, r: target.hex.r });
                }
            }
        });

        this.register('Underworld Pitlord', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'abyssal-slam' });
            const dmgScale = caster.starLevel === 1 ? 2.55 : (caster.starLevel === 2 ? 3.75 : 5.80);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            target.modifiers.push({ id: `skill-pitlord-stun-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 40 });
        });

        this.register('Demon Summoner', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'demonic-circle' });
            const sentinelHp = caster.starLevel === 1 ? 350 : (caster.starLevel === 2 ? 600 : 1100);
            const selfNeighbors = hexNeighbors(caster.hex);
            const placeHex = selfNeighbors.find(n => !boardState.isHexOccupied(n)) || caster.hex;
            const sentinel = UnitFactory.createUnit('Vanguard Squire', 'sentinel-' + Date.now());
            if (sentinel) {
                sentinel.faction = caster.faction;
                sentinel.baseStats.hp = sentinelHp;
                sentinel.currentHP = sentinelHp;
                sentinel.maxHP = sentinelHp;
                sentinel.baseStats.atk = 30;
                boardState.addUnit(sentinel, placeHex);
            }
        });

        this.register('Lord of Torment', ({ caster, target, boardState }) => {
            const enemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead');
            let highestHp = target || enemies[0];
            if (!highestHp) return;
            for (const e of enemies) {
                if (e.currentHP > highestHp.currentHP) highestHp = e;
            }
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'tormenting-sweep' });
            const dmgScale = caster.starLevel === 1 ? 3.00 : (caster.starLevel === 2 ? 4.40 : 7.00);
            resolveDamage(caster, highestHp, caster.baseStats.atk * dmgScale, 'physical');
            if (highestHp.currentHP <= highestHp.maxHP * 0.20) {
                resolveDamage(caster, highestHp, highestHp.currentHP * 10, 'true');
            }
        });

        // --- MAGIC TOWER ---
        this.register('Tower Novice', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'spark-shot' });
            const dmgScale = caster.starLevel === 1 ? 1.35 : (caster.starLevel === 2 ? 2.00 : 3.15);
            resolveDamage(caster, target, (caster.baseStats.ap || 0) * dmgScale, 'magic');
        });

        this.register('Frost Wielder', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'frostbite' });
            const dmgScale = caster.starLevel === 1 ? 1.75 : (caster.starLevel === 2 ? 2.55 : 4.00);
            resolveDamage(caster, target, (caster.baseStats.ap || 0) * dmgScale, 'magic');
            target.modifiers.push({ id: `skill-frost-stun-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 30 });
        });

        this.register('Storm Warden', ({ caster }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'lightning-shield' });
            const shieldAmt = caster.starLevel === 1 ? 220 : (caster.starLevel === 2 ? 370 : 600);
            caster.modifiers.push({ id: `skill-storm-shield-${Date.now()}`, source: 'skill', type: 'flat', statType: 'HP', value: shieldAmt, duration: 80 });
            caster.currentHP = Math.min(caster.maxHP + shieldAmt, caster.currentHP + shieldAmt);
            caster.modifiers.push({ id: `skill-storm-thorns-${Date.now()}`, source: 'skill', type: 'flat', statType: 'ReflectDamage', value: 60, duration: 80 });
        });

        this.register('Arcane Illusionist', ({ caster, target, boardState }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'mirror-image' });
            const neighbors = hexNeighbors(caster.hex).filter(n => !boardState.isHexOccupied(n));
            if (neighbors.length > 0) {
                const dest = neighbors[Math.floor(Math.random() * neighbors.length)];
                const prev = { ...caster.hex };
                caster.hex = dest;
                bus.emit({ type: 'UNIT_MOVED', unitId: caster.id, from: prev, to: dest });
            }
            const dmgScale = caster.starLevel === 1 ? 1.20 : (caster.starLevel === 2 ? 1.75 : 2.75);
            resolveDamage(caster, target, (caster.baseStats.ap || 0) * dmgScale, 'magic');
        });

        this.register('Battle Mage', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'spell-blade' });
            const dmgScale = caster.starLevel === 1 ? 2.55 : (caster.starLevel === 2 ? 3.75 : 5.80);
            resolveDamage(caster, target, (caster.baseStats.ap || 0) * dmgScale, 'magic');
            caster.modifiers.push({ id: `skill-battle-def-${Date.now()}`, source: 'skill', type: 'flat', statType: 'DEF', value: 30, duration: 60 });
        });

        this.register('High Archmage', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'time-distortion' });
            for (const ally of boardState.getAllUnits()) {
                if (ally.faction === caster.faction && !ally.isOnBench && ally.state !== 'Dead') {
                    ally.modifiers.push({ id: `skill-archmage-as-${Date.now()}`, source: 'skill', type: 'percent', statType: 'AttackSpeed', value: 50, duration: 80 });
                }
            }
            const dmgScale = caster.starLevel === 1 ? 3.50 : (caster.starLevel === 2 ? 5.20 : 8.50);
            for (const e of boardState.getAllUnits()) {
                if (e.faction !== caster.faction && !e.isOnBench && e.state !== 'Dead') {
                    resolveDamage(caster, e, (caster.baseStats.ap || 0) * dmgScale * 0.5, 'magic');
                    e.modifiers.push({ id: `skill-archmage-silence-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 40 });
                }
            }
        });

        // --- SYLVAN ELVES ---
        this.register('Leaf Ranger', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'quick-arrow' });
            const dmgScale = caster.starLevel === 1 ? 0.75 : (caster.starLevel === 2 ? 1.10 : 1.65);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
        });

        this.register('Forest Guardian', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'vine-snare' });
            const dmgScale = caster.starLevel === 1 ? 1.55 : (caster.starLevel === 2 ? 2.30 : 3.60);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            target.modifiers.push({ id: `skill-vine-root-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 40 });
        });

        this.register('Shrine Priestess', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'leaf-shower' });
            const healAmt = caster.starLevel === 1 ? 180 : (caster.starLevel === 2 ? 310 : 495);
            const allies = boardState.getAllUnits().filter(u => u.faction === caster.faction && !u.isOnBench && u.state !== 'Dead');
            allies.sort((a, b) => a.currentHP / a.maxHP - b.currentHP / b.maxHP);
            for (let hi = 0; hi < Math.min(2, allies.length); hi++) {
                allies[hi].currentHP = Math.min(allies[hi].maxHP, allies[hi].currentHP + healAmt);
            }
        });

        this.register('Wind Dancer', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'blade-whirl' });
            const dmgScale = caster.starLevel === 1 ? 2.15 : (caster.starLevel === 2 ? 3.15 : 4.90);
            const windEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of windEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 1) {
                    resolveDamage(caster, e, caster.baseStats.atk * dmgScale, 'physical');
                }
            }
            caster.modifiers.push({ id: `skill-wind-dodge-${Date.now()}`, source: 'skill', type: 'percent', statType: 'AttackSpeed', value: 20, duration: 80 });
        });

        this.register('Elder Druid', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'natures-grasp' });
            const dmgScale = caster.starLevel === 1 ? 2.25 : (caster.starLevel === 2 ? 3.30 : 5.15);
            const lineEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of lineEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 2) {
                    resolveDamage(caster, e, (caster.baseStats.ap || 0) * dmgScale, 'magic');
                    e.modifiers.push({ id: `skill-druid-silence-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 40 });
                }
            }
        });

        this.register('Elf Monarch', ({ caster, target, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'solar-arrow' });
            const dmgScale = caster.starLevel === 1 ? 3.00 : (caster.starLevel === 2 ? 4.40 : 7.20);
            const elfEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            let lowestHp = target || elfEnemies[0];
            if (!lowestHp) return;
            for (const e of elfEnemies) {
                if (e.currentHP < lowestHp.currentHP) lowestHp = e;
            }
            resolveDamage(caster, lowestHp, caster.baseStats.atk * dmgScale, 'physical');
            if (lowestHp.currentHP <= lowestHp.maxHP * 0.15) {
                resolveDamage(caster, lowestHp, lowestHp.currentHP * 10, 'true');
            }
        });

        // --- NECROPOLIS UNDEAD ---
        this.register('Crypt Skeleton', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'jagged-swing' });
            const dmgScale = caster.starLevel === 1 ? 1.40 : (caster.starLevel === 2 ? 2.05 : 3.20);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            caster.currentHP = Math.min(caster.maxHP, caster.currentHP + 80);
        });

        this.register('Wandering Ghost', ({ caster, target, boardState }) => {
            const ghostEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead');
            let farthest = target || ghostEnemies[0];
            if (!farthest) return;
            let maxD = 0;
            for (const e of ghostEnemies) {
                const d = hexDistance(caster.hex, e.hex);
                if (d > maxD) {
                    maxD = d;
                    farthest = e;
                }
            }
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'haunt' });
            const dmgScale = caster.starLevel === 1 ? 1.70 : (caster.starLevel === 2 ? 2.50 : 3.90);
            resolveDamage(caster, farthest, caster.baseStats.atk * dmgScale, 'physical');
            farthest.modifiers.push({ id: `skill-ghost-silence-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 40 });
        });

        this.register('Plague Bearer', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'toxic-cloud' });
            const dmgScale = caster.starLevel === 1 ? 1.85 : (caster.starLevel === 2 ? 2.70 : 4.25);
            const plagueEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of plagueEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 1) {
                    resolveDamage(caster, e, (caster.baseStats.ap || 0) * dmgScale, 'magic');
                    e.modifiers.push({ id: `skill-plague-antiheal-${Date.now()}`, source: 'skill', type: 'percent', statType: 'Lifesteal', value: -33, duration: 100 });
                }
            }
        });

        this.register('Grave Keeper', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'grave-shield' });
            const shieldAmt = caster.starLevel === 1 ? 280 : (caster.starLevel === 2 ? 460 : 750);
            caster.modifiers.push({ id: `skill-grave-shield-${Date.now()}`, source: 'skill', type: 'flat', statType: 'HP', value: shieldAmt, duration: 80 });
            caster.currentHP = Math.min(caster.maxHP + shieldAmt, caster.currentHP + shieldAmt);
            for (const e of boardState.getAllUnits()) {
                if (e.faction !== caster.faction && !e.isOnBench && e.state !== 'Dead' && hexDistance(caster.hex, e.hex) <= 1) {
                    resolveDamage(caster, e, 25 * 40, 'magic');
                }
            }
        });

        this.register('Reaper of Souls', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'soul-harvest' });
            const dmgScale = caster.starLevel === 1 ? 2.60 : (caster.starLevel === 2 ? 3.80 : 5.90);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            if (target.currentHP <= 0 || target.state === 'Dying') {
                caster.currentHP = Math.min(caster.maxHP, caster.currentHP + caster.maxHP * 0.30);
            }
        });

        this.register('Lich Lord', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'death-wave' });
            const dmgScale = caster.starLevel === 1 ? 2.90 : (caster.starLevel === 2 ? 4.30 : 7.00);
            const lichEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of lichEnemies) {
                resolveDamage(caster, e, (caster.baseStats.ap || 0) * dmgScale, 'magic');
            }
            // Heal undead allies
            for (const ally of boardState.getAllUnits()) {
                if (ally.faction === caster.faction && !ally.isOnBench && ally.origin === 'Necropolis Undead' && ally.state !== 'Dead') {
                    ally.currentHP = Math.min(ally.maxHP, ally.currentHP + 250);
                }
            }
        });

        this.register('Fire Breeder', ({ caster }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'flame-ward' });
            const shieldAmt = caster.starLevel === 1 ? 140 : (caster.starLevel === 2 ? 240 : 380);
            caster.modifiers.push({ id: `skill-flame-shield-${Date.now()}`, source: 'skill', type: 'flat', statType: 'HP', value: shieldAmt, duration: 80 });
            caster.currentHP = Math.min(caster.maxHP + shieldAmt, caster.currentHP + shieldAmt);
            caster.modifiers.push({ id: `skill-flame-bonus-${Date.now()}`, source: 'skill', type: 'flat', statType: 'ATK', value: 20, duration: 80 });
        });

        this.register('Cinder Hatchling', ({ caster, target, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'ember-spit' });
            const dmgScale = caster.starLevel === 1 ? 1.40 : (caster.starLevel === 2 ? 2.05 : 3.20);
            const hatchEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench);
            let farthest = target || hatchEnemies[0];
            if (!farthest) return;
            let maxD2 = 0;
            for (const e of hatchEnemies) {
                const d = hexDistance(caster.hex, e.hex);
                if (d > maxD2) { maxD2 = d; farthest = e; }
            }
            resolveDamage(caster, farthest, caster.baseStats.atk * dmgScale, 'physical');
            resolveDamage(caster, farthest, 15 * 5 * 20, 'true');
        });

        this.register('Wyvern Rider', ({ caster, target, boardState }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'dive-strike' });
            const dmgScale = caster.starLevel === 1 ? 1.75 : (caster.starLevel === 2 ? 2.55 : 4.00);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            const knb = hexNeighbors(target.hex).find(n => !boardState.isHexOccupied(n));
            if (knb) {
                const prev = { ...target.hex };
                target.hex = knb;
                bus.emit({ type: 'UNIT_MOVED', unitId: target.id, from: prev, to: knb });
            }
        });

        this.register('Dragon Priest', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'dragons-breath' });
            const healAmt = caster.starLevel === 1 ? 180 : (caster.starLevel === 2 ? 310 : 500);
            const priestAllies = boardState.getAllUnits().filter(u => u.faction === caster.faction && !u.isOnBench && u.state !== 'Dead');
            let healed = 0;
            for (const ally of priestAllies) {
                if (hexDistance(caster.hex, ally.hex) <= 2 && healed < 3) {
                    ally.currentHP = Math.min(ally.maxHP, ally.currentHP + healAmt);
                    healed++;
                }
            }
        });

        this.register('Scale Zealot', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'draconic-frenzy' });
            const dmgScale = caster.starLevel === 1 ? 2.55 : (caster.starLevel === 2 ? 3.75 : 5.80);
            const scaleEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            let hitCount = 0;
            for (const e of scaleEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 1) {
                    resolveDamage(caster, e, caster.baseStats.atk * dmgScale, 'physical');
                    hitCount++;
                }
            }
            if (hitCount > 0) {
                caster.modifiers.push({ id: `skill-frenzy-as-${Date.now()}`, source: 'skill', type: 'percent', statType: 'AttackSpeed', value: 8 * hitCount, duration: 80 });
            }
        });

        this.register('Cinder Dragon', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'inferno-breath' });
            const dmgScale = caster.starLevel === 1 ? 3.20 : (caster.starLevel === 2 ? 4.70 : 7.80);
            const coneEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of coneEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 2) {
                    resolveDamage(caster, e, (caster.baseStats.ap || 0) * dmgScale, 'magic');
                    resolveDamage(caster, e, e.maxHP * 0.08, 'true');
                }
            }
        });

        this.register('Sprout Sprite', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'dewdrop' });
            const healAmt = caster.starLevel === 1 ? 130 : (caster.starLevel === 2 ? 225 : 360);
            const spriteAllies = boardState.getAllUnits().filter(u => u.faction === caster.faction && !u.isOnBench && u.state !== 'Dead');
            let lowest = spriteAllies[0];
            if (!lowest) return;
            for (const a of spriteAllies) {
                if (a.currentHP / a.maxHP < lowest.currentHP / lowest.maxHP) lowest = a;
            }
            lowest.currentHP = Math.min(lowest.maxHP, lowest.currentHP + healAmt);
        });

        this.register('Ember Pixie', ({ caster, target, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'spark-flare' });
            const dmgScale = caster.starLevel === 1 ? 1.45 : (caster.starLevel === 2 ? 2.15 : 3.35);
            const pixieEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench);
            let farthestT = target || pixieEnemies[0];
            if (!farthestT) return;
            let maxD3 = 0;
            for (const e of pixieEnemies) {
                const d = hexDistance(caster.hex, e.hex);
                if (d > maxD3) { maxD3 = d; farthestT = e; }
            }
            resolveDamage(caster, farthestT, caster.baseStats.atk * dmgScale, 'physical');
        });

        this.register('Wave Sylph', ({ caster, target }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'splash' });
            const dmgScale = caster.starLevel === 1 ? 1.70 : (caster.starLevel === 2 ? 2.50 : 3.90);
            resolveDamage(caster, target, (caster.baseStats.ap || 0) * dmgScale, 'magic');
            target.modifiers.push({ id: `skill-splash-aslow-${Date.now()}`, source: 'skill', type: 'percent', statType: 'AttackSpeed', value: -35, duration: 60 });
        });

        this.register('Pebble Gnome', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'hard-harden' });
            const defAmt = caster.starLevel === 1 ? 35 : (caster.starLevel === 2 ? 62 : 100);
            caster.modifiers.push({ id: `skill-gnome-def-${Date.now()}`, source: 'skill', type: 'flat', statType: 'DEF', value: defAmt, duration: 100 });
            caster.modifiers.push({ id: `skill-gnome-mdef-${Date.now()}`, source: 'skill', type: 'flat', statType: 'MDEF', value: defAmt, duration: 100 });
            const gnomeEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead');
            for (const e of gnomeEnemies) {
                if (hexDistance(caster.hex, e.hex) <= 2) e.targetId = caster.id;
            }
        });

        this.register('Gale Sylph', ({ caster, target, boardState }) => {
            if (!target) return;
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'wind-blade' });
            const dmgScale = caster.starLevel === 1 ? 2.55 : (caster.starLevel === 2 ? 3.75 : 5.80);
            resolveDamage(caster, target, caster.baseStats.atk * dmgScale, 'physical');
            const knb2 = hexNeighbors(target.hex).find(n => !boardState.isHexOccupied(n));
            if (knb2) {
                const prev = { ...target.hex };
                target.hex = knb2;
                bus.emit({ type: 'UNIT_MOVED', unitId: target.id, from: prev, to: knb2 });
            }
        });

        this.register('Primordial Fairy Queen', ({ caster, boardState }) => {
            bus.emit({ type: 'SKILL_CAST', unitId: caster.id, skillId: 'tidal-fairy-wave' });
            const dmgScale = caster.starLevel === 1 ? 2.80 : (caster.starLevel === 2 ? 4.15 : 6.80);
            const waveEnemies = boardState.getAllUnits().filter(u => u.faction !== caster.faction && !u.isOnBench && u.state !== 'Dead' && u.state !== 'Dying');
            for (const e of waveEnemies) {
                resolveDamage(caster, e, (caster.baseStats.ap || 0) * dmgScale, 'magic');
                e.modifiers.push({ id: `skill-wave-stun-${Date.now()}`, source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 30 });
            }
        });
    }
}

export const skillRegistry = new SkillRegistry();
