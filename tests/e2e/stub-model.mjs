/**
 * An OpenAI-compatible stub, for exercising the voice loop without spending
 * money at the real provider.
 *
 * Everything it returns is canned. It proves the plumbing — that a
 * MediaRecorder blob reaches Whisper's endpoint, that a buyer turn comes
 * back through the state machine, that TTS audio plays, and that the
 * latency instrument records a sample. It proves nothing whatsoever about
 * the quality of any model output, and the latency it produces is the app's
 * own overhead with the network and the models removed.
 *
 *   node tests/e2e/stub-model.mjs        # listens on :4599
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SILENCE = readFileSync(join(HERE, 'silence.mp3'));
const PORT = Number(process.env.STUB_PORT ?? 4599);

/** Walks the ladder up so a scripted run reaches `committed`. */
const SCRIPT = [
  { reply: "Fine. You've got a minute. What is this about?" },
  { reply: 'We do have a lot of escalations, yes. More than I would like.' },
  { reply: "Hm. That's not a number I'd thought about that way." },
  { reply: "Alright, that's more interesting than I expected." },
  { reply: "I'd want my ops lead in that conversation too." },
  { reply: "Thursday works. Send the invite and I'll accept it." },
];

let turn = 0;

function json(res, body, status = 200) {
  const s = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(s),
  });
  res.end(s);
}

const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const url = req.url ?? '';

  if (url.includes('/audio/speech')) {
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': SILENCE.length });
    return res.end(SILENCE);
  }

  if (url.includes('/audio/transcriptions')) {
    return json(res, { text: 'This is a stubbed transcription of what the rep said.' });
  }

  if (url.includes('/chat/completions')) {
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    const system = body.messages?.[0]?.content ?? '';

    if (system.includes('You grade one thing only')) {
      return json(res, {
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 20,
                quote: '',
                note: 'You never proposed a concrete next step.',
              }),
            },
          },
        ],
      });
    }

    const step = SCRIPT[Math.min(turn, SCRIPT.length - 1)];
    turn += 1;
    return json(res, {
      choices: [
        {
          message: {
            content: JSON.stringify({
              reply: step.reply,
              direction: 'warmed',
              acknowledged: true,
              askedForNextStep: turn >= SCRIPT.length,
            }),
          },
        },
      ],
    });
  }

  json(res, { error: `unhandled stub route: ${url}` }, 404);
});

server.listen(PORT, () => console.log(`stub model on http://localhost:${PORT}/v1`));

export { server };
