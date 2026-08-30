# Pitchback

**Practise a sales call out loud, against a buyer who pushes back.**

You hold a button and talk. A simulated buyer answers in a voice, in character,
and their receptivity moves — up if you earn it, down if you talk over them, and
off the call entirely if you waste enough of their time. At the end you get four
scores, two of which are arithmetic you can check against your own transcript.

No account, no email, no login wall. It needs a microphone.

---

## Why the scores are worth reading

Most practice tools hand you four numbers a language model made up. Three of
these four are not that.

| Competency | How it is scored | What it looks at |
| --- | --- | --- |
| **Discovery** | computed | Open and closed questions per turn, and whether they were spread through the call or bunched into the first half |
| **Talk-to-listen** | computed | Your share of all words spoken |
| **Objection handling** | state machine | Every turn that began with the buyer resistant, and whether you moved them up, held, or lost ground |
| **Next-step close** | model judged | Whether you secured something specific and dated — and the grader must quote your own words back, or the quote is dropped |

The thresholds come from published analyses of real sales calls: that rep talk
time above roughly 65% tracks with lower win rates, that won calls cluster near a
43/57 split, and that strong reps spread questions across a call rather than
front-loading them.

**What is deliberately not borrowed** is Gong's raw "11–14 questions" figure. That
is measured over a full discovery call; a run here is at most twelve turns, so the
absolute count would be meaningless. Discovery is scored on rate and spread, which
are the parts of the finding that survive the change of scale. Inventing a
threshold would have been easier and would have been wrong.

## The buyer is a state machine, not a mood

Seven states, ordered:

```
hostile → dismissive → skeptical → neutral → curious → interested → committed
```

The model plays the buyer, but it does not decide where the buyer ends up. Each
turn it proposes a direction — `warmed`, `held`, or `cooled` — and
`lib/sim/buyer-state.ts` decides whether that move is legal:

- Movement is capped at **one rung per turn**, in either direction.
- A turn over **120 words** costs a rung regardless of what the model wanted.
  Talking over a buyer does not warm them.
- Answering an objection **without acknowledging it first** cannot warm a
  skeptical buyer.
- Warming past `neutral` requires that you actually **asked a question**.
- Nobody reaches `committed` without being **asked for something specific**.
- Three consecutive hostile turns and they **hang up**.

Without those constraints the model takes a hostile prospect to "sounds great,
send me a contract" inside two turns, which teaches nothing. Every transition is
recorded with the rule that fired it, and the results page shows the whole chain.

## Latency

The results page reports median and p95 round-trip latency for your own run,
measured across a stated boundary: **from the instant recording stops to the
instant the buyer's audio is ready to play.** That includes speech-to-text, the
buyer model, text-to-speech, and every network hop between them. It excludes how
long you chose to speak and how long the reply takes to play back, because
neither is the system's to control.

## Cost control

Every voice turn costs real money at the model provider, and the demo is public,
so:

- Every paid endpoint is **rate limited in Postgres**, not in process memory —
  each serverless instance has its own heap, so an in-memory counter is not a
  limit at all.
- Text-to-speech is **cached by hash of voice + model + text**. A scenario's
  opening line is byte-identical on every run and is synthesised once.
- A run is capped at **12 turns**, a recording at **~30 seconds**, and a turn at
  2,000 characters.
- The TTS rate limit is only charged on a **cache miss**, since a hit costs
  nothing.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the two values
npx prisma migrate deploy
npm run dev
```

Two environment variables are required. There is no degraded mode: a missing key
throws on the first call rather than serving a demo that appears to work and
quietly says nothing.

| Variable | What it is for |
| --- | --- |
| `OPENAI_API_KEY` | Whisper, the buyer model, and text-to-speech |
| `DATABASE_URL` | Postgres — runs, rate limit windows, TTS cache |

`RATELIMIT_SALT` is optional and only changes how client identifiers are hashed.

```bash
npm test        # unit tests, no key or database needed
npm run typecheck
npm run lint
```

## Layout

```
lib/sim/buyer-state.ts   the seven-state machine and its constraints
lib/sim/scoring.ts       the four competencies
lib/ai/buyer.ts          the buyer persona and turn call
lib/ai/grade.ts          the one model-judged competency
lib/ratelimit.ts         Postgres-backed fixed-window limiting
lib/hooks/useVoiceLoop.ts  record → transcribe → turn → speak, and the timer
data/scenarios.ts        the five calls
app/api/transcribe       speech to text
app/api/run/[id]/turn    one buyer turn, through the state machine
app/api/speak            text to speech, cached
app/api/run/[id]/grade   final scoring
```

## Honest notes

- The buyer is a language model reading a persona. Its *words* are generated. Its
  *state* is not — that is the state machine, and every transition is shown to
  you with the rule that produced it.
- Three of the four scores are computed or derived. The fourth is a judgement,
  labelled as one in the interface.
- Runs are stored without any account, and nothing recorded identifies who did
  them. Audio is sent to the model provider for transcription and is not stored.
- This began as a hotel front-desk training tool built for a hackathon by a team
  of two. The voice loop, state machine and scoring here were rewritten for
  sales; the git history before that rewrite is a different product.
