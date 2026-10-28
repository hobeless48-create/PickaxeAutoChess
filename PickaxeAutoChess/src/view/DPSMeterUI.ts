// src/view/DPSMeterUI.ts

export interface UnitCombatStats {
    id: string;
    name: string;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    isPlayer: boolean;
}

export class DPSMeterUI {
    private container: HTMLElement;
    private isVisible: boolean = false;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'dps-meter-sidebar';
        this.container.style.position = 'fixed';
        this.container.style.right = '16px';
        this.container.style.top = '120px';
        this.container.style.width = '240px';
        this.container.style.background = 'rgba(15, 23, 42, 0.85)';
        this.container.style.backdropFilter = 'blur(12px)';
        this.container.style.border = '1px solid rgba(255, 255, 255, 0.15)';
        this.container.style.borderRadius = '12px';
        this.container.style.padding = '12px';
        this.container.style.color = '#f8fafc';
        this.container.style.fontFamily = 'system-ui, sans-serif';
        this.container.style.fontSize = '12px';
        this.container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
        this.container.style.zIndex = '999';
        this.container.style.display = 'none';

        document.body.appendChild(this.container);
    }

    public show(): void {
        this.isVisible = true;
        this.container.style.display = 'block';
    }

    public hide(): void {
        this.isVisible = false;
        this.container.style.display = 'none';
    }

    /**
     * Updates real-time DPS / Damage / Healing bar charts.
     */
    public update(stats: UnitCombatStats[]): void {
        if (!this.isVisible || !stats || stats.length === 0) return;

        const maxDamage = Math.max(...stats.map(s => s.damageDealt), 1);

        let html = `
            <div style="font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; display: flex; justify-content: space-between;">
                <span>UNIT COMBAT DPS</span>
                <span style="color: #38bdf8;">LIVE</span>
            </div>
        `;

        stats.slice(0, 6).forEach(s => {
            const pct = Math.min(100, Math.round((s.damageDealt / maxDamage) * 100));
            const barColor = s.isPlayer ? '#3b82f6' : '#ef4444';

            html += `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; margin-bottom: 2px;">
                        <span>${s.name}</span>
                        <span style="color: #f59e0b;">${s.damageDealt.toLocaleString()}</span>
                    </div>
                    <div style="height: 6px; width: 100%; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${pct}%; background: ${barColor}; transition: width 0.2s ease;"></div>
                    </div>
                </div>
            `;
        });

        this.container.innerHTML = html;
    }
}
