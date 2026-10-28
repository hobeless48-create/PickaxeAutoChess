// src/view/ShopUI.ts

import { ShopManager } from '../core/shop/ShopManager';
import { BoardState } from '../core/board/BoardState';
import { SynergyManager } from '../core/stats/SynergyManager';
import synergiesCatalogRaw from '../core/data/synergies_catalog.json';
import { bus } from '../core/events/EventBus';

import recipesRaw from '../core/data/recipes.json';

const synergiesCatalog = synergiesCatalogRaw as Record<string, { desc: string, thresholds: { req: number, desc: string }[] }>;

export class ShopUI {
    private container: HTMLElement;
    private shopManager: ShopManager;
    private boardState: BoardState;
    private onBuyUnitCallback?: (cardName: string) => void;
    
    private inventoryPageIndex: number = 0;
    private isShopOpen: boolean = false;
    private shopMode: 'heroes' | 'facilities' = 'heroes';
    
    // UI Tab toggle: 'synergy' | 'item'
    private activeTab: 'synergy' | 'item' = 'synergy';

    private synergyTooltip: HTMLDivElement | null = null;
    private lockedSynergy: string | null = null;
    private itemTooltip: HTMLDivElement | null = null;
    private interestTooltip: HTMLDivElement | null = null;
    private combinePreviewTooltip: HTMLDivElement | null = null;

    private lastHP: number = 100;
    private lastOpponentHP: number = 100;
    private lastStage: number = 1;
    private lastRound: number = 1;
    private lastPhase: string = 'Preparation';
    private lastTimer: number = 30;
    private draggedInventoryIndex: number = -1;

    constructor(container: HTMLElement, shopManager: ShopManager, boardState: BoardState) {
        this.container = container;
        this.shopManager = shopManager;
        this.boardState = boardState;
        this.createLayout();

        bus.on('INVENTORY_CHANGED', () => {
            this.updateInventoryView();
        });
    }

    public onBuyUnit(cb: (cardName: string) => void): void {
        this.onBuyUnitCallback = cb;
    }

