// src/core/stats/SynergyManager.ts

import { Unit } from '../units/Unit';
import { UnitFactory } from '../units/UnitFactory';
import { BoardState } from '../board/BoardState';
import { hexDistance, hexNeighbors } from '../hex/HexGrid';
import { bus } from '../events/EventBus';
import { resolveDamage } from '../combat/CombatEngine';

export class SynergyManager {
    public static allyDeathsThisCombat: number = 0;
    public static undeadResurrectionsThisCombat: number = 0;
    public static chronoFreezeTriggered: boolean = false;
    public static berserkerDeathImmunitySet: Set<string> = new Set();
    public static dragonEggCharges: number = 0;
    public static greatDemonLordSummoned: boolean = false;
    public static rangerStacks: Map<string, number> = new Map();
    public static chronoStacks: Map<string, number> = new Map();

    public static calculateSynergies(units: Unit[]): Map<string, number> {
        const traitCounts = new Map<string, Set<string>>(); // trait -> Set of unique unit names

        // Only count unique units (same name doesn't double-stack traits)
        for (const unit of units) {
            if (unit.faction === 'player' && unit.state !== 'Dead' && !unit.isOnBench) {
                const allTraits = [...unit.traits];
                if (unit.origin) {
                    allTraits.push(unit.origin);
                }
                for (const trait of allTraits) {
                    if (!traitCounts.has(trait)) {
                        traitCounts.set(trait, new Set());
                    }
                    traitCounts.get(trait)!.add(unit.name);
                }
            }
        }

        const activeTiers = new Map<string, number>();
        for (const [trait, uniqueNames] of traitCounts.entries()) {
            activeTiers.set(trait, uniqueNames.size);
        }
        return activeTiers;
    }

