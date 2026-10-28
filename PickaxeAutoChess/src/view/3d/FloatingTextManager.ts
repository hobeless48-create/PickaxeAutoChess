// src/view/3d/FloatingTextManager.ts

import * as THREE from 'three';

interface FloatingText {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
}

export class FloatingTextManager {
    private scene: THREE.Scene;
    private floatingTexts: FloatingText[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    /**
     * Spawns color-coded 3D floating combat text (Damage / Healing / Critical hit).
     */
    public spawnText(
        text: string,
        position: THREE.Vector3,
        type: 'physical' | 'magic' | 'true' | 'crit' | 'heal' = 'physical'
    ): void {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let color = '#f97316'; // Physical (Orange)
        let fontSize = 'bold 44px sans-serif';
        if (type === 'magic') color = '#38bdf8'; // Magic (Blue)
        else if (type === 'true') color = '#f8fafc'; // True Damage (White)
        else if (type === 'crit') { color = '#eab308'; fontSize = 'bold 56px sans-serif'; } // Crit (Yellow)
        else if (type === 'heal') color = '#22c55e'; // Heal (Green)

        ctx.font = fontSize;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer glow stroke
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText(text, 128, 64);

        // Fill text
        ctx.fillStyle = color;
        ctx.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const geo = new THREE.PlaneGeometry(1.2, 0.6);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.y += 1.8 + Math.random() * 0.3;
        mesh.position.x += (Math.random() - 0.5) * 0.4;

        this.scene.add(mesh);

        this.floatingTexts.push({
            mesh,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.8 + Math.random() * 0.5, (Math.random() - 0.5) * 0.5),
            life: 0,
            maxLife: 0.85
        });
    }

    public update(delta: number, camera: THREE.Camera): void {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life += delta;

            ft.mesh.position.x += ft.velocity.x * delta;
            ft.mesh.position.y += ft.velocity.y * delta;
            ft.mesh.position.z += ft.velocity.z * delta;

            // Make billboard face camera
            ft.mesh.quaternion.copy(camera.quaternion);

            // Fade out
            const progress = ft.life / ft.maxLife;
            (ft.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;

            if (ft.life >= ft.maxLife) {
                this.scene.remove(ft.mesh);
                ft.mesh.geometry.dispose();
                (ft.mesh.material as THREE.MeshBasicMaterial).dispose();
                this.floatingTexts.splice(i, 1);
            }
        }
    }
}