    private createLayout(): void {
        // 1. TFT style HUD Header top
        const hud = document.createElement('div');
        hud.id = 'game-hud';
        hud.style.position = 'absolute';
        hud.style.top = '20px';
        hud.style.left = '50%';
        hud.style.transform = 'translateX(-50%)';
        hud.style.display = 'flex';
        hud.style.gap = '25px';
        hud.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
        hud.style.backdropFilter = 'blur(16px)';
        (hud.style as any).webkitBackdropFilter = 'blur(16px)';
        hud.style.padding = '10px 24px';
        hud.style.borderRadius = '20px';
        hud.style.border = '1px solid rgba(251, 191, 36, 0.4)';
        hud.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(251, 191, 36, 0.2)';
        hud.style.color = '#ffffff';
        hud.style.fontSize = '15px';
        hud.style.fontWeight = 'bold';
        hud.style.fontFamily = "'Inter', system-ui, sans-serif";
        hud.innerHTML = `
            <div>HP: <span id="hud-hp" style="color: #10b981;">100</span></div>
            <div id="hud-gold-container" style="cursor: pointer;">Gold: <span id="hud-gold" style="color: #fbbf24;">20</span></div>
            <div>Stage: <span id="hud-stage">1</span> - <span id="hud-round">1</span></div>
            <div>Phase: <span id="hud-phase" style="color: #60a5fa;">Preparation</span> (<span id="hud-timer">30</span>s)</div>
        `;
        this.container.appendChild(hud);

        const goldContainer = hud.querySelector('#hud-gold-container') as HTMLElement;
        if (goldContainer) {
            goldContainer.onmouseenter = (e) => this.showInterestTooltip(e);
            goldContainer.onmouseleave = () => this.hideInterestTooltip();
        }

        // 2. TFT style Combined Left Panel (Tabs: Synergy / Item)
        const leftPanel = document.createElement('div');
        leftPanel.id = 'left-tabbed-panel';
        leftPanel.style.position = 'absolute';
        leftPanel.style.left = '20px';
        leftPanel.style.top = '100px';
        leftPanel.style.display = 'flex';
        leftPanel.style.flexDirection = 'column';
        leftPanel.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
        leftPanel.style.backdropFilter = 'blur(16px)';
        (leftPanel.style as any).webkitBackdropFilter = 'blur(16px)';
        leftPanel.style.borderRadius = '14px';
        leftPanel.style.border = '1px solid rgba(56, 189, 248, 0.25)';
        leftPanel.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        leftPanel.style.width = '200px';
        leftPanel.style.color = '#ffffff';
        leftPanel.style.fontFamily = "'Inter', system-ui, sans-serif";
        leftPanel.style.overflow = 'hidden';

        // Tab header buttons
        const tabHeader = document.createElement('div');
        tabHeader.style.display = 'flex';
        tabHeader.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        
        const synergyTabBtn = document.createElement('button');
        synergyTabBtn.innerText = 'Synergy';
        synergyTabBtn.style.flex = '1';
        synergyTabBtn.style.padding = '8px';
        synergyTabBtn.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
        synergyTabBtn.style.border = 'none';
        synergyTabBtn.style.color = '#fff';
        synergyTabBtn.style.cursor = 'pointer';
        synergyTabBtn.style.fontWeight = 'bold';
        synergyTabBtn.style.fontSize = '12px';
        synergyTabBtn.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

        const itemTabBtn = document.createElement('button');
        itemTabBtn.innerText = 'Items';
        itemTabBtn.style.flex = '1';
        itemTabBtn.style.padding = '8px';
        itemTabBtn.style.backgroundColor = 'transparent';
        itemTabBtn.style.border = 'none';
        itemTabBtn.style.color = '#94a3b8';
        itemTabBtn.style.cursor = 'pointer';
        itemTabBtn.style.fontWeight = 'bold';
        itemTabBtn.style.fontSize = '12px';
        itemTabBtn.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

        synergyTabBtn.onclick = () => {
            this.activeTab = 'synergy';
            synergyTabBtn.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
            synergyTabBtn.style.color = '#fff';
            itemTabBtn.style.backgroundColor = 'transparent';
            itemTabBtn.style.color = '#94a3b8';
            this.renderLeftPanelContent();
        };

        itemTabBtn.onclick = () => {
            this.activeTab = 'item';
            itemTabBtn.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
            itemTabBtn.style.color = '#fff';
            synergyTabBtn.style.backgroundColor = 'transparent';
            synergyTabBtn.style.color = '#94a3b8';
            this.renderLeftPanelContent();
        };

        tabHeader.appendChild(synergyTabBtn);
        tabHeader.appendChild(itemTabBtn);
        leftPanel.appendChild(tabHeader);

        // Content wrapper div
        const contentWrapper = document.createElement('div');
        contentWrapper.id = 'left-panel-content-wrapper';
        contentWrapper.style.padding = '12px';
        leftPanel.appendChild(contentWrapper);

        this.container.appendChild(leftPanel);

        // 3. Matchup list right panel showing participants
        const matchupPanel = document.createElement('div');
        matchupPanel.id = 'matchup-panel';
        matchupPanel.style.position = 'absolute';
        matchupPanel.style.right = '20px';
        matchupPanel.style.top = '100px';
        matchupPanel.style.width = '160px';
        matchupPanel.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
        matchupPanel.style.backdropFilter = 'blur(16px)';
        (matchupPanel.style as any).webkitBackdropFilter = 'blur(16px)';
        matchupPanel.style.borderRadius = '12px';
        matchupPanel.style.padding = '12px';
        matchupPanel.style.color = '#ffffff';
        matchupPanel.style.fontFamily = "'Inter', system-ui, sans-serif";
        matchupPanel.style.border = '1px solid rgba(56, 189, 248, 0.2)';
        matchupPanel.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        matchupPanel.innerHTML = `
            <div style="font-size: 13px; font-weight: bold; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 4px; margin-bottom: 8px;">Matchups</div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
                <div style="color: #10b981; font-weight: bold;">🛡️ Player (You): <span id="matchup-player-hp">100</span> HP</div>
                <div style="color: #ef4444; font-weight: bold;">⚔️ Opponent (AI): <span id="matchup-opponent-hp">100</span> HP</div>
            </div>
        `;
        this.container.appendChild(matchupPanel);

        // 4. Shop popup panel (hidden by default — opened via Shop button)
        const shopDiv = document.createElement('div');
        shopDiv.id = 'shop-deck';
        shopDiv.style.position = 'absolute';
        shopDiv.style.bottom = '80px';         // Floats above the Shop button
        shopDiv.style.left = '50%';
        shopDiv.style.transform = 'translateX(-50%)';
        shopDiv.style.display = 'none';        // Hidden until toggled
        shopDiv.style.flexDirection = 'column';
        shopDiv.style.gap = '10px';
        shopDiv.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
        shopDiv.style.padding = '14px 18px';
        shopDiv.style.borderRadius = '20px';
        shopDiv.style.border = '1px solid rgba(56, 189, 248, 0.3)';
        shopDiv.style.boxShadow = '0 20px 50px rgba(0,0,0,0.7), 0 0 20px rgba(56,189,248,0.15)';
        shopDiv.style.backdropFilter = 'blur(16px)';
        (shopDiv.style as any).webkitBackdropFilter = 'blur(16px)';
        shopDiv.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

        // Shop Header Bar (Close button + Mode Tabs)
        const shopHeaderRow = document.createElement('div');
        shopHeaderRow.style.display = 'flex';
        shopHeaderRow.style.justifyContent = 'space-between';
        shopHeaderRow.style.alignItems = 'center';
        shopHeaderRow.style.width = '100%';

        const modeTabsContainer = document.createElement('div');
        modeTabsContainer.style.display = 'flex';
        modeTabsContainer.style.gap = '8px';

        const heroModeBtn = document.createElement('button');
        heroModeBtn.id = 'shop-mode-hero-btn';
        heroModeBtn.innerText = '⚔️ Hero Shop';
        heroModeBtn.style.padding = '5px 12px';
        heroModeBtn.style.backgroundColor = '#1d4ed8';
        heroModeBtn.style.border = 'none';
        heroModeBtn.style.color = '#fff';
        heroModeBtn.style.fontWeight = 'bold';
        heroModeBtn.style.borderRadius = '6px';
        heroModeBtn.style.cursor = 'pointer';
        heroModeBtn.style.fontSize = '12px';

        const facilityModeBtn = document.createElement('button');
        facilityModeBtn.id = 'shop-mode-facility-btn';
        facilityModeBtn.innerText = '🏰 Facility Shop';
        facilityModeBtn.style.padding = '5px 12px';
        facilityModeBtn.style.backgroundColor = 'transparent';
        facilityModeBtn.style.border = '1px solid #334155';
        facilityModeBtn.style.color = '#94a3b8';
        facilityModeBtn.style.fontWeight = 'bold';
        facilityModeBtn.style.borderRadius = '6px';
        facilityModeBtn.style.cursor = 'pointer';
        facilityModeBtn.style.fontSize = '12px';

        heroModeBtn.onclick = () => {
            this.shopMode = 'heroes';
            heroModeBtn.style.backgroundColor = '#1d4ed8';
            heroModeBtn.style.color = '#fff';
            facilityModeBtn.style.backgroundColor = 'transparent';
            facilityModeBtn.style.color = '#94a3b8';
            this.updateShopCards();
        };

        facilityModeBtn.onclick = () => {
            this.shopMode = 'facilities';
            facilityModeBtn.style.backgroundColor = '#b45309';
            facilityModeBtn.style.color = '#fff';
            heroModeBtn.style.backgroundColor = 'transparent';
            heroModeBtn.style.color = '#94a3b8';
            this.updateShopCards();
        };

        modeTabsContainer.appendChild(heroModeBtn);
        modeTabsContainer.appendChild(facilityModeBtn);

        // ✕ close button inside panel
        const closeBtn = document.createElement('button');
        closeBtn.id = 'shop-close-btn';
        closeBtn.innerText = '✕ Close';
        closeBtn.style.padding = '4px 10px';
        closeBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        closeBtn.style.border = '1px solid #ef4444';
        closeBtn.style.color = '#ef4444';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.borderRadius = '6px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '12px';
        closeBtn.style.fontFamily = 'sans-serif';
        closeBtn.onclick = () => this.toggleShop(false);

        shopHeaderRow.appendChild(modeTabsContainer);
        shopHeaderRow.appendChild(closeBtn);
        shopDiv.appendChild(shopHeaderRow);

        // Row: buttons + cards
        const shopRow = document.createElement('div');
        shopRow.style.display = 'flex';
        shopRow.style.gap = '15px';
        shopDiv.appendChild(shopRow);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.flexDirection = 'column';
        buttonsDiv.style.gap = '10px';
        buttonsDiv.style.alignItems = 'center';
        buttonsDiv.style.justifyContent = 'center';

        // Level & XP circular dial indicator
        const xpProgressDiv = document.createElement('div');
        xpProgressDiv.id = 'xp-progress-hud';
        xpProgressDiv.style.color = '#38bdf8';
        xpProgressDiv.style.fontSize = '12px';
        xpProgressDiv.style.fontWeight = 'bold';
        xpProgressDiv.style.fontFamily = 'sans-serif';
        xpProgressDiv.innerText = 'Lvl 3 (0/10 XP)';
        buttonsDiv.appendChild(xpProgressDiv);

        const xpBtn = document.createElement('button');
        xpBtn.innerText = 'Buy XP (4g)';
        xpBtn.style.padding = '8px 12px';
        xpBtn.style.backgroundColor = '#3b82f6';
        xpBtn.style.border = 'none';
        xpBtn.style.color = '#fff';
        xpBtn.style.fontWeight = 'bold';
        xpBtn.style.borderRadius = '6px';
        xpBtn.style.cursor = 'pointer';
        xpBtn.onclick = () => {
            if (this.shopManager.buyXP()) {
                this.updateHUD();
            }
        };

        const rerollBtn = document.createElement('button');
        rerollBtn.innerText = 'Reroll (2g)';
        rerollBtn.style.padding = '8px 12px';
        rerollBtn.style.backgroundColor = '#ef4444';
        rerollBtn.style.border = 'none';
        rerollBtn.style.color = '#fff';
        rerollBtn.style.fontWeight = 'bold';
        rerollBtn.style.borderRadius = '6px';
        rerollBtn.style.cursor = 'pointer';
        rerollBtn.onclick = () => {
            if (this.shopManager.reroll()) {
                this.updateShopCards();
                this.updateHUD();
            }
        };

        buttonsDiv.appendChild(xpBtn);
        buttonsDiv.appendChild(rerollBtn);
        shopRow.appendChild(buttonsDiv);

        const cardsContainer = document.createElement('div');
        cardsContainer.id = 'cards-container';
        cardsContainer.style.display = 'flex';
        cardsContainer.style.gap = '10px';
        shopRow.appendChild(cardsContainer);

        this.container.appendChild(shopDiv);

        // 5. Floating "🛒 Shop" toggle button — always visible at bottom right
        const shopToggleBtn = document.createElement('button');
        shopToggleBtn.id = 'shop-toggle-btn';
        shopToggleBtn.innerText = '🛒 Shop';
        shopToggleBtn.style.position = 'absolute';
        shopToggleBtn.style.bottom = '24px';
        shopToggleBtn.style.right = '24px';
        shopToggleBtn.style.padding = '12px 24px';
        shopToggleBtn.style.background = 'rgba(15, 23, 42, 0.85)';
        shopToggleBtn.style.border = '1px solid rgba(251, 191, 36, 0.4)';
        shopToggleBtn.style.color = '#fbbf24';
        shopToggleBtn.style.fontWeight = 'bold';
        shopToggleBtn.style.fontSize = '15px';
        shopToggleBtn.style.fontFamily = "'Inter', system-ui, sans-serif";
        shopToggleBtn.style.borderRadius = '14px';
        shopToggleBtn.style.cursor = 'pointer';
        shopToggleBtn.style.backdropFilter = 'blur(16px)';
        (shopToggleBtn.style as any).webkitBackdropFilter = 'blur(16px)';
        shopToggleBtn.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(251, 191, 36, 0.25)';
        shopToggleBtn.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        shopToggleBtn.onmouseenter = () => {
            shopToggleBtn.style.transform = 'translateY(-2px) scale(1.03)';
            shopToggleBtn.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 22px rgba(251, 191, 36, 0.4)';
        };
        shopToggleBtn.onmouseleave = () => {
            shopToggleBtn.style.transform = 'translateY(0) scale(1.0)';
            shopToggleBtn.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(251, 191, 36, 0.25)';
        };
        shopToggleBtn.onclick = () => this.toggleShop(!this.isShopOpen);
        this.container.appendChild(shopToggleBtn);

        // 6. Floating synergy details panel (adjacent to the left tabbed panel)
        this.synergyTooltip = document.createElement('div');
        this.synergyTooltip.id = 'synergy-details-tooltip';
        this.synergyTooltip.style.position = 'absolute';
        this.synergyTooltip.style.left = '230px'; // 20px padding + 200px leftPanel width + 10px gap
        this.synergyTooltip.style.top = '100px';
        this.synergyTooltip.style.width = '280px';
        this.synergyTooltip.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
        this.synergyTooltip.style.backdropFilter = 'blur(16px)';
        (this.synergyTooltip.style as any).webkitBackdropFilter = 'blur(16px)';
        this.synergyTooltip.style.borderRadius = '14px';
        this.synergyTooltip.style.padding = '16px';
        this.synergyTooltip.style.color = '#ffffff';
        this.synergyTooltip.style.fontFamily = "'Inter', system-ui, sans-serif";
        this.synergyTooltip.style.border = '1px solid rgba(56, 189, 248, 0.3)';
        this.synergyTooltip.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(56,189,248,0.2)';
        this.synergyTooltip.style.display = 'none'; // Hidden initially
        this.synergyTooltip.style.zIndex = '1100';
        this.container.appendChild(this.synergyTooltip);

        // 7. Floating item details panel
        this.itemTooltip = document.createElement('div');
        this.itemTooltip.id = 'item-details-tooltip';
        this.itemTooltip.style.position = 'absolute';
        this.itemTooltip.style.left = '230px';
        this.itemTooltip.style.top = '100px';
        this.itemTooltip.style.width = '280px';
        this.itemTooltip.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
        this.itemTooltip.style.backdropFilter = 'blur(16px)';
        (this.itemTooltip.style as any).webkitBackdropFilter = 'blur(16px)';
        this.itemTooltip.style.borderRadius = '14px';
        this.itemTooltip.style.padding = '16px';
        this.itemTooltip.style.color = '#ffffff';
        this.itemTooltip.style.fontFamily = "'Inter', system-ui, sans-serif";
        this.itemTooltip.style.border = '1px solid rgba(56, 189, 248, 0.3)';
        this.itemTooltip.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(56,189,248,0.2)';
        this.itemTooltip.style.display = 'none'; // Hidden initially
        this.itemTooltip.style.zIndex = '1100';
        this.container.appendChild(this.itemTooltip);

        // 8. Floating interest details panel
        this.interestTooltip = document.createElement('div');
        this.interestTooltip.id = 'interest-tooltip';
        this.interestTooltip.style.position = 'absolute';
        this.interestTooltip.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
        this.interestTooltip.style.backdropFilter = 'blur(16px)';
        (this.interestTooltip.style as any).webkitBackdropFilter = 'blur(16px)';
        this.interestTooltip.style.border = '1px solid rgba(251, 191, 36, 0.3)';
        this.interestTooltip.style.padding = '8px 14px';
        this.interestTooltip.style.borderRadius = '10px';
        this.interestTooltip.style.display = 'none';
        this.interestTooltip.style.zIndex = '1200';
        this.interestTooltip.style.color = '#fff';
        this.interestTooltip.style.fontFamily = "'Inter', system-ui, sans-serif";
        // 9. Floating item combine preview tooltip
        this.combinePreviewTooltip = document.createElement('div');
        this.combinePreviewTooltip.id = 'combine-preview-tooltip';
        this.combinePreviewTooltip.style.position = 'absolute';
        this.combinePreviewTooltip.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
        this.combinePreviewTooltip.style.backdropFilter = 'blur(16px)';
        (this.combinePreviewTooltip.style as any).webkitBackdropFilter = 'blur(16px)';
        this.combinePreviewTooltip.style.borderRadius = '14px';
        this.combinePreviewTooltip.style.padding = '14px 18px';
        this.combinePreviewTooltip.style.color = '#ffffff';
        this.combinePreviewTooltip.style.fontFamily = "'Inter', system-ui, sans-serif";
        this.combinePreviewTooltip.style.border = '1px solid rgba(251, 191, 36, 0.6)';
        this.combinePreviewTooltip.style.boxShadow = '0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(251,191,36,0.3)';
        this.combinePreviewTooltip.style.display = 'none';
        this.combinePreviewTooltip.style.zIndex = '1300';
        this.combinePreviewTooltip.style.pointerEvents = 'none';
        this.container.appendChild(this.combinePreviewTooltip);

        this.updateShopCards();
        this.renderLeftPanelContent();
    }