    public static applySynergiesToUnits(units: Unit[], activeTiers: Map<string, number>, playerLevel: number, playerGold: number = 0): void {
        const humans = activeTiers.get('Human') || 0;
        const rangers = activeTiers.get('Rangers') || 0;

        for (const unit of units) {
            if (unit.faction !== 'player' || unit.isOnBench) continue;

            // Clear old synergy modifiers from unit
            unit.modifiers = unit.modifiers.filter(m => m.source !== 'synergy');

            const isHuman = unit.origin === 'Human';

            // 1. Human Synergy: 3 / 5 / 7
            if (humans >= 3) {
                let hpBonus = 0;
                let statPct = 0;

                if (humans >= 7) {
                    if (isHuman) {
                        hpBonus = 60 * playerLevel;
                        statPct = 6 * playerLevel;
                        // Humans gain +20% Max HP
                        unit.modifiers.push({
                            id: 'synergy-human-hp-pct',
                            source: 'synergy',
                            type: 'percent',
                            statType: 'HP',
                            value: 20,
                            duration: -1
                        });
                        // Humans gain +10% Damage Amplification
                        unit.damageAmpModifier = (unit.damageAmpModifier || 0) + 0.10;
                    } else {
                        hpBonus = (60 * playerLevel) * 0.5;
                        statPct = (6 * playerLevel) * 0.5;
                    }
                } else if (humans >= 5) {
                    if (isHuman) {
                        hpBonus = 60 * playerLevel;
                        statPct = 6 * playerLevel;
                    }
                } else {
                    if (isHuman) {
                        hpBonus = 30 * playerLevel;
                        statPct = 3 * playerLevel;
                    }
                }

                if (hpBonus > 0) {
                    unit.modifiers.push({
                        id: 'synergy-human-hp-flat',
                        source: 'synergy',
                        type: 'flat',
                        statType: 'HP',
                        value: hpBonus,
                        duration: -1
                    });
                }
                if (statPct > 0) {
                    unit.modifiers.push({
                        id: 'synergy-human-atk-pct',
                        source: 'synergy',
                        type: 'percent',
                        statType: 'ATK',
                        value: statPct,
                        duration: -1
                    });
                    unit.modifiers.push({
                        id: 'synergy-human-ap-pct',
                        source: 'synergy',
                        type: 'percent',
                        statType: 'AP',
                        value: statPct,
                        duration: -1
                    });
                }
            }

            // 2. Rangers Synergy: 2 / 4 / 6
            if (rangers >= 2 && unit.traits.includes('Rangers')) {
                const val = rangers >= 6 ? 60 : (rangers >= 4 ? 35 : 15);
                unit.modifiers.push({
                    id: 'synergy-rangers-speed',
                    source: 'synergy',
                    type: 'percent',
                    statType: 'AttackSpeed',
                    value: val,
                    duration: -1
                });
            }

            // 3. Ancient Synergy: handled via AncientManager
            
            // 4. Noble Synergy: 3 / 6 / 9 — gold & damage amp
            const nobles = activeTiers.get('Noble') || 0;
            if (nobles >= 3 && unit.origin === 'Noble') {
                let nobleAmp = 0;
                let maxAmp = 0;
                if (nobles >= 9) {
                    maxAmp = 100;
                    nobleAmp = Math.min(maxAmp, Math.floor(playerGold / 2));
                } else if (nobles >= 6) {
                    maxAmp = 40;
                    nobleAmp = Math.min(maxAmp, Math.floor(playerGold / 2));
                } else {
                    nobleAmp = 0;
                }
                if (nobleAmp > 0) {
                    unit.modifiers.push({
                        id: 'synergy-noble-amp',
                        source: 'synergy', type: 'percent', statType: 'FinalDamage', value: nobleAmp, duration: -1
                    });
                    unit.effectiveFinalDamage = (unit.effectiveFinalDamage || 0) + nobleAmp / 100;
                    unit.damageAmpModifier = (unit.damageAmpModifier || 0) + nobleAmp / 100;
                }
            }

            // 5. Dwarven Forge: 3 / 6 / 9 — item effectiveness
            const dwarves = activeTiers.get('Dwarven Forge') || 0;
            if (dwarves >= 3 && unit.origin === 'Dwarven Forge') {
                let itemPct = 0;
                if (dwarves >= 9) itemPct = 100;
                else if (dwarves >= 6) itemPct = 50;
                else itemPct = 25;
                (unit as any).itemEffectiveness = itemPct;
                if (dwarves >= 9) {
                    unit.modifiers.push({
                        id: 'synergy-dwarf-def',
                        source: 'synergy', type: 'flat', statType: 'DEF', value: 20 * unit.equippedItems.length, duration: -1
                    });
                    unit.modifiers.push({
                        id: 'synergy-dwarf-mdef',
                        source: 'synergy', type: 'flat', statType: 'MDEF', value: 20 * unit.equippedItems.length, duration: -1
                    });
                }
            }

            // 6. Demonic Pact: 3 / 6 / 9 — sacrifice & stat buff
            const demons = activeTiers.get('Demonic Pact') || 0;
            if (demons >= 3 && unit.origin === 'Demonic Pact') {
                let demonAtkPct = 0;
                if (demons >= 9) demonAtkPct = 40;
                else if (demons >= 6) demonAtkPct = 30;
                else demonAtkPct = 20;
                unit.modifiers.push({
                    id: 'synergy-demon-atk',
                    source: 'synergy', type: 'percent', statType: 'ATK', value: demonAtkPct, duration: -1
                });
                unit.modifiers.push({
                    id: 'synergy-demon-ap',
                    source: 'synergy', type: 'percent', statType: 'AP', value: demonAtkPct, duration: -1
                });
            }

            // 7. Magic Tower: 3 / 6 / 9 — spell stacking
            const mages = activeTiers.get('Magic Tower') || 0;
            if (mages >= 3 && unit.origin === 'Magic Tower') {
                let apBonus = 0;
                if (mages >= 9) apBonus = 40;
                else if (mages >= 6) apBonus = 25;
                else apBonus = 15;
                unit.modifiers.push({
                    id: 'synergy-magic-ap',
                    source: 'synergy', type: 'percent', statType: 'AP', value: apBonus, duration: -1
                });
            }

            // 8. Sylvan Elves: 3 / 6 / 9 — crit & dodge
            const elves = activeTiers.get('Sylvan Elves') || 0;
            if (elves >= 3 && unit.origin === 'Sylvan Elves') {
                let critBonus = 0;
                if (elves >= 9) critBonus = 50;
                else if (elves >= 6) critBonus = 30;
                else critBonus = 15;
                unit.modifiers.push({
                    id: 'synergy-elf-crit',
                    source: 'synergy', type: 'percent', statType: 'CritChance', value: critBonus, duration: -1
                });
            }

            // 9. Necropolis Undead: 3 / 6 / 9 — reanimation & lifesteal
            const undead = activeTiers.get('Necropolis Undead') || 0;
            if (undead >= 6 && unit.origin === 'Necropolis Undead') {
                unit.modifiers.push({
                    id: 'synergy-undead-lifesteal',
                    source: 'synergy', type: 'percent', statType: 'Lifesteal', value: 10, duration: -1
                });
                unit.lifestealPercent = (unit.lifestealPercent || 0) + 0.10;
            }

            // 10. Draconic Zealots: 3 / 5 / 7 / 9
            const draconics = activeTiers.get('Draconic Zealots') || 0;
            if (draconics >= 5 && unit.origin === 'Draconic Zealots') {
                unit.modifiers.push({
                    id: 'synergy-dragon-atk',
                    source: 'synergy', type: 'percent', statType: 'ATK', value: 15, duration: -1
                });
            }

            // Combat Traits
            // 12. Mercenary: 2 / 4 / 6
            const mercs = activeTiers.get('Mercenary') || 0;
            if (mercs >= 4 && unit.traits.includes('Mercenary')) {
                unit.modifiers.push({
                    id: 'synergy-merc-amp',
                    source: 'synergy', type: 'percent', statType: 'FinalDamage', value: 15, duration: -1
                });
                unit.damageAmpModifier = (unit.damageAmpModifier || 0) + 0.15;
            }

            // 13. Gladiators: 2 / 4 / 6
            const glads = activeTiers.get('Gladiators') || 0;
            if (glads >= 2 && unit.traits.includes('Gladiators')) {
                unit.modifiers.push({
                    id: 'synergy-glad-amp',
                    source: 'synergy', type: 'percent', statType: 'FinalDamage', value: 10, duration: -1
                });
                unit.damageAmpModifier = (unit.damageAmpModifier || 0) + 0.10;
            }

            // 14. Rogues: 2 / 4 / 6
            const rogues = activeTiers.get('Rogues') || 0;
            if (rogues >= 2 && unit.traits.includes('Rogues')) {
                unit.modifiers.push({
                    id: 'synergy-rogue-critdmg',
                    source: 'synergy', type: 'percent', statType: 'CritDamage', value: 15, duration: -1
                });
            }

            // 16. Doom Harbingers: 2 / 4
            const harbingers = activeTiers.get('Doom Harbingers') || 0;
            if (harbingers >= 2 && unit.traits.includes('Doom Harbingers')) {
                unit.modifiers.push({
                    id: 'synergy-harbinger-amp',
                    source: 'synergy', type: 'percent', statType: 'FinalDamage', value: 10, duration: -1
                });
                unit.damageAmpModifier = (unit.damageAmpModifier || 0) + 0.10;
            }
        }
    }

