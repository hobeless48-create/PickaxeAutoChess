// src/view/UnitView.ts

import * as THREE from 'three';
import { ModelFactory } from './3d/ModelFactory';
import { hexToWorld } from '../core/hex/HexGrid';
import type { Hex } from '../core/hex/HexGrid';
import { BOARD_Z_OFFSET } from './BoardView';
import unitsCatalogRaw from '../core/data/units_catalog.json';
import facilityCatalogRaw from '../core/data/facility_catalog.json';

interface CatalogUnit {
    name: string;
    cost: number;
    faction: string;
    traits: string[];
}

interface FacilityEntry {
    name: string;
    facilityType: 'Offensive' | 'Support' | 'Resource';
    cost: number;
    traits: string[];
}

const unitsCatalog = unitsCatalogRaw as CatalogUnit[];
const facilityCatalog = facilityCatalogRaw as FacilityEntry[];

export class UnitView {
    private scene: THREE.Scene;
    private meshes: Map<string, THREE.Object3D> = new Map();
    private unitStates: Map<string, { animation: string; elapsed: number; initialY: number }> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public spawnUnit(
        unitId: string,
        initialHex: Hex,
        _color: string = '#3b82f6',
        modelName?: string,
        starLevel: number = 1,
        _isUnderConstruction: boolean = false,
        team: 'player' | 'enemy' = 'player'
    ): void {
        // Remove old mesh if already exists
        this.removeUnit(unitId);

        const worldPos = hexToWorld(initialHex);
        const name = modelName || 'Vanguard Squire';

        // Lookup Catalog Entry for Real Faction, Cost, and Traits
        const facEntry = facilityCatalog.find(f => f.name.toLowerCase() === name.toLowerCase());
        const catalogEntry = facEntry ? {
            name: facEntry.name,
            cost: facEntry.cost,
            faction: 'Architect',
            traits: facEntry.traits || []
        } : (unitsCatalog.find(u => u.name.toLowerCase() === name.toLowerCase()) || {
            name,
            cost: 1,
            faction: 'Human',
            traits: []
        });

        // Instantiate Distinct 3D Character Model Mesh via ModelFactory
        const unit3DGroup = ModelFactory.createUnit3DModel(
            catalogEntry.name,
            catalogEntry.faction,
            catalogEntry.cost,
            catalogEntry.traits,
            starLevel,
            team
        );
        unit3DGroup.name = unitId;

        const posY = 0.0;
        unit3DGroup.position.set(worldPos.x, posY, worldPos.z + BOARD_Z_OFFSET);

        this.scene.add(unit3DGroup);
        this.meshes.set(unitId, unit3DGroup);
        this.unitStates.set(unitId, { animation: 'idle', elapsed: Math.random() * 10, initialY: posY });
    }

    public playAnimation(unitId: string, animationName: string): void {
        const state = this.unitStates.get(unitId);
        if (state) {
            state.animation = animationName;
            state.elapsed = 0; // reset
        }
    }

    public updatePosition(unitId: string, targetHex: Hex, deltaTime: number): void {
        const mesh = this.meshes.get(unitId);
        const state = this.unitStates.get(unitId);
        if (!mesh || !state) return;

        const targetWorld = hexToWorld(targetHex);
        const targetX = targetWorld.x;
        const targetZ = targetWorld.z + BOARD_Z_OFFSET;

        // Smoothly lerp position coordinates
        const lerpSpeed = 8.0;
        mesh.position.x += (targetX - mesh.position.x) * lerpSpeed * deltaTime;
        mesh.position.z += (targetZ - mesh.position.z) * lerpSpeed * deltaTime;

        // Update 3D Character Mesh Micro-animations (bobbing / lunging)
        state.elapsed += deltaTime;

        const bodyGroup = mesh.getObjectByName('BodyGroup');

        if (state.animation === 'idle') {
            if (bodyGroup) bodyGroup.position.y = 0.08 + Math.sin(state.elapsed * 3.0) * 0.04;
        } else if (state.animation === 'walk') {
            if (bodyGroup) bodyGroup.position.y = 0.08 + Math.abs(Math.sin(state.elapsed * 10.0)) * 0.12;
        } else if (state.animation === 'attack' || state.animation === 'cast') {
            const lungeFactor = Math.sin(Math.min(state.elapsed * Math.PI * 2.5, Math.PI));
            mesh.position.z += lungeFactor * 0.3;
            if (bodyGroup) bodyGroup.position.y = 0.08 + lungeFactor * 0.1;

            if (state.elapsed > 0.4) {
                state.animation = 'idle';
            }
        } else if (state.animation === 'die') {
            const progress = Math.min(state.elapsed, 1.0);
            mesh.scale.set(1.0 - progress, 1.0 - progress, 1.0 - progress);
            mesh.position.y = state.initialY - progress * 0.4;
        }
    }

    public getUnitMesh(unitId: string): THREE.Object3D | undefined {
        return this.meshes.get(unitId);
    }

    public removeUnit(unitId: string): void {
        const mesh = this.meshes.get(unitId);
        if (mesh) {
            this.scene.remove(mesh);
            this.meshes.delete(unitId);
        }
        this.unitStates.delete(unitId);
    }

    public removeAllUnits(): void {
        for (const mesh of this.meshes.values()) {
            this.scene.remove(mesh);
        }
        this.meshes.clear();
        this.unitStates.clear();
    }
}
