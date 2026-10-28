// src/view/ScreenManager.ts

import { BoardState } from '../core/board/BoardState';
import { ShopManager } from '../core/shop/ShopManager';
import { GameLoopManager } from '../core/board/GameLoopManager';
import { AncientManager } from '../core/stats/AncientManager';
import { UnitView } from './UnitView';
import { UIOverlay } from './UIOverlay';
import { UnitInspectUI } from './UnitInspectUI';
import { ShopUI } from './ShopUI';

import unitsCatalogRaw from '../core/data/units_catalog.json';
import synergiesCatalogRaw from '../core/data/synergies_catalog.json';
import recipesRaw from '../core/data/recipes.json';

export type ScreenState = 'LOBBY' | 'SETTINGS' | 'COMPENDIUM' | 'GAMEPLAY';

interface CatalogUnit {
    name: string;
    cost: number;
    faction: string;
    traits: string[];
    baseStats: { hp: number; atk: number; def: number; mdef: number; ap?: number };
    skill?: { name: string; desc: string; manaInfo: string };
}

export class ScreenManager {
    private container: HTMLElement;
    private currentState: ScreenState = 'LOBBY';

    // Core logic and view dependencies for state resets
    private boardState: BoardState;
    private shopManager: ShopManager;
    private gameLoop: GameLoopManager;
    private ancientManager: AncientManager;
    private unitView: UnitView;
    private uiOverlay: UIOverlay;
    private unitInspectUI: UnitInspectUI;
    private shopUI: ShopUI;

    // DOM Screen Elements
    private lobbyEl!: HTMLDivElement;
    private settingsEl!: HTMLDivElement;
    private compendiumEl!: HTMLDivElement;
    private topMenuBtnEl!: HTMLButtonElement;

    // Compendium active tab and filter states
    private compendiumTab: 'units' | 'synergies' | 'items' = 'units';
    private unitFactionFilter: string = 'All';
    private unitCostFilter: number = 0; // 0 = All
    private synergyCategoryFilter: 'all' | 'origins' | 'classes' = 'all';
    private synergySearchQuery: string = '';

    constructor(
        container: HTMLElement,
        boardState: BoardState,
        shopManager: ShopManager,
        gameLoop: GameLoopManager,
        ancientManager: AncientManager,
        unitView: UnitView,
        uiOverlay: UIOverlay,
        unitInspectUI: UnitInspectUI,
        shopUI: ShopUI
    ) {
        this.container = container;
        this.boardState = boardState;
        this.shopManager = shopManager;
        this.gameLoop = gameLoop;
        this.ancientManager = ancientManager;
        this.unitView = unitView;
        this.uiOverlay = uiOverlay;
        this.unitInspectUI = unitInspectUI;
        this.shopUI = shopUI;

        this.buildUI();
        this.setScreen('LOBBY');
    }

    private buildUI(): void {
        this.buildLobbyScreen();
        this.buildSettingsModal();
        this.buildCompendiumScreen();
        this.buildTopMenuButton();
    }

    public setScreen(state: ScreenState): void {
        this.currentState = state;

        // Toggle screen container visibility
        this.lobbyEl.style.display = state === 'LOBBY' ? 'flex' : 'none';
        this.settingsEl.style.display = state === 'SETTINGS' ? 'flex' : 'none';
        this.compendiumEl.style.display = state === 'COMPENDIUM' ? 'flex' : 'none';

        // Gameplay UI containers visibility
        const hudEl = document.getElementById('game-hud');
        const leftPanelEl = document.getElementById('left-tabbed-panel');
        const matchupPanelEl = document.getElementById('matchup-panel');
        const shopDeckEl = document.getElementById('shop-deck');
        const shopBtnEl = document.getElementById('shop-toggle-btn');
        const sellZoneEl = document.getElementById('sell-zone');
        const ancientPopupEl = document.getElementById('ancient-chest-popup');

        const isGameplay = state === 'GAMEPLAY';

        if (hudEl) hudEl.style.display = isGameplay ? 'flex' : 'none';
        if (leftPanelEl) leftPanelEl.style.display = isGameplay ? 'flex' : 'none';
        if (matchupPanelEl) matchupPanelEl.style.display = isGameplay ? 'flex' : 'none';
        if (shopBtnEl) shopBtnEl.style.display = isGameplay ? 'block' : 'none';
        if (this.topMenuBtnEl) this.topMenuBtnEl.style.display = isGameplay ? 'block' : 'none';

        if (!isGameplay) {
            if (shopDeckEl) shopDeckEl.style.display = 'none';
            if (sellZoneEl) {
                sellZoneEl.style.opacity = '0';
                sellZoneEl.style.transform = 'translateY(-100%)';
            }
            if (ancientPopupEl) ancientPopupEl.style.display = 'none';
            this.unitInspectUI.hide();
        }
    }