    /** Call at combat start to reset counters and execute combat-start reactive synergies */
    public static handleCombatStart(boardState: BoardState, activeTiers: Map<string, number>): void {
        this.allyDeathsThisCombat = 0;
        this.undeadResurrectionsThisCombat = 0;
        this.chronoFreezeTriggered = false;
        this.berserkerDeathImmunitySet.clear();
        this.rangerStacks.clear();
        this.chronoStacks.clear();

        const units = boardState.getAllUnits().filter(u => !u.isOnBench && u.state !== 'Dead');

        // 1. Demonic Pact 3: Sacrifice lowest-HP Demon for +20% ATK & AP
        const demons = activeTiers.get('Demonic Pact') || 0;
        if (demons >= 3) {
            const playerDemons = units.filter(u => u.faction === 'player' && u.origin === 'Demonic Pact');
            if (playerDemons.length > 1) {
                playerDemons.sort((a, b) => a.currentHP - b.currentHP);
                const sacrificed = playerDemons[0];
                sacrificed.currentHP = 0;
                sacrificed.state = 'Dead';
                bus.emit({ type: 'UNIT_DIED', unitId: sacrificed.id });
                console.log(`[Demonic Pact 3] Sacrificed lowest-HP Demon ${sacrificed.name}!`);

                for (const demon of playerDemons.slice(1)) {
                    demon.modifiers.push({
                        id: `synergy-demon-sac-atk-${Date.now()}`,
                        source: 'synergy', type: 'percent', statType: 'ATK', value: 20, duration: -1
                    });
                    demon.modifiers.push({
                        id: `synergy-demon-sac-ap-${Date.now()}`,
                        source: 'synergy', type: 'percent', statType: 'AP', value: 20, duration: -1
                    });
                }
            }
        }

        // 2. Beast Tamer 2/3/4: Summon Tamed Wolves
        const beasts = activeTiers.get('Beast Tamer') || 0;
        if (beasts >= 2) {
            const tamers = units.filter(u => u.faction === 'player' && u.traits.includes('Beast Tamer'));
            if (tamers.length > 0) {
                const wolfCount = beasts >= 4 ? 2 : 1;
                const wolfHp = beasts >= 3 ? 750 : 500;
                for (let w = 0; w < wolfCount; w++) {
                    const spawnNeighbors = hexNeighbors(tamers[0].hex).filter(n => !boardState.isHexOccupied(n));
                    const spawnHex = spawnNeighbors.length > 0 ? spawnNeighbors[0] : tamers[0].hex;
                    const wolf = UnitFactory.createUnit('Vanguard Squire', `tamed-wolf-${Date.now()}-${w}`);
                    if (wolf) {
                        wolf.name = 'Tamed Wolf';
                        wolf.faction = 'player';
                        wolf.baseStats.hp = wolfHp;
                        wolf.currentHP = wolfHp;
                        wolf.maxHP = wolfHp;
                        wolf.baseStats.atk = 40;
                        if (beasts >= 4) {
                            wolf.baseAttackSpeed = wolf.baseAttackSpeed * 1.33;
                        }
                        boardState.addUnit(wolf, spawnHex);
                        console.log(`[Beast Tamer] Summoned Tamed Wolf at (${spawnHex.q}, ${spawnHex.r}) with ${wolfHp} HP.`);
                    }
                }
            }
        }

        // 3. Elemental Fairy 3: Summon Elemental Golem & Enemy AS Slow
        const fairies = activeTiers.get('Elemental Fairy') || 0;
        if (fairies >= 3) {
            const existingGolem = units.find(u => u.name === 'Elemental Golem' && u.faction === 'player');
            if (!existingGolem) {
                const fairyUnits = units.filter(u => u.faction === 'player' && u.origin === 'Elemental Fairy');
                const anchorHex = fairyUnits.length > 0 ? fairyUnits[0].hex : { q: 4, r: 4 };
                const spawnNeighbors = hexNeighbors(anchorHex).filter(n => !boardState.isHexOccupied(n));
                const spawnHex = spawnNeighbors.length > 0 ? spawnNeighbors[0] : anchorHex;
                const golem = UnitFactory.createUnit('Stone Protector', `elemental-golem-${Date.now()}`);
                if (golem) {
                    golem.name = 'Elemental Golem';
                    golem.faction = 'player';
                    golem.baseStats.hp = 1200;
                    golem.currentHP = 1200;
                    golem.maxHP = 1200;
                    golem.baseStats.atk = 40;
                    boardState.addUnit(golem, spawnHex);
                    console.log(`[Elemental Fairy] Summoned Elemental Golem.`);
                }
            }

            // Apply enemy AS Slow (15% at Tier 3, 33% at Tier 7)
            const slowVal = fairies >= 7 ? -33 : -15;
            for (const enemy of units.filter(u => u.faction !== 'player')) {
                enemy.modifiers.push({
                    id: 'synergy-fairy-slow',
                    source: 'synergy', type: 'percent', statType: 'AttackSpeed', value: slowVal, duration: -1
                });
            }
        }

        // 4. Chrono Scholar 4: Start Mana & Enemy Delay
        const chronos = activeTiers.get('Chrono Scholar') || 0;
        if (chronos >= 4) {
            for (const ally of units.filter(u => u.faction === 'player')) {
                ally.mana = Math.min(ally.maxMana, ally.mana + 20);
            }
            for (const enemy of units.filter(u => u.faction !== 'player')) {
                enemy.modifiers.push({
                    id: 'synergy-chrono-delay',
                    source: 'synergy', type: 'flat', statType: 'ManaPause', value: 1, duration: 40
                });
            }
        }

        // 5. Runesmith 2/4: Frontline Shield
        const runesmiths = activeTiers.get('Runesmith') || 0;
        if (runesmiths >= 2) {
            for (const ally of units.filter(u => u.faction === 'player' && (u.hex.r === 4 || u.hex.r === 5))) {
                const shieldAmt = Math.round(ally.maxHP * 0.15);
                ally.modifiers.push({
                    id: `synergy-runesmith-shield-${Date.now()}`,
                    source: 'synergy', type: 'flat', statType: 'HP', value: shieldAmt, duration: 100
                });
                ally.currentHP = Math.min(ally.maxHP + shieldAmt, ally.currentHP + shieldAmt);
                if (runesmiths >= 4) {
                    ally.modifiers.push({
                        id: `synergy-runesmith-reflect-${Date.now()}`,
                        source: 'synergy', type: 'percent', statType: 'ReflectDamage', value: 33, duration: 100
                    });
                }
            }
        }

        // 6. Gladiators 2: Isolated Shield
        const glads = activeTiers.get('Gladiators') || 0;
        if (glads >= 2) {
            for (const ally of units.filter(u => u.faction === 'player' && u.traits.includes('Gladiators'))) {
                const hasAdj = units.some(other => other.id !== ally.id && other.faction === 'player' && hexDistance(ally.hex, other.hex) <= 1);
                if (!hasAdj) {
                    const shieldAmt = Math.round(ally.maxHP * 0.15);
                    ally.modifiers.push({
                        id: `synergy-glad-isolated-shield-${Date.now()}`,
                        source: 'synergy', type: 'flat', statType: 'HP', value: shieldAmt, duration: 100
                    });
                    ally.currentHP = Math.min(ally.maxHP + shieldAmt, ally.currentHP + shieldAmt);
                }
            }
        }
    }

