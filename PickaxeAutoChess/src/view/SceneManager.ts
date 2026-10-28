// src/view/SceneManager.ts

import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';

export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private ambientLight: THREE.AmbientLight;
    private directionalLight: THREE.DirectionalLight;
    private container: HTMLElement;
    
    // Postprocessing Composer
    private composer!: EffectComposer;
    private gui!: GUI;

    // Animated environment objects
    private blossomParticles: THREE.Points[] = [];
    private blossomClock = new THREE.Clock();

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();

        // TFT-style: warm afternoon sky
        this.scene.background = new THREE.Color('#87CEEB');
        // Atmospheric fog for depth (light blue matching sky)
        this.scene.fog = new THREE.FogExp2('#87CEEB', 0.028);

        // Camera centered on the 7-col × 8-row flat-top hex grid
        // Board is now shifted +3 in Z (Z_OFFSET in BoardView), so lookAt shifts too
        // colWidth=1.559×7cols → centerX≈4.68; rowHeight=1.35×8rows+3offset → centerZ≈7.73
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
        this.camera.position.set(4.68, 16, 18);
        this.camera.lookAt(4.68, 0, 7.5);

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);

        // === LIGHTING ===
        // Warm sky ambient
        this.ambientLight = new THREE.AmbientLight('#c9e8ff', 1.2);
        this.scene.add(this.ambientLight);

        // Main sun (warm yellow-white, top-right)
        this.directionalLight = new THREE.DirectionalLight('#fff5d6', 2.5);
        this.directionalLight.position.set(8, 20, 8);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 80;
        this.directionalLight.shadow.camera.left = -20;
        this.directionalLight.shadow.camera.right = 20;
        this.directionalLight.shadow.camera.top = 20;
        this.directionalLight.shadow.camera.bottom = -20;
        this.scene.add(this.directionalLight);

        // Cool fill light from opposite side (blue-sky bounce)
        const fillLight = new THREE.DirectionalLight('#aad4ff', 0.6);
        fillLight.position.set(-6, 8, -6);
        this.scene.add(fillLight);

        // === BUILD ARENA ===
        this.buildArena();

        // Setup PMNDRS postprocessing Bloom effects
        this.initPostprocessing();

        // Setup lil-gui controllers
        this.initGUI();

        window.addEventListener('resize', this.onWindowResize);
    }

    // ─────────────────────────────────────────────────────────────
    // ARENA ENVIRONMENT CONSTRUCTION
    // ─────────────────────────────────────────────────────────────
    private buildArena(): void {
        // Board center reference (Z_OFFSET=3 added in BoardView, 8 rows × 1.35 height)
        // centerX = (6 cols × 1.559) / 2 ≈ 4.68
        // centerZ = 3 + (7 rows × 1.35) / 2 ≈ 3 + 4.73 ≈ 7.73
        const cx = 4.68;
        const cz = 7.5;

        // ── 1. LARGE GRASS GROUND PLANE ────────────────────────────
        const groundGeo = new THREE.PlaneGeometry(80, 80, 8, 8);
        const groundMat = new THREE.MeshStandardMaterial({
            color: '#4a8c3f',
            roughness: 0.95,
            metalness: 0.0,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(cx, -0.65, cz);
        ground.receiveShadow = true;
        this.scene.add(ground);

        // ── 2. ARENA INFIELD (lighter grass patch under the board) ──
        const infieldGeo = new THREE.PlaneGeometry(16, 18, 2, 2);
        const infieldMat = new THREE.MeshStandardMaterial({
            color: '#5dab50',
            roughness: 0.9,
            metalness: 0.0,
        });
        const infield = new THREE.Mesh(infieldGeo, infieldMat);
        infield.rotation.x = -Math.PI / 2;
        infield.position.set(cx, -0.63, cz);
        infield.receiveShadow = true;
        this.scene.add(infield);

        // ── 3. STONE PERIMETER WALL (back) ────────────────────────
        const wallMat = new THREE.MeshStandardMaterial({
            color: '#8b8073',
            roughness: 0.85,
            metalness: 0.15,
        });

        // Back wall (enemy side)
        const backWallGeo = new THREE.BoxGeometry(22, 4.5, 1.2);
        const backWall = new THREE.Mesh(backWallGeo, wallMat);
        backWall.position.set(cx, 1.6, cz - 10);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.scene.add(backWall);
        this.addWallBattlements(cx, cz - 10, 22, 'back');

        // Front wall (player side) — lower so camera can see over it
        const frontWallGeo = new THREE.BoxGeometry(22, 2.5, 1.0);
        const frontWall = new THREE.Mesh(frontWallGeo, wallMat);
        frontWall.position.set(cx, 0.6, cz + 10);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        this.scene.add(frontWall);

        // Side wall left
        const sideWallGeo = new THREE.BoxGeometry(1.0, 4.0, 22);
        const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
        leftWall.position.set(cx - 11.5, 1.3, cz);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // Side wall right
        const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
        rightWall.position.set(cx + 11.5, 1.3, cz);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        // ── 4. CORNER TOWERS ──────────────────────────────────────
        const towerMat = new THREE.MeshStandardMaterial({ color: '#6b6058', roughness: 0.8, metalness: 0.2 });
        const towerPositions = [
            [cx - 11.5, cz - 10],
            [cx + 11.5, cz - 10],
            [cx - 11.5, cz + 10],
            [cx + 11.5, cz + 10],
        ] as [number, number][];
        for (const [tx, tz] of towerPositions) {
            const towerGeo = new THREE.CylinderGeometry(1.2, 1.4, 6, 8);
            const tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.set(tx, 2.35, tz);
            tower.castShadow = true;
            this.scene.add(tower);
            // Tower cap
            const capGeo = new THREE.ConeGeometry(1.4, 1.8, 8);
            const capMat = new THREE.MeshStandardMaterial({ color: '#8b2252', roughness: 0.6 });
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.set(tx, 6.25, tz);
            this.scene.add(cap);
        }

        // ── 5. CHERRY BLOSSOM TREES (left + right sides) ──────────
        const treePositions: [number, number][] = [
            [cx - 13.5, cz - 5],
            [cx - 14.0, cz + 0],
            [cx - 13.5, cz + 5],
            [cx + 13.5, cz - 5],
            [cx + 14.0, cz + 0],
            [cx + 13.5, cz + 5],
        ];
        for (const [tx, tz] of treePositions) {
            this.addBlossomTree(tx, tz);
        }

        // ── 6. BLOSSOM PARTICLE DRIFT ─────────────────────────────
        this.addBlossomParticles(cx, cz);

        // ── 7. BACKDROP HILLS / MOUNTAINS (distant, stylised) ─────
        const hillMat = new THREE.MeshStandardMaterial({ color: '#3a7a34', roughness: 1.0, metalness: 0.0 });
        const hillPositions: [number, number, number, number, number][] = [
            [cx - 25, 0, cz - 18, 14, 10],
            [cx + 25, 0, cz - 20, 12, 9],
            [cx,      0, cz - 28, 18, 12],
        ];
        for (const [hx, _hy, hz, rx, ry] of hillPositions) {
            const hillGeo = new THREE.SphereGeometry(1, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.45);
            hillGeo.scale(rx, ry, rx * 0.7);
            const hill = new THREE.Mesh(hillGeo, hillMat);
            hill.position.set(hx, -0.5, hz);
            hill.receiveShadow = true;
            this.scene.add(hill);
        }
    }

    /** Adds a simplified cherry blossom tree at position */
    private addBlossomTree(x: number, z: number): void {
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 3.5, 7);
        const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 1.1, z);
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Canopy (multiple overlapping blossom spheres)
        const blossomColors = ['#ffb7c5', '#ff85a1', '#ffc0cb', '#ff69b4'];
        const offsets: [number, number, number][] = [
            [0, 3.8, 0], [-0.7, 3.2, 0.4], [0.7, 3.4, -0.3],
            [0.3, 4.3, 0.5], [-0.4, 4.0, -0.5],
        ];
        for (const [dx, dy, dz] of offsets) {
            const canopyGeo = new THREE.SphereGeometry(1.1 + Math.random() * 0.4, 7, 6);
            const blossomColor = blossomColors[Math.floor(Math.random() * blossomColors.length)];
            const canopyMat = new THREE.MeshStandardMaterial({
                color: blossomColor,
                roughness: 0.8,
                emissive: blossomColor,
                emissiveIntensity: 0.12,
            });
            const canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.set(x + dx, dy, z + dz);
            canopy.castShadow = true;
            this.scene.add(canopy);
        }
    }

    /** Adds wall battlements (notches) along the top of a wall */
    private addWallBattlements(cx: number, cz: number, width: number, _side: string): void {
        const merlonMat = new THREE.MeshStandardMaterial({ color: '#7a7068', roughness: 0.85 });
        const count = Math.floor(width / 2.2);
        const startX = cx - width / 2 + 1.1;
        for (let i = 0; i < count; i++) {
            if (i % 2 === 0) {
                const merlonGeo = new THREE.BoxGeometry(0.9, 1.0, 1.0);
                const merlon = new THREE.Mesh(merlonGeo, merlonMat);
                merlon.position.set(startX + i * (width / count), 4.1, cz);
                merlon.castShadow = true;
                this.scene.add(merlon);
            }
        }
    }

    /** Scattered falling blossom petal particles */
    private addBlossomParticles(cx: number, cz: number): void {
        const count = 600;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = cx + (Math.random() - 0.5) * 30;
            positions[i * 3 + 1] = Math.random() * 12 + 0.5;
            positions[i * 3 + 2] = cz + (Math.random() - 0.5) * 24;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: '#ffb7c5',
            size: 0.18,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
        });
        const particles = new THREE.Points(geo, mat);
        this.blossomParticles.push(particles);
        this.scene.add(particles);
    }

    private initPostprocessing(): void {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bloomEffect = new BloomEffect({
            intensity: 0.8,
            luminanceThreshold: 0.3,
            luminanceSmoothing: 0.75,
            mipmapBlur: true
        });

        const effectPass = new EffectPass(this.camera, bloomEffect);
        this.composer.addPass(effectPass);
    }

    private initGUI(): void {
        this.gui = new GUI({ title: 'Visuals Controller' });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '20px';
        this.gui.domElement.style.right = '200px';

        const lightsFolder = this.gui.addFolder('Environment Lighting');
        lightsFolder.add(this.directionalLight, 'intensity', 0, 5, 0.1).name('Sun Intensity');
        lightsFolder.add(this.ambientLight, 'intensity', 0, 3, 0.1).name('Sky Ambient');

        this.gui.close();
    }

    public startRenderLoop(onUpdate?: (deltaTime: number) => void): void {
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();

            // Drift blossom particles downward and reset
            const t = this.blossomClock.getElapsedTime();
            for (const pts of this.blossomParticles) {
                const pos = pts.geometry.attributes['position'] as THREE.BufferAttribute;
                const arr = pos.array as Float32Array;
                for (let i = 0; i < arr.length / 3; i++) {
                    arr[i * 3 + 1] -= delta * (0.3 + (i % 7) * 0.05); // fall speed
                    arr[i * 3 + 0] += Math.sin(t * 0.4 + i) * 0.004;   // gentle sway
                    if (arr[i * 3 + 1] < -0.6) {
                        arr[i * 3 + 1] = 12 + Math.random() * 3; // reset to top
                    }
                }
                pos.needsUpdate = true;
            }

            if (onUpdate) onUpdate(delta);
            this.composer.render(delta);
        };
        animate();
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    private onWindowResize = (): void => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    };
}