    private toggleShop(open: boolean): void {
        this.isShopOpen = open;
        const shopDiv = document.getElementById('shop-deck');
        const btn = document.getElementById('shop-toggle-btn') as HTMLButtonElement | null;
        if (shopDiv) {
            shopDiv.style.display = open ? 'flex' : 'none';
        }
        if (btn) {
            btn.innerText = open ? '✕ Hide Shop' : '🛒 Shop';
        }
    }

    public updateHUD(hp?: number, stage?: number, round?: number, phase?: string, timer?: number, opponentHP?: number): void {
        if (hp !== undefined) this.lastHP = hp;
        if (stage !== undefined) this.lastStage = stage;
        if (round !== undefined) this.lastRound = round;
        if (phase !== undefined) this.lastPhase = phase;
        if (timer !== undefined) this.lastTimer = timer;
        if (opponentHP !== undefined) this.lastOpponentHP = opponentHP;

        const hpEl = document.getElementById('hud-hp');
        const goldEl = document.getElementById('hud-gold');
        const stageEl = document.getElementById('hud-stage');
        const roundEl = document.getElementById('hud-round');
        const phaseEl = document.getElementById('hud-phase');
        const timerEl = document.getElementById('hud-timer');
        const playerHpEl = document.getElementById('matchup-player-hp');
        const opponentHpEl = document.getElementById('matchup-opponent-hp');

        if (hpEl) hpEl.innerText = this.lastHP.toString();
        if (goldEl) goldEl.innerText = this.shopManager.gold.toString();
        if (stageEl) stageEl.innerText = this.lastStage.toString();
        if (roundEl) roundEl.innerText = this.lastRound.toString();
        if (phaseEl) phaseEl.innerText = this.lastPhase;
        if (timerEl) timerEl.innerText = this.lastTimer.toString();
        if (playerHpEl) playerHpEl.innerText = this.lastHP.toString();
        if (opponentHpEl) opponentHpEl.innerText = this.lastOpponentHP.toString();
        
        // Update Level/XP string dial indicators
        const xpProgressEl = document.getElementById('xp-progress-hud');
        if (xpProgressEl) {
            const currentLevel = this.shopManager.level;
            const currentXP = this.shopManager.xp;
            const req = this.shopManager.getNextXPNeeded();
            xpProgressEl.innerText = `Lvl ${currentLevel} (${currentXP}/${req} XP)`;
        }

        this.renderLeftPanelContent();
    }