    public getScreen(): ScreenState {
        return this.currentState;
    }

    public startGame(): void {
        console.log('[ScreenManager] Transitioning to GAMEPLAY state with full state reset...');

        // 1. Clean logic state reset
        this.boardState.reset();
        this.shopManager.reset();
        this.gameLoop.reset();
        this.ancientManager.reset();

        // 2. Clean visual state reset
        this.unitView.removeAllUnits();
        this.uiOverlay.removeAllHPBars();
        this.unitInspectUI.hide();

        // 3. Roll fresh initial shop and update HUD
        this.shopManager.rollShop();
        this.shopUI.updateShopCards();
        this.shopUI.updateHUD(
            this.gameLoop.playerHP,
            this.gameLoop.stage,
            this.gameLoop.round,
            this.gameLoop.phase,
            this.gameLoop.phaseTimer,
            this.gameLoop.opponentHP
        );

        // 4. Set active screen state to GAMEPLAY
        this.setScreen('GAMEPLAY');
    }

    public returnToLobby(): void {
        console.log('[ScreenManager] Returning to LOBBY...');
        this.unitInspectUI.hide();
        this.setScreen('LOBBY');
    }

    // ─────────────────────────────────────────────────────────────
    // 1. LOBBY SCREEN BUILDER
    // ─────────────────────────────────────────────────────────────
    private buildLobbyScreen(): void {
        this.lobbyEl = document.createElement('div');
        this.lobbyEl.id = 'lobby-screen';
        Object.assign(this.lobbyEl.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            webkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            zIndex: '5000',
            fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
            color: '#ffffff',
            userSelect: 'none'
        });

        this.lobbyEl.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;">
                <div style="font-size:13px;font-weight:700;letter-spacing:5px;color:#fbbf24;text-transform:uppercase;text-shadow:0 0 12px rgba(251,191,36,0.4);">
                    AutoChess Tactics
                </div>
                <div style="font-size:52px;font-weight:900;letter-spacing:-1.5px;background:linear-gradient(135deg,#ffffff 0%,#fbbf24 45%,#d97706 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 10px 30px rgba(251,191,36,0.35));">
                    PICKAXE AUTO CHESS
                </div>
                <div style="font-size:14px;color:#94a3b8;letter-spacing:1px;margin-top:4px;">
                    2D Sprite Tactics • Textured Hex Grid • 36 Hero Catalog
                </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:16px;width:300px;">
                <button id="btn-lobby-start" style="padding:16px 28px;border:1px solid rgba(124,58,237,0.5);border-radius:14px;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);color:#ffffff;font-weight:800;font-size:17px;cursor:pointer;box-shadow:0 8px 24px rgba(37,99,235,0.4),0 0 20px rgba(124,58,237,0.3);transition:all 0.25s cubic-bezier(0.16,1,0.3,1);">
                    ⚔️ START GAME
                </button>
                <button id="btn-lobby-compendium" style="padding:14px 28px;border:1px solid rgba(56,189,248,0.3);border-radius:14px;background:rgba(30,41,59,0.6);color:#f1f5f9;font-weight:700;font-size:15px;cursor:pointer;backdrop-filter:blur(12px);box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:all 0.25s cubic-bezier(0.16,1,0.3,1);">
                    📖 COMPENDIUM
                </button>
                <button id="btn-lobby-settings" style="padding:14px 28px;border:1px solid rgba(56,189,248,0.3);border-radius:14px;background:rgba(30,41,59,0.6);color:#f1f5f9;font-weight:700;font-size:15px;cursor:pointer;backdrop-filter:blur(12px);box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:all 0.25s cubic-bezier(0.16,1,0.3,1);">
                    ⚙️ SETTINGS
                </button>
            </div>

