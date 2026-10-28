// src/core/board/GameLoopManager.ts

import { BoardState } from './BoardState';
import { UnitFactory } from '../units/UnitFactory';
import { bus } from '../events/EventBus';
import unitsCatalogRaw from '../data/units_catalog.json';
import { AncientManager } from '../stats/AncientManager';
import { SynergyManager } from '../stats/SynergyManager';

export type GamePhase = 'Preparation' | 'Matchmaking' | 'Combat' | 'Resolution';

export class GameLoopManager {
    public ancientManager: AncientManager | null = null;
    public shopManager: any = null;
    public phase: GamePhase = 'Preparation';
    public phaseTimer: number = 30; // seconds remaining
    public playerHP: number = 100;
    public opponentHP: number = 100;
    public stage: number = 1;
    public round: number = 1;
    public winStreak: number = 0;
    public lossStreak: number = 0;

    private boardState: BoardState;
    private onPhaseChangeCallbacks: Array<(phase: GamePhase) => void> = [];

    constructor(boardState: BoardState) {
        this.boardState = boardState;
    }

    public onPhaseChange(cb: (phase: GamePhase) => void): void {
        this.onPhaseChangeCallbacks.push(cb);
    }

    public reset(): void {
        this.phase = 'Preparation';
        this.phaseTimer = 30;
        this.playerHP = 100;
        this.opponentHP = 100;
        this.stage = 1;
        this.round = 1;
        this.winStreak = 0;
        this.lossStreak = 0;
        this.localCombatResolved = false;
        this.boardSnapshot = [];
    }

    public tickSecond(): void {
        if (this.phaseTimer > 0) {
            this.phaseTimer--;
        } else {
            this.transitionNextPhase();
        }
    }

    private transitionNextPhase(): void {
        if (this.phase === 'Preparation') {
            this.phase = 'Matchmaking';
            this.phaseTimer = 2;
            this.setupMatchmaking();
        } else if (this.phase === 'Matchmaking') {
            this.phase = 'Combat';
            this.phaseTimer = 40;
            this.setupCombat();
        } else if (this.phase === 'Combat') {
            this.phase = 'Resolution';
            this.phaseTimer = 3;
            this.resolveRound();
        } else if (this.phase === 'Resolution') {
            this.phase = 'Preparation';
            this.phaseTimer = 30;
            this.incrementRound();

            // Decrement Facility construction timers
            const activeTraits = SynergyManager.calculateSynergies(this.boardState.getAllUnits());
            const architects = activeTraits.get('Architect') || 0;
            for (const unit of this.boardState.getAllUnits()) {
                if (unit.isFacility && unit.constructionRoundsRemaining > 0) {
                    const decAmt = architects >= 2 ? 2 : 1;
                    unit.constructionRoundsRemaining = Math.max(0, unit.constructionRoundsRemaining - decAmt);
                    console.log(`[Facility] ${unit.name} construction updated. Rounds remaining: ${unit.constructionRoundsRemaining}`);
                }
            }
        }

        for (const cb of this.onPhaseChangeCallbacks) {
            cb(this.phase);
        }
    }

    public localCombatResolved: boolean = false;
    public multiplayerPlayersResolved: boolean = true; // In multiplayer, change to false until server synchronizes
    private boardSnapshot: Array<{ unitId: string; hex: { q: number; r: number }; isOnBench: boolean; benchSlotIndex: number }> = [];

    public saveBoardSnapshot(): void {
        this.boardSnapshot = [];
        for (const unit of this.boardState.getAllUnits()) {
            if (unit.faction === 'player') {
                this.boardSnapshot.push({
                    unitId: unit.id,
                    hex: { q: unit.hex.q, r: unit.hex.r },
                    isOnBench: unit.isOnBench,
                    benchSlotIndex: unit.benchSlotIndex
                });
            }
        }
        console.log(`[GameLoop] Saved snapshot of ${this.boardSnapshot.length} player units.`);
    }

    public restoreBoardSnapshot(): void {
        try {
            console.log(`[GameLoop] Restoring snapshot of ${this.boardSnapshot.length} player units.`);
            const snapshotMap = new Map(this.boardSnapshot.map(s => [s.unitId, s]));
            
            // Restore all player units in the snapshot
            for (const snap of this.boardSnapshot) {
                const unit = this.boardState.getUnit(snap.unitId);
                if (unit) {
                    const prev = { ...unit.hex };
                    unit.hex = { q: snap.hex.q, r: snap.hex.r };
                    unit.isOnBench = snap.isOnBench;
                    unit.benchSlotIndex = snap.benchSlotIndex;
                    unit.state = 'Idle';
                    unit.currentHP = unit.maxHP;
                    unit.mana = 0;
                    bus.emit({ type: 'UNIT_MOVED', unitId: unit.id, from: prev, to: unit.hex });
                }
            }

            // Clean up any extra player units not in starting snapshot
            for (const unit of this.boardState.getAllUnits()) {
                if (unit.faction === 'player' && !snapshotMap.has(unit.id)) {
                    this.boardState.removeUnit(unit.id);
                    bus.emit({ type: 'UNIT_DIED', unitId: unit.id });
                }
            }
        } catch (err) {
            console.error('[GameLoop] Error restoring board snapshot:', err);
        }
    }

