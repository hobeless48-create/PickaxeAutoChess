// src/test_core.ts

import { hexDistance, hexRound, hexToWorld } from './core/hex/HexGrid';
import { TickManager } from './core/tick/TickManager';
import { transitionUnit } from './core/fsm/UnitFSM';
import type { FsmUnit } from './core/fsm/UnitFSM';
import { getActualStat } from './core/stats/ModifierPipeline';
import type { Modifier } from './core/stats/ModifierPipeline';
import { resolveDamage } from './core/combat/CombatEngine';
import type { CombatUnit } from './core/combat/CombatEngine';

console.log('--- STARTING CORE ENGINE VALIDATION TESTS ---');

// 1. Hex Coordinates Validation
const tileA = { q: 0, r: 0 };
const tileB = { q: 2, r: -1 }; // distance should be 2
const distance = hexDistance(tileA, tileB);
console.log(`[Hex Math] Distance from (0,0) to (2,-1): ${distance} (Expected: 2)`);

const fractionalHex = { q: 1.2, r: -0.9 };
const rounded = hexRound(fractionalHex);
console.log(`[Hex Math] Rounding (1.2, -0.9): q=${rounded.q}, r=${rounded.r} (Expected: q=1, r=-1)`);

const worldPos = hexToWorld({ q: 1, r: 0 });
console.log(`[Hex Math] World coordinates of (1,0): X=${worldPos.x.toFixed(2)}, Z=${worldPos.z.toFixed(2)} (Expected: X=1.50, Z=0.87)`);

// 2. FSM Logic Checks
const testUnit: FsmUnit = { id: 'test-1', state: 'Idle' };
console.log(`[FSM] Unit starts at: ${testUnit.state}`);
const ok1 = transitionUnit(testUnit, 'Searching');
console.log(`[FSM] Transition to Searching: ${ok1 ? 'SUCCESS' : 'FAILED'} (Current state: ${testUnit.state})`);
const ok2 = transitionUnit(testUnit, 'Casting'); // should fail
console.log(`[FSM] Invalid transition to Casting failed as expected: ${!ok2 ? 'YES' : 'NO'}`);

// 3. Modifier Pipeline Checks
const baseHP = 1000;
const modifiers: Modifier[] = [
    { id: 'item-1', source: 'item', type: 'flat', statType: 'HP', value: 200, duration: -1 },
    { id: 'synergy-1', source: 'synergy', type: 'percent', statType: 'HP', value: 10, duration: -1 }
];
const actualHP = getActualStat(baseHP, modifiers, 'HP');
console.log(`[Stat Modifiers] Base HP 1000 with +200 flat and +10% percent: ${actualHP} (Expected: 1320)`);

// 4. Combat Calculations Verification
const defender: CombatUnit = {
    id: 'defender-1',
    state: 'Idle',
    effectiveDEF: 50,
    effectiveMDEF: 20,
    damageAmpModifier: 0,
    damageReductionModifier: 0.10, // 10% reduction
    lifestealPercent: 0,
    currentHP: 500,
    maxHP: 500
};

const attacker: CombatUnit = {
    id: 'attacker-1',
    state: 'Idle',
    effectiveDEF: 10,
    effectiveMDEF: 10,
    damageAmpModifier: 0.20, // 20% amplification
    damageReductionModifier: 0,
    lifestealPercent: 0.25, // 25% lifesteal
    currentHP: 200,
    maxHP: 500
};

// Attack: Physical damage raw 100
// Mitigated defense: 100 * (100 / (100 + 50)) = 66.67
// Attacker amp: 66.67 * 1.20 = 80
// Defender reduction: 80 * 0.90 = 72
// Post-mitigation lifesteal: 72 * 0.25 = 18
const finalDamageApplied = resolveDamage(attacker, defender, 100, 'physical');
console.log(`[Combat Math] Damage resolved: ${finalDamageApplied.toFixed(2)} (Expected: 72.00)`);
console.log(`[Combat Math] Defender remaining HP: ${defender.currentHP.toFixed(2)} (Expected: 428.00)`);
console.log(`[Combat Math] Attacker lifesteal healed to HP: ${attacker.currentHP.toFixed(2)} (Expected: 218.00)`);

// 5. Roster & Catalog Validation (Milestone 3)
import unitsCatalogRaw from './core/data/units_catalog.json';
import { UnitFactory } from './core/units/UnitFactory';
import { BoardState } from './core/board/BoardState';
import { processUnitStatusTicks } from './core/combat/CombatEngine';