            <div style="position:absolute;bottom:24px;font-size:12px;color:#64748b;letter-spacing:0.5px;">
                Pickaxe AutoChess v1.0.0 • Premium Glassmorphic Presentation
            </div>
        `;

        this.container.appendChild(this.lobbyEl);

        const startBtn = this.lobbyEl.querySelector('#btn-lobby-start') as HTMLButtonElement;
        const compendiumBtn = this.lobbyEl.querySelector('#btn-lobby-compendium') as HTMLButtonElement;
        const settingsBtn = this.lobbyEl.querySelector('#btn-lobby-settings') as HTMLButtonElement;

        startBtn.onclick = () => this.startGame();
        compendiumBtn.onclick = () => this.setScreen('COMPENDIUM');
        settingsBtn.onclick = () => this.setScreen('SETTINGS');
    }

    // ─────────────────────────────────────────────────────────────
    // 2. SETTINGS MODAL BUILDER
    // ─────────────────────────────────────────────────────────────
    private buildSettingsModal(): void {
        this.settingsEl = document.createElement('div');
        this.settingsEl.id = 'settings-modal';
        Object.assign(this.settingsEl.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(11, 14, 20, 0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: '5100',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            color: '#ffffff'
        });

        this.settingsEl.innerHTML = `
            <div style="width:440px;background:rgba(15,23,42,0.95);border:1px solid #334155;border-radius:20px;padding:28px;display:flex;flex-direction:column;gap:20px;box-shadow:0 20px 50px rgba(0,0,0,0.7);">
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:12px;">
                    <div style="font-size:20px;font-weight:800;color:#fbbf24;">⚙️ Game Settings</div>
                    <button id="btn-close-settings" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button>
                </div>

                <div style="display:flex;flex-direction:column;gap:14px;font-size:14px;color:#cbd5e1;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>Sound Effects (SFX)</span>
                        <input type="checkbox" checked style="width:18px;height:18px;cursor:pointer;accent-color:#3b82f6;"/>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>Ambient Music</span>
                        <input type="checkbox" checked style="width:18px;height:18px;cursor:pointer;accent-color:#3b82f6;"/>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>Bloom & VFX Quality</span>
                        <select style="background:#1e293b;color:#fff;border:1px solid #475569;border-radius:6px;padding:4px 8px;cursor:pointer;">
                            <option value="high">High (Bloom On)</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>Grid Highlight Glow</span>
                        <input type="checkbox" checked style="width:18px;height:18px;cursor:pointer;accent-color:#3b82f6;"/>
                    </div>
                </div>

                <div style="border-top:1px solid #334155;padding-top:14px;font-size:12px;color:#94a3b8;line-height:1.6;">
                    <div style="font-weight:bold;color:#f1f5f9;margin-bottom:4px;">🎮 Drag & Keyboard Controls:</div>
                    <div>• <b>Left Click Unit</b>: Inspect unit stats, skills & items</div>
                    <div>• <b>Drag Unit</b>: Position on player hex grid or bench</div>
                    <div>• <b>Drag to Top</b>: Sell unit for gold refund</div>
                    <div>• <b>Drag Item</b>: Equip onto allied unit</div>
                </div>

