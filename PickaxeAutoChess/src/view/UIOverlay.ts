// src/view/UIOverlay.ts

import * as THREE from 'three';

export class UIOverlay {
    private container: HTMLElement;
    private bars: Map<string, HTMLDivElement> = new Map();

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public createHPBar(unitId: string): void {
        const barWrapper = document.createElement('div');
        barWrapper.style.position = 'absolute';
        barWrapper.style.display = 'flex';
        barWrapper.style.flexDirection = 'column';
        barWrapper.style.gap = '2px';
        barWrapper.style.width = '64px';
        barWrapper.style.pointerEvents = 'none';

        // HP Container
        const hpContainer = document.createElement('div');
        hpContainer.style.width = '100%';
        hpContainer.style.height = '6px';
        hpContainer.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
        hpContainer.style.borderRadius = '4px';
        hpContainer.style.border = '1px solid rgba(0, 0, 0, 0.8)';
        hpContainer.style.overflow = 'hidden';
        hpContainer.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.4)';

        const hpFill = document.createElement('div');
        hpFill.className = 'hp-fill';
        hpFill.style.width = '100%';
        hpFill.style.height = '100%';
        hpFill.style.background = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
        hpFill.style.borderRadius = '3px';
        hpFill.style.transition = 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

        hpContainer.appendChild(hpFill);

        // Mana Container
        const manaContainer = document.createElement('div');
        manaContainer.style.width = '100%';
        manaContainer.style.height = '4px';
        manaContainer.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
        manaContainer.style.borderRadius = '3px';
        manaContainer.style.border = '1px solid rgba(0, 0, 0, 0.8)';
        manaContainer.style.overflow = 'hidden';
        manaContainer.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.4)';

        const manaFill = document.createElement('div');
        manaFill.className = 'mana-fill';
        manaFill.style.width = '0%';
        manaFill.style.height = '100%';
        manaFill.style.background = 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)';
        manaFill.style.borderRadius = '2px';
        manaFill.style.transition = 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

        manaContainer.appendChild(manaFill);

        barWrapper.appendChild(hpContainer);
        barWrapper.appendChild(manaContainer);
        this.container.appendChild(barWrapper);
        this.bars.set(unitId, barWrapper);
    }

    public updateHPBar(
        unitId: string,
        currentHP: number,
        maxHP: number,
        worldPosition: THREE.Vector3,
        camera: THREE.Camera,
        currentMana: number = 0,
        maxMana: number = 100,
        unit?: any
    ): void {
        const bar = this.bars.get(unitId);
        if (!bar) return;

        const pos = worldPosition.clone();
        pos.y += 1.5;
        pos.project(camera);

        const x = (pos.x * .5 + .5) * window.innerWidth;
        const y = (-(pos.y * .5) + .5) * window.innerHeight;

        bar.style.left = `${x - 32}px`;
        bar.style.top = `${y}px`;

        const hpFill = bar.querySelector('.hp-fill') as HTMLDivElement;
        if (hpFill) {
            const pct = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
            hpFill.style.width = `${pct}%`;
        }

        const manaFill = bar.querySelector('.mana-fill') as HTMLDivElement;
        if (manaFill) {
            const pct = Math.max(0, Math.min(100, (currentMana / maxMana) * 100));
            manaFill.style.width = `${pct}%`;
        }

        // Render Construction Status Badge for under-construction facilities
        let badge = bar.querySelector('.construction-badge') as HTMLDivElement;
        if (unit && unit.isFacility && unit.constructionRoundsRemaining > 0) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'construction-badge';
                badge.style.fontSize = '10px';
                badge.style.color = '#fbbf24';
                badge.style.fontWeight = 'bold';
                badge.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
                badge.style.backdropFilter = 'blur(8px)';
                (badge.style as any).webkitBackdropFilter = 'blur(8px)';
                badge.style.padding = '2px 6px';
                badge.style.borderRadius = '6px';
                badge.style.border = '1px solid rgba(251, 191, 36, 0.5)';
                badge.style.marginBottom = '2px';
                badge.style.textAlign = 'center';
                badge.style.fontFamily = "'Inter', system-ui, sans-serif";
                badge.style.whiteSpace = 'nowrap';
                badge.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.4)';
                bar.insertBefore(badge, bar.firstChild);
            }
            const total = unit.totalConstructionRounds || 2;
            badge.innerText = `🏗️ ${unit.constructionRoundsRemaining}/${total} rounds`;
            badge.style.display = 'block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    public removeHPBar(unitId: string): void {
        const bar = this.bars.get(unitId);
        if (bar) {
            if (bar.parentElement) {
                bar.parentElement.removeChild(bar);
            }
            this.bars.delete(unitId);
        }
    }

    public removeAllHPBars(): void {
        for (const bar of this.bars.values()) {
            if (bar.parentElement) {
                bar.parentElement.removeChild(bar);
            }
        }
        this.bars.clear();
    }

    public showRoundAnnouncement(stage: number, round: number, phase: string): void {
        const announcement = document.createElement('div');
        announcement.className = 'round-announcement-banner';

        let phaseText = 'Preparation Phase';
        let phaseColor = '#38bdf8';
        if (phase === 'Combat') {
            phaseText = '⚔️ COMBAT PHASE';
            phaseColor = '#ef4444';
        } else if (phase === 'Resolution') {
            phaseText = 'Round Resolution';
            phaseColor = '#fbbf24';
        } else if (phase === 'Matchmaking') {
            phaseText = 'Matchmaking...';
            phaseColor = '#a855f7';
        }

        announcement.innerHTML = `
            <div style="font-size:12px;font-weight:800;letter-spacing:3px;color:#94a3b8;text-transform:uppercase;">
                STAGE ${stage} - ROUND ${round}
            </div>
            <div style="font-size:26px;font-weight:900;letter-spacing:1px;color:${phaseColor};text-shadow:0 0 16px ${phaseColor}80;">
                ${phaseText}
            </div>
        `;

        this.container.appendChild(announcement);
        setTimeout(() => {
            if (announcement.parentElement) {
                announcement.parentElement.removeChild(announcement);
            }
        }, 2200);
    }

    public showVictoryDefeatBanner(isVictory: boolean, detailMsg?: string): void {
        const banner = document.createElement('div');
        banner.className = isVictory ? 'outcome-banner-victory' : 'outcome-banner-defeat';

        const mainTitle = isVictory ? '🏆 VICTORY!' : '💀 DEFEAT';
        const titleColor = isVictory ? '#34d399' : '#f87171';
        const subMsg = detailMsg || (isVictory ? 'Enemies eliminated!' : 'Your tactical defenses collapsed');

        banner.innerHTML = `
            <div style="font-size:32px;font-weight:900;letter-spacing:2px;color:${titleColor};text-shadow:0 0 20px ${titleColor}80;">
                ${mainTitle}
            </div>
            <div style="font-size:13px;font-weight:600;color:#f1f5f9;letter-spacing:0.5px;">
                ${subMsg}
            </div>
        `;

        this.container.appendChild(banner);
        setTimeout(() => {
            if (banner.parentElement) {
                banner.parentElement.removeChild(banner);
            }
        }, 2500);
    }
}
