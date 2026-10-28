// src/core/tick/TickManager.ts

export class TickManager {
    private tickRateHz: number;
    private tickMs: number;
    private lastTick: number = 0;
    private isRunning: boolean = false;
    private tickCount: number = 0;
    private onTickCallbacks: Array<(tickCount: number) => void> = [];
    private timerId: any = null;

    constructor(tickRateHz: number = 20) {
        this.tickRateHz = tickRateHz;
        this.tickMs = 1000 / this.tickRateHz;
    }

    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTick = Date.now();
        this.tickCount = 0;
        this.loop();
    }

    public stop(): void {
        this.isRunning = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    public onTick(callback: (tickCount: number) => void): void {
        this.onTickCallbacks.push(callback);
    }

    public getTickCount(): number {
        return this.tickCount;
    }

    private loop = (): void => {
        if (!this.isRunning) return;

        const now = Date.now();
        const delta = now - this.lastTick;

        if (delta >= this.tickMs) {
            // Drift correction
            this.lastTick = now - (delta % this.tickMs);
            this.tickCount++;
            
            // Execute tick updates
            for (const cb of this.onTickCallbacks) {
                cb(this.tickCount);
            }
        }

        // Use setTimeout to yield execution, keeping accuracy high via drift corrected timestamps
        const nextDelay = Math.max(0, this.tickMs - (Date.now() - this.lastTick));
        this.timerId = setTimeout(this.loop, nextDelay);
    };
}
