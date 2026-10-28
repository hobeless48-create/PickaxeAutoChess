import * as THREE from 'three';
import { BoardState } from '../core/board/BoardState';
import { GameLoopManager } from '../core/board/GameLoopManager';
import { UnitInspectUI } from './UnitInspectUI';
import { Unit } from '../core/units/Unit';
import { bus } from '../core/events/EventBus';
import { ShopManager } from '../core/shop/ShopManager';

export class DragControls {
    private camera: THREE.Camera;
    private scene: THREE.Scene;
    private boardState: BoardState;
    private gameLoop: GameLoopManager;
    private shopManager: ShopManager;
    private interactiveTiles: THREE.Object3D[];
    private unitInspectUI: UnitInspectUI;
    
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private startMousePos: THREE.Vector2 = new THREE.Vector2();
    
    private selectedUnit: Unit | null = null;
    private isDragging: boolean = false;
    private plane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Flat drag plane

    private sellZoneEl: HTMLDivElement;
    private isOverSellZone: boolean = false;

    constructor(
        camera: THREE.Camera,
        scene: THREE.Scene,
        boardState: BoardState,
        gameLoop: GameLoopManager,
        shopManager: ShopManager,
        interactiveTiles: THREE.Object3D[],
        unitInspectUI: UnitInspectUI
    ) {
        this.camera = camera;
        this.scene = scene;
        this.boardState = boardState;
        this.gameLoop = gameLoop;
        this.shopManager = shopManager;
        this.interactiveTiles = interactiveTiles;
        this.unitInspectUI = unitInspectUI;

        // --- Sell Zone overlay ---
        this.sellZoneEl = document.createElement('div');
        this.sellZoneEl.id = 'sell-zone';
        Object.assign(this.sellZoneEl.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '56px',
            background: 'rgba(220, 38, 38, 0.85)',
            backdropFilter: 'blur(16px)',
            webkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#fff',
            fontSize: '17px',
            fontWeight: '700',
            fontFamily: "'Inter', system-ui, sans-serif",
            letterSpacing: '0.05em',
            zIndex: '9999',
            pointerEvents: 'none',
            opacity: '0',
            transform: 'translateY(-100%)',
            transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 8px 30px rgba(220,38,38,0.4)',
            borderBottom: '2px solid rgba(239,68,68,0.6)',
        });
        this.sellZoneEl.innerHTML = `<span style="font-size:22px;">🪙</span> Drag Here to Sell Unit`;
        document.body.appendChild(this.sellZoneEl);
        // -------------------------

        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);

        // Listen for item drag and drop events
        window.addEventListener('dragover', this.onDragOver);
        window.addEventListener('drop', this.onDropItem);
    }

    private onMouseDown = (event: MouseEvent): void => {
        // We can inspect units in any phase, but we only lock dragging
        const canDrag = this.gameLoop.phase === 'Preparation';

        this.updateMouseCoords(event);
        this.startMousePos.copy(this.mouse);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // First find if we clicked on a tile containing a player unit or enemy unit
        const intersects = this.raycaster.intersectObjects(this.interactiveTiles);
        let clickedUnit = false;
        if (intersects.length > 0) {
            const tile = intersects[0].object;
            const userData = tile.userData;

            if (userData.type === 'hex') {
                const hex = userData.hex;
                // Find any unit at hex (player or enemy)
                const unit = this.boardState.getAllUnits().find(
                    u => !u.isOnBench && u.hex.q === hex.q && u.hex.r === hex.r
                );
                if (unit) {
                    this.selectedUnit = unit;
                    if (canDrag && unit.faction === 'player') {
                        this.isDragging = true;
                        unit.isDragging = true;
                        this.showSellZone();
                    }
                    clickedUnit = true;
                }
            } else if (userData.type === 'bench') {
                const index = userData.index;
                const unit = this.boardState.getBenchSlots()[index];
                if (unit) {
                    this.selectedUnit = unit;
                    if (canDrag && unit.faction === 'player') {
                        this.isDragging = true;
                        unit.isDragging = true;
                        this.showSellZone();
                    }
                    clickedUnit = true;
                }
            }
        }

        if (!clickedUnit) {
            this.unitInspectUI.hide();
        }
    };

    private showSellZone(): void {
        this.sellZoneEl.style.opacity = '1';
        this.sellZoneEl.style.transform = 'translateY(0)';
    }

    private hideSellZone(): void {
        this.sellZoneEl.style.opacity = '0';
        this.sellZoneEl.style.transform = 'translateY(-100%)';
        this.setSellZoneHover(false);
    }

    private setSellZoneHover(active: boolean): void {
        this.isOverSellZone = active;
        if (active && this.selectedUnit) {
            const refund = this.shopManager.sellRefund(this.selectedUnit.cost, this.selectedUnit.starLevel);
            this.sellZoneEl.style.background = 'rgba(251, 191, 36, 0.95)';
            this.sellZoneEl.style.color = '#0f172a';
            this.sellZoneEl.style.borderBottom = '2px solid #fbbf24';
            this.sellZoneEl.style.boxShadow = '0 8px 36px rgba(251,191,36,0.7), 0 0 20px rgba(251,191,36,0.4)';
            this.sellZoneEl.innerHTML = `<span style="font-size:22px;">🪙</span> Release to Sell ${this.selectedUnit.name} (+${refund}g Gold)`;
        } else {
            this.sellZoneEl.style.background = 'rgba(220, 38, 38, 0.85)';
            this.sellZoneEl.style.color = '#fff';
            this.sellZoneEl.style.borderBottom = '2px solid rgba(239,68,68,0.6)';
            this.sellZoneEl.style.boxShadow = '0 8px 30px rgba(220,38,38,0.4)';
            this.sellZoneEl.innerHTML = `<span style="font-size:22px;">🪙</span> Drag Here to Sell Unit`;
        }
    }

    private lastHoveredTile: THREE.Mesh | null = null;

    private highlightTile(tile: THREE.Mesh): void {
        if (tile.material instanceof THREE.MeshStandardMaterial) {
            tile.material.emissive.set('#38bdf8');
            tile.material.emissiveIntensity = 0.5;
        }
    }

    private resetTileHighlight(tile: THREE.Mesh): void {
        if (tile.material instanceof THREE.MeshStandardMaterial) {
            tile.material.emissive.set('#000000');
            tile.material.emissiveIntensity = 0.0;
        }
    }

    private onMouseMove = (event: MouseEvent): void => {
        if (!this.isDragging || !this.selectedUnit) return;

        this.updateMouseCoords(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Detect if cursor is inside sell zone (top 56px)
        const overZone = event.clientY <= 56;
        if (overZone !== this.isOverSellZone) this.setSellZoneHover(overZone);

        // Snap visual translation position temporarily while dragging
        const intersectPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.plane, intersectPoint);
        
        // Find visual representation mesh on scene to move
        const unitMesh = this.scene.getObjectByName(this.selectedUnit.id);
        if (unitMesh) {
            unitMesh.position.copy(intersectPoint);
            unitMesh.position.y = 0.75; // Elevation for 2D card sprite during dragging
        }

        // Highlight tile under cursor while dragging
        const intersects = this.raycaster.intersectObjects(this.interactiveTiles);
        if (intersects.length > 0) {
            const tile = intersects[0].object as THREE.Mesh;
            if (this.lastHoveredTile && this.lastHoveredTile !== tile) {
                this.resetTileHighlight(this.lastHoveredTile);
            }
            this.highlightTile(tile);
            this.lastHoveredTile = tile;
        } else if (this.lastHoveredTile) {
            this.resetTileHighlight(this.lastHoveredTile);
            this.lastHoveredTile = null;
        }
    };

    private onMouseUp = (event: MouseEvent): void => {
        if (!this.selectedUnit) return;
        this.selectedUnit.isDragging = false;
        
        this.updateMouseCoords(event);
        
        if (this.lastHoveredTile) {
            this.resetTileHighlight(this.lastHoveredTile);
            this.lastHoveredTile = null;
        }
        
        // Calculate drag distance to differentiate between click and drag
        const dist = this.mouse.distanceTo(this.startMousePos);
        
        if (dist < 0.02) {
            // It was a click! Show inspection panel.
            this.unitInspectUI.showUnit(this.selectedUnit.id);
        }

        if (this.isDragging) {
            this.isDragging = false;
            this.hideSellZone();

            // --- Sell zone drop ---
            if (event.clientY <= 56 && this.selectedUnit.faction === 'player') {
                const unit = this.selectedUnit;
                const refund = this.shopManager.sellRefund(unit.cost, unit.starLevel);
                this.shopManager.addGold(refund);
                this.boardState.removeUnit(unit.id);
                bus.emit({ type: 'BOARD_UNITS_CHANGED' });
                bus.emit({ type: 'UNIT_DIED', unitId: unit.id }); // triggers cleanup of 3D mesh
                console.log(`[Sell] Sold ${unit.name} (${unit.starLevel}★ cost ${unit.cost}g) → +${refund}g refund`);
                this.selectedUnit = null;
                return;
            }
            // ----------------------

            this.raycaster.setFromCamera(this.mouse, this.camera);

            const intersects = this.raycaster.intersectObjects(this.interactiveTiles);
            let placementSuccess = false;

            if (intersects.length > 0) {
                const tile = intersects[0].object;
                const userData = tile.userData;

                if (userData.type === 'hex') {
                    const hex = userData.hex;
                    placementSuccess = this.boardState.moveUnitToBoard(this.selectedUnit.id, hex, this.shopManager.level);
                } else if (userData.type === 'bench') {
                    const index = userData.index;
                    placementSuccess = this.boardState.moveUnitToBench(this.selectedUnit.id, index);
                }
            }

            // Reset visual mesh translation to actual grid coordinates if placement failed
            if (!placementSuccess) {
                console.log('[DragControls] Invalid placement position. Snapping unit back.');
            } else {
                bus.emit({ type: 'BOARD_UNITS_CHANGED' });
            }
        }

        this.selectedUnit = null;
    };

    private updateMouseCoords(event: MouseEvent | DragEvent): void {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    private onDragOver = (event: DragEvent): void => {
        event.preventDefault();
    };

    private onDropItem = (event: DragEvent): void => {
        event.preventDefault();

        if (this.gameLoop.phase !== 'Preparation') {
            console.warn('[Item] Items cannot be equipped during combat or resolution phases.');
            bus.emit({ type: 'INVENTORY_CHANGED' });

            const warningEl = document.createElement('div');
            warningEl.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(239,68,68,0.95);color:white;padding:12px 24px;border-radius:12px;font-weight:bold;font-size:14px;font-family:\'Inter\',system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.5);pointer-events:none;transition:opacity 0.4s ease;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);';
            warningEl.innerText = '⚠️ Items can only be equipped during Preparation phase!';
            document.body.appendChild(warningEl);
            setTimeout(() => {
                warningEl.style.opacity = '0';
                setTimeout(() => warningEl.remove(), 400);
            }, 2200);
            return;
        }

        const itemIndexStr = event.dataTransfer?.getData('text/plain');
        if (!itemIndexStr) return;
        const itemIndex = parseInt(itemIndexStr);
        if (isNaN(itemIndex) || itemIndex < 0) return;

        this.updateMouseCoords(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.interactiveTiles);
        if (intersects.length > 0) {
            const tile = intersects[0].object;
            const userData = tile.userData;
            let targetUnit: Unit | undefined;

            if (userData.type === 'hex') {
                const hex = userData.hex;
                targetUnit = this.boardState.getAllUnits().find(
                    u => !u.isOnBench && u.hex.q === hex.q && u.hex.r === hex.r
                );
            } else if (userData.type === 'bench') {
                const index = userData.index;
                const unit = this.boardState.getBenchSlots()[index];
                if (unit) targetUnit = unit;
            }

            if (targetUnit) {
                console.log(`[DragControls] Attaching item at index ${itemIndex} to unit ${targetUnit.name}`);
                const success = this.boardState.attachInventoryItem(itemIndex, targetUnit.id);
                if (success) {
                    bus.emit({ type: 'INVENTORY_CHANGED' });
                }
            }
        }
    };
}
