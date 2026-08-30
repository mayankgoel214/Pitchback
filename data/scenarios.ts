import type { BuyerState } from '@/lib/sim/buyer-state';

export interface Scenario {
  id: string;
  title: string;
  /** One line, shown on the card. */
  summary: string;
  difficulty: 'starter' | 'intermediate' | 'hard';
  /** Who the rep is calling. */
  buyer: {
    name: string;
    role: string;
    company: string;
    /** Drives the persona prompt — how this person behaves under pressure. */
    disposition: string;
  };
  /** What the rep is selling, and what they know going in. */
  brief: string;
  /** Where the buyer starts on the receptivity ladder. */
  openingState: BuyerState;
  /** The buyer's first line. Spoken before the rep says anything. */
  openingLine: string;
  /** The pushbacks this buyer reaches for. Given to the model as material. */
  objections: string[];
  /** What a good next step looks like here — used by the close grader. */
  nextStep: string;
  objectives: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'cold-open',
    title: 'The cold call interrupt',
    summary: 'You caught her between meetings and she did not ask you to call.',
    difficulty: 'hard',
    buyer: {
      name: 'Dana Whitmore',
      role: 'VP of Operations',
      company: 'Kestrel Logistics',
      disposition:
        'Direct to the point of blunt. Gives you one sentence to justify the interruption and means it. Warms only to specifics about her world, never to enthusiasm.',
    },
    brief:
      'You sell route-planning software. Kestrel runs 240 trucks across the Midwest. You have no prior relationship and no referral.',
    openingState: 'hostile',
    openingLine:
      "You've got about thirty seconds before I hang up, and I'm already regretting picking up. What is this?",
    objections: [
      "I didn't ask for this call.",
      "We're not looking at new software this year.",
      'Send me something in writing and I\'ll look at it. Maybe.',
      "Everyone says they'll save us money.",
    ],
    nextStep:
      'A specific, calendared follow-up — a time, a short duration, and a reason she would want it.',
    objectives: [
      'Earn the next thirty seconds before pitching anything',
      'Name a problem she actually has, not one you wish she had',
      'Ask before you tell',
      'Leave with a time on the calendar, not "send me something"',
    ],
  },
  {
    id: 'discovery',
    title: 'The guarded discovery call',
    summary: 'He took the meeting, but he is not going to hand you the problem.',
    difficulty: 'starter',
    buyer: {
      name: 'Peter Osei',
      role: 'Director of Customer Support',
      company: 'Northwind Retail',
      disposition:
        'Polite and cooperative on the surface, guarded underneath. Answers exactly what he is asked and nothing more, so shallow questions get shallow answers. Opens up when a question shows you understand support work.',
    },
    brief:
      'You sell a support-ticket triage tool. He agreed to a 20-minute intro call after a webinar. You know his team is 30 agents; you know nothing else.',
    openingState: 'neutral',
    openingLine:
      "Hi — yeah, I've got about twenty minutes. I signed up for that webinar a while back, so, go ahead. What did you want to cover?",
    objections: [
      "I'm not sure we have a problem worth solving here.",
      'We already have a process for that.',
      "I'd have to involve a lot of other people.",
    ],
    nextStep:
      'A working session with a named colleague, or a scoped look at his real ticket data.',
    objectives: [
      'Get past the first answer to the reason behind it',
      'Spread questions through the call instead of front-loading them',
      'Quantify something — volume, time, cost',
      'Identify who else has to be in the room',
    ],
  },
  {
    id: 'pricing',
    title: 'The pricing pushback',
    summary: 'She likes the product. She has decided it costs too much.',
    difficulty: 'intermediate',
    buyer: {
      name: 'Renata Alvarez',
      role: 'Head of Finance',
      company: 'Halcyon Health',
      disposition:
        'Numerate and unbothered by silence. Discounts read to her as an admission the first price was invented. Responds to arithmetic, not adjectives.',
    },
    brief:
      'Late-stage deal. The team wants your product; Renata signs. Your quote came in at $84k a year against a budget she says is $50k.',
    openingState: 'skeptical',
    openingLine:
      "I'll be straight with you — the team likes it, but eighty-four is well outside what I've set aside. Unless that number moves, I don't see how we get there.",
    objections: [
      'Your competitor quoted us considerably less.',
      "I don't see what justifies the premium.",
      'Can you do better on the price?',
      "We could just build a version of this internally.",
    ],
    nextStep:
      'An agreed path to a decision — a revised scope, a pilot with defined success criteria, or a date to reconvene with the numbers she asked for.',
    objectives: [
      'Find out what the budget number is actually made of',
      'Hold the price without dismissing the concern',
      'Reframe cost against the cost of the status quo',
      'Avoid discounting to fill a silence',
    ],
  },
  {
    id: 'incumbent',
    title: 'The incumbent competitor',
    summary: 'They already bought this. From someone else. Two years ago.',
    difficulty: 'intermediate',
    buyer: {
      name: 'Tomas Lindqvist',
      role: 'Engineering Manager',
      company: 'Ardent Systems',
      disposition:
        'Loyal to the decision he made and mildly defensive about it. Hears criticism of the incumbent as criticism of his judgement. Will admit friction if you let him raise it himself.',
    },
    brief:
      'You sell an observability platform. Ardent has used a competitor since 2024 and renews in four months. Tomas chose the incumbent.',
    openingState: 'dismissive',
    openingLine:
      "Look, we're already set up with someone and it works fine. I'm not really sure what you're expecting to get out of this call.",
    objections: [
      "We've already invested a lot in getting the current setup right.",
      'Switching would be a huge amount of work.',
      "I chose the current vendor. It was the right call.",
      "What could you possibly do that they don't?",
    ],
    nextStep:
      'Permission to be involved at renewal, or a narrow technical comparison on one workload.',
    objectives: [
      'Let him defend the incumbent without arguing back',
      'Find friction he raises himself rather than one you assert',
      'Never criticise the vendor he chose',
      'Aim at the renewal date, not at an immediate switch',
    ],
  },
  {
    id: 'churn-save',
    title: 'The renewal at risk',
    summary: 'An existing customer, three weeks from renewal, already halfway out the door.',
    difficulty: 'hard',
    buyer: {
      name: 'Marguerite Boateng',
      role: 'Chief of Staff',
      company: 'Vantage Partners',
      disposition:
        'Tired of being handled. Has raised the same issue three times and been told it is on the roadmap each time. Apologies without a date make her angrier, not calmer.',
    },
    brief:
      'Vantage has been a customer for three years. Two support escalations last quarter went unresolved. Renewal is in three weeks and Marguerite has taken a competitor call.',
    openingState: 'hostile',
    openingLine:
      "Honestly? I'm glad you called, because I was going to have to send an email I didn't want to write. This has not been working, and I've said so more than once.",
    objections: [
      "I've heard 'we're fixing it' three times now.",
      "Why should I believe this time is different?",
      "We're already talking to someone else.",
      'I need this resolved, not explained.',
    ],
    nextStep:
      'A concrete commitment with an owner and a date, and a check-in before the renewal deadline.',
    objectives: [
      'Let her finish before you say anything at all',
      'Own the failure without a list of reasons',
      'Commit to something dated and specific',
      'Earn the renewal conversation rather than asking for it now',
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
export type Voice = (typeof VOICES)[number];

/**
 * A fixed voice per buyer. Fixed rather than chosen at request time so the
 * TTS cache actually hits — a rotating voice would miss on every line.
 */
const SCENARIO_VOICES: Record<string, Voice> = {
  'cold-open': 'shimmer',
  discovery: 'onyx',
  pricing: 'nova',
  incumbent: 'echo',
  'churn-save': 'fable',
};

export function voiceFor(scenarioId: string): Voice {
  return SCENARIO_VOICES[scenarioId] ?? 'alloy';
}
