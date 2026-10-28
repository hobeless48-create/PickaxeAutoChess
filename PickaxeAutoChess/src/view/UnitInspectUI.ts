import { BoardState } from '../core/board/BoardState';
import { Unit } from '../core/units/Unit';
import itemDescRaw from '../core/data/item_descriptions.json';

interface ItemInfo { desc: string; effect: string; color: string; tier: string; }
const itemDescs: Record<string, ItemInfo> = itemDescRaw as Record<string, ItemInfo>;

export class UnitInspectUI {
    private container: HTMLElement;
    private panel: HTMLDivElement;
    private boardState: BoardState;
    private currentUnitId: string | null = null;
    private tooltip!: HTMLDivElement;

    constructor(container: HTMLElement, boardState: BoardState) {
        this.container = container;
        this.boardState = boardState;

        this.panel = document.createElement('div');
        this.panel.style.position = 'absolute';
        this.panel.style.right = '20px';
        this.panel.style.top = '50%';
        this.panel.style.transform = 'translateY(-50%)';
        this.panel.style.width = '260px';
        this.panel.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
        this.panel.style.backdropFilter = 'blur(16px)';
        (this.panel.style as any).webkitBackdropFilter = 'blur(16px)';
        this.panel.style.borderRadius = '16px';
        this.panel.style.padding = '16px';
        this.panel.style.color = '#ffffff';
        this.panel.style.fontFamily = "'Inter', system-ui, sans-serif";
        this.panel.style.border = '1px solid rgba(56, 189, 248, 0.3)';
        this.panel.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6)';
        this.panel.style.display = 'none'; // hidden initially
        this.panel.style.zIndex = '1000';
        this.panel.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

        this.container.appendChild(this.panel);

