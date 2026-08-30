import { NextResponse } from 'next/server';

/**
 * Turns a thrown error into a JSON response the interface can actually
 * show someone.
 *
 * Without this a route that throws produces Next's HTML 500 page, the
 * client cannot parse a message out of it, and the user is told "Request
 * failed (500)" while the server log holds the exact cause. The whole
 * point of failing loudly is lost if the noise only reaches the log.
 *
 * The full error is always logged. What is *returned* is deliberately
 * narrower: recognised operational faults get a specific message, and
 * anything unrecognised gets a generic one, so an unexpected exception
 * cannot spill internals into a public response.
 */

export class OperationalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'OperationalError';
  }
}

function classify(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof OperationalError) {
    return { status: error.status, code: error.code, message: error.message };
  }

  const raw = error instanceof Error ? error.message : String(error);

  // A missing key is a deployment fault, not a visitor's fault, and saying
  // so plainly is more useful than a generic 500. It reveals nothing — the
  // absence of a secret is not itself a secret.
  if (raw.includes('OPENAI_API_KEY is not set')) {
    return {
      status: 503,
      code: 'not_configured',
      message:
        'The voice service is not configured on this deployment, so the call cannot run. This is a server-side fault, not something you did.',
    };
  }

  if (/rate limit|429|quota|insufficient_quota/i.test(raw)) {
    return {
      status: 503,
      code: 'upstream_limited',
      message:
        'The model provider is rate limiting or out of quota right now. Try again in a moment.',
    };
  }

  if (/timeout|ETIMEDOUT|ECONNRESET|fetch failed/i.test(raw)) {
    return {
      status: 504,
      code: 'upstream_unreachable',
      message: 'The model provider did not respond in time. Try that turn again.',
    };
  }

  if (raw.startsWith('Buyer model returned') || raw.startsWith('Grader returned')) {
    return {
      status: 502,
      code: 'bad_model_response',
      message:
        'The model returned something this app could not use, so nothing was scored rather than guessed. Try that turn again.',
    };
  }

  return {
    status: 500,
    code: 'internal_error',
    message: 'Something failed on the server. Nothing was scored or saved for that turn.',
  };
}

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

/** Wrap a route handler so every throw becomes structured JSON. */
export function route<Ctx>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const { status, code, message } = classify(error);
      console.error(`[${code}] ${req.method} ${new URL(req.url).pathname}`, error);
      return NextResponse.json({ error: code, message }, { status });
    }
  };
}