    public resolveLocalCombat(): void {
        if (this.phase !== 'Combat' || this.localCombatResolved) return;
        this.localCombatResolved = true;
        console.log('[GameLoop] Local combat resolved.');
        this.checkCombatPhaseEnd();
    }

    public checkCombatPhaseEnd(): void {
        if (this.phase === 'Combat' && this.localCombatResolved && this.multiplayerPlayersResolved) {
            this.phaseTimer = 0;
            this.transitionNextPhase();
        }
    }

    private setupMatchmaking(): void {
        console.log('[GameLoop] Pairings set. Opponent boards cloned.');
    }

    private setupCombat(): void {
        console.log('[GameLoop] Fight started. autonomous simulation begins.');
        this.localCombatResolved = false;

        // Scale enemy count with stage: stage 1 = 1 enemy, stage 2 = 2, etc., cap at 7
        const enemyCount = Math.min(7, this.stage);
        const catalog = unitsCatalogRaw as any[];

        // Spread enemies across the top 4 rows (r=0..3), columns 0..6
        // Pre-compute a set of starting positions to avoid stacking on the same hex
        const positions: { q: number; r: number }[] = [
            { q: 3, r: 0 }, { q: 1, r: 0 }, { q: 5, r: 0 },
            { q: 2, r: 1 }, { q: 4, r: 1 }, { q: 0, r: 1 }, { q: 6, r: 1 },
        ];

        for (let i = 0; i < enemyCount; i++) {
            // Pick a unit whose cost <= current stage so difficulty scales naturally
            const choices = catalog.filter(u => u.cost <= this.stage);
            const entry = choices.length > 0
                ? choices[Math.floor(Math.random() * choices.length)]
                : catalog[0];

            const opponent = UnitFactory.createUnit(entry.name, `ai-${Date.now()}-${i}`);
            if (opponent) {
                opponent.faction = 'enemy';
                this.boardState.addUnit(opponent, positions[i]);
            }
        }

        // Set all existing non-bench units to Searching state
        for (const unit of this.boardState.getAllUnits()) {
            if (!unit.isOnBench) {
                unit.state = 'Searching';
            }
        }
    }

