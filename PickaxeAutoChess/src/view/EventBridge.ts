// src/view/EventBridge.ts

import { bus } from '../core/events/EventBus';
import { UnitView } from './UnitView';
import { UIOverlay } from './UIOverlay';
import { ParticleSystem } from './ParticleSystem';
import { BoardState } from '../core/board/BoardState';
import { soundManager } from '../audio/SoundManager';

export class EventBridge {
    private unitView: UnitView;
    private uiOverlay: UIOverlay;
    private particles: ParticleSystem;
    private boardState: BoardState;

    constructor(unitView: UnitView, uiOverlay: UIOverlay, particles: ParticleSystem, boardState: BoardState) {
        this.unitView = unitView;
        this.uiOverlay = uiOverlay;
        this.particles = particles;
        this.boardState = boardState;
        this.bindEvents();
    }

    private bindEvents(): void {
        bus.on('UNIT_MOVED', (e) => {
            if (e.type === 'UNIT_MOVED') {
                this.unitView.playAnimation(e.unitId, 'walk');
            }
        });

        bus.on('ATTACK_START', (e) => {
            if (e.type === 'ATTACK_START') {
                this.unitView.playAnimation(e.unitId, 'attack');
                soundManager.playHitSound();

                // Spawn impact spark particles at attacker coordinates
                const attackerMesh = this.unitView.getUnitMesh(e.unitId);
                if (attackerMesh) {
                    const pos = attackerMesh.position.clone();
                    pos.y = 0.5;
                    this.particles.spawnSparks(pos, '#f59e0b', 10);
                }
            }
        });

        bus.on('SKILL_CAST', (e) => {
            if (e.type === 'SKILL_CAST') {
                this.unitView.playAnimation(e.unitId, 'cast');
                soundManager.playUpgradeChime();

                // Spawn ultimate ring visual indicator around unit
                const casterMesh = this.unitView.getUnitMesh(e.unitId);
                if (casterMesh) {
                    const pos = casterMesh.position.clone();
                    this.particles.spawnRing(pos, '#a78bfa');
                }
            }
        });

        bus.on('UNIT_DIED', (e) => {
            if (e.type === 'UNIT_DIED') {
                this.unitView.playAnimation(e.unitId, 'die');

                const deadMesh = this.unitView.getUnitMesh(e.unitId);
                if (deadMesh) {
                    const pos = deadMesh.position.clone();
                    pos.y = 0.4;
                    this.particles.spawnSparks(pos, '#ef4444', 20);
                }

                setTimeout(() => {
                    const unit = this.boardState.getUnit(e.unitId);
                    if (!unit || unit.state === 'Dead' || unit.state === 'Dying') {
                        this.unitView.removeUnit(e.unitId);
                        this.uiOverlay.removeHPBar(e.unitId);
                    }
                }, 1000);
            }
        });

        bus.on('DAMAGE_APPLIED', (e) => {
            if (e.type === 'DAMAGE_APPLIED') {
                soundManager.playHitSound();
            }
        });
    }
}