                <button id="btn-settings-back" style="padding:12px;border:none;border-radius:10px;background:#3b82f6;color:#ffffff;font-weight:700;font-size:14px;cursor:pointer;">
                    Back to Lobby
                </button>
            </div>
        `;

        this.container.appendChild(this.settingsEl);

        const closeBtn = this.settingsEl.querySelector('#btn-close-settings') as HTMLButtonElement;
        const backBtn = this.settingsEl.querySelector('#btn-settings-back') as HTMLButtonElement;

        closeBtn.onclick = () => this.setScreen('LOBBY');
        backBtn.onclick = () => this.setScreen('LOBBY');
    }

    // ─────────────────────────────────────────────────────────────
    // 3. COMPENDIUM VIEW BUILDER
    // ─────────────────────────────────────────────────────────────
    private buildCompendiumScreen(): void {
        this.compendiumEl = document.createElement('div');
        this.compendiumEl.id = 'compendium-screen';
        Object.assign(this.compendiumEl.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'none',
            flexDirection: 'column',
            backgroundColor: 'rgba(11, 14, 20, 0.95)',
            backdropFilter: 'blur(16px)',
            zIndex: '5200',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            color: '#ffffff',
            padding: '24px 32px',
            boxSizing: 'border-box'
        });

        this.compendiumEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:16px;margin-bottom:16px;">
                <div style="display:flex;align-items:center;gap:16px;">
                    <div style="font-size:24px;font-weight:800;color:#fbbf24;">📖 Game Compendium</div>
                    <div style="display:flex;gap:8px;">
                        <button id="comp-tab-units" style="padding:8px 16px;border:none;border-radius:8px;background:#3b82f6;color:#fff;font-weight:bold;cursor:pointer;">Units Catalog</button>
                        <button id="comp-tab-synergies" style="padding:8px 16px;border:1px solid #334155;border-radius:8px;background:transparent;color:#94a3b8;font-weight:bold;cursor:pointer;">Synergies</button>
                        <button id="comp-tab-items" style="padding:8px 16px;border:1px solid #334155;border-radius:8px;background:transparent;color:#94a3b8;font-weight:bold;cursor:pointer;">Item Recipes</button>
                    </div>
                </div>
                <button id="btn-compendium-back" style="padding:8px 20px;border:1px solid #475569;border-radius:8px;background:rgba(30,41,59,0.8);color:#fff;font-weight:bold;cursor:pointer;">
                    Back to Lobby
                </button>
            </div>

            <!-- Content Area -->
            <div id="compendium-content" style="flex:1;overflow-y:auto;padding-right:8px;"></div>
        `;

        this.container.appendChild(this.compendiumEl);

        const tabUnits = this.compendiumEl.querySelector('#comp-tab-units') as HTMLButtonElement;
        const tabSynergies = this.compendiumEl.querySelector('#comp-tab-synergies') as HTMLButtonElement;
        const tabItems = this.compendiumEl.querySelector('#comp-tab-items') as HTMLButtonElement;
        const backBtn = this.compendiumEl.querySelector('#btn-compendium-back') as HTMLButtonElement;

        tabUnits.onclick = () => {
            this.compendiumTab = 'units';
            this.updateCompendiumTabButtons();
            this.renderCompendiumContent();
        };

        tabSynergies.onclick = () => {
            this.compendiumTab = 'synergies';
            this.updateCompendiumTabButtons();
            this.renderCompendiumContent();
        };

        tabItems.onclick = () => {
            this.compendiumTab = 'items';
            this.updateCompendiumTabButtons();
            this.renderCompendiumContent();
        };

        backBtn.onclick = () => this.setScreen('LOBBY');

