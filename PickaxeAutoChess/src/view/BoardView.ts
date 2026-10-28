// src/view/BoardView.ts

import * as THREE from 'three';
import { hexToWorld } from '../core/hex/HexGrid';
import type { Hex } from '../core/hex/HexGrid';

// How far forward (in Z) to offset the entire board
// so the bottom hex rows aren't hidden behind the shop UI panel.
export const BOARD_Z_OFFSET = 3;

export class BoardView {
    private scene: THREE.Scene;
    private hexRadius: number;
    private tileMeshes: THREE.Object3D[] = [];

    // Cached textures for hex grid tiles and bench slots
    private playerHexTexture: THREE.CanvasTexture | null = null;
    private playerHexAltTexture: THREE.CanvasTexture | null = null;
    private enemyHexTexture: THREE.CanvasTexture | null = null;
    private enemyHexAltTexture: THREE.CanvasTexture | null = null;
    private benchSlotTexture: THREE.CanvasTexture | null = null;

    constructor(scene: THREE.Scene, hexRadius: number = 0.85) {
        this.scene = scene;
        this.hexRadius = hexRadius;
        this.initTileTextures();
    }

    private initTileTextures(): void {
        this.playerHexTexture = this.generateHexTileTexture('#1d4a6b', '#2563eb', '#38bdf8');
        this.playerHexAltTexture = this.generateHexTileTexture('#1e6091', '#3b82f6', '#60a5fa');
        this.enemyHexTexture = this.generateHexTileTexture('#6b1d1d', '#991b1b', '#f87171');
        this.enemyHexAltTexture = this.generateHexTileTexture('#8b2020', '#b91c1c', '#fca5a5');
        this.benchSlotTexture = this.generateBenchSlotTexture();
    }

    private generateHexTileTexture(bgGrad1: string, bgGrad2: string, borderClr: string): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d')!;

        // Fill transparent
        ctx.clearRect(0, 0, 256, 256);

        // Draw flat-top hexagon path
        const cx = 128;
        const cy = 128;
        const radius = 120;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 + Math.PI / 6;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Radial gradient fill
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
        grad.addColorStop(0, bgGrad2);
        grad.addColorStop(1, bgGrad1);
        ctx.fillStyle = grad;
        ctx.fill();

