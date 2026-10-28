// src/view/ParticleSystem.ts

import * as THREE from 'three';

interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;     // Remaining duration in seconds
    maxLife: number;
}

export class ParticleSystem {
    private scene: THREE.Scene;
    private particles: Particle[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public spawnSparks(position: THREE.Vector3, color: string = '#f59e0b', count: number = 8): void {
        const geom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.9
        });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geom, mat.clone());
            mesh.position.copy(position);
            
            // Random scatter direction velocities
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2.0;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                3.0 + Math.random() * 3.0,
                Math.sin(angle) * speed
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                life: 0.5,
                maxLife: 0.5
            });
        }
    }

    public spawnRing(position: THREE.Vector3, color: string = '#7c3aed'): void {
        // Ultimate skill glowing expanding cylinder ring
        const geom = new THREE.RingGeometry(0.2, 0.3, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.rotation.x = -Math.PI / 2;
        // Float slightly above hex surface
        mesh.position.copy(position);
        mesh.position.y = 0.05;

        this.scene.add(mesh);
        
        // Custom scale update animation over time
        this.particles.push({
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 0.6,
            maxLife: 0.6
        });
    }

    public update(deltaTime: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                if (Array.isArray(p.mesh.material)) {
                    p.mesh.material.forEach(m => m.dispose());
                } else {
                    p.mesh.material.dispose();
                }
                this.particles.splice(i, 1);
            } else {
                const ratio = p.life / p.maxLife;

                // If it is a spark particle, apply gravity and move
                if (p.velocity.length() > 0) {
                    p.velocity.y -= 9.8 * deltaTime; // gravity pull
                    p.mesh.position.addScaledVector(p.velocity, deltaTime);
                    p.mesh.scale.setScalar(ratio);
                } else {
                    // It is a casting ring: expand scale and fade opacity
                    const scaleFactor = 1.0 + (1.0 - ratio) * 6.0;
                    p.mesh.scale.set(scaleFactor, scaleFactor, 1);
                    if (p.mesh.material instanceof THREE.MeshBasicMaterial) {
                        p.mesh.material.opacity = ratio;
                    }
                }
            }
        }
    }
}
