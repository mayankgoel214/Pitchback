import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These cover the promises the AI layer makes about failure: that a bad
 * response from the model becomes a loud error rather than a plausible
 * default, and that a quote the rep never said never reaches the screen.
 *
 * A hardcoded fallback score is exactly what the old code did — it returned
 * 50 whenever the grader threw, logged as a "keyword fallback" that did not
 * exist, so a failed evaluation was indistinguishable from a real one.
 */

const create = vi.fn();

vi.mock('@/lib/ai/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/client')>('@/lib/ai/client');
  return {
    ...actual,
    openai: () => ({ chat: { completions: { create } } }),
  };
});

const { buyerTurn } = await import('@/lib/ai/buyer');
const { judgeNextStep } = await import('@/lib/ai/grade');
const { SCENARIOS } = await import('@/data/scenarios');

const scenario = SCENARIOS[0];
const reply = (content: string | null) => ({ choices: [{ message: { content } }] });

beforeEach(() => create.mockReset());

describe('buyerTurn refuses to invent a turn', () => {
  it('throws on an empty response rather than returning silence', async () => {
    create.mockResolvedValue(reply(null));
    await expect(buyerTurn(scenario, 'neutral', [], 'Hello?')).rejects.toThrow(/empty/i);
  });

  it('throws on unparseable JSON', async () => {
    create.mockResolvedValue(reply('not json at all'));
    await expect(buyerTurn(scenario, 'neutral', [], 'Hello?')).rejects.toThrow(/unparseable/i);
  });

  it('throws on a direction outside the three legal values', async () => {
    create.mockResolvedValue(reply(JSON.stringify({ reply: 'Fine.', direction: 'delighted' })));
    await expect(buyerTurn(scenario, 'neutral', [], 'Hello?')).rejects.toThrow(/invalid direction/i);
  });

  it('throws when the buyer said nothing', async () => {
    create.mockResolvedValue(reply(JSON.stringify({ reply: '   ', direction: 'held' })));
    await expect(buyerTurn(scenario, 'neutral', [], 'Hello?')).rejects.toThrow(/no reply/i);
  });

  it('does not fill in a missing direction with a safe-looking default', async () => {
    // The old evaluator returned a hardcoded 50 whenever the model failed,
    // so a broken grader and a mediocre rep produced the same number. The
    // equivalent here would be defaulting a missing direction to "held",
    // which would look entirely plausible in the state history.
    create.mockResolvedValue(reply(JSON.stringify({ reply: 'Go on.' })));
    await expect(buyerTurn(scenario, 'neutral', [], 'Hello?')).rejects.toThrow(
      /invalid direction/i,
    );
  });
});

describe('buyerTurn computes what should not be guessed', () => {
  const ok = (over: Record<string, unknown> = {}) =>
    reply(JSON.stringify({ reply: 'Go on.', direction: 'held', ...over }));

  it('counts the question itself rather than trusting the model', async () => {
    create.mockResolvedValue(ok());
    const t = await buyerTurn(scenario, 'neutral', [], 'What does that cost you today?');
    expect(t.signals.askedQuestion).toBe(true);
  });

  it('sees no question when there is none, whatever the model claims', async () => {
    create.mockResolvedValue(ok({ askedQuestion: true }));
    const t = await buyerTurn(scenario, 'neutral', [], 'We save people a lot of money.');
    expect(t.signals.askedQuestion).toBe(false);
  });

  it('detects a monologue by word count', async () => {
    create.mockResolvedValue(ok());
    const long = Array.from({ length: 130 }, () => 'word').join(' ');
    const t = await buyerTurn(scenario, 'neutral', [], long);
    expect(t.signals.monologued).toBe(true);
  });

  it('takes acknowledgement and next-step from the model, since they need meaning', async () => {
    create.mockResolvedValue(ok({ acknowledged: true, askedForNextStep: true }));
    const t = await buyerTurn(scenario, 'neutral', [], 'Fair enough.');
    expect(t.signals.acknowledgedObjection).toBe(true);
    expect(t.signals.askedForNextStep).toBe(true);
  });

  it('treats a missing boolean as false rather than truthy', async () => {
    create.mockResolvedValue(ok());
    const t = await buyerTurn(scenario, 'neutral', [], 'Fair enough.');
    expect(t.signals.acknowledgedObjection).toBe(false);
    expect(t.signals.askedForNextStep).toBe(false);
  });
});

describe('the grader must quote something the rep actually said', () => {
  const history = [
    { role: 'buyer' as const, text: 'What do you want?' },
    {
      role: 'rep' as const,
      text: 'Could we put thirty minutes on Thursday to walk through your routing data?',
    },
  ];

  it('keeps a quote that appears in the transcript', async () => {
    create.mockResolvedValue(
      reply(
        JSON.stringify({
          score: 88,
          quote: 'Could we put thirty minutes on Thursday to walk through your routing data?',
          note: 'Specific and dated.',
        }),
      ),
    );
    const j = await judgeNextStep(scenario, history);
    expect(j.quote).toMatch(/Thursday/);
    expect(j.note).toBe('Specific and dated.');
  });

  it('drops a fabricated quote and says why', async () => {
    create.mockResolvedValue(
      reply(
        JSON.stringify({
          score: 88,
          quote: 'I will send over a proposal by Friday and follow up on Monday morning.',
          note: 'Specific and dated.',
        }),
      ),
    );
    const j = await judgeNextStep(scenario, history);
    expect(j.quote).toBe('');
    expect(j.note).toMatch(/did not match the transcript/);
  });

  it('accepts an empty quote when no next step was attempted', async () => {
    create.mockResolvedValue(
      reply(JSON.stringify({ score: 5, quote: '', note: 'You never proposed one.' })),
    );
    const j = await judgeNextStep(scenario, history);
    expect(j.quote).toBe('');
    expect(j.note).toBe('You never proposed one.');
  });

  it('throws on an out-of-range score instead of clamping it quietly', async () => {
    create.mockResolvedValue(reply(JSON.stringify({ score: 140, quote: '', note: 'x' })));
    await expect(judgeNextStep(scenario, history)).rejects.toThrow(/out-of-range/i);
  });

  it('throws when the score is not a number at all', async () => {
    create.mockResolvedValue(reply(JSON.stringify({ score: 'great', quote: '', note: 'x' })));
    await expect(judgeNextStep(scenario, history)).rejects.toThrow(/out-of-range/i);
  });

  it('throws when there is no note to show', async () => {
    create.mockResolvedValue(reply(JSON.stringify({ score: 50, quote: '', note: '' })));
    await expect(judgeNextStep(scenario, history)).rejects.toThrow(/no note/i);
  });
});