    private showCombinePreview(itemA: string, itemB: string, e: MouseEvent | DragEvent): void {
        if (!this.combinePreviewTooltip) return;

        const recipe = (recipesRaw as any[]).find(r =>
            (r.componentA === itemA && r.componentB === itemB) ||
            (r.componentA === itemB && r.componentB === itemA)
        );

        if (!recipe) {
            this.hideCombinePreview();
            return;
        }

        const statsEntries = Object.entries(recipe.stats).map(([statName, val]) => {
            const numVal = val as number;
            const prefix = numVal >= 0 ? '+' : '';
            const suffix = statName.includes('Speed') || statName.includes('Chance') ? '%' : '';
            return `<div>✨ ${statName}: ${prefix}${numVal}${suffix}</div>`;
        }).join('');

        this.combinePreviewTooltip.innerHTML = `
            <div style="font-size: 11px; text-transform: uppercase; color: #fbbf24; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 4px;">⚡ Item Combine Result</div>
            <div style="font-weight: bold; font-size: 15px; color: #ffffff; margin-bottom: 2px;">🎁 ${recipe.result}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">Recipe: ${itemA} + ${itemB}</div>
            <div style="font-size: 11px; color: #a3e635; display: flex; flex-direction: column; gap: 3px; font-family: monospace;">
                ${statsEntries}
            </div>
        `;

        const posX = Math.min(window.innerWidth - 220, Math.max(10, e.clientX + 15));
        const posY = Math.min(window.innerHeight - 150, Math.max(10, e.clientY - 20));
        this.combinePreviewTooltip.style.left = `${posX}px`;
        this.combinePreviewTooltip.style.top = `${posY}px`;
        this.combinePreviewTooltip.style.display = 'block';
    }

