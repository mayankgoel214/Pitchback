/**
 * Buyer receptivity state machine.
 *
 * The LLM plays the buyer, but it does not get to decide where the buyer
 * lands. It proposes a direction (`warmed` / `held` / `cooled`) and this
 * machine decides whether that move is legal. Without the constraint the
 * model happily jumps a hostile prospect straight to "sounds great, send me
 * a contract" the moment a rep says something pleasant, which makes the
 * practice worthless.
 */

export const BUYER_STATES = [
  'hostile',
  'dismissive',
  'skeptical',
  'neutral',
  'curious',
  'interested',
  'committed',
] as const;

export type BuyerState = (typeof BUYER_STATES)[number];

/** Position on the ladder. Higher is more receptive. */
export function rank(state: BuyerState): number {
  return BUYER_STATES.indexOf(state);
}

export type Direction = 'warmed' | 'held' | 'cooled';

export interface TurnSignals {
  /** The direction the model says the buyer moved, from its own reply. */
  proposed: Direction;
  /** Rep asked at least one question this turn. */
  askedQuestion: boolean;
  /** Rep named the buyer's objection before answering it. */
  acknowledgedObjection: boolean;
  /** Rep's turn ran long enough to read as a monologue. */
  monologued: boolean;
  /** Rep asked for a specific, time-bound next step. */
  askedForNextStep: boolean;
}

export interface Transition {
  from: BuyerState;
  to: BuyerState;
  /** Why the machine landed here — surfaced in the UI and the transcript. */
  trigger: string;
  /** True when the machine overrode what the model proposed. */
  constrained: boolean;
}

/** A turn this long reads as a pitch rather than a conversation. */
export const MONOLOGUE_WORDS = 120;

/**
 * Buyers who are still hostile after this many turns hang up. Bounds the
 * demo, and it is also true to life.
 */
export const HOSTILE_PATIENCE = 3;

function step(state: BuyerState, by: number): BuyerState {
  const i = Math.min(BUYER_STATES.length - 1, Math.max(0, rank(state) + by));
  return BUYER_STATES[i];
}

/**
 * Apply one rep turn to the buyer's state.
 *
 * Rules, in the order they are checked:
 *  1. A monologue always costs a step, whatever the model proposed. Talking
 *     over a buyer does not warm them up.
 *  2. Movement is capped at one step per turn in either direction.
 *  3. `committed` is unreachable unless the rep actually asked for a next
 *     step. A buyer cannot commit to something nobody proposed.
 *  4. Warming past `neutral` requires the rep to have asked a question at
 *     some point this turn — interest comes from being asked about, not
 *     from being talked at.
 *  5. Answering an objection without acknowledging it cannot warm the buyer.
 */
export function transition(from: BuyerState, signals: TurnSignals): Transition {
  const {
    proposed,
    askedQuestion,
    acknowledgedObjection,
    monologued,
    askedForNextStep,
  } = signals;

  if (monologued) {
    return {
      from,
      to: step(from, -1),
      trigger: `rep monologued (over ${MONOLOGUE_WORDS} words)`,
      constrained: proposed !== 'cooled',
    };
  }

  if (proposed === 'cooled') {
    return { from, to: step(from, -1), trigger: 'buyer cooled', constrained: false };
  }

  if (proposed === 'held') {
    return { from, to: from, trigger: 'buyer unmoved', constrained: false };
  }

  // proposed === 'warmed' from here down.

  if (from === 'skeptical' && !acknowledgedObjection) {
    return {
      from,
      to: from,
      trigger: 'objection answered without being acknowledged',
      constrained: true,
    };
  }

  if (rank(from) >= rank('neutral') && !askedQuestion) {
    return {
      from,
      to: from,
      trigger: 'no question asked — buyer has nothing to warm to',
      constrained: true,
    };
  }

  const next = step(from, 1);

  if (next === 'committed' && !askedForNextStep) {
    return {
      from,
      to: 'interested',
      trigger: 'no next step proposed — buyer cannot commit to nothing',
      constrained: true,
    };
  }

  return { from, to: next, trigger: 'buyer warmed', constrained: false };
}

/**
 * Whether the buyer ends the call. Returns a reason, or null to continue.
 * Never random — a caller can reproduce any ending from the state history.
 */
export function callEnds(
  history: Transition[],
): { reason: 'hung_up' | 'committed' } | null {
  const last = history[history.length - 1];
  if (!last) return null;

  if (last.to === 'committed') return { reason: 'committed' };

  const trailing = history.slice(-HOSTILE_PATIENCE);
  if (
    trailing.length === HOSTILE_PATIENCE &&
    trailing.every((t) => t.to === 'hostile')
  ) {
    return { reason: 'hung_up' };
  }

  return null;
}
