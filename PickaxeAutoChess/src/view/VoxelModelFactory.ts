// src/view/VoxelModelFactory.ts

import * as THREE from 'three';

/**
 * Legacy 2D/3D Model Factory Stub.
 * Replaced by 2D Billboard Card Sprites in UnitView.ts.
 */
export class VoxelModelFactory {
    static createVoxelUnit(name: string): THREE.Group {
        const group = new THREE.Group();
        group.name = name;
        return group;
    }
}