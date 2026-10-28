// src/core/fsm/UnitFSM.ts

export type FSMState = 'Idle' | 'Searching' | 'Moving' | 'Attacking' | 'Casting' | 'Stunned' | 'Dying' | 'Dead';

export const VALID_TRANSITIONS: Record<FSMState, FSMState[]> = {
    Idle:       ['Searching'],
    Searching:  ['Moving', 'Attacking'],
    Moving:     ['Searching', 'Attacking', 'Stunned'],
    Attacking:  ['Searching', 'Casting', 'Stunned', 'Dying'],
    Casting:    ['Attacking', 'Searching', 'Stunned', 'Dying'],
    Stunned:    ['Searching'],
    Dying:      ['Dead'],
    Dead:       [],
};

export interface FsmUnit {
    id: string;
    state: FSMState;
}

export function transitionUnit(unit: FsmUnit, next: FSMState): boolean {
    const allowed = VALID_TRANSITIONS[unit.state];
    if (!allowed.includes(next)) {
        console.error(`Invalid FSM Transition Attempted: ${unit.state} → ${next} on unit ${unit.id}`);
        return false;
    }
    unit.state = next;
    return true;
}
