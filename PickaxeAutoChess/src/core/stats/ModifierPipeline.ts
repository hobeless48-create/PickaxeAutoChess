// src/core/stats/ModifierPipeline.ts

export interface Modifier {
    id: string;
    source: 'item' | 'synergy' | 'skill' | 'debuff';
    type: 'flat' | 'percent';
    statType: string;
    value: number;
    duration: number; // remaining ticks, -1 = permanent
}

export function getActualStat(baseStat: number, modifiers: Modifier[], statType: string): number {
    const flats = modifiers.filter(m => m.statType === statType && m.type === 'flat');
    const percents = modifiers.filter(m => m.statType === statType && m.type === 'percent');

    const flatSum = flats.reduce((sum, m) => sum + m.value, 0);
    const percentSum = percents.reduce((sum, m) => sum + m.value, 0);

    // Formula: (Base + Sum(Flats)) * (1 + Sum(Percents) / 100)
    return (baseStat + flatSum) * (1 + percentSum / 100);
}