    /** Call when any unit dies to handle reactive death synergies */
    public static handleUnitDeath(deadUnit: Unit, boardState: BoardState, activeTiers: Map<string, number>): void {
        if (deadUnit.faction === 'player') {
            this.allyDeathsThisCombat++;

            // Demonic Pact 6: Pit Lord summon on 3 ally deaths
            const demons = activeTiers.get('Demonic Pact') || 0;
            if (demons >= 6 && this.allyDeathsThisCombat === 3) {
                const spawnHex = deadUnit.hex;
                const pitLord = UnitFactory.createUnit('Underworld Pitlord', `lesser-pit-lord-${Date.now()}`);
                if (pitLord) {
                    pitLord.name = 'Lesser Pit Lord';
                    pitLord.faction = 'player';
                    pitLord.baseStats.hp = 1000;
                    pitLord.currentHP = 1000;
                    pitLord.maxHP = 1000;
                    pitLord.baseStats.atk = 80;
                    boardState.addUnit(pitLord, spawnHex);
                    console.log(`[Demonic Pact 6] 3 allied deaths reached! Summoned Lesser Pit Lord at (${spawnHex.q}, ${spawnHex.r}).`);
                }
            }

            // Necropolis Undead 3/6/9: Resurrection Engine
            const undead = activeTiers.get('Necropolis Undead') || 0;
            if (undead >= 3) {
                const maxResurrects = undead >= 9 ? 999 : (undead >= 6 ? 2 : 1);
                if (this.undeadResurrectionsThisCombat < maxResurrects) {
                    this.undeadResurrectionsThisCombat++;
                    const hpPct = undead >= 9 ? 0.10 : 0.50;
                    deadUnit.currentHP = Math.round(deadUnit.maxHP * hpPct);
                    deadUnit.state = 'Searching';
                    console.log(`[Necropolis Undead] Resurrected ${deadUnit.name} with ${(hpPct * 100)}% HP!`);
                }
            }
        }
    }

