// src/core/combat/CombatEngine.ts

import { transitionUnit } from '../fsm/UnitFSM';
import type { FsmUnit } from '../fsm/UnitFSM';
import { hexDistance } from '../hex/HexGrid';

export interface CombatUnit extends FsmUnit {
    effectiveDEF: number;
    effectiveMDEF: number;
    damageAmpModifier: number;      // raw percent (e.g. 0.10 for +10% damage amp)
    damageReductionModifier: number;  // raw percent (e.g. 0.15 for +15% reduction)
    lifestealPercent: number;       // raw percent (e.g. 0.20 for +20% lifesteal)
    currentHP: number;
    maxHP: number;
}

export function handleItemCombatStart(units: any[]): void {
    if (!units) return;

    for (const unit of units) {
        if (!unit.equippedItems || unit.equippedItems.length === 0) continue;

        // Reset per-combat tracking flags
        unit.stormchargedAttackCount = 0;
        unit.berserkerGlaiveStacks = 0;
        unit.titansResolveStacks = 0;
        unit.vanguardsVowTriggered = false;

        // 1. Gloomward Shroud: 15% max HP shield for 8s (160 ticks)
        if (unit.equippedItems.includes("Gloomward Shroud")) {
            const shieldVal = Math.round(unit.maxHP * 0.15);
            if (unit.modifiers) {
                unit.modifiers.push({
                    id: `item-gloomward-shield-${Date.now()}`,
                    source: 'item',
                    type: 'flat',
                    statType: 'Shield',
                    value: shieldVal,
                    duration: 160
                });
            }
        }

        // 2. Chalice of Justice: +15% ATK and +15% AP for combat
        if (unit.equippedItems.includes("Chalice of Justice")) {
            if (unit.modifiers) {
                unit.modifiers.push({
                    id: `item-chalice-atk-${Date.now()}`,
                    source: 'item',
                    type: 'percent',
                    statType: 'ATK',
                    value: 15,
                    duration: -1
                });
                unit.modifiers.push({
                    id: `item-chalice-ap-${Date.now()}`,
                    source: 'item',
                    type: 'percent',
                    statType: 'AP',
                    value: 15,
                    duration: -1
                });
            }
        }

        // 3. Zephyr's Tempest: Banish farthest enemy for 5s (100 ticks)
        if (unit.equippedItems.includes("Zephyr's Tempest")) {
            let farthestEnemy: any = null;
            let maxDist = -1;
            for (const enemy of units) {
                if (enemy.faction !== unit.faction && !enemy.isOnBench && enemy.state !== 'Dead' && enemy.state !== 'Dying') {
                    const dist = hexDistance(unit.hex, enemy.hex);
                    if (dist > maxDist) {
                        maxDist = dist;
                        farthestEnemy = enemy;
                    }
                }
            }
            if (farthestEnemy && farthestEnemy.modifiers) {
                farthestEnemy.modifiers.push({
                    id: `item-zephyr-banish-${Date.now()}`,
                    source: 'item',
                    type: 'flat',
                    statType: 'Stun',
                    value: 1,
                    duration: 100
                });
                console.log(`[Item Passive] Zephyr's Tempest banished ${farthestEnemy.name} for 5 seconds.`);
            }
        }
    }
}