    private hideCombinePreview(): void {
        if (this.combinePreviewTooltip) {
            this.combinePreviewTooltip.style.display = 'none';
        }
    }

    private getFrameColor(cost: number): string {
        switch (cost) {
            case 1: return '#64748b'; // Gray
            case 2: return '#10b981'; // Green
            case 3: return '#3b82f6'; // Blue
            case 4: return '#8b5cf6'; // Purple
            case 5: return '#f59e0b'; // Gold
            default: return '#64748b';
        }
    }

    public updateShopCards(): void {
        const container = document.getElementById('cards-container');
        if (!container) return;
        container.innerHTML = '';

        const facilityBtn = document.getElementById('shop-mode-facility-btn');
        if (facilityBtn) {
            const currentFacCount = this.shopManager.getPlayerFacilityCount(this.boardState);
            const maxFacCap = this.shopManager.getFacilityCapacityLimit(this.boardState);
            facilityBtn.innerText = `🏰 Facility Shop (${currentFacCount}/${maxFacCap})`;
        }

        if (this.shopMode === 'heroes') {
            this.shopManager.currentShop.forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.style.width = '120px';
                cardDiv.style.height = '160px';
                cardDiv.style.borderRadius = '8px';
                cardDiv.style.padding = '10px';
                cardDiv.style.display = 'flex';
                cardDiv.style.flexDirection = 'column';
                cardDiv.style.justifyContent = 'space-between';
                cardDiv.style.cursor = card ? 'pointer' : 'default';

                if (card) {
                    const borderClr = this.getFrameColor(card.cost);
                    const normalized = card.name.toLowerCase().replace(/\s+/g, '_');
                    cardDiv.style.border = `2px solid ${borderClr}`;
                    cardDiv.style.backgroundColor = '#1e293b';
                    cardDiv.innerHTML = `
                        <div style="font-weight: bold; color: #e2e8f0; font-size: 13px; font-family: sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${card.name}</div>
                        <div style="display: flex; justify-content: center; align-items: center; height: 65px; margin: 4px 0; border-radius: 4px; overflow: hidden; background-color: #0f172a;">
                            <img src="/assets/concepts/${normalized}.png" style="height: 100%; object-fit: contain;" onerror="this.style.display='none';"/>
                        </div>
                        <div style="font-size: 10px; color: #94a3b8; font-family: sans-serif;">${card.faction}</div>
                        <div style="font-size: 12px; color: #fbbf24; font-weight: bold; font-family: sans-serif;">Cost: ${card.cost}g</div>
                    `;
                    cardDiv.onclick = () => {
                        const bought = this.shopManager.buyUnit(index);
                        if (bought && this.onBuyUnitCallback) {
                            this.onBuyUnitCallback(bought.name);
                            this.updateShopCards();
                            this.updateHUD();
                        }
                    };
                } else {
                    cardDiv.style.backgroundColor = 'transparent';
                    cardDiv.style.border = '1px dashed #334155';
                }

                container.appendChild(cardDiv);
            });
        } else {
            // Facility Shop Mode
            const canBuy = this.shopManager.canBuyFacility(this.boardState);

            this.shopManager.currentFacilityShop.forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.style.width = '170px';
                cardDiv.style.height = '160px';
                cardDiv.style.borderRadius = '8px';
                cardDiv.style.padding = '10px';
                cardDiv.style.display = 'flex';
                cardDiv.style.flexDirection = 'column';
                cardDiv.style.justifyContent = 'space-between';
                cardDiv.style.cursor = card && canBuy ? 'pointer' : 'default';

                if (card) {
                    let borderClr = '#b45309'; // Amber
                    if (card.facilityType === 'Offensive') borderClr = '#ef4444';
                    else if (card.facilityType === 'Support') borderClr = '#10b981';
                    else if (card.facilityType === 'Resource') borderClr = '#f59e0b';

                    cardDiv.style.border = `2px solid ${borderClr}`;
                    cardDiv.style.backgroundColor = '#1e293b';
                    cardDiv.style.opacity = canBuy ? '1.0' : '0.6';

                    cardDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-weight: bold; color: #f8fafc; font-size: 13px; font-family: sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${card.icon} ${card.name}</div>
                        </div>
                        <div style="font-size: 10px; color: #fbbf24; background-color: rgba(15, 23, 42, 0.8); padding: 2px 6px; border-radius: 4px; display: inline-block;">
                            🏗️ Build: ${card.constructionRounds} rounds
                        </div>
                        <div style="font-size: 10px; color: #cbd5e1; font-family: sans-serif; line-height: 1.3; height: 50px; overflow: hidden; margin: 4px 0;">${card.desc}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 10px; color: #94a3b8; font-family: sans-serif;">${card.facilityType}</span>
                            <span style="font-size: 12px; color: #fbbf24; font-weight: bold; font-family: sans-serif;">Cost: ${card.cost}g</span>
                        </div>
                    `;

                    cardDiv.onclick = () => {
                        const boughtFacility = this.shopManager.buyFacility(index, this.boardState);
                        if (boughtFacility) {
                            if (this.onBuyUnitCallback) {
                                this.onBuyUnitCallback(boughtFacility.name);
                            }
                            bus.emit({ type: 'UNIT_MOVED', unitId: boughtFacility.id, from: boughtFacility.hex, to: boughtFacility.hex });
                            this.updateShopCards();
                            this.updateHUD();
                        }
                    };
                } else {
                    cardDiv.style.backgroundColor = 'transparent';
                    cardDiv.style.border = '1px dashed #334155';
                }

                container.appendChild(cardDiv);
            });
        }
    }

    private renderLeftPanelContent(): void {
        const wrapper = document.getElementById('left-panel-content-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';

        if (this.activeTab === 'synergy') {
            // Draw Synergy list
            const synergyList = document.createElement('div');
            synergyList.id = 'synergy-list-wrapper';
            synergyList.style.display = 'flex';
            synergyList.style.flexDirection = 'column';
            synergyList.style.gap = '8px';
            wrapper.appendChild(synergyList);
            this.updateSynergyPanel();
        } else {
            // Draw Items Inventory panel list
            const itemPanel = document.createElement('div');
            itemPanel.style.display = 'flex';
            itemPanel.style.flexDirection = 'column';
            itemPanel.style.gap = '8px';
            
            itemPanel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div style="font-size: 11px; color: #94a3b8;">Page <span id="inventory-page-num">1</span></div>
                    <div style="display: flex; gap: 4px;">
                        <button id="btn-prev-page" style="padding: 2px 4px; font-size: 9px; background-color: #334155; border: none; color: #fff; border-radius: 4px; cursor: pointer;">&lt;</button>
                        <button id="btn-next-page" style="padding: 2px 4px; font-size: 9px; background-color: #334155; border: none; color: #fff; border-radius: 4px; cursor: pointer;">&gt;</button>
                    </div>
                </div>
                <div id="inventory-cells-wrapper" style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;"></div>
            `;
            wrapper.appendChild(itemPanel);

            // Re-bind pagination buttons click triggers
            const prevBtn = document.getElementById('btn-prev-page');
            const nextBtn = document.getElementById('btn-next-page');

            if (prevBtn) {
                prevBtn.onclick = () => {
                    if (this.inventoryPageIndex > 0) {
                        this.inventoryPageIndex--;
                        this.updateInventoryView();
                    }
                };
            }
            if (nextBtn) {
                nextBtn.onclick = () => {
                    const totalItems = this.boardState.itemInventory.length;
                    const maxPageIndex = Math.max(0, Math.ceil(totalItems / 10) - 1);
                    if (this.inventoryPageIndex < maxPageIndex) {
                        this.inventoryPageIndex++;
                        this.updateInventoryView();
                    }
                };
            }

            this.updateInventoryView();
        }
    }

    public updateInventoryView(): void {
        const wrapper = document.getElementById('inventory-cells-wrapper');
        const pageNumSpan = document.getElementById('inventory-page-num');
        if (!wrapper) return;
        wrapper.innerHTML = '';

        if (pageNumSpan) {
            pageNumSpan.innerText = (this.inventoryPageIndex + 1).toString();
        }

        const inventory = this.boardState.itemInventory;
        const startIndex = this.inventoryPageIndex * 10;

        for (let i = 0; i < 10; i++) {
            const actualIndex = startIndex + i;
            const cell = document.createElement('div');
            cell.style.width = '170px';
            cell.style.height = '30px';
            cell.style.borderRadius = '6px';
            cell.style.border = '1px solid #475569';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontSize = '12px';
            cell.style.color = '#ffffff';
            cell.style.fontFamily = 'sans-serif';
            cell.style.backgroundColor = '#1e293b';
            
            cell.draggable = true;

            const item = inventory[actualIndex];
            if (item) {
                cell.innerText = item;
                
                if (item === 'Item Remover') {
                    cell.style.backgroundColor = '#047857';
                } else if (item === 'Item Reforger') {
                    cell.style.backgroundColor = '#7c3aed';
                }

                cell.style.cursor = 'grab';
                
                cell.onmouseenter = () => {
                    this.showItemTooltip(item);
                };
                cell.onmouseleave = () => {
                    this.hideItemTooltip();
                };

                cell.ondragstart = (e) => {
                    this.draggedInventoryIndex = actualIndex;
                    e.dataTransfer?.setData('text/plain', actualIndex.toString());
                };

                cell.ondragend = () => {
                    this.draggedInventoryIndex = -1;
                    this.hideCombinePreview();
                };

                cell.ondragover = (e) => {
                    e.preventDefault();
                    if (this.draggedInventoryIndex !== -1 && this.draggedInventoryIndex !== actualIndex) {
                        const itemA = inventory[this.draggedInventoryIndex];
                        const itemB = inventory[actualIndex];
                        if (itemA && itemB) {
                            this.showCombinePreview(itemA, itemB, e);
                        }
                    }
                };

                cell.ondragenter = (e) => {
                    e.preventDefault();
                    if (this.draggedInventoryIndex !== -1 && this.draggedInventoryIndex !== actualIndex) {
                        const itemA = inventory[this.draggedInventoryIndex];
                        const itemB = inventory[actualIndex];
                        if (itemA && itemB) {
                            this.showCombinePreview(itemA, itemB, e);
                        }
                    }
                };

                cell.ondragleave = () => {
                    this.hideCombinePreview();
                };

                cell.ondrop = (e) => {
                    e.preventDefault();
                    this.hideCombinePreview();
                    const dragIndexStr = e.dataTransfer?.getData('text/plain');
                    const dragIndex = dragIndexStr ? parseInt(dragIndexStr) : -1;
                    const sourceIndex = dragIndex !== -1 ? dragIndex : this.draggedInventoryIndex;
                    if (sourceIndex !== -1 && sourceIndex !== actualIndex) {
                        const success = this.boardState.combineInventoryItems(sourceIndex, actualIndex);
                        if (success) {
                            this.updateInventoryView();
                        }
                    }
                    this.draggedInventoryIndex = -1;
                };
            } else {
                cell.innerText = '- Empty -';
                cell.style.border = '1px dashed #334155';
                cell.style.backgroundColor = 'transparent';
                cell.ondragover = (e) => {
                    e.preventDefault();
                    this.hideCombinePreview();
                };
            }

            wrapper.appendChild(cell);
        }
    }

    private updateSynergyPanel(): void {
        const wrapper = document.getElementById('synergy-list-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';

        const activeTraits = SynergyManager.calculateSynergies(this.boardState.getAllUnits());
        if (activeTraits.size === 0) {
            wrapper.innerHTML = `<div style="font-size: 11px; color: #64748b; font-style: italic;">No active traits</div>`;
            return;
        }

        for (const [trait, count] of activeTraits.entries()) {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.padding = '6px';
            row.style.borderRadius = '4px';
            row.style.backgroundColor = 'rgba(51, 65, 85, 0.4)';
            row.style.cursor = 'pointer';
            row.style.transition = 'background-color 0.2s';
            row.style.borderLeft = '3px solid #fbbf24';

            row.onmouseover = () => {
                row.style.backgroundColor = 'rgba(51, 65, 85, 0.7)';
                this.showSynergyTooltip(trait, count, false);
            };
            row.onmouseout = () => {
                row.style.backgroundColor = 'rgba(51, 65, 85, 0.4)';
                this.hideSynergyTooltip(false);
            };

            row.onclick = () => {
                this.showSynergyTooltip(trait, count, true);
            };

            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 12px; font-weight: bold; color: #f1f5f9;">🛡️ ${trait}</span>
                </div>
                <span style="font-size: 11px; background-color: #1e293b; padding: 2px 6px; border-radius: 8px; color: #fbbf24; font-weight: bold;">${count}</span>
            `;
            wrapper.appendChild(row);
        }
    }

    private showSynergyTooltip(trait: string, count: number, isClick: boolean = false): void {
        if (!this.synergyTooltip) return;

        const synData = synergiesCatalog[trait];
        let desc = "Grants bonus attributes matching tier thresholds.";
        let thresholds: { req: number, desc: string }[] = [];
        if (synData) {
            desc = synData.desc;
            thresholds = synData.thresholds;
        }

        let thresholdHtml = '';
        if (thresholds.length > 0) {
            thresholdHtml = `
                <div style="margin-top: 12px; border-top: 1px solid #334155; padding-top: 10px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Thresholds</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
            `;

            const sorted = [...thresholds].sort((a, b) => a.req - b.req);
            let activeReq = 0;
            for (const t of sorted) {
                if (count >= t.req) {
                    activeReq = t.req;
                }
            }

            for (const t of sorted) {
                const isActive = count >= t.req && t.req === activeReq;
                const isReached = count >= t.req;
                const color = isActive ? '#fbbf24' : (isReached ? '#f1f5f9' : '#64748b');
                const border = isActive ? '1px solid #b45309' : '1px solid transparent';
                const bg = isActive ? 'rgba(180, 83, 9, 0.15)' : 'transparent';
                const bullet = isReached ? '●' : '○';

                thresholdHtml += `
                    <div style="font-size: 11px; color: ${color}; border: ${border}; background-color: ${bg}; padding: 6px; border-radius: 6px; line-height: 1.4; transition: all 0.2s;">
                        <span style="font-weight: bold; margin-right: 4px;">${bullet} (${t.req}):</span> ${t.desc}
                    </div>
                `;
            }

            thresholdHtml += `
                    </div>
                </div>
            `;
        }

        this.synergyTooltip.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                    <div style="font-size: 15px; font-weight: bold; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
                        <span>🛡️</span> ${trait}
                    </div>
                    <div style="font-size: 11px; color: #10b981; font-weight: bold; margin-top: 2px;">
                        Active Count: ${count} ${count === 1 ? 'unit' : 'units'}
                    </div>
                </div>
                ${isClick ? `<button id="close-synergy-btn" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; transition: background-color 0.2s;">✕</button>` : ''}
            </div>
            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 8px;">
                ${desc}
            </div>
            ${thresholdHtml}
        `;

        this.synergyTooltip.style.display = 'block';

        if (isClick) {
            this.lockedSynergy = trait;
            const closeBtn = this.synergyTooltip.querySelector('#close-synergy-btn') as HTMLButtonElement | null;
            if (closeBtn) {
                closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = 'rgba(255,255,255,0.1)'; closeBtn.style.color = '#fff'; };
                closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = 'transparent'; closeBtn.style.color = '#94a3b8'; };
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.hideSynergyTooltip(true);
                };
            }
        }
    }

    private hideSynergyTooltip(force: boolean = false): void {
        if (!this.synergyTooltip) return;
        if (force) {
            this.lockedSynergy = null;
        }
        if (this.lockedSynergy) {
            const activeTraits = SynergyManager.calculateSynergies(this.boardState.getAllUnits());
            const count = activeTraits.get(this.lockedSynergy) || 0;
            this.showSynergyTooltip(this.lockedSynergy, count, true);
        } else {
            this.synergyTooltip.style.display = 'none';
        }
    }

    private showItemTooltip(itemName: string): void {
        if (!this.itemTooltip) return;

        let statsHtml = '';
        let typeLabel = 'Basic Component';
        
        const recipe = (recipesRaw as any[]).find(r => r.result === itemName);
        
        if (itemName === 'Item Remover') {
            typeLabel = 'Consumable';
            statsHtml = `<div style="font-size: 11px; color: #10b981; line-height: 1.4;">Drag onto a unit to remove all equipped items and return them to inventory.</div>`;
        } else if (itemName === 'Item Reforger') {
            typeLabel = 'Consumable';
            statsHtml = `<div style="font-size: 11px; color: #7c3aed; line-height: 1.4;">Drag onto a unit to reforge all equipped items into random equivalents.</div>`;
        } else if (recipe) {
            typeLabel = 'Completed Item';
            const statsEntries = Object.entries(recipe.stats).map(([statName, val]) => {
                const numVal = val as number;
                const prefix = numVal >= 0 ? '+' : '';
                const suffix = statName.includes('Speed') || statName.includes('Chance') ? '%' : '';
                return `<div>✨ ${statName}: ${prefix}${numVal}${suffix}</div>`;
            }).join('');
            statsHtml = `
                <div style="font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; line-height: 1.4;">
                    ${statsEntries}
                </div>
                <div style="margin-top: 10px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #334155; padding-top: 8px;">
                    Recipe: ${recipe.componentA} + ${recipe.componentB}
                </div>
            `;
        } else {
            let desc = '';
            if (itemName === 'Blunt Sword') desc = '+10% Physical Attack (ATK)';
            else if (itemName === 'Bow') desc = '+10% Attack Speed';
            else if (itemName === 'Chestplate') desc = '+20 Physical Defense (DEF)';
            else desc = 'Basic item component used in recipes.';
            
            statsHtml = `<div style="font-size: 11px; color: #60a5fa; line-height: 1.4;">${desc}</div>`;
        }

        this.itemTooltip.innerHTML = `
            <div style="font-weight: bold; font-size: 14px; color: #fbbf24; margin-bottom: 2px;">🎁 ${itemName}</div>
            <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 8px;">${typeLabel}</div>
            ${statsHtml}
        `;
        
        if (this.synergyTooltip) this.synergyTooltip.style.display = 'none';
        this.itemTooltip.style.display = 'block';
    }

    private hideItemTooltip(): void {
        if (this.itemTooltip) {
            this.itemTooltip.style.display = 'none';
        }
        if (this.lockedSynergy && this.synergyTooltip) {
            this.synergyTooltip.style.display = 'block';
        }
    }

    private showInterestTooltip(e: MouseEvent): void {
        if (!this.interestTooltip) return;

        const currentGold = this.shopManager.gold;
        const interest = Math.min(5, Math.floor(currentGold / 10));

        let coinsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const isActive = i <= interest;
            const color = isActive ? '#ffffff' : '#64748b';
            const dot = isActive ? '●' : '○';
            coinsHtml += `<span style="font-size: 14px; color: ${color}; margin-right: 2px;">${dot}</span>`;
        }

        this.interestTooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; color: #fbbf24; font-size: 11px;">Interest Tracker</div>
            <div style="display: flex; align-items: center; gap: 2px;">
                ${coinsHtml}
                <span style="font-size: 10px; color: #94a3b8; margin-left: 4px;">(+${interest}g interest)</span>
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 4px; line-height: 1.3;">+1 gold at round end for every 10 gold saved.</div>
        `;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        this.interestTooltip.style.left = `${rect.left + window.scrollX - 40}px`;
        this.interestTooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
        this.interestTooltip.style.display = 'block';
    }

    private hideInterestTooltip(): void {
        if (this.interestTooltip) {
            this.interestTooltip.style.display = 'none';
        }
    }
}