    /** Call every combat tick to process dynamic stacking & overtime multipliers */
    public static handleCombatTick(tickCount: number, _combatTimerSec: number, boardState: BoardState, activeTiers: Map<string, number>): void {
        const units = boardState.getAllUnits().filter(u => !u.isOnBench && u.state !== 'Dead');

        // 1. Vanguard Berserkers 3/5/7: Missing HP AS & ATK scaling
        const berserkers = activeTiers.get('Vanguard Berserkers') || 0;
        if (berserkers >= 3) {
            for (const unit of units.filter(u => u.faction === 'player' && u.traits.includes('Vanguard Berserkers'))) {
                const missingPct = Math.max(0, (unit.maxHP - unit.currentHP) / unit.maxHP * 100);
                let asBonus = 0;
                let atkBonus = 0;

                if (berserkers >= 5) {
                    asBonus = missingPct * 1.0;   // +1% AS per 1% missing HP
                    atkBonus = missingPct * 0.5;  // +0.5% ATK per 1% missing HP
                } else {
                    asBonus = missingPct * 0.5;   // +1% AS per 2% missing HP
                }

                unit.modifiers = unit.modifiers.filter(m => !m.id.startsWith('synergy-berserker-missing'));
                if (asBonus > 0) {
                    unit.modifiers.push({
                        id: 'synergy-berserker-missing-as',
                        source: 'synergy', type: 'percent', statType: 'AttackSpeed', value: asBonus, duration: -1
                    });
                }
                if (atkBonus > 0) {
                    unit.modifiers.push({
                        id: 'synergy-berserker-missing-atk',
                        source: 'synergy', type: 'percent', statType: 'ATK', value: atkBonus, duration: -1
                    });
                }

                // Tier 7: 3s Death Immunity at 20% HP
                if (berserkers >= 7 && unit.currentHP <= unit.maxHP * 0.20 && !this.berserkerDeathImmunitySet.has(unit.id)) {
                    this.berserkerDeathImmunitySet.add(unit.id);
                    unit.modifiers.push({
                        id: `synergy-berserker-death-immunity-${Date.now()}`,
                        source: 'synergy', type: 'flat', statType: 'DeathImmunity', value: 1, duration: 60
                    });
                    console.log(`[Vanguard Berserkers 7] ${unit.name} triggered 3s Death Immunity!`);
                }
            }
        }

        // 2. Rangers 4/6: 3s Stacking Attack Speed
        const rangers = activeTiers.get('Rangers') || 0;
        if (rangers >= 4 && tickCount % 60 === 0 && tickCount > 0) {
            const stackVal = rangers >= 6 ? 25 : 15;
            for (const unit of units.filter(u => u.faction === 'player' && u.traits.includes('Rangers'))) {
                const current = this.rangerStacks.get(unit.id) || 0;
                if (current < 5) {
                    const next = current + 1;
                    this.rangerStacks.set(unit.id, next);
                    unit.modifiers.push({
                        id: `synergy-ranger-stack-${next}`,
                        source: 'synergy', type: 'percent', statType: 'AttackSpeed', value: stackVal, duration: -1
                    });
                    console.log(`[Rangers] ${unit.name} gained AS stack ${next} (+${stackVal}% AS).`);
                }
            }
        }

        // 3. Chrono Scholar 2/6: 6s Stacking Attack Speed & Time Freeze
        const chronos = activeTiers.get('Chrono Scholar') || 0;
        if (chronos >= 2 && tickCount % 120 === 0 && tickCount > 0) {
            for (const ally of units.filter(u => u.faction === 'player')) {
                const current = this.chronoStacks.get(ally.id) || 0;
                if (current < 3) {
                    const next = current + 1;
                    this.chronoStacks.set(ally.id, next);
                    ally.modifiers.push({
                        id: `synergy-chrono-stack-${next}`,
                        source: 'synergy', type: 'percent', statType: 'AttackSpeed', value: 15, duration: -1
                    });
                }
            }
        }
        if (chronos >= 6 && !this.chronoFreezeTriggered) {
            const lowAlly = units.find(u => u.faction === 'player' && u.currentHP <= u.maxHP * 0.20);
            if (lowAlly) {
                this.chronoFreezeTriggered = true;
                console.log(`[Chrono Scholar 6] Emergency Time Freeze triggered by ${lowAlly.name}!`);
                for (const enemy of units.filter(u => u.faction !== 'player' && hexDistance(u.hex, lowAlly.hex) <= 2)) {
                    enemy.modifiers.push({
                        id: `synergy-chrono-freeze-${Date.now()}`,
                        source: 'synergy', type: 'flat', statType: 'Stun', value: 1, duration: 50
                    });
                }
            }
        }

        // 4. Elemental Fairy 7: 5s Tidal Wave MDEF Shred
        const fairies = activeTiers.get('Elemental Fairy') || 0;
        if (fairies >= 7 && tickCount % 100 === 0 && tickCount > 0) {
            for (const enemy of units.filter(u => u.faction !== 'player')) {
                resolveDamage(units.find(u => u.origin === 'Elemental Fairy') || enemy, enemy, 150, 'magic');
                enemy.modifiers.push({
                    id: `synergy-fairy-wave-${Date.now()}`,
                    source: 'synergy', type: 'percent', statType: 'MDEF', value: -33, duration: 100
                });
            }
            console.log(`[Elemental Fairy 7] Tidal Wave triggered! 150 Magic Damage & 33% MDEF shred.`);
        }

        // 5. Overtime Multipliers (after 25s of combat)
        const combatDurationTicks = tickCount;
        if (combatDurationTicks >= 500) {
            for (const unit of units) {
                if (!unit.modifiers.some(m => m.id === 'synergy-overtime-antiheal')) {
                    unit.modifiers.push({
                        id: 'synergy-overtime-antiheal',
                        source: 'synergy', type: 'percent', statType: 'AntiHeal', value: 50, duration: -1
                    });
                }
                if (combatDurationTicks % 20 === 0) {
                    unit.damageAmpModifier = (unit.damageAmpModifier || 0) + 0.10;
                }
            }
        }
    }