export function processOnAttackItemPassives(attacker: any, target: any): {
    bonusPhysicalDmg: number;
    bonusMagicDmg: number;
    isCrit: boolean;
    critMult: number;
} {
    let bonusPhysicalDmg = 0;
    let bonusMagicDmg = 0;

    const targetHasStalwartShield = target.equippedItems?.includes("Stalwart Shield");
    const rawCritChance = attacker.effectiveCritChance || 0.10;
    const isCrit = !targetHasStalwartShield && Math.random() < rawCritChance;
    const critMult = isCrit ? (1 + (attacker.effectiveCritDamage || 0.75)) : 1.0;

    const items = attacker.equippedItems || [];

    // Sage's Spear: +2 extra mana per attack
    if (items.includes("Sage's Spear")) {
        attacker.mana = Math.min(attacker.maxMana, attacker.mana + 2);
    }

    // Aether Blade: 15% ATK bonus magic damage on hit
    if (items.includes("Aether Blade")) {
        bonusMagicDmg += Math.round((attacker.effectiveATK || attacker.baseStats?.atk || 50) * 0.15);
    }

    // Colossus Sunderer: Shred target DEF by 5% per hit (max 5 stacks = -25%)
    if (items.includes("Colossus Sunderer") && target.modifiers) {
        const existingStacks = target.modifiers.filter((m: any) => m.id.startsWith('item-sunderer-def-'));
        if (existingStacks.length < 5) {
            target.modifiers.push({
                id: `item-sunderer-def-${Date.now()}-${Math.random()}`,
                source: 'item',
                type: 'percent',
                statType: 'DEF',
                value: -5,
                duration: 160
            });
        }
    }

    // Stormcharged Bow: Every 3rd attack restores +10 extra mana
    if (items.includes("Stormcharged Bow")) {
        attacker.stormchargedAttackCount = (attacker.stormchargedAttackCount || 0) + 1;
        if (attacker.stormchargedAttackCount % 3 === 0) {
            attacker.mana = Math.min(attacker.maxMana, attacker.mana + 10);
        }
    }

    // Berserker's Glaive: +4% AS stack per attack (max 10 stacks)
    if (items.includes("Berserker's Glaive")) {
        attacker.berserkerGlaiveStacks = (attacker.berserkerGlaiveStacks || 0);
        if (attacker.berserkerGlaiveStacks < 10) {
            attacker.berserkerGlaiveStacks++;
            if (attacker.modifiers) {
                attacker.modifiers.push({
                    id: `item-glaive-as-${Date.now()}-${Math.random()}`,
                    source: 'item',
                    type: 'percent',
                    statType: 'AttackSpeed',
                    value: 4,
                    duration: -1
                });
            }
        }
    }

    // Shredding Arrow: Crit reduces target DEF by 50% for 5s (100 ticks)
    if (items.includes("Shredding Arrow") && isCrit && target.modifiers) {
        target.modifiers.push({
            id: `item-shredding-def-${Date.now()}`,
            source: 'item',
            type: 'percent',
            statType: 'DEF',
            value: -50,
            duration: 100
        });
    }

    // Stinger Bow: Apply Anti-Heal (50% reduced healing) for 5s
    if (items.includes("Stinger Bow") && target.modifiers) {
        target.modifiers.push({
            id: `item-stinger-antiheal-${Date.now()}`,
            source: 'item',
            type: 'flat',
            statType: 'AntiHeal',
            value: 50,
            duration: 100
        });
    }

    // Shattering Hammer: 3% of target max HP bonus physical damage
    if (items.includes("Shattering Hammer")) {
        bonusPhysicalDmg += Math.round((target.maxHP || 1000) * 0.03);
    }

    // Titan's Resolve: On dealing crit, gain +2 ATK & +2 DEF stack (max 25)
    if (items.includes("Titan's Resolve") && isCrit) {
        attacker.titansResolveStacks = (attacker.titansResolveStacks || 0);
        if (attacker.titansResolveStacks < 25) {
            attacker.titansResolveStacks++;
            if (attacker.modifiers) {
                attacker.modifiers.push({
                    id: `item-titans-atk-${Date.now()}-${Math.random()}`,
                    source: 'item',
                    type: 'flat',
                    statType: 'ATK',
                    value: 2,
                    duration: -1
                });
                attacker.modifiers.push({
                    id: `item-titans-def-${Date.now()}-${Math.random()}`,
                    source: 'item',
                    type: 'flat',
                    statType: 'DEF',
                    value: 2,
                    duration: -1
                });
            }
        }
    }

    return { bonusPhysicalDmg, bonusMagicDmg, isCrit, critMult };
}

export function processOnSkillCastItemPassives(caster: any, target?: any, units?: any[]): number {
    let skillCritMult = 1.0;
    const items = caster.equippedItems || [];

    // Archmage's Codex: +10% AP stack for combat on skill cast
    if (items.includes("Archmage's Codex") && caster.modifiers) {
        caster.modifiers.push({
            id: `item-codex-ap-${Date.now()}-${Math.random()}`,
            source: 'item',
            type: 'percent',
            statType: 'AP',
            value: 10,
            duration: -1
        });
    }

    // Burning Grimoire: Burn target for 2% max HP true damage/sec for 3s (60 ticks)
    if (items.includes("Burning Grimoire") && target && target.modifiers) {
        target.modifiers.push({
            id: `item-grimoire-burn-${Date.now()}`,
            source: 'item',
            type: 'flat',
            statType: 'Plague',
            value: 2,
            duration: 60
        });
    }

    // Aura of Redemption: Heal all allies for 10% max HP
    if (items.includes("Aura of Redemption") && units) {
        for (const ally of units) {
            if (ally.faction === caster.faction && ally.state !== 'Dead' && ally.state !== 'Dying') {
                const healVal = Math.round(ally.maxHP * 0.10);
                ally.currentHP = Math.min(ally.maxHP, ally.currentHP + healVal);
            }
        }
    }

    // Spellweaver's Gloves: Skill can critically strike
    if (items.includes("Spellweaver's Gloves")) {
        const critChance = caster.effectiveCritChance || 0.10;
        if (Math.random() < critChance) {
            skillCritMult = 1 + (caster.effectiveCritDamage || 0.75);
        }
    }

    return skillCritMult;
}

