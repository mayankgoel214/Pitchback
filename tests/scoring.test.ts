import { describe, expect, it } from 'vitest';
import {
  countQuestions,
  countWords,
  discoveryStats,
  overall,
  scoreDiscovery,
  scoreNextStep,
  scoreObjectionHandling,
  scoreTalkListen,
  talkShare,
  type Message,
} from '@/lib/sim/scoring';
import type { Transition } from '@/lib/sim/buyer-state';

const rep = (text: string): Message => ({ role: 'rep', text });
const buyer = (text: string): Message => ({ role: 'buyer', text });

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('counting', () => {
  it('counts words without being fooled by whitespace', () => {
    expect(countWords('  one   two  three ')).toBe(3);
    expect(countWords('   ')).toBe(0);
  });

  it('separates open questions from closed ones', () => {
    const c = countQuestions('What does that cost you? Is that a problem?');
    expect(c.open).toBe(1);
    expect(c.closed).toBe(1);
    expect(c.weighted).toBeCloseTo(1.4);
  });

  it('ignores statements', () => {
    expect(countQuestions('We save people money. A lot of money.').open).toBe(0);
  });

  it('strips leading discourse markers before classifying', () => {
    expect(countQuestions('So how are you handling that today?').open).toBe(1);
  });

  it('treats inverted phrasing as open rather than dropping it', () => {
    const c = countQuestions('Your team handles this manually today?');
    expect(c.open + c.closed).toBe(1);
  });
});

describe('talk-to-listen', () => {
  it('measures the rep share of all words', () => {
    expect(talkShare([rep(words(40)), buyer(words(60))])).toBeCloseTo(0.4);
  });

  it('gives full marks inside the band won calls cluster in', () => {
    expect(scoreTalkListen([rep(words(43)), buyer(words(57))]).score).toBe(100);
  });

  it('punishes dominating the call', () => {
    const s = scoreTalkListen([rep(words(75)), buyer(words(25))]).score;
    expect(s).toBe(0);
  });

  it('punishes being too passive to lead it', () => {
    const s = scoreTalkListen([rep(words(10)), buyer(words(90))]);
    expect(s.score).toBeLessThan(50);
    expect(s.detail).toMatch(/passive/);
  });

  it('never returns a negative score', () => {
    expect(scoreTalkListen([rep(words(99)), buyer(words(1))]).score).toBe(0);
  });

  it('reports zero on an empty transcript rather than dividing by zero', () => {
    expect(talkShare([])).toBe(0);
  });

  it('marks itself as computed, not judged', () => {
    expect(scoreTalkListen([rep('hi'), buyer('hi')]).method).toBe('computed');
  });
});

describe('discovery', () => {
  it('rewards a question roughly every turn', () => {
    const t = [
      rep('What does that process look like today?'),
      buyer('Manual, mostly.'),
      rep('How long does that take your team?'),
      buyer('Hours.'),
    ];
    expect(scoreDiscovery(t).score).toBeGreaterThan(80);
  });

  it('penalises asking nothing at all', () => {
    const t = [rep('We do three things. It is great.'), buyer('Right.')];
    expect(scoreDiscovery(t).score).toBe(0);
  });

  it('penalises interrogation', () => {
    const barrage = 'What? How? Why? When? Where? Who?';
    const heavy = scoreDiscovery([rep(barrage), buyer('...'), rep(barrage), buyer('...')]);
    const measured = scoreDiscovery([
      rep('What does that cost you?'),
      buyer('...'),
      rep('How is the team handling it?'),
      buyer('...'),
    ]);
    expect(heavy.score).toBeLessThan(measured.score);
  });

  it('penalises front-loading every question into the first half', () => {
    const frontLoaded = [
      rep('What does that look like? How long has it been that way?'),
      buyer('...'),
      rep('Right, so let me walk you through what we do.'),
      buyer('...'),
    ];
    const spread = [
      rep('What does that look like?'),
      buyer('...'),
      rep('How long has it been that way?'),
      buyer('...'),
    ];
    expect(discoveryStats(frontLoaded).spread).toBeLessThan(discoveryStats(spread).spread);
    expect(scoreDiscovery(frontLoaded).score).toBeLessThan(scoreDiscovery(spread).score);
  });

  it('reports zero spread when nothing was asked', () => {
    expect(discoveryStats([rep('No questions here.')]).spread).toBe(0);
  });
});

describe('objection handling', () => {
  const t = (
    from: Transition['from'],
    to: Transition['to'],
    constrained = false,
  ): Transition => ({ from, to, trigger: 'test', constrained });

  it('scores nothing when the buyer never pushed back, and says so', () => {
    const c = scoreObjectionHandling([t('neutral', 'curious'), t('curious', 'interested')]);
    expect(c.score).toBe(0);
    expect(c.detail).toMatch(/never pushed back/);
  });

  it('gives full marks for moving a resistant buyer up every time', () => {
    const c = scoreObjectionHandling([t('hostile', 'dismissive'), t('dismissive', 'skeptical')]);
    expect(c.score).toBe(100);
  });

  it('gives partial credit for holding ground', () => {
    const c = scoreObjectionHandling([t('skeptical', 'skeptical')]);
    expect(c.score).toBe(35);
  });

  it('gives nothing for making it worse', () => {
    const c = scoreObjectionHandling([t('skeptical', 'dismissive')]);
    expect(c.score).toBe(0);
  });

  it('counts constrained turns as talking past the objection', () => {
    const c = scoreObjectionHandling([t('skeptical', 'skeptical', true)]);
    expect(c.detail).toMatch(/without acknowledging/);
  });

  it('reads from the state machine, not a model', () => {
    expect(scoreObjectionHandling([t('skeptical', 'neutral')]).method).toBe('state_machine');
  });
});

describe('next-step close', () => {
  it('passes the grader score through and shows the quote', () => {
    const c = scoreNextStep({
      score: 90,
      quote: 'Can we put thirty minutes on Thursday?',
      note: 'Specific and dated.',
    });
    expect(c.score).toBe(90);
    expect(c.detail).toContain('Thursday');
    expect(c.method).toBe('model_judged');
  });

  it('shows the note alone when there was no quote to show', () => {
    const c = scoreNextStep({ score: 10, quote: '', note: 'You never proposed one.' });
    expect(c.detail).toBe('You never proposed one.');
  });
});

describe('overall', () => {
  it('averages the four competencies', () => {
    const c = [
      scoreNextStep({ score: 100, quote: '', note: 'a' }),
      scoreNextStep({ score: 50, quote: '', note: 'b' }),
    ];
    expect(overall(c)).toBe(75);
  });

  it('is zero with nothing to average rather than NaN', () => {
    expect(overall([])).toBe(0);
  });
});
