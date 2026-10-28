// src/core/hex/HexGrid.ts

export interface Hex {
    q: number;
    r: number;
}

export interface Cube {
    q: number;
    r: number;
    s: number;
}

export function axialToCube(hex: Hex): Cube {
    return { q: hex.q, r: hex.r, s: -hex.q - hex.r };
}

export function cubeToAxial(cube: Cube): Hex {
    return { q: cube.q, r: cube.r };
}

// O(1) Manhattan Hex Distance
export function hexDistance(a: Hex, b: Hex): number {
    const ac = axialToCube(a);
    const bc = axialToCube(b);
    return Math.max(
        Math.abs(ac.q - bc.q),
        Math.abs(ac.r - bc.r),
        Math.abs(ac.s - bc.s)
    );
}

// Returns all 6 neighbors of a hex
export const HEX_DIRECTIONS: Hex[] = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

export function hexNeighbors(hex: Hex): Hex[] {
    return HEX_DIRECTIONS.map(d => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

// Snapping fractional float coordinates to closest hex integer
export function cubeRound(frac: Cube): Cube {
    let q = Math.round(frac.q);
    let r = Math.round(frac.r);
    let s = Math.round(frac.s);

    const qDiff = Math.abs(q - frac.q);
    const rDiff = Math.abs(r - frac.r);
    const sDiff = Math.abs(s - frac.s);

    if (qDiff > rDiff && qDiff > sDiff) {
        q = -r - s;
    } else if (rDiff > sDiff) {
        r = -q - s;
    } else {
        s = -q - r;
    }

    return { q, r, s };
}

export function hexRound(hexFractional: Hex): Hex {
    const cube = axialToCube(hexFractional);
    const roundedCube = cubeRound(cube);
    return cubeToAxial(roundedCube);
}

// Translate to Flat-top hexagon world coordinates on XZ plane
// Uses "offset column" layout (same as TFT): columns stagger up/down
export const HEX_SIZE = 0.9; // radius (center-to-vertex) in world units

// Flat-top hex dimensions:
//   col width  = sqrt(3) * size
//   row height = 3/2 * size
//   odd columns shift up by half row height (0.5 * size)
export function hexToWorld(hex: Hex): { x: number; z: number } {
    const colWidth  = Math.sqrt(3) * HEX_SIZE;  // horizontal spacing between columns
    const rowHeight = 1.5 * HEX_SIZE;            // vertical spacing between rows
    const x = hex.q * colWidth;
    // Odd columns shift upward (negative z) by half a rowHeight
    const z = hex.r * rowHeight + (hex.q % 2 !== 0 ? -rowHeight * 0.5 : 0);
    return { x, z };
}
