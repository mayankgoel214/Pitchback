import { describe, expect, it } from 'vitest';
import {
  BUYER_STATES,
  callEnds,
  HOSTILE_PATIENCE,
  rank,
  transition,
  type Transition,
  type TurnSignals,
} from '@/lib/sim/buyer-state';

const base: TurnSignals = {
  proposed: 'held',
  askedQuestion: true,
  acknowledgedObjection: true,
  monologued: false,
  askedForNextStep: false,
};

const signals = (over: Partial<TurnSignals> = {}): TurnSignals => ({ ...base, ...over });

describe('the ladder', () => {
  it('has exactly seven states, ordered least to most receptive', () => {
    expect(BUYER_STATES).toHaveLength(7);
    expect(BUYER_STATES[0]).toBe('hostile');
    expect(BUYER_STATES[6]).toBe('committed');
    expect(rank('skeptical')).toBeLessThan(rank('curious'));
  });
});

describe('movement is capped at one step', () => {
  it('warms by exactly one', () => {
    expect(transition('neutral', signals({ proposed: 'warmed' })).to).toBe('curious');
  });

  it('cools by exactly one', () => {
    expect(transition('curious', signals({ proposed: 'cooled' })).to).toBe('neutral');
  });

  it('holds when the buyer is unmoved', () => {
    expect(transition('skeptical', signals()).to).toBe('skeptical');
  });

  it('cannot cool below hostile', () => {
    expect(transition('hostile', signals({ proposed: 'cooled' })).to).toBe('hostile');
  });

  it('cannot warm above committed', () => {
    const t = transition('committed', signals({ proposed: 'warmed', askedForNextStep: true }));
    expect(t.to).toBe('committed');
  });
});

describe('a monologue always costs a step', () => {
  it('overrides a warming the model proposed, and says it constrained it', () => {
    const t = transition('curious', signals({ proposed: 'warmed', monologued: true }));
    expect(t.to).toBe('neutral');
    expect(t.constrained).toBe(true);
    expect(t.trigger).toMatch(/monologued/);
  });

  it('is not marked constrained when the model already wanted to cool', () => {
    const t = transition('curious', signals({ proposed: 'cooled', monologued: true }));
    expect(t.to).toBe('neutral');
    expect(t.constrained).toBe(false);
  });
});

describe('objections must be acknowledged before they are answered', () => {
  it('refuses to warm a skeptical buyer who was talked past', () => {
    const t = transition(
      'skeptical',
      signals({ proposed: 'warmed', acknowledgedObjection: false }),
    );
    expect(t.to).toBe('skeptical');
    expect(t.constrained).toBe(true);
  });

  it('warms a skeptical buyer who was acknowledged', () => {
    const t = transition('skeptical', signals({ proposed: 'warmed' }));
    expect(t.to).toBe('neutral');
    expect(t.constrained).toBe(false);
  });
});

describe('warming past neutral requires a question', () => {
  it('will not warm a neutral buyer who was only talked at', () => {
    const t = transition('neutral', signals({ proposed: 'warmed', askedQuestion: false }));
    expect(t.to).toBe('neutral');
    expect(t.constrained).toBe(true);
    expect(t.trigger).toMatch(/no question/);
  });

  it('still allows warming below neutral without one', () => {
    const t = transition('dismissive', signals({ proposed: 'warmed', askedQuestion: false }));
    expect(t.to).toBe('skeptical');
  });
});

describe('commitment requires something to commit to', () => {
  it('holds at interested when no next step was proposed', () => {
    const t = transition('interested', signals({ proposed: 'warmed', askedForNextStep: false }));
    expect(t.to).toBe('interested');
    expect(t.constrained).toBe(true);
    expect(t.trigger).toMatch(/next step/);
  });

  it('reaches committed once a next step is on the table', () => {
    const t = transition('interested', signals({ proposed: 'warmed', askedForNextStep: true }));
    expect(t.to).toBe('committed');
    expect(t.constrained).toBe(false);
  });

  it('is the only route to committed — no leap from hostile', () => {
    const state: (typeof BUYER_STATES)[number] = 'hostile';
    const t = transition(state, signals({ proposed: 'warmed', askedForNextStep: true }));
    expect(t.to).toBe('dismissive');
    expect(t.to).not.toBe('committed');
  });
});

describe('the call ends deterministically', () => {
  const at = (to: (typeof BUYER_STATES)[number]): Transition => ({
    from: to,
    to,
    trigger: 'test',
    constrained: false,
  });

  it('does not end on an empty history', () => {
    expect(callEnds([])).toBeNull();
  });

  it('ends when the buyer commits', () => {
    expect(callEnds([at('neutral'), at('committed')])).toEqual({ reason: 'committed' });
  });

  it('hangs up after the patience limit of consecutive hostile turns', () => {
    const hostile = Array.from({ length: HOSTILE_PATIENCE }, () => at('hostile'));
    expect(callEnds(hostile)).toEqual({ reason: 'hung_up' });
  });

  it('does not hang up one turn early', () => {
    const hostile = Array.from({ length: HOSTILE_PATIENCE - 1 }, () => at('hostile'));
    expect(callEnds(hostile)).toBeNull();
  });

  it('does not hang up when the buyer recovered in between', () => {
    expect(callEnds([at('hostile'), at('dismissive'), at('hostile')])).toBeNull();
  });
});
