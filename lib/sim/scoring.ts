/**
 * The four competencies a run is scored on.
 *
 * Two of them (discovery, talk-to-listen) are arithmetic over the
 * transcript. One (objection handling) is read off the state machine's own
 * history. Only the fourth (next-step close) is a model judgement, and that
 * one is required to quote the line it is judging.
 *
 * On the thresholds: Gong's published call analyses are the source for the
 * *shape* of these — that rep talk time above ~65% tracks with lower win
 * rates, that a 43/57 split is where won calls cluster, that top performers
 * spread questions across a call instead of front-loading them, and that
 * past a point more questions reads as interrogation rather than curiosity.
 *
 * What is deliberately NOT copied across is Gong's raw question count
 * (11-14 over a full discovery call). A practice run here is eight to twelve
 * turns, not forty minutes, so the absolute count would be meaningless.
 * Discovery is scored on rate and spread, which are the parts of that
 * finding that survive the change of scale.
 */

import { BuyerState, Transition, rank } from './buyer-state';

export interface Message {
  role: 'rep' | 'buyer';
  text: string;
}

export interface Competency {
  key: 'discovery' | 'talk_listen' | 'objection_handling' | 'next_step';
  label: string;
  score: number; // 0-100
  /** What the number was derived from — shown to the user, not a vibe. */
  detail: string;
  method: 'computed' | 'state_machine' | 'model_judged';
}

// --- word and question counting ------------------------------------------

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

const OPEN_STARTERS =
  /^(what|how|why|tell me|walk me|describe|talk me|help me understand|when|where|who|which)\b/i;
const CLOSED_STARTERS =
  /^(is|are|was|were|do|does|did|can|could|will|would|should|have|has|had|am|any)\b/i;

export interface QuestionCount {
  open: number;
  closed: number;
  /** Open questions weighted full, closed at 0.4. */
  weighted: number;
}

export function countQuestions(text: string): QuestionCount {
  const questions = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.endsWith('?'));

  let open = 0;
  let closed = 0;
  for (const q of questions) {
    const body = q.replace(/^(so|and|but|ok|okay|right|well)[,\s]+/i, '');
    if (OPEN_STARTERS.test(body)) open++;
    else if (CLOSED_STARTERS.test(body)) closed++;
    else open++; // mid-sentence or inverted phrasing; treat as open
  }

  return { open, closed, weighted: open + closed * 0.4 };
}

// --- 1. talk-to-listen ----------------------------------------------------

/** Rep's share of all words spoken. */
export function talkShare(messages: Message[]): number {
  const rep = messages
    .filter((m) => m.role === 'rep')
    .reduce((n, m) => n + countWords(m.text), 0);
  const total = messages.reduce((n, m) => n + countWords(m.text), 0);
  return total === 0 ? 0 : rep / total;
}

/**
 * Full marks for a 35-50% share, which brackets the 43/57 split won calls
 * cluster around. Falls off to zero by 75% (dominating the call) and by 15%
 * (the rep is not leading the conversation at all).
 */
export function scoreTalkListen(messages: Message[]): Competency {
  const share = talkShare(messages);
  const pct = Math.round(share * 100);

  let score: number;
  if (share >= 0.35 && share <= 0.5) score = 100;
  else if (share > 0.5) score = Math.max(0, Math.round(100 - ((share - 0.5) / 0.25) * 100));
  else score = Math.max(0, Math.round(100 - ((0.35 - share) / 0.2) * 100));

  const detail =
    share > 0.5
      ? `You spoke ${pct}% of the words. Won calls cluster nearer 43%.`
      : share < 0.35
        ? `You spoke ${pct}% of the words — too passive to be steering the call.`
        : `You spoke ${pct}% of the words, inside the range won calls cluster in.`;

  return { key: 'talk_listen', label: 'Talk-to-listen', score, detail, method: 'computed' };
}

// --- 2. discovery ---------------------------------------------------------

export interface DiscoveryStats {
  open: number;
  closed: number;
  /** Weighted questions per rep turn. */
  rate: number;
  /** 0-1. How evenly questions fall across the call; 1 is perfectly even. */
  spread: number;
}