        // Inner glowing border
        ctx.strokeStyle = borderClr;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Secondary subtle inner ring
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 + Math.PI / 6;
            const x = cx + (radius - 16) * Math.cos(angle);
            const y = cy + (radius - 16) * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    private generateBenchSlotTexture(): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, 256, 256);

        // Rounded rect slot
        const r = 24;
        const w = 240;
        const h = 240;
        const x = 8;
        const y = 8;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        // Slot inner background
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, w - 16, h - 16, r - 4);
        ctx.fill();

        // Outer cyan glow border
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Dashed inner border
        ctx.setLineDash([12, 8]);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x + 16, y + 16, w - 32, h - 32, r - 8);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    public renderBoard(): void {
        // TFT-style board: 7 columns × 8 rows (4 player rows + 4 enemy rows)
        const columns = 7;
        const rows = 8;

        const HEX_SIZE = 0.9;
        const colWidth  = Math.sqrt(3) * HEX_SIZE;
        const rowHeight = 1.5 * HEX_SIZE;

        const boardW = (columns - 1) * colWidth + colWidth;
        const boardH = (rows - 1) * rowHeight + rowHeight;
        const centerX = ((columns - 1) * colWidth) / 2;
        const centerZ = ((rows - 1) * rowHeight) / 2 + BOARD_Z_OFFSET;

        // 1. Flat 2D Base ground tray underneath board
        const platformGeom = new THREE.PlaneGeometry(boardW + 1.2, boardH + 1.2);
        const platformMat = new THREE.MeshStandardMaterial({
            color: '#1e293b',
            roughness: 0.8,
            metalness: 0.2
        });
        const platform = new THREE.Mesh(platformGeom, platformMat);
        platform.rotation.x = -Math.PI / 2;
        platform.position.set(centerX, 0.001, centerZ);
        platform.receiveShadow = true;
        this.scene.add(platform);

        // 2. Gold dividing line between player & enemy sides (Row 3 -> 4)
        const divGeo = new THREE.PlaneGeometry(boardW + 1.2, 0.16);
        const divMat = new THREE.MeshStandardMaterial({
            color: '#fbbf24',
            emissive: '#f59e0b',
            emissiveIntensity: 0.4,
            roughness: 0.3
        });
        const divider = new THREE.Mesh(divGeo, divMat);
        divider.rotation.x = -Math.PI / 2;
        divider.position.set(centerX, 0.008, rowHeight * 3.5 + BOARD_Z_OFFSET);
        this.scene.add(divider);

        // 3. Render 56 flat 2D textured hexagon tiles on y = 0.005
        for (let r = 0; r < rows; r++) {
            for (let q = 0; q < columns; q++) {
                this.createHexTile({ q, r });
            }
        }

        // 4. Render 9 Bench 2D flat slots below board
        const slotWidth = 1.0;
        const slotHeight = 1.0;
        const spacing = 1.2;
        const benchTotalW = (9 - 1) * spacing;
        const benchStartX = centerX - benchTotalW / 2;
        const benchZ = (rows - 1) * rowHeight + BOARD_Z_OFFSET + 1.5;

        // Bench tray backing plate mesh on y = 0.002
        const benchTrayGeo = new THREE.PlaneGeometry(benchTotalW + 1.6, slotHeight + 0.5);
        const benchTrayMat = new THREE.MeshStandardMaterial({
            color: '#0f172a',
            roughness: 0.7,
            metalness: 0.3
        });
        const benchTray = new THREE.Mesh(benchTrayGeo, benchTrayMat);
        benchTray.rotation.x = -Math.PI / 2;
        benchTray.position.set(centerX, 0.002, benchZ);
        benchTray.receiveShadow = true;
        this.scene.add(benchTray);

        const slotGeom = new THREE.PlaneGeometry(slotWidth, slotHeight);

        for (let i = 0; i < 9; i++) {
            const material = new THREE.MeshStandardMaterial({
                map: this.benchSlotTexture,
                transparent: true,
                side: THREE.DoubleSide,
                roughness: 0.4,
                metalness: 0.5
            });
            const slotMesh = new THREE.Mesh(slotGeom, material);

            slotMesh.rotation.x = -Math.PI / 2;
            slotMesh.position.set(benchStartX + i * spacing, 0.005, benchZ);
            slotMesh.receiveShadow = true;
            slotMesh.userData = { type: 'bench', index: i };

            this.scene.add(slotMesh);
            this.tileMeshes.push(slotMesh);
        }
    }

    public getInteractiveTiles(): THREE.Object3D[] {
        return this.tileMeshes;
    }

    /** Returns the bench Z world position for main.ts / DragControls to use for placement */
    public static getBenchZ(): number {
        const rows = 8;
        const HEX_SIZE = 0.9;
        const rowHeight = 1.5 * HEX_SIZE;
        return (rows - 1) * rowHeight + BOARD_Z_OFFSET + 1.5;
    }

    private createHexTile(hex: Hex): void {
        const radius = this.hexRadius * 0.95;

        // Flat-top hexagon shape
        const hexShape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 + Math.PI / 6;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (i === 0) {
                hexShape.moveTo(x, y);
            } else {
                hexShape.lineTo(x, y);
            }
        }
        hexShape.closePath();

        const geometry = new THREE.ShapeGeometry(hexShape);

        // Adjust UV mapping to cleanly cover the hexagon shape geometry
        const posAttr = geometry.attributes.position;
        const uvs = [];
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const u = (vx / (radius * 2)) + 0.5;
            const v = (vy / (radius * 2)) + 0.5;
            uvs.push(u, v);
        }
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        const isAlternate = (hex.q + hex.r) % 2 === 0;
        const isFriendlySide = hex.r >= 4; // bottom 4 rows (closest to camera) = player side

        let selectedTexture = isFriendlySide
            ? (isAlternate ? this.playerHexTexture : this.playerHexAltTexture)
            : (isAlternate ? this.enemyHexTexture : this.enemyHexAltTexture);

        const material = new THREE.MeshStandardMaterial({
            map: selectedTexture,
            transparent: true,
            side: THREE.DoubleSide,
            roughness: 0.3,
            metalness: 0.4
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;

        const worldPos = hexToWorld(hex);
        mesh.position.set(worldPos.x, 0.005, worldPos.z + BOARD_Z_OFFSET);
        mesh.receiveShadow = true;
        mesh.userData = { type: 'hex', hex: hex, originalMaterial: material };

        this.scene.add(mesh);
        this.tileMeshes.push(mesh);
    }
}
