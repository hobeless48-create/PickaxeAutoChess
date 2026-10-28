// src/view/3d/ProjectileManager.ts

import * as THREE from 'three';

interface ActiveProjectile {
    mesh: THREE.Mesh;
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    progress: number;
    speed: number;
    arcHeight: number;
    onImpact?: () => void;
}

export class ProjectileManager {
    private scene: THREE.Scene;
    private projectiles: ActiveProjectile[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    /**
     * Launches a 3D projectile with physical parabolic arc flight and impact callback.
     */
    public spawnProjectile(
        start: THREE.Vector3,
        target: THREE.Vector3,
        color: string = '#f97316',
        speed: number = 4.0,
        arcHeight: number = 1.2,
        onImpact?: () => void
    ): void {
        const geo = new THREE.SphereGeometry(0.14, 12, 12);
        const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.8,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(start);
        mesh.position.y += 1.0;

        this.scene.add(mesh);

        this.projectiles.push({
            mesh,
            startPos: start.clone().add(new THREE.Vector3(0, 1.0, 0)),
            targetPos: target.clone().add(new THREE.Vector3(0, 1.0, 0)),
            progress: 0,
            speed,
            arcHeight,
            onImpact
        });
    }

    public update(delta: number): void {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.progress += delta * p.speed;

            if (p.progress >= 1.0) {
                // Impact!
                p.mesh.position.copy(p.targetPos);
                if (p.onImpact) p.onImpact();

                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                (p.mesh.material as THREE.MeshStandardMaterial).dispose();
                this.projectiles.splice(i, 1);
            } else {
                // Parabolic arc interpolation
                p.mesh.position.lerpVectors(p.startPos, p.targetPos, p.progress);
                const arc = Math.sin(p.progress * Math.PI) * p.arcHeight;
                p.mesh.position.y += arc;
            }
        }
    }
}
