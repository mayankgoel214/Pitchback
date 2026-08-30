/**
 * Drives the real microphone path in a real browser.
 *
 * This is the part of the app that unit tests cannot reach: getUserMedia,
 * MediaRecorder, the multipart upload to the transcription route, and the
 * latency clock that starts when recording stops. Chromium supplies a
 * synthetic capture device, so it needs no hardware and no human.
 *
 * Assumes the app is already running with OPENAI_BASE_URL pointed at
 * tests/e2e/stub-model.mjs. See the README.
 *
 *   node tests/e2e/voice-loop.mjs http://localhost:3111
 *
 * Exits non-zero on the first failed expectation, and says which.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:3111';

const failures = [];
function expect(label, condition, detail = '') {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    failures.push(label);
  }
}

const browser = await chromium.launch({
  args: [
    '--use-fake-device-for-media-capture',
    '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const context = await browser.newContext({ permissions: ['microphone'] });
const page = await context.newPage();

const calls = [];
const consoleErrors = [];
page.on('response', (r) => {
  if (r.url().includes('/api/')) calls.push(`${r.status()} ${new URL(r.url()).pathname}`);
});
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});

console.log('voice loop, through a real browser:');

await page.goto(`${BASE}/practice/discovery`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Start the call' }).click();
await page.waitForTimeout(3000);

expect('the buyer speaks first', await page.getByText(/twenty minutes/i).count() > 0);

// Push to talk, for real: mouse down, record, mouse up.
const mic = page.getByRole('button', { name: 'Hold to talk' });
const box = await mic.boundingBox();
if (!box) throw new Error('the microphone button was not on the page');

await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.waitForTimeout(300);
expect('releasing is what sends, not clicking', await page.getByText('Release to send').count() > 0);
await page.waitForTimeout(1500);
await page.mouse.up();

await page
  .waitForFunction(() => / \d+ ms/.test(document.body.innerText), { timeout: 30000 })
  .catch(() => {});
await page.waitForTimeout(2000);

const body = await page.evaluate(() => document.body.innerText);

expect('audio reached the transcription route', calls.some((c) => c === '200 /api/transcribe'),
  calls.join(', '));
expect('the transcript became a turn', calls.some((c) => /200 .*\/turn$/.test(c)));
expect('the buyer was synthesised', calls.some((c) => c === '200 /api/speak'));
expect('a latency sample was recorded', calls.some((c) => /\/turn\/latency$/.test(c)));
expect('the transcribed words are on screen', body.includes('stubbed transcription'));

const ms = body.match(/·\s(\d+)\sms/);
expect('a round trip was timed', Boolean(ms), 'no "N ms" rendered');
if (ms) {
  const value = Number(ms[1]);
  expect('the timing is a plausible measurement', value > 0 && value < 60_000, `${value} ms`);
}

expect('nothing errored in the console', consoleErrors.length === 0, consoleErrors[0] ?? '');

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} failed: ${failures.join('; ')}`);
  process.exit(1);
}
console.log('\nall good. note: latency here is the app\'s own overhead — the models are stubbed.');