    private resolveRound(): void {
        console.log('[GameLoop] Round finished. Evaluating HP modifications.');

        let playerAlive = false;
        let enemyAlive = false;

        let playerSurvivors = 0;
        let enemySurvivors = 0;
        for (const unit of this.boardState.getAllUnits()) {
            if (!unit.isOnBench && unit.state !== 'Dead' && unit.state !== 'Dying') {
                if (unit.faction === 'player') playerSurvivors++;
                if (unit.faction === 'enemy') enemySurvivors++;
            }
        }

        playerAlive = playerSurvivors > 0;
        enemyAlive = enemySurvivors > 0;

        if (!playerAlive && enemyAlive) {
            // Player lost
            this.lossStreak++;
            this.winStreak = 0;
            
            // Ancient synergy: lose-streak gold bonus
            if (this.ancientManager) {
                this.ancientManager.awardLoseStreakGold(this.lossStreak);
            }
            
            // Rebalanced HP Loss formula: Damage = Winner Level + surviving board units count
            const winnerLevel = this.stage; // Opponent Level (AI stage)
            const damageApplied = winnerLevel + enemySurvivors;
            
            this.playerHP = Math.max(0, this.playerHP - damageApplied);
            console.log(`[GameLoop] Round Lost. Stage ${this.stage} damage applied: ${damageApplied} (${winnerLevel} + ${enemySurvivors}). Player HP: ${this.playerHP}`);
        } else if (playerAlive && !enemyAlive) {
            // Player won
            this.winStreak++;
            this.lossStreak = 0;
            
            const winnerLevel = this.shopManager ? this.shopManager.level : 3;
            const damageApplied = winnerLevel + playerSurvivors;
            this.opponentHP = Math.max(0, this.opponentHP - damageApplied);
            console.log(`[GameLoop] Round Won! Opponent took ${damageApplied} (${winnerLevel} + ${playerSurvivors}) damage. Opponent HP: ${this.opponentHP}`);
            
            // Loot Drop Mechanics:
            // Stage 1 tutorial drops components at 1-2, 1-3, 1-4
            if (this.stage === 1 && (this.round === 2 || this.round === 3 || this.round === 4)) {
                const componentsPool = ['Blunt Sword', 'Bow', 'Chestplate'];
                const drop = componentsPool[Math.floor(Math.random() * componentsPool.length)];
                this.boardState.addItemToInventory(drop);
                console.log(`[Loot Drop] Stage 1 tutorial drop: ${drop}`);
            }

            // Boss Round 7 drops (in every stage): 2 components + 2 Item Removers
            if (this.round === 7) {
                const componentsPool = ['Blunt Sword', 'Bow', 'Chestplate'];
                const dropA = componentsPool[Math.floor(Math.random() * componentsPool.length)];
                const dropB = componentsPool[Math.floor(Math.random() * componentsPool.length)];
                
                this.boardState.addItemToInventory(dropA);
                this.boardState.addItemToInventory(dropB);
                // Also award 2 removers (represented as consumables strings)
                this.boardState.addItemToInventory('Item Remover');
                this.boardState.addItemToInventory('Item Remover');
                console.log(`[Loot Drop] Boss round 7 loot: ${dropA}, ${dropB}, 2x Item Remover`);
            }
        } else {
            // Tie breaker / draw
            this.winStreak = 0;
            this.lossStreak = 0;
            console.log('[GameLoop] Draw round.');
        }

        // Evaluate Facility destruction penalties and Resource payouts
        enemySurvivors = 0;
        for (const unit of this.boardState.getAllUnits()) {
            if (unit.faction === 'enemy' && !unit.isOnBench && unit.state !== 'Dead' && unit.state !== 'Dying') {
                enemySurvivors++;
            }
        }
        const activeTraits = SynergyManager.calculateSynergies(this.boardState.getAllUnits());
        const architects = activeTraits.get('Architect') || 0;
        
        for (const unit of this.boardState.getAllUnits()) {
            if (unit.faction === 'player' && unit.isFacility) {
                if (unit.state === 'Dead' || unit.state === 'Dying') {
                    // Destruction penalty only applies on round loss when enemies survive
                    if (!playerAlive && enemyAlive && enemySurvivors > 0) {
                        let penalty = 0;
                        if (unit.starLevel === 1) {
                            penalty = Math.max(1, Math.floor(enemySurvivors / 3)) * 1;
                        } else if (unit.starLevel === 2) {
                            penalty = Math.max(1, Math.floor(enemySurvivors / 3)) * 3;
                        } else {
                            penalty = Math.max(1, Math.floor(enemySurvivors / 4)) * 6;
                        }
                        if (architects >= 6) {
                            console.log(`[Facility] Architect (6) negated destruction penalty of ${penalty} HP for ${unit.name}`);
                            penalty = 0;
                        }
                        if (penalty > 0) {
                            this.playerHP = Math.max(0, this.playerHP - penalty);
                            console.log(`[Facility] Destroyed facility ${unit.name}! Player took ${penalty} damage. HP: ${this.playerHP}`);
                        }
                    }
                } else if (unit.facilityType === 'Resource' && unit.constructionRoundsRemaining === 0) {
                    const facName = unit.facilityName || unit.name;
                    let goldReward = unit.starLevel * 2;
                    let xpReward = unit.starLevel * 1;

                    if (facName === 'Gold Mine' || unit.name.includes('Gold')) {
                        goldReward = unit.starLevel === 1 ? 3 : (unit.starLevel === 2 ? 6 : 10);
                        xpReward = 0;
                    } else if (facName === 'Alchemy Lab' || unit.name.includes('Alchemy')) {
                        goldReward = unit.starLevel === 1 ? 2 : (unit.starLevel === 2 ? 4 : 7);
                        xpReward = unit.starLevel === 1 ? 2 : (unit.starLevel === 2 ? 4 : 6);
                    }

                    if (this.shopManager) {
                        this.shopManager.gold += goldReward;
                        if (xpReward > 0) {
                            this.shopManager.addXP(xpReward);
                        }
                        console.log(`[Facility] Resource Facility ${unit.name} payout: +${goldReward}g, +${xpReward} XP`);
                    }
                }
            }
        }

        // Clean enemy units from board
        for (const unit of this.boardState.getAllUnits()) {
            if (unit.faction === 'enemy') {
                bus.emit({ type: 'UNIT_DIED', unitId: unit.id });
                this.boardState.removeUnit(unit.id);
            } else {
                // Reset friendly units state to Idle and HP to full
                unit.state = 'Idle';
                unit.currentHP = unit.maxHP;
            }
        }
    }

    private incrementRound(): void {
        this.round++;
        if (this.round > 7) {
            this.round = 1;
            this.stage++;
        }
    }
}
