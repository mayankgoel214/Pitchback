import { MODELS, openai, LIMITS } from './client';
import type { Scenario } from '@/data/scenarios';
import {
  BuyerState,
  Direction,
  MONOLOGUE_WORDS,
  TurnSignals,
} from '@/lib/sim/buyer-state';
import { countQuestions, countWords, type Message } from '@/lib/sim/scoring';

export interface BuyerTurn {
  /** What the buyer says out loud. Goes to TTS verbatim. */
  reply: string;
  signals: TurnSignals;
}

/**
 * How each rung of the ladder should sound. The model is given only the
 * current rung, not the whole ladder, so it cannot anticipate where it is
 * "supposed" to end up and drift there.
 */
const STATE_DIRECTION: Record<BuyerState, string> = {
  hostile:
    'You want off this call. Short, clipped sentences. You interrupt. You are not rude for sport — you are busy and this is an imposition.',
  dismissive:
    'You are not hostile, you simply do not see why this concerns you. Polite brush-offs. You offer nothing unprompted.',
  skeptical:
    'You are listening, but you are looking for the catch. You push back on claims and ask what the evidence is. You do not accept adjectives.',
  neutral:
    'You are cooperative and unexcited. You answer what you are asked, accurately, and no more. You do not volunteer the real problem.',
  curious:
    'Something they said landed. You ask a question of your own. You start describing your situation in your own words.',
  interested:
    'You can see this applying to you. You raise practical concerns — timing, who else needs to be involved, what it would take.',
  committed:
    'You are ready to agree to the specific next step that has been proposed. You confirm it in your own words.',
};

function systemPrompt(scenario: Scenario, state: BuyerState): string {
  return `You are ${scenario.buyer.name}, ${scenario.buyer.role} at ${scenario.buyer.company}. You are on a live sales call. The other person on the line is a sales rep practising this conversation.

WHO YOU ARE
${scenario.buyer.disposition}

THE SITUATION
${scenario.brief}

PUSHBACKS AVAILABLE TO YOU (use them when they fit; do not work through them in order)
${scenario.objections.map((o) => `- ${o}`).join('\n')}

YOUR CURRENT STATE: ${state}
${STATE_DIRECTION[state]}

HOW TO SPEAK
- This is speech, not writing. One to three sentences. Contractions. No bullet points, no headings, no stage directions, no asterisks.
- Never narrate your own emotional state. Show it in what you say.
- Never coach the rep, never break character, never mention that this is practice or that you are an AI.
- Do not be won over by enthusiasm, flattery, or a well-turned phrase. You move when the rep says something specific about your situation.

Return JSON with exactly these keys:
{
  "reply": "what you say out loud",
  "direction": "warmed" | "held" | "cooled",
  "acknowledged": boolean,
  "askedForNextStep": boolean
}

"direction" is how the rep's last turn actually moved you — not how they hoped it would. Most turns are "held". Reserve "warmed" for a turn that told you something specific and relevant you did not already know, or asked a question that made you think.
"acknowledged" is true only if the rep named your concern before answering it. Restating your words back before pivoting to a pitch does not count.
"askedForNextStep" is true only if the rep proposed a concrete next step — a specific action with a time attached. "I'll follow up" is not one.`;
}

function isDirection(v: unknown): v is Direction {
  return v === 'warmed' || v === 'held' || v === 'cooled';
}

/**
 * One buyer turn. Throws on a malformed or failed response rather than
 * substituting a neutral default — a fabricated "held" would silently
 * corrupt both the state history and the objection-handling score derived
 * from it.
 */
export async function buyerTurn(
  scenario: Scenario,
  state: BuyerState,
  history: Message[],
  repTurn: string,
): Promise<BuyerTurn> {
  const completion = await openai().chat.completions.create({
    model: MODELS.buyer,
    temperature: 0.8,
    max_tokens: 220,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt(scenario, state) },
      ...history.map((m) => ({
        role: (m.role === 'rep' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      })),
      { role: 'user', content: repTurn.slice(0, LIMITS.maxTurnChars) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Buyer model returned an empty response.');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Buyer model returned unparseable JSON: ${raw.slice(0, 200)}`);
  }

  const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
  if (!reply) throw new Error('Buyer model returned no reply text.');
  if (!isDirection(parsed.direction)) {
    throw new Error(`Buyer model returned an invalid direction: ${String(parsed.direction)}`);
  }

  return {
    reply,
    signals: {
      proposed: parsed.direction,
      // Computed here rather than trusted to the model — these are arithmetic,
      // and the model has no business guessing at them.
      askedQuestion: countQuestions(repTurn).open + countQuestions(repTurn).closed > 0,
      monologued: countWords(repTurn) > MONOLOGUE_WORDS,
      acknowledgedObjection: parsed.acknowledged === true,
      askedForNextStep: parsed.askedForNextStep === true,
    },
  };
}