    /** Call at start of Preparation phase for prep-phase synergy logic (Dragon Egg, Demonic 9, Fairy merge) */
    public static handlePreparationPhase(boardState: BoardState, activeTiers: Map<string, number>, _shopManager: any, gameLoop: any): void {
        const units = boardState.getAllUnits();

        // 1. Demonic Pact 9: Sacrifice 5 Player HP for Great Demon Lord
        const demons = activeTiers.get('Demonic Pact') || 0;
        if (demons >= 9 && !this.greatDemonLordSummoned && gameLoop.playerHP > 5) {
            this.greatDemonLordSummoned = true;
            gameLoop.playerHP = Math.max(1, gameLoop.playerHP - 5);
            const demonLord = UnitFactory.createUnit('Lord of Torment', `great-demon-lord-${Date.now()}`);
            if (demonLord) {
                demonLord.name = 'Great Demon Lord';
                demonLord.faction = 'player';
                demonLord.starLevel = 3;
                demonLord.baseStats.hp = 1500;
                demonLord.currentHP = 1500;
                demonLord.maxHP = 1500;
                demonLord.baseStats.atk = 120;
                const added = boardState.addUnitToBench(demonLord);
                if (!added) {
                    const freeHex = { q: 3, r: 7 };
                    boardState.addUnit(demonLord, freeHex);
                }
                console.log(`[Demonic Pact 9] Sacrificed 5 Player HP! Spawned Great Demon Lord (HP: ${gameLoop.playerHP}).`);
            }
        }

        // 2. Draconic Zealots 3/5/7/9: Golden Dragon Egg Hatching
        const draconics = activeTiers.get('Draconic Zealots') || 0;
        if (draconics >= 3) {
            let egg = units.find(u => u.name === 'Golden Dragon Egg' && u.faction === 'player');
            if (!egg) {
                const newEgg = UnitFactory.createUnit('Cinder Hatchling', `dragon-egg-${Date.now()}`);
                if (newEgg) {
                    newEgg.name = 'Golden Dragon Egg';
                    newEgg.faction = 'player';
                    newEgg.baseStats.hp = 1;
                    newEgg.currentHP = 1;
                    newEgg.maxHP = 1;
                    newEgg.baseStats.atk = 0;
                    boardState.addUnitToBench(newEgg);
                    egg = newEgg;
                    console.log(`[Draconic Zealots] Spawned Golden Dragon Egg on bench.`);
                }
            }

            if (egg) {
                const addCharges = draconics >= 5 ? 2 : 1;
                this.dragonEggCharges += addCharges;
                console.log(`[Draconic Zealots] Dragon Egg gained +${addCharges} hatch charge. Total: ${this.dragonEggCharges}/4.`);

                if (this.dragonEggCharges >= 4) {
                    let hatchedName = 'Cinder Hatchling';
                    if (draconics >= 9) hatchedName = 'Cinder Dragon';
                    else if (draconics >= 7) hatchedName = 'Wyvern Rider';

                    const hatched = UnitFactory.createUnit(hatchedName, `hatched-dragon-${Date.now()}`, 2);
                    if (hatched) {
                        hatched.faction = 'player';
                        boardState.removeUnit(egg.id);
                        boardState.addUnitToBench(hatched);
                        this.dragonEggCharges = 0;
                        console.log(`[Draconic Zealots] Egg Hatched! Created 2-star ${hatchedName} on bench.`);
                    }
                }
            }
        }

        // 3. Elemental Fairy 5/7: Fairy Golem Merge
        const fairies = activeTiers.get('Elemental Fairy') || 0;
        if (fairies >= 5) {
            const golem = units.find(u => u.name === 'Elemental Golem' && u.faction === 'player' && !u.isOnBench);
            if (golem) {
                const adjacentFairies = units.filter(u => u.id !== golem.id && u.faction === 'player' && u.origin === 'Elemental Fairy' && !u.isOnBench && hexDistance(u.hex, golem.hex) <= 1);
                const statBoostPct = fairies >= 7 ? 40 : 20;
                for (const fairy of adjacentFairies) {
                    console.log(`[Elemental Fairy] Merged ${fairy.name} into Elemental Golem! (+${statBoostPct}% stats)`);
                    golem.maxHP = Math.round(golem.maxHP * (1 + statBoostPct / 100));
                    golem.currentHP = golem.maxHP;
                    golem.baseStats.atk = Math.round(golem.baseStats.atk * (1 + statBoostPct / 100));
                    golem.baseStats.def = Math.round(golem.baseStats.def * (1 + statBoostPct / 100));
                    boardState.removeUnit(fairy.id);
                    bus.emit({ type: 'UNIT_DIED', unitId: fairy.id });
                }
            }
        }
    }
}