export function resolveDamage(
    attacker: CombatUnit,
    target: CombatUnit,
    rawDamage: number,
    damageType: 'physical' | 'magic' | 'true'
): number {
    const att = attacker as any;
    const tgt = target as any;

    let modifiedRaw = rawDamage;

    // Dragon's Scale: -30% magic damage taken
    if (damageType === 'magic' && tgt.equippedItems?.includes("Dragon's Scale")) {
        modifiedRaw *= 0.70;
    }

    let finalDmg = 0;

    if (att.isFacility) {
        if (att.constructionRoundsRemaining > 0) {
            // Inert under-construction facility cannot attack
            return 0;
        }
        if (att.facilityType === 'Offensive') {
            const percentHp = att.starLevel === 1 ? 0.05 : (att.starLevel === 2 ? 0.08 : 0.12);
            const raw = tgt.maxHP * percentHp;
            const defense = tgt.effectiveDEF || 0;
            finalDmg = raw * (100 / (100 + defense));
        } else {
            // Support or Resource facility cannot attack
            return 0;
        }
    } else if (damageType === 'true') {
        finalDmg = modifiedRaw;
    } else {
        const defense = damageType === 'physical' ? target.effectiveDEF : target.effectiveMDEF;
        
        // Mitigation formula: mitigated = raw × 100 / (100 + DEF)
        const mitigated = modifiedRaw * (100 / (100 + defense));
        
        // Attacker damage amplification
        const amplified = mitigated * (1 + (attacker.damageAmpModifier || 0));
        
        // Target damage reduction
        let extraDR = 0;
        if (tgt.titansResolveStacks >= 25) {
            extraDR = 0.15;
        }
        finalDmg = amplified * (1 - ((target.damageReductionModifier || 0) + extraDR));
    }

    // Apply damage to target
    target.currentHP -= finalDmg;

    // Thornmail Vest: reflect 20% physical damage back to attacker as true damage
    if (damageType === 'physical' && tgt.equippedItems?.includes("Thornmail Vest") && att.currentHP > 0) {
        const reflectDmg = Math.round(finalDmg * 0.20);
        att.currentHP -= reflectDmg;
        if (att.currentHP <= 0) {
            att.currentHP = 0;
            transitionUnit(att, 'Dying');
        }
    }

    // Titan's Resolve: On taking damage, gain stack (+2 ATK/DEF, max 25)
    if (tgt.equippedItems?.includes("Titan's Resolve")) {
        tgt.titansResolveStacks = (tgt.titansResolveStacks || 0);
        if (tgt.titansResolveStacks < 25) {
            tgt.titansResolveStacks++;
            if (tgt.modifiers) {
                tgt.modifiers.push({
                    id: `item-titans-atk-${Date.now()}-${Math.random()}`,
                    source: 'item',
                    type: 'flat',
                    statType: 'ATK',
                    value: 2,
                    duration: -1
                });
                tgt.modifiers.push({
                    id: `item-titans-def-${Date.now()}-${Math.random()}`,
                    source: 'item',
                    type: 'flat',
                    statType: 'DEF',
                    value: 2,
                    duration: -1
                });
            }
        }
    }

    // Vanguard's Vow: HP < 40% -> 200 HP shield for 5s (100 ticks)
    if (tgt.equippedItems?.includes("Vanguard's Vow") && !tgt.vanguardsVowTriggered && target.currentHP > 0 && target.currentHP / target.maxHP <= 0.40) {
        tgt.vanguardsVowTriggered = true;
        if (tgt.modifiers) {
            tgt.modifiers.push({
                id: `item-vanguard-shield-${Date.now()}`,
                source: 'item',
                type: 'flat',
                statType: 'Shield',
                value: 200,
                duration: 100
            });
        }
    }

    // Guardian's Pendant: Taking >= 15% max HP damage restores 15 mana
    if (tgt.equippedItems?.includes("Guardian's Pendant") && finalDmg >= target.maxHP * 0.15 && target.currentHP > 0) {
        if (tgt.mana !== undefined && tgt.maxMana !== undefined) {
            tgt.mana = Math.min(tgt.maxMana, tgt.mana + 15);
        }
    }

    // Vanguard Berserker 7: Death Immunity check
    const hasDeathImmunity = tgt.modifiers?.some((m: any) => m.statType === 'DeathImmunity' && m.duration !== 0);
    if (hasDeathImmunity && target.currentHP <= 0) {
        target.currentHP = 1;
    }

    // Defender mana gain on damage taken (10% of post-mitigation damage, max 20 mana per hit)
    if (tgt.mana !== undefined && tgt.maxMana !== undefined && target.currentHP > 0) {
        const isManaPaused = tgt.modifiers?.some((m: any) => m.statType === 'ManaPause' && m.duration !== 0);
        if (!isManaPaused) {
            const manaGain = Math.min(20, Math.max(1, Math.floor(finalDmg * 0.10)));
            tgt.mana = Math.min(tgt.maxMana, tgt.mana + manaGain);
        }
    }

    // Post-mitigation Lifesteal with Anti-Heal check
    if (attacker.lifestealPercent > 0 && attacker.currentHP > 0) {
        let antiHealFactor = 1.0;
        const antiHealMod = att.modifiers?.find((m: any) => m.statType === 'AntiHeal' && m.duration !== 0);
        if (antiHealMod) {
            antiHealFactor = Math.max(0, 1 - (antiHealMod.value / 100));
        }
        const lifestealHeal = finalDmg * attacker.lifestealPercent * antiHealFactor;
        attacker.currentHP = Math.min(attacker.maxHP, attacker.currentHP + lifestealHeal);
    }

    // Check death state transition
    if (target.currentHP <= 0) {
        target.currentHP = 0;
        // Aura of Redemption on death
        if (tgt.equippedItems?.includes("Aura of Redemption") && tgt.boardStateRef) {
            for (const ally of tgt.boardStateRef.getAllUnits()) {
                if (ally.faction === tgt.faction && ally.id !== tgt.id && ally.state !== 'Dead' && ally.state !== 'Dying') {
                    const healVal = Math.round(ally.maxHP * 0.10);
                    ally.currentHP = Math.min(ally.maxHP, ally.currentHP + healVal);
                }
            }
        }
        transitionUnit(target, 'Dying');
    }

    return finalDmg;
}

