import { MODELS, openai } from './client';
import type { Scenario } from '@/data/scenarios';
import type { Message, NextStepJudgement } from '@/lib/sim/scoring';

/**
 * The only model-judged competency. It is required to quote the rep's own
 * words, so a reader can check the score against the transcript instead of
 * taking it on trust. A judgement with no quote is only valid when the
 * grader is reporting that no next step was attempted at all.
 */
export async function judgeNextStep(
  scenario: Scenario,
  history: Message[],
): Promise<NextStepJudgement> {
  const transcript = history
    .map((m) => `${m.role === 'rep' ? 'REP' : 'BUYER'}: ${m.text}`)
    .join('\n');

  const completion = await openai().chat.completions.create({
    model: MODELS.grader,
    temperature: 0.2,
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You grade one thing only: whether the sales rep secured a concrete next step.

In this scenario a good next step is: ${scenario.nextStep}

Scoring:
- 0-20: no next step was proposed at all, or the call simply ended.
- 21-50: something vague. "I'll follow up", "let me send you some information", "we'll be in touch". No time, no specific action.
- 51-80: a specific action, but missing either a time or the buyer's agreement to it.
- 81-100: a specific action, with a time attached, that the buyer agreed to.

Quote the rep's own words verbatim from the transcript. Do not paraphrase and do not invent a line. If the rep never proposed a next step, return an empty quote and say so in the note.

Return JSON:
{ "score": number, "quote": "the rep's exact words, or empty string", "note": "one sentence, addressed to the rep as 'you'" }`,
      },
      { role: 'user', content: transcript },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Grader returned an empty response.');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Grader returned unparseable JSON: ${raw.slice(0, 200)}`);
  }

  const score = Number(parsed.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(`Grader returned an out-of-range score: ${String(parsed.score)}`);
  }

  const quote = typeof parsed.quote === 'string' ? parsed.quote.trim() : '';
  const note = typeof parsed.note === 'string' ? parsed.note.trim() : '';
  if (!note) throw new Error('Grader returned no note.');

  // A quote the rep never said would make the score unverifiable. Drop it
  // rather than display it, and say why.
  const said = history
    .filter((m) => m.role === 'rep')
    .map((m) => m.text.toLowerCase())
    .join(' ');
  const verified = quote && said.includes(quote.toLowerCase().slice(0, 40));

  return {
    score: Math.round(score),
    quote: verified ? quote : '',
    note: quote && !verified ? `${note} (quote omitted — it did not match the transcript)` : note,
  };
}