console.log(`[Roster Audit] Total units in catalog: ${unitsCatalogRaw.length} (Expected: 61)`);
const relicTitan = UnitFactory.createUnit('Relic Titan', 'test-titan-1');
console.log(`[Roster Audit] 61st unit Relic Titan created: ${relicTitan ? 'SUCCESS (' + relicTitan.cost + '-cost ' + relicTitan.origin + ')' : 'FAILED'}`);

// 6. Defender Mana Gain & Status Ticks Validation
const testDefender = UnitFactory.createUnit('Vanguard Squire', 'def-mana-test')!;
testDefender.mana = 0;
const testAttacker = UnitFactory.createUnit('Vanguard Squire', 'atk-mana-test')!;

const damageDealt = resolveDamage(testAttacker, testDefender, 100, 'physical');
console.log(`[Defender Mana] Defender took ${damageDealt.toFixed(1)} damage, gained mana: ${testDefender.mana} (Expected > 0)`);

// Status ticks test
testDefender.modifiers.push({ id: 'test-stun', source: 'skill', type: 'flat', statType: 'Stun', value: 1, duration: 2 });
processUnitStatusTicks(testDefender, 1);
console.log(`[Status Ticks] Stun duration remaining: ${testDefender.modifiers.find(m => m.id === 'test-stun')?.duration} (Expected: 1)`);
processUnitStatusTicks(testDefender, 2);
console.log(`[Status Ticks] Stun purged after expiry: ${!testDefender.modifiers.some(m => m.id === 'test-stun') ? 'SUCCESS' : 'FAILED'}`);

// 7. Milestone 4 Interactive Facility System Validation
import { ShopManager } from './core/shop/ShopManager';
import { processFacilityCombatTicks } from './core/combat/CombatEngine';

console.log('--- STARTING MILESTONE 4 FACILITY SYSTEM TESTS ---');
const facCatalog = UnitFactory.getFacilityCatalog();
console.log(`[Facility Catalog] Total facilities in catalog: ${facCatalog.length} (Expected: 7)`);

const ballista = UnitFactory.createFacilityFromCatalog('Ballista Tower', 'fac-ballista-1')!;
console.log(`[Facility Creation] Ballista Tower created: ${ballista && ballista.isFacility && ballista.facilityType === 'Offensive' ? 'SUCCESS' : 'FAILED'} (Construction rounds: ${ballista.constructionRoundsRemaining})`);

const boardStateTest = new BoardState();
const shopManagerTest = new ShopManager();
shopManagerTest.gold = 100;

shopManagerTest.rollFacilityShop();
console.log(`[Facility Shop] Rolled facility shop cards count: ${shopManagerTest.currentFacilityShop.length} (Expected: 3)`);

// Buy up to capacity limit (3)
shopManagerTest.buyFacility(0, boardStateTest);
shopManagerTest.buyFacility(1, boardStateTest);
shopManagerTest.buyFacility(2, boardStateTest);
console.log(`[Facility Purchasing] Purchased 3 facilities. Current count: ${shopManagerTest.getPlayerFacilityCount(boardStateTest)}/3`);

shopManagerTest.rollFacilityShop();
const fac4Attempt = shopManagerTest.buyFacility(0, boardStateTest);
console.log(`[Facility Capacity] 4th facility purchase correctly rejected by capacity limit: ${fac4Attempt === null ? 'SUCCESS' : 'FAILED'}`);

// Test Inert status & Support Aura ticks
const totem = UnitFactory.createFacilityFromCatalog('Healing Totem', 'fac-totem-1')!;
totem.constructionRoundsRemaining = 0; // Completed construction
totem.faction = 'player';

const damagedHero = UnitFactory.createUnit('Vanguard Squire', 'hero-1')!;
damagedHero.faction = 'player';
damagedHero.currentHP = 500; // Damaged

processFacilityCombatTicks([totem, damagedHero], 40); // 40 ticks = 2s pulse
console.log(`[Facility Aura] Healing Totem healed ally HP to: ${damagedHero.currentHP} (Expected > 500)`);

// 8. Headless Timer Check
const ticker = new TickManager(20);
let count = 0;
ticker.onTick((tickNum) => {
    count++;
    if (tickNum === 20) {
        console.log(`[Tick Loop] Successfully completed ${count} iterations!`);
        ticker.stop();
        console.log('--- COMPLETED CORE ENGINE VALIDATION TESTS ---');
    }
});
ticker.start();