/**
 * Decrement modifier durations and apply per-tick status effect processing (Plague, Stun, Item Auras, etc.)
 */
export function processUnitStatusTicks(unit: any, tickCount: number): void {
    if (!unit || !unit.modifiers) return;

    // Decrement modifier durations
    unit.modifiers = unit.modifiers.map((m: any) => {
        if (m.duration > 0) m.duration--;
        return m;
    }).filter((m: any) => m.duration !== 0);

    // Process Plague DOT (1% max HP true damage per second, every 20 ticks)
    if (unit.state !== 'Dead' && unit.state !== 'Dying') {
        const plagueMod = unit.modifiers.find((m: any) => m.statType === 'Plague');
        if (plagueMod && tickCount % 20 === 0) {
            const plagueDmg = Math.max(1, Math.floor(unit.maxHP * (plagueMod.value ? plagueMod.value / 100 : 0.01)));
            unit.currentHP -= plagueDmg;
            if (unit.currentHP <= 0) {
                unit.currentHP = 0;
                transitionUnit(unit, 'Dying');
            }
        }
    }
}

/**
 * Process item aura ticks, HP regen, and attacker counts (every tick or 20 ticks)
 */
export function processItemStatusTicks(units: any[], tickCount: number): void {
    if (!units || units.length === 0) return;

    // Every 20 ticks (1 second)
    if (tickCount % 20 === 0) {
        for (const unit of units) {
            if (unit.isOnBench || unit.state === 'Dead' || unit.state === 'Dying') continue;

            const items = unit.equippedItems || [];

            // Warmog's Armor & Hero's Crest: Regenerate 2% max HP per second
            if (items.includes("Warmog's Armor") || items.includes("Hero's Crest")) {
                const regenVal = Math.max(1, Math.round(unit.maxHP * 0.02));
                unit.currentHP = Math.min(unit.maxHP, unit.currentHP + regenVal);
            }

            // Aura of Clarity: +2 Mana/sec to adjacent allies (dist <= 1)
            if (items.includes("Aura of Clarity")) {
                for (const ally of units) {
                    if (ally.faction === unit.faction && ally.id !== unit.id && !ally.isOnBench && ally.state !== 'Dead' && ally.state !== 'Dying') {
                        if (hexDistance(unit.hex, ally.hex) <= 1) {
                            ally.mana = Math.min(ally.maxMana, ally.mana + 2);
                        }
                    }
                }
            }

            // Sunfire Cape: Burn enemies within 2 hexes for 1% max HP true damage & 33% AntiHeal
            if (items.includes("Sunfire Cape")) {
                for (const enemy of units) {
                    if (enemy.faction !== unit.faction && !enemy.isOnBench && enemy.state !== 'Dead' && enemy.state !== 'Dying') {
                        if (hexDistance(unit.hex, enemy.hex) <= 2) {
                            const burnDmg = Math.max(1, Math.round(enemy.maxHP * 0.01));
                            enemy.currentHP -= burnDmg;
                            if (enemy.modifiers) {
                                enemy.modifiers.push({
                                    id: `item-sunfire-antiheal-${unit.id}`,
                                    source: 'item',
                                    type: 'flat',
                                    statType: 'AntiHeal',
                                    value: 33,
                                    duration: 20
                                });
                            }
                            if (enemy.currentHP <= 0) {
                                enemy.currentHP = 0;
                                transitionUnit(enemy, 'Dying');
                            }
                        }
                    }
                }
            }

            // Evenshroud: -30% MDEF aura for enemies within 2 hexes
            if (items.includes("Evenshroud")) {
                for (const enemy of units) {
                    if (enemy.faction !== unit.faction && !enemy.isOnBench && enemy.state !== 'Dead' && enemy.state !== 'Dying') {
                        if (hexDistance(unit.hex, enemy.hex) <= 2 && enemy.modifiers) {
                            enemy.modifiers.push({
                                id: `item-evenshroud-mdef-${unit.id}`,
                                source: 'item',
                                type: 'percent',
                                statType: 'MDEF',
                                value: -30,
                                duration: 20
                            });
                        }
                    }
                }
            }

            // Static Ward: -20% MDEF aura for enemies within 2 hexes
            if (items.includes("Static Ward")) {
                for (const enemy of units) {
                    if (enemy.faction !== unit.faction && !enemy.isOnBench && enemy.state !== 'Dead' && enemy.state !== 'Dying') {
                        if (hexDistance(unit.hex, enemy.hex) <= 2 && enemy.modifiers) {
                            enemy.modifiers.push({
                                id: `item-staticward-mdef-${unit.id}`,
                                source: 'item',
                                type: 'percent',
                                statType: 'MDEF',
                                value: -20,
                                duration: 20
                            });
                        }
                    }
                }
            }

            // Crown of Valor & Gargoyle Stoneplate: +10 DEF/AP or DEF/MDEF per enemy targeting unit
            let attackerCount = 0;
            for (const enemy of units) {
                if (enemy.faction !== unit.faction && enemy.targetId === unit.id && enemy.state !== 'Dead' && enemy.state !== 'Dying') {
                    attackerCount++;
                }
            }

            if (items.includes("Crown of Valor") && attackerCount > 0) {
                unit.effectiveDEF = (unit.effectiveDEF || 0) + (attackerCount * 10);
                unit.effectiveAP = (unit.effectiveAP || 0) + (attackerCount * 10);
            }

            if (items.includes("Gargoyle Stoneplate") && attackerCount > 0) {
                unit.effectiveDEF = (unit.effectiveDEF || 0) + (attackerCount * 10);
                unit.effectiveMDEF = (unit.effectiveMDEF || 0) + (attackerCount * 10);
            }
        }
    }

    // Every 80 ticks (4 seconds)
    if (tickCount % 80 === 0) {
        for (const unit of units) {
            if (unit.isOnBench || unit.state === 'Dead' || unit.state === 'Dying') continue;

            const items = unit.equippedItems || [];

            // Mithril Cloak: Cleanse debuffs and gain +10% AS stack
            if (items.includes("Mithril Cloak")) {
                if (unit.modifiers) {
                    unit.modifiers = unit.modifiers.filter((m: any) =>
                        m.statType !== 'Stun' && m.statType !== 'Disarmed' && m.statType !== 'AntiHeal' && m.statType !== 'Plague'
                    );
                    unit.modifiers.push({
                        id: `item-mithril-as-${Date.now()}`,
                        source: 'item',
                        type: 'percent',
                        statType: 'AttackSpeed',
                        value: 10,
                        duration: -1
                    });
                }
            }
        }
    }
}