        this.tooltip = document.createElement('div');
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.display = 'none';
        this.tooltip.style.zIndex = '2000';
        this.tooltip.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
        this.tooltip.style.backdropFilter = 'blur(16px)';
        (this.tooltip.style as any).webkitBackdropFilter = 'blur(16px)';
        this.tooltip.style.borderRadius = '10px';
        this.tooltip.style.padding = '10px 14px';
        this.tooltip.style.color = '#f1f5f9';
        this.tooltip.style.fontFamily = "'Inter', system-ui, sans-serif";
        this.tooltip.style.fontSize = '12px';
        this.tooltip.style.border = '1px solid rgba(251, 191, 36, 0.4)';
        this.tooltip.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.maxWidth = '240px';
        this.tooltip.style.lineHeight = '1.4';
        this.tooltip.style.borderTop = '3px solid #fbbf24';
        this.container.appendChild(this.tooltip);
    }

    public showUnit(unitId: string): void {
        const unit = this.boardState.getUnit(unitId);
        if (!unit) return;

        this.currentUnitId = unitId;
        this.render(unit);
        this.panel.style.display = 'flex';
        this.panel.style.flexDirection = 'column';
        this.panel.style.gap = '10px';
    }

    public hide(): void {
        this.currentUnitId = null;
        this.panel.style.display = 'none';
    }

    private showItemTooltip(itemName: string, x: number, y: number): void {
        const info = itemDescs[itemName];
        if (!info) return;
        const tierLabel = info.tier === 'completed' ? 'Completed Item' : 'Component';
        const tierColor = info.tier === 'completed' ? '#f59e0b' : '#94a3b8';
        this.tooltip.innerHTML =
            '<div style="font-weight:bold;font-size:13px;color:' + info.color + ';margin-bottom:4px;">' + itemName + '</div>' +
            '<div style="font-size:10px;color:' + tierColor + ';margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">' + tierLabel + '</div>' +
            '<div style="color:#cbd5e1;margin-bottom:6px;">' + info.desc + '</div>' +
            '<div style="color:#a3e635;font-weight:bold;font-family:monospace;font-size:11px;">' + info.effect + '</div>';
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = Math.min(x, window.innerWidth - 260) + 'px';
        this.tooltip.style.top = Math.min(y, window.innerHeight - 200) + 'px';
    }

    private hideItemTooltip(): void {
        this.tooltip.style.display = 'none';
    }

    private getFrameColor(cost: number): string {
        switch (cost) {
            case 1: return '#64748b'; // Gray
            case 2: return '#10b981'; // Green
            case 3: return '#3b82f6'; // Blue
            case 4: return '#8b5cf6'; // Purple
            case 5: return '#f59e0b'; // Gold
            default: return '#334155';
        }
    }

    private render(unit: Unit): void {
        const borderClr = this.getFrameColor(unit.cost);
        this.panel.style.border = `2px solid ${borderClr}`;

        let constructionOverlayHtml = '';
        if (unit.isFacility && unit.constructionRoundsRemaining > 0) {
            const currentStage = unit.totalConstructionRounds - unit.constructionRoundsRemaining + 1;
            const pct = Math.round(((currentStage - 1) / unit.totalConstructionRounds) * 100);
            constructionOverlayHtml = `
                <div style="background: linear-gradient(135deg, rgba(6,182,212,0.25), rgba(245,158,11,0.25)); border: 1px solid #06b6d4; border-radius: 10px; padding: 10px; margin-top: 4px; box-shadow: 0 0 15px rgba(6,182,212,0.3);">
                    <div style="font-weight: bold; font-size: 12px; color: #38bdf8; display: flex; align-items: center; justify-content: space-between;">
                        <span>🏗️ UNDER CONSTRUCTION</span>
                        <span style="font-size: 11px; color: #fbbf24; background: rgba(15,23,42,0.6); padding: 2px 6px; border-radius: 4px;">Stage ${currentStage}/${unit.totalConstructionRounds}</span>
                    </div>
                    <div style="font-size: 14px; font-weight: bold; color: #fbbf24; margin-top: 4px;">
                        ${unit.facilityName || unit.name}
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
                        Remaining Counter: <b style="color: #f59e0b;">${unit.constructionRoundsRemaining}/${unit.totalConstructionRounds} rounds remaining</b>
                    </div>
                    <div style="width: 100%; height: 6px; background-color: #1e293b; border-radius: 3px; overflow: hidden; margin-top: 6px;">
                        <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #06b6d4, #f59e0b); transition: width 0.3s;"></div>
                    </div>
                </div>
            `;
        }

        let skillHtml = `<div style="font-size:12px; color:#94a3b8; font-style:italic;">No skill data available</div>`;
        
        if (unit.skill) {
            const sk = unit.skill;
            skillHtml = `
                <div style="margin-top: 10px; padding: 10px; background-color: rgba(30, 41, 59, 0.8); border-radius: 8px; border: 1px solid #475569;">
                    <div style="font-weight: bold; font-size: 13px; color: #f59e0b; margin-bottom: 4px;">✨ ${sk.name}</div>
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">${sk.desc}</div>
                    <div style="font-size: 11px; color: #60a5fa; margin-top: 4px; font-weight: bold;">Mana: ${sk.manaInfo}</div>
                </div>
            `;
        }

        const normalized = unit.name.toLowerCase().replace(/\s+/g, '_');
        this.panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-size: 16px; font-weight: bold; color: #f1f5f9;">${unit.name}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                        ★${unit.starLevel} | ${unit.origin} | ${unit.traits.join(', ')}
                    </div>
                </div>
                <button id="close-inspect-btn" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">✕</button>
            </div>
            ${constructionOverlayHtml}
            
            <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 110px; border-radius: 8px; overflow: hidden; background-color: #0f172a; border: 1px solid #334155; margin-top: 6px;">
                <img src="/assets/concepts/${normalized}.png" style="height: 100%; object-fit: contain;" onerror="this.style.display='none';"/>
            </div>
            
            <!-- 3 Item Slots -->
            <div style="display: flex; gap: 8px; justify-content: center; margin-top: 6px;">
                <div class="inspect-item-slot" id="inspect-item-0" style="width: 48px; height: 28px; background-color: #0f172a; border: 1px dashed #475569; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; text-align: center; overflow: hidden; padding: 2px; font-family: sans-serif;">Empty</div>
                <div class="inspect-item-slot" id="inspect-item-1" style="width: 48px; height: 28px; background-color: #0f172a; border: 1px dashed #475569; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; text-align: center; overflow: hidden; padding: 2px; font-family: sans-serif;">Empty</div>
                <div class="inspect-item-slot" id="inspect-item-2" style="width: 48px; height: 28px; background-color: #0f172a; border: 1px dashed #475569; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; text-align: center; overflow: hidden; padding: 2px; font-family: sans-serif;">Empty</div>
            </div>
            
            <!-- HP Bar -->
            <div style="margin-top: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                    <span>HP</span>
                    <span id="inspect-hp-text">0 / 0</span>
                </div>
                <div style="width: 100%; height: 6px; background-color: #1e293b; border-radius: 3px; overflow: hidden;">
                    <div id="inspect-hp-bar" style="width: 0%; height: 100%; background-color: #ef4444; transition: width 0.2s;"></div>
                </div>
            </div>

            <!-- Mana Bar -->
            <div style="margin-top: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                    <span>Mana</span>
                    <span id="inspect-mana-text">0 / 0</span>
                </div>
                <div style="width: 100%; height: 6px; background-color: #1e293b; border-radius: 3px; overflow: hidden;">
                    <div id="inspect-mana-bar" style="width: 0%; height: 100%; background-color: #3b82f6; transition: width 0.2s;"></div>
                </div>
            </div>

            <!-- 10 Base Stats Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-top: 8px; font-size: 11px; color: #cbd5e1; font-family: monospace;">
                <div id="inspect-atk">⚔️ ATK: 0</div>
                <div id="inspect-ap">🔮 AP: 0</div>
                <div id="inspect-def">🛡️ DEF: 0</div>
                <div id="inspect-mdef">✨ MDEF: 0</div>
                <div id="inspect-as">⚡ AS: 0</div>
                <div>🏹 RNG: ${unit.attackRange}</div>
                <div id="inspect-regen">💧 REG: 0/s</div>
                <div id="inspect-crit">🎯 CRT: 10%</div>
                <div id="inspect-critdmg">💥 CDMG: 75%</div>
                <div id="inspect-reduction">🔰 RED: 0%</div>
                <div id="inspect-lifesteal">🧛 LIFE: 0%</div>
                <div id="inspect-amp">🔥 AMP: 0%</div>
            </div>

            ${skillHtml}
        `;

        const closeBtn = this.panel.querySelector('#close-inspect-btn') as HTMLButtonElement;
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.hide();
            };
        }

        this.updateDynamicValues(unit);
    }

    private updateDynamicValues(unit: Unit): void {
        const hpText = this.panel.querySelector('#inspect-hp-text') as HTMLElement | null;
        const hpBar = this.panel.querySelector('#inspect-hp-bar') as HTMLElement | null;
        const manaText = this.panel.querySelector('#inspect-mana-text') as HTMLElement | null;
        const manaBar = this.panel.querySelector('#inspect-mana-bar') as HTMLElement | null;

        const atkEl = this.panel.querySelector('#inspect-atk') as HTMLElement | null;
        const apEl = this.panel.querySelector('#inspect-ap') as HTMLElement | null;
        const defEl = this.panel.querySelector('#inspect-def') as HTMLElement | null;
        const mdefEl = this.panel.querySelector('#inspect-mdef') as HTMLElement | null;
        const asEl = this.panel.querySelector('#inspect-as') as HTMLElement | null;
        const regenEl = this.panel.querySelector('#inspect-regen') as HTMLElement | null;
        const critEl = this.panel.querySelector('#inspect-crit') as HTMLElement | null;
        const critDmgEl = this.panel.querySelector('#inspect-critdmg') as HTMLElement | null;
        const redEl = this.panel.querySelector('#inspect-reduction') as HTMLElement | null;
        const lifeEl = this.panel.querySelector('#inspect-lifesteal') as HTMLElement | null;
        const ampEl = this.panel.querySelector('#inspect-amp') as HTMLElement | null;

        // Render equipped items
        for (let i = 0; i < 3; i++) {
            const slot = this.panel.querySelector(`#inspect-item-${i}`) as HTMLElement | null;
            if (slot) {
                const item = unit.equippedItems[i];
                if (item) {
                    slot.innerText = item;
                    slot.style.border = '1px solid #f59e0b';
                    slot.style.backgroundColor = '#1e293b';
                    slot.style.color = '#fbbf24';
                    slot.style.fontWeight = 'bold';
                    slot.style.cursor = 'pointer';
                    slot.onmouseenter = (_e: any) => {
                        const rect = slot.getBoundingClientRect();
                        this.showItemTooltip(item, rect.right + 10, rect.top - 10);
                    };
                    slot.onmouseleave = () => this.hideItemTooltip();
                    slot.onmousemove = (e: any) => {
                        this.showItemTooltip(item, e.clientX + 12, e.clientY - 10);
                    };
                } else {
                    slot.innerText = 'Empty';
                    slot.style.border = '1px dashed #475569';
                    slot.style.backgroundColor = '#0f172a';
                    slot.style.color = '#94a3b8';
                    slot.style.fontWeight = 'normal';
                    slot.style.cursor = 'default';
                    slot.onmouseenter = null;
                    slot.onmouseleave = null;
                    slot.onmousemove = null;
                }
            }
        }

        if (hpText) hpText.innerText = `${Math.ceil(unit.currentHP)} / ${Math.ceil(unit.maxHP)}`;
        if (hpBar) {
            const hpPct = Math.max(0, Math.min(100, (unit.currentHP / unit.maxHP) * 100));
            hpBar.style.width = `${hpPct}%`;
        }
        if (manaText) manaText.innerText = `${Math.ceil(unit.mana)} / ${Math.ceil(unit.maxMana)}`;
        if (manaBar) {
            const manaPct = Math.max(0, Math.min(100, (unit.mana / unit.maxMana) * 100));
            manaBar.style.width = `${manaPct}%`;
        }

        if (atkEl) atkEl.innerText = `⚔️ ATK: ${unit.effectiveATK.toFixed(0)}`;
        if (apEl) apEl.innerText = `🔮 AP: ${unit.effectiveAP.toFixed(0)}`;
        if (defEl) defEl.innerText = `🛡️ DEF: ${unit.effectiveDEF.toFixed(0)}`;
        if (mdefEl) mdefEl.innerText = `✨ MDEF: ${unit.effectiveMDEF.toFixed(0)}`;
        if (asEl) asEl.innerText = `⚡ AS: ${unit.effectiveAttackSpeed.toFixed(2)}`;
        if (regenEl) regenEl.innerText = `💧 REG: ${unit.effectiveManaRegen.toFixed(0)}/s`;
        if (critEl) critEl.innerText = `🎯 CRT: ${(unit.effectiveCritChance * 100).toFixed(0)}%`;
        if (critDmgEl) critDmgEl.innerText = `💥 CDMG: ${(unit.effectiveCritDamage * 100).toFixed(0)}%`;
        if (redEl) redEl.innerText = `🔰 RED: ${(unit.effectiveDamageReduction * 100).toFixed(0)}%`;
        if (lifeEl) lifeEl.innerText = `🧛 LIFE: ${(unit.effectiveLifesteal * 100).toFixed(0)}%`;
        if (ampEl) ampEl.innerText = `🔥 AMP: ${(unit.effectiveFinalDamage * 100).toFixed(0)}%`;
    }

    public update(): void {
        if (this.currentUnitId) {
            const unit = this.boardState.getUnit(this.currentUnitId);
            if (unit && unit.state !== 'Dead') {
                this.updateDynamicValues(unit);
            } else {
                this.hide();
            }
        }
    }
}
