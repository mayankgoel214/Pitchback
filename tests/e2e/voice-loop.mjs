/**
 * Drives the real microphone path in a real browser.
 *
 * This is the part of the app that unit tests cannot reach: getUserMedia,
 * MediaRecorder, the multipart upload to the transcription route, and the
 * latency clock that starts when recording stops. Chromium supplies a
 * synthetic capture device, so it needs no microphone and no human — but it
 * does need the machine to have *some* audio input device. A bare CI
 * container has none, and on such a machine the microphone assertions are
 * skipped with a loud notice and the typed path is exercised instead. The
 * microphone path is therefore verified locally, not on GitHub's runners.
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

/**
 * Some environments have no audio input at all — a bare CI container is one,
 * and Chromium's fake capture device does not conjure one into existence.
 * The microphone assertions are skipped there rather than failing forever,
 * but never quietly: what went uncovered is printed, and the rest of the
 * chain is still exercised through the typed path.
 */
const hasMic = await page.evaluate(async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((d) => d.kind === 'audioinput');
  } catch {
    return false;
  }
});
await page.getByRole('button', { name: 'Start the call' }).click();
await page.waitForTimeout(3000);

expect('the buyer speaks first', await page.getByText(/twenty minutes/i).count() > 0);

if (!hasMic) {
  console.log(
    '\n  ────────────────────────────────────────────────────────────────\n' +
      '  SKIPPED: the microphone path. This machine has no audio input\n' +
      '  device, so getUserMedia cannot be exercised here. NOT COVERED by\n' +
      '  this run: MediaRecorder, the multipart upload to /api/transcribe,\n' +
      '  and the latency clock. Run this locally, where a device exists.\n' +
      '  Falling through to the typed path, which covers the rest.\n' +
      '  ────────────────────────────────────────────────────────────────\n',
  );

  await page.getByRole('button', { name: 'Type instead' }).click();
  const input = page.locator('input[aria-label="Your turn"]');
  await input.fill('How big is the support team today, and what does a bad day look like?');
  await input.press('Enter');

  await page
    .waitForFunction(() => document.body.innerText.includes('buyer warmed'), { timeout: 30_000 })
    .catch(() => {});

  const typedBody = await page.evaluate(() => document.body.innerText);

  expect('a typed turn reaches the buyer', calls.some((c) => /200 .*\/turn$/.test(c)),
    calls.join(', '));
  expect('the buyer was synthesised', calls.some((c) => c === '200 /api/speak'));
  expect('the state machine moved and said why', /buyer warmed|buyer unmoved/.test(typedBody));
  expect('no latency is claimed for a typed turn', !/·\s\d+\sms/.test(typedBody));
  expect('nothing errored in the console', consoleErrors.length === 0, consoleErrors[0] ?? '');

  await browser.close();

  if (failures.length) {
    console.error(`\n${failures.length} failed: ${failures.join('; ')}`);
    process.exit(1);
  }
  console.log('\ntyped path good. THE MICROPHONE PATH WAS NOT TESTED — see the notice above.');
  process.exit(0);
}

// Push to talk, for real: mouse down, record, mouse up.
const mic = page.getByRole('button', { name: 'Hold to talk' });
const box = await mic.boundingBox();
if (!box) throw new Error('the microphone button was not on the page');

await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();

// getUserMedia takes as long as it takes — noticeably longer on a cold CI
// runner than on a laptop. Wait for the state, not for a guessed duration.
let recording = true;
await page
  .waitForFunction(() => document.body.innerText.includes('Release to send'), {
    timeout: 20_000,
  })
  .catch(() => {
    recording = false;
  });

if (!recording) {
  const banner = await page
    .locator('[role="alert"]')
    .first()
    .innerText()
    .catch(() => '');
  expect(
    'releasing is what sends, not clicking',
    false,
    banner ? `the app said: ${banner}` : 'recording never started and nothing was reported',
  );
} else {
  expect('releasing is what sends, not clicking', true);
}

// Record real audio only once the recorder is actually running.
await page.waitForTimeout(1800);
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