        this.renderCompendiumContent();
    }

    private updateCompendiumTabButtons(): void {
        const tabUnits = this.compendiumEl.querySelector('#comp-tab-units') as HTMLButtonElement;
        const tabSynergies = this.compendiumEl.querySelector('#comp-tab-synergies') as HTMLButtonElement;
        const tabItems = this.compendiumEl.querySelector('#comp-tab-items') as HTMLButtonElement;

        const activeStyle = { background: '#3b82f6', color: '#fff', border: 'none' };
        const inactiveStyle = { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' };

        Object.assign(tabUnits.style, this.compendiumTab === 'units' ? activeStyle : inactiveStyle);
        Object.assign(tabSynergies.style, this.compendiumTab === 'synergies' ? activeStyle : inactiveStyle);
        Object.assign(tabItems.style, this.compendiumTab === 'items' ? activeStyle : inactiveStyle);
    }

    private renderCompendiumContent(): void {
        const contentEl = this.compendiumEl.querySelector('#compendium-content') as HTMLDivElement;
        if (!contentEl) return;
        contentEl.innerHTML = '';

        if (this.compendiumTab === 'units') {
            this.renderUnitsCatalog(contentEl);
        } else if (this.compendiumTab === 'synergies') {
            this.renderSynergiesCatalog(contentEl);
        } else if (this.compendiumTab === 'items') {
            this.renderItemsCatalog(contentEl);
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

    private renderUnitsCatalog(container: HTMLDivElement): void {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '16px';

        // Filter Bar (Faction + Cost)
        const filterBar = document.createElement('div');
        filterBar.style.display = 'flex';
        filterBar.style.gap = '16px';
        filterBar.style.alignItems = 'center';
        filterBar.style.flexWrap = 'wrap';

        const factions = ['All', 'Human', 'Ancient', 'Noble', 'Dwarven Forge', 'Demonic Pact', 'Magic Tower', 'Sylvan Elves'];
        let factionBtnsHtml = '<div style="display:flex;gap:6px;align-items:center;"><span style="font-size:12px;color:#94a3b8;font-weight:bold;">Faction:</span>';
        for (const fac of factions) {
            const isActive = this.unitFactionFilter === fac;
            const bg = isActive ? '#2563eb' : '#1e293b';
            const color = isActive ? '#fff' : '#94a3b8';
            factionBtnsHtml += `<button class="fac-filter-btn" data-fac="${fac}" style="padding:4px 10px;border:1px solid #334155;border-radius:6px;background:${bg};color:${color};font-size:12px;cursor:pointer;">${fac}</button>`;
        }
        factionBtnsHtml += '</div>';

        let costBtnsHtml = '<div style="display:flex;gap:6px;align-items:center;"><span style="font-size:12px;color:#94a3b8;font-weight:bold;">Cost:</span>';
        for (let c = 0; c <= 5; c++) {
            const label = c === 0 ? 'All' : `${c}g`;
            const isActive = this.unitCostFilter === c;
            const bg = isActive ? '#fbbf24' : '#1e293b';
            const color = isActive ? '#0f172a' : '#94a3b8';
            costBtnsHtml += `<button class="cost-filter-btn" data-cost="${c}" style="padding:4px 10px;border:1px solid #334155;border-radius:6px;background:${bg};color:${color};font-size:12px;font-weight:bold;cursor:pointer;">${label}</button>`;
        }
        costBtnsHtml += '</div>';

        filterBar.innerHTML = factionBtnsHtml + costBtnsHtml;
        wrapper.appendChild(filterBar);

        // Unit Grid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
        grid.style.gap = '16px';

        const catalog = unitsCatalogRaw as CatalogUnit[];
        const filtered = catalog.filter(u => {
            const matchFac = this.unitFactionFilter === 'All' || u.faction === this.unitFactionFilter;
            const matchCost = this.unitCostFilter === 0 || u.cost === this.unitCostFilter;
            return matchFac && matchCost;
        });

        for (const unit of filtered) {
            const card = document.createElement('div');
            const borderClr = this.getFrameColor(unit.cost);
            const normalized = unit.name.toLowerCase().replace(/\s+/g, '_');

            card.style.backgroundColor = '#0f172a';
            card.style.border = `2px solid ${borderClr}`;
            card.style.borderRadius = '12px';
            card.style.padding = '14px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '10px';

            const skillDesc = unit.skill ? unit.skill.desc : 'No skill';
            const manaInfo = unit.skill ? unit.skill.manaInfo : '';

            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:bold;font-size:15px;color:#f1f5f9;">${unit.name}</div>
                    <div style="font-size:12px;color:#fbbf24;font-weight:bold;">🪙 ${unit.cost}g</div>
                </div>

                <div style="display:flex;justify-content:center;align-items:center;height:90px;background:#1e293b;border-radius:8px;overflow:hidden;">
                    <img src="/assets/concepts/${normalized}.png" style="height:100%;object-fit:contain;" onerror="this.style.display='none';"/>
                </div>

                <div style="font-size:11px;color:#94a3b8;">
                    <div><b>Faction:</b> ${unit.faction}</div>
                    <div><b>Traits:</b> ${unit.traits.join(', ')}</div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;color:#cbd5e1;font-family:monospace;background:rgba(30,41,59,0.5);padding:6px;border-radius:6px;">
                    <div>HP: ${unit.baseStats.hp}</div>
                    <div>ATK: ${unit.baseStats.atk}</div>
                    <div>DEF: ${unit.baseStats.def}</div>
                    <div>MDEF: ${unit.baseStats.mdef}</div>
                </div>

                <div style="font-size:11px;background:rgba(30,41,59,0.8);padding:8px;border-radius:6px;border:1px solid #334155;">
                    <div style="font-weight:bold;color:#f59e0b;margin-bottom:2px;">✨ ${unit.skill ? unit.skill.name : 'Basic'} <span style="color:#60a5fa;font-size:10px;">${manaInfo}</span></div>
                    <div style="color:#cbd5e1;line-height:1.3;">${skillDesc}</div>
                </div>
            `;
            grid.appendChild(card);
        }

        wrapper.appendChild(grid);
        container.appendChild(wrapper);

        // Bind filter clicks
        filterBar.querySelectorAll('.fac-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fac = (e.target as HTMLElement).getAttribute('data-fac');
                if (fac) {
                    this.unitFactionFilter = fac;
                    this.renderCompendiumContent();
                }
            });
        });

        filterBar.querySelectorAll('.cost-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cost = parseInt((e.target as HTMLElement).getAttribute('data-cost') || '0');
                this.unitCostFilter = cost;
                this.renderCompendiumContent();
            });
        });
    }

    private renderSynergiesCatalog(container: HTMLDivElement): void {
        const originsList = [
            'Human', 'Ancient', 'Noble', 'Dwarven Forge', 'Demonic Pact',
            'Magic Tower', 'Sylvan Elves', 'Necropolis Undead', 'Draconic Zealots',
            'Elemental Fairy', 'Architect', 'Mercenary'
        ];

        const classesList = [
            'Royal Guard', 'Plague Alchemist', 'Chrono Scholar', 'Gladiators',
            'Rogues', 'High Clerics', 'Cavalry Knight', 'Beast Tamer',
            'Runesmith', 'Card Gamblers', 'Doom Harbingers', 'Vanguard Berserkers',
            'Rangers'
        ];

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '16px';

        // 1. Control bar with Dropdown selector & Live search input
        const filterBar = document.createElement('div');
        filterBar.style.display = 'flex';
        filterBar.style.gap = '16px';
        filterBar.style.alignItems = 'center';
        filterBar.style.flexWrap = 'wrap';

        const selectLabel = document.createElement('span');
        selectLabel.style.fontSize = '13px';
        selectLabel.style.fontWeight = 'bold';
        selectLabel.style.color = '#fbbf24';
        selectLabel.innerText = 'Category:';

        const categorySelect = document.createElement('select');
        categorySelect.id = 'synergy-category-select';
        categorySelect.style.padding = '8px 14px';
        categorySelect.style.backgroundColor = '#1e293b';
        categorySelect.style.border = '1px solid rgba(251, 191, 36, 0.4)';
        categorySelect.style.borderRadius = '8px';
        categorySelect.style.color = '#ffffff';
        categorySelect.style.fontWeight = 'bold';
        categorySelect.style.fontSize = '13px';
        categorySelect.style.cursor = 'pointer';

        categorySelect.innerHTML = `
            <option value="all" ${this.synergyCategoryFilter === 'all' ? 'selected' : ''}>All Synergies (25)</option>
            <option value="origins" ${this.synergyCategoryFilter === 'origins' ? 'selected' : ''}>Origins (12)</option>
            <option value="classes" ${this.synergyCategoryFilter === 'classes' ? 'selected' : ''}>Classes (13)</option>
        `;

        categorySelect.onchange = (e) => {
            this.synergyCategoryFilter = (e.target as HTMLSelectElement).value as any;
            this.renderCompendiumContent();
        };

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'synergy-search-input';
        searchInput.placeholder = '🔍 Search synergy name or threshold effect...';
        searchInput.value = this.synergySearchQuery;
        searchInput.style.padding = '8px 14px';
        searchInput.style.backgroundColor = '#1e293b';
        searchInput.style.border = '1px solid #475569';
        searchInput.style.borderRadius = '8px';
        searchInput.style.color = '#ffffff';
        searchInput.style.fontSize = '13px';
        searchInput.style.flex = '1';
        searchInput.style.minWidth = '220px';

        searchInput.oninput = (e) => {
            this.synergySearchQuery = (e.target as HTMLInputElement).value;
            this.renderCompendiumContent();
        };

        filterBar.appendChild(selectLabel);
        filterBar.appendChild(categorySelect);
        filterBar.appendChild(searchInput);
        wrapper.appendChild(filterBar);

        // 2. Synergy Cards Grid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        grid.style.gap = '16px';

        const catalog = synergiesCatalogRaw as Record<string, { desc: string; thresholds: { req: number; desc: string }[] }>;
        const searchLower = this.synergySearchQuery.toLowerCase().trim();

        for (const [traitName, data] of Object.entries(catalog)) {
            const isOrigin = originsList.includes(traitName);
            const isClass = classesList.includes(traitName);
            const categoryType = isOrigin ? 'Origin' : 'Class';

            // Filter check: category dropdown
            if (this.synergyCategoryFilter === 'origins' && !isOrigin) continue;
            if (this.synergyCategoryFilter === 'classes' && !isClass) continue;

            // Filter check: live search query
            if (searchLower !== '') {
                const nameMatch = traitName.toLowerCase().includes(searchLower);
                const descMatch = data.desc.toLowerCase().includes(searchLower);
                const thresholdMatch = data.thresholds.some(t => t.desc.toLowerCase().includes(searchLower));
                if (!nameMatch && !descMatch && !thresholdMatch) continue;
            }

            const card = document.createElement('div');
            card.style.backgroundColor = '#0f172a';
            card.style.border = isOrigin ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(139, 92, 246, 0.4)';
            card.style.borderRadius = '12px';
            card.style.padding = '16px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '10px';

            const badgeBg = isOrigin ? '#0369a1' : '#6d28d9';
            const categoryBadge = `<span style="font-size:10px; background:${badgeBg}; color:#fff; padding:2px 8px; border-radius:10px; text-transform:uppercase; letter-spacing:0.05em; font-weight:bold;">${categoryType}</span>`;

            let thresholdHtml = '';
            for (const t of data.thresholds) {
                thresholdHtml += `
                    <div style="font-size:12px;color:#cbd5e1;background:rgba(30,41,59,0.6);padding:6px 10px;border-radius:6px;line-height:1.4;">
                        <span style="font-weight:bold;color:#fbbf24;">(${t.req}):</span> ${t.desc}
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:17px;font-weight:bold;color:#fbbf24;display:flex;align-items:center;gap:8px;">
                        <span>${isOrigin ? '🛡️' : '⚔️'}</span> ${traitName}
                    </div>
                    ${categoryBadge}
                </div>
                <div style="font-size:12px;color:#94a3b8;line-height:1.4;">${data.desc}</div>
                <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">
                    <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;">Threshold Details</div>
                    ${thresholdHtml}
                </div>
            `;
            grid.appendChild(card);
        }

        wrapper.appendChild(grid);
        container.appendChild(wrapper);

        // Keep search input focused if user was typing
        if (searchLower !== '') {
            const el = document.getElementById('synergy-search-input') as HTMLInputElement | null;
            if (el) {
                el.focus();
                el.setSelectionRange(el.value.length, el.value.length);
            }
        }
    }

    private renderItemsCatalog(container: HTMLDivElement): void {
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        grid.style.gap = '16px';

        const recipes = recipesRaw as any[];

        for (const recipe of recipes) {
            const card = document.createElement('div');
            card.style.backgroundColor = '#0f172a';
            card.style.border = '1px solid #f59e0b';
            card.style.borderRadius = '12px';
            card.style.padding = '16px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '8px';

            const statsList = Object.entries(recipe.stats).map(([k, v]) => `<div>✨ ${k}: +${v}</div>`).join('');

            card.innerHTML = `
                <div style="font-size:16px;font-weight:bold;color:#fbbf24;">🎁 ${recipe.result}</div>
                <div style="font-size:11px;color:#94a3b8;background:rgba(30,41,59,0.8);padding:6px 10px;border-radius:6px;">
                    <b>Recipe:</b> ${recipe.componentA} + ${recipe.componentB}
                </div>
                <div style="font-size:12px;color:#a3e635;display:flex;flex-direction:column;gap:4px;font-family:monospace;margin-top:4px;">
                    ${statsList}
                </div>
            `;
            grid.appendChild(card);
        }

        container.appendChild(grid);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. TOP GAMEPLAY MENU BUTTON BUILDER
    // ─────────────────────────────────────────────────────────────
    private buildTopMenuButton(): void {
        this.topMenuBtnEl = document.createElement('button');
        this.topMenuBtnEl.id = 'top-lobby-menu-btn';
        this.topMenuBtnEl.innerText = '⚙️ Menu';
        Object.assign(this.topMenuBtnEl.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '8px 16px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid #334155',
            color: '#ffffff',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '13px',
            fontFamily: 'sans-serif',
            cursor: 'pointer',
            zIndex: '4000',
            display: 'none'
        });

        this.topMenuBtnEl.onclick = () => {
            const confirmQuit = confirm('Return to Pre-Game Lobby?');
            if (confirmQuit) {
                this.returnToLobby();
            }
        };

        this.container.appendChild(this.topMenuBtnEl);
    }
}