export function discoveryStats(messages: Message[]): DiscoveryStats {
  const turns = messages.filter((m) => m.role === 'rep');
  let open = 0;
  let closed = 0;
  const perTurn: number[] = [];

  for (const t of turns) {
    const c = countQuestions(t.text);
    open += c.open;
    closed += c.closed;
    perTurn.push(c.weighted);
  }

  const weighted = open + closed * 0.4;
  const rate = turns.length ? weighted / turns.length : 0;

  // Spread: compare the first half of the call to the second. A rep who
  // front-loads every question and then pitches scores low here even if the
  // total is healthy.
  const mid = Math.floor(perTurn.length / 2);
  const first = perTurn.slice(0, mid).reduce((a, b) => a + b, 0);
  const second = perTurn.slice(mid).reduce((a, b) => a + b, 0);
  const spread =
    first + second === 0 ? 0 : 1 - Math.abs(first - second) / (first + second);

  return { open, closed, rate, spread };
}

/**
 * Rate is worth 70, spread 30. Rate peaks at roughly a question per turn and
 * is penalised above two per turn, where it starts to read as interrogation.
 */
export function scoreDiscovery(messages: Message[]): Competency {
  const { open, closed, rate, spread } = discoveryStats(messages);

  let rateScore: number;
  if (rate >= 0.75 && rate <= 1.5) rateScore = 100;
  else if (rate > 1.5) rateScore = Math.max(0, 100 - ((rate - 1.5) / 1.5) * 100);
  else rateScore = (rate / 0.75) * 100;

  const score = Math.round(rateScore * 0.7 + spread * 100 * 0.3);

  const detail =
    `${open} open and ${closed} closed questions across your turns ` +
    `(${rate.toFixed(2)} weighted per turn). ` +
    (spread < 0.5
      ? 'They were bunched into one half of the call rather than spread through it.'
      : 'They were spread through the call rather than front-loaded.');

  return { key: 'discovery', label: 'Discovery', score, detail, method: 'computed' };
}

// --- 3. objection handling ------------------------------------------------

const RESISTANT: BuyerState[] = ['hostile', 'dismissive', 'skeptical'];

/**
 * Read off the state machine. Every turn that started with the buyer
 * resistant is an objection the rep had to handle; the score is how often
 * they moved the buyer up rather than sideways or down. Turns the machine
 * had to constrain — answering an objection without acknowledging it — are
 * counted as failures even when the model wanted to warm the buyer.
 */
export function scoreObjectionHandling(history: Transition[]): Competency {
  const attempts = history.filter((t) => RESISTANT.includes(t.from));

  if (attempts.length === 0) {
    return {
      key: 'objection_handling',
      label: 'Objection handling',
      score: 0,
      detail: 'The buyer never pushed back, so there is nothing to score here yet.',
      method: 'state_machine',
    };
  }

  let earned = 0;
  let dismissed = 0;
  for (const t of attempts) {
    if (rank(t.to) > rank(t.from)) earned += 1;
    else if (rank(t.to) === rank(t.from)) earned += 0.35;
    if (t.constrained) dismissed++;
  }

  const score = Math.round((earned / attempts.length) * 100);
  const detail =
    `${attempts.length} turn${attempts.length === 1 ? '' : 's'} began with the buyer resistant. ` +
    (dismissed > 0
      ? `${dismissed} of them answered the objection without acknowledging it first.`
      : 'You acknowledged before answering each time.');

  return {
    key: 'objection_handling',
    label: 'Objection handling',
    score,
    detail,
    method: 'state_machine',
  };
}

// --- 4. next-step close ---------------------------------------------------

export interface NextStepJudgement {
  /** 0-100 from the grader. */
  score: number;
  /** The rep's own words the grader is scoring. Empty if none was found. */
  quote: string;
  note: string;
}

export function scoreNextStep(j: NextStepJudgement): Competency {
  return {
    key: 'next_step',
    label: 'Next-step close',
    score: j.score,
    detail: j.quote ? `"${j.quote}" — ${j.note}` : j.note,
    method: 'model_judged',
  };
}

// --- overall --------------------------------------------------------------

export function overall(competencies: Competency[]): number {
  if (!competencies.length) return 0;
  return Math.round(
    competencies.reduce((n, c) => n + c.score, 0) / competencies.length,
  );
}