export function processGamblersDiceWinBonus(units: any[], shopManager: any): void {
    if (!units || !shopManager) return;
    for (const unit of units) {
        if (unit.faction === 'player' && !unit.isOnBench && unit.state !== 'Dead' && unit.state !== 'Dying') {
            if (unit.equippedItems?.includes("Gambler's Dice")) {
                if (Math.random() < 0.25) {
                    shopManager.addGold(1);
                    console.log(`[Gambler's Dice] Gold bonus triggered: +1g`);
                }
            }
        }
    }
}

/**
 * Process Support Facility active aura ticks and Architect combat bonuses
 */
export function processFacilityCombatTicks(units: any[], tickCount: number, activeTraits?: Map<string, number>): void {
    if (!units || units.length === 0) return;

    const architects = activeTraits?.get('Architect') || 0;

    for (const unit of units) {
        if (!unit.isFacility || unit.state === 'Dead' || unit.state === 'Dying') continue;

        // Under-construction facilities remain inert
        if (unit.constructionRoundsRemaining > 0) continue;

        // Architect (6): +40 DEF/MDEF bonus & doubled attack rates for facilities
        if (architects >= 6 && !unit.facilityArchitectBuffed) {
            unit.effectiveDEF = (unit.effectiveDEF || unit.baseStats?.def || 50) + 40;
            unit.effectiveMDEF = (unit.effectiveMDEF || unit.baseStats?.mdef || 50) + 40;
            unit.facilityArchitectBuffed = true;
        }

        const star = unit.starLevel || 1;
        const facName = unit.facilityName || unit.name;

        // Support Facility combat aura effects
        if (unit.facilityType === 'Support') {
            // 1. Healing Totem: Heals all allies every 40 ticks (2 seconds)
            if ((facName === 'Healing Totem' || unit.name.includes('Healing')) && tickCount % 40 === 0) {
                const healPct = star === 1 ? 0.03 : (star === 2 ? 0.05 : 0.08);
                for (const ally of units) {
                    if (ally.faction === unit.faction && ally.state !== 'Dead' && ally.state !== 'Dying') {
                        const healVal = Math.round(ally.maxHP * healPct);
                        ally.currentHP = Math.min(ally.maxHP, ally.currentHP + healVal);
                    }
                }
            }

            // 2. Shield Generator: Grants DEF/MDEF bonus and a starting shield to all allies
            if ((facName === 'Shield Generator' || unit.name.includes('Shield')) && !unit.auraApplied) {
                const defBonus = star === 1 ? 20 : (star === 2 ? 35 : 50);
                const shieldVal = star === 1 ? 100 : (star === 2 ? 200 : 350);
                for (const ally of units) {
                    if (ally.faction === unit.faction && ally.state !== 'Dead' && ally.state !== 'Dying') {
                        ally.effectiveDEF = (ally.effectiveDEF || 0) + defBonus;
                        ally.effectiveMDEF = (ally.effectiveMDEF || 0) + defBonus;
                        if (ally.modifiers) {
                            ally.modifiers.push({
                                id: `facility-shield-${unit.id}`,
                                source: 'facility',
                                type: 'flat',
                                statType: 'Shield',
                                value: shieldVal,
                                duration: -1
                            });
                        }
                    }
                }
                unit.auraApplied = true;
            }

            // 3. Command Post: Grants ATK amp & AP bonus to all allies
            if ((facName === 'Command Post' || unit.name.includes('Command')) && !unit.auraApplied) {
                const atkPct = star === 1 ? 0.20 : (star === 2 ? 0.35 : 0.50);
                for (const ally of units) {
                    if (ally.faction === unit.faction && ally.state !== 'Dead' && ally.state !== 'Dying') {
                        ally.damageAmpModifier = (ally.damageAmpModifier || 0) + atkPct;
                        ally.effectiveAP = (ally.effectiveAP || 0) + Math.round(100 * atkPct);
                    }
                }
                unit.auraApplied = true;
            }
        }
    }

    // Architect (4): 3% max HP/s regen to adjacent/allied units
    if (architects >= 4 && tickCount % 20 === 0) {
        for (const ally of units) {
            if (ally.faction === 'player' && ally.state !== 'Dead' && ally.state !== 'Dying') {
                const regenVal = Math.max(1, Math.round(ally.maxHP * 0.03));
                ally.currentHP = Math.min(ally.maxHP, ally.currentHP + regenVal);
            }
        }
    }
}
