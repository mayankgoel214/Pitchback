/**
 * Captures the frames for docs/pitchback-demo.mp4.
 *
 * This is a captioned state sequence, not a screen recording. Each frame is
 * a real screenshot of the running app driven through a real call; the
 * captions are added afterwards. The voice is genuinely synthesised and
 * genuinely transcribed, but nobody speaks in the video, because the
 * capture is scripted — the walkthrough says so on screen.
 *
 *   node scripts/capture-demo.mjs http://localhost:3111
 *
 * Writes numbered PNGs plus a captions.json into docs/demo-frames/.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:3111';
const OUT = join(process.cwd(), 'docs', 'demo-frames');

/** The call the video walks through. Each turn is one captured beat. */
const TURNS = [
  {
    say: "I'll be quick. You run 240 trucks across the Midwest, and I'm told dispatch still plans routes by hand. What does that cost you on a bad week?",
    caption: 'A hostile buyer gives you one sentence. Spend it on her problem, not your product.',
  },
  {
    say: 'How many of those escalations turn into a missed delivery window?',
    caption: 'Questions move her up the ladder. Statements do not.',
  },
  {
    say: 'That tracks with what I hear from other fleets. What happens today when a driver goes off-route mid-shift?',
    caption: 'Every transition is labelled with the rule that produced it.',
  },
  {
    say: 'So dispatch finds out after the fact. How long before anyone knows?',
    caption: 'The model proposes a direction. The state machine decides if it is legal.',
  },
  {
    say: 'If you could see it inside ten minutes instead of the next morning, what would that be worth to you?',
    caption: 'Movement is capped at one rung a turn, so nobody leaps to "send me a contract".',
  },
  {
    say: 'Understood. Who else would need to be in that conversation besides you?',
    caption: 'She is interested — but interest is not commitment.',
  },
  {
    say: "Then let's do this — thirty minutes Thursday, you and your ops lead, and I'll bring the routing analysis for your Midwest lanes. Does 10am work?",
    caption: 'Nobody reaches committed without being asked for something specific and dated.',
  },
];

const frames = [];
let n = 0;

async function shoot(page, caption, hold = 1) {
  const file = `frame-${String(n).padStart(3, '0')}.png`;
  await page.screenshot({ path: join(OUT, file) });
  frames.push({ file, caption, hold });
  n += 1;
}

async function typeTurn(page, text) {
  await page.evaluate((t) => {
    const input = document.querySelector('input[aria-label="Your turn"]');
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    ).set;
    setter.call(input, t);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// --- the landing page ---
await page.goto(BASE, { waitUntil: 'networkidle' });
await shoot(page, 'Pitchback: practise a sales call out loud, against a buyer who pushes back.', 3);

await page.evaluate(() => document.querySelector('#scenarios')?.scrollIntoView());
await page.waitForTimeout(600);
await shoot(page, 'Five calls. A cold interrupt, a guarded discovery, pricing, an incumbent, a renewal at risk.', 3);

// --- the call ---
await page.goto(`${BASE}/practice/cold-open`, { waitUntil: 'networkidle' });
await shoot(page, 'Dana Whitmore did not ask you to call. She starts hostile.', 3);

await page.getByRole('button', { name: 'Start the call' }).click();
await page.waitForTimeout(2500);
await shoot(page, 'She speaks first. Her voice is synthesised; yours is transcribed by Whisper.', 3);

await page.getByRole('button', { name: 'Type instead' }).click();
await page.waitForTimeout(400);
await shoot(page, 'You can hold the mic and talk, or type — the exercise works either way.', 2);

for (const turn of TURNS) {
  await typeTurn(page, turn.say);
  await page.waitForTimeout(2600);
  await shoot(page, turn.caption, 3);
  if (await page.getByRole('button', { name: 'See how you did' }).count()) break;
}

// --- the score ---
const done = page.getByRole('button', { name: 'See how you did' });
if (await done.count()) {
  await shoot(page, 'She agreed to a next step. The call closes itself.', 2);
  await done.click();
  await page.waitForURL(/\/run\//, { timeout: 20000 });
  await page.waitForTimeout(1200);
}

await shoot(page, 'Four scores. Three of them are not a model’s opinion.', 3);

await page.evaluate(() => window.scrollBy(0, 520));
await page.waitForTimeout(500);
await shoot(page, 'Discovery and talk-to-listen are arithmetic on your own transcript.', 3);

await page.evaluate(() => window.scrollBy(0, 520));
await page.waitForTimeout(500);
await shoot(page, 'Objection handling is read off the state machine. Only the close is judged.', 3);

await page.evaluate(() => window.scrollBy(0, 560));
await page.waitForTimeout(500);
await shoot(page, 'Every rung the buyer moved, and the rule that moved her.', 3);

await writeFile(join(OUT, 'captions.json'), JSON.stringify(frames, null, 2));
await browser.close();

console.log(`captured ${frames.length} frames into ${OUT}`);
