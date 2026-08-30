import { describe, expect, it, vi } from 'vitest';
import { OperationalError, route } from '@/lib/http';

/**
 * A thrown route used to produce Next's HTML 500 page, which the client
 * could not parse a message out of — so the user saw "Request failed
 * (500)" while the server log held the exact cause. Failing loudly is
 * pointless if the noise only reaches the log.
 */

const req = (path = '/api/speak') =>
  new Request(`http://localhost${path}`, { method: 'POST' });

const throwing = (e: unknown) =>
  route(async () => {
    throw e;
  });

async function body(res: Response) {
  return (await res.json()) as { error: string; message: string };
}

describe('route()', () => {
  it('passes a successful response straight through', async () => {
    const handler = route(async () => Response.json({ ok: true }));
    const res = await handler(req(), undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('always returns parseable JSON, never an HTML error page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await throwing(new Error('anything at all'))(req(), undefined);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    await expect(body(res)).resolves.toHaveProperty('message');
  });

  it('reports a missing key as a server-side configuration fault', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await throwing(
      new Error('OPENAI_API_KEY is not set. Voice and grading are unavailable;'),
    )(req(), undefined);
    expect(res.status).toBe(503);
    const b = await body(res);
    expect(b.error).toBe('not_configured');
    expect(b.message).toMatch(/not something you did/);
  });

  it('distinguishes an upstream quota problem from our own failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await throwing(new Error('429 insufficient_quota'))(req(), undefined);
    expect(res.status).toBe(503);
    expect((await body(res)).error).toBe('upstream_limited');
  });

  it('reports a timeout as a gateway timeout', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await throwing(new Error('fetch failed: ETIMEDOUT'))(req(), undefined);
    expect(res.status).toBe(504);
    expect((await body(res)).error).toBe('upstream_unreachable');
  });

  it('says nothing was scored when the model returns something unusable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await throwing(new Error('Buyer model returned unparseable JSON: {'))(
      req(),
      undefined,
    );
    expect(res.status).toBe(502);
    const b = await body(res);
    expect(b.error).toBe('bad_model_response');
    expect(b.message).toMatch(/rather than guessed/);
  });

  it('does not leak an unrecognised error message to the client', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const secretish = 'connection to postgres://user:hunter2@10.0.0.4 refused';
    const res = await throwing(new Error(secretish))(req(), undefined);
    expect(res.status).toBe(500);
    const b = await body(res);
    expect(b.message).not.toContain('hunter2');
    expect(b.message).not.toContain('10.0.0.4');
    expect(b.error).toBe('internal_error');
  });

  it('honours an explicit OperationalError', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await throwing(
      new OperationalError('That run is already closed.', 409, 'run_closed'),
    )(req(), undefined);
    expect(res.status).toBe(409);
    expect(await body(res)).toEqual({
      error: 'run_closed',
      message: 'That run is already closed.',
    });
  });

  it('logs the full error server-side even when the client sees a generic one', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('internal detail worth keeping');
    await throwing(err)(req(), undefined);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('internal_error'), err);
  });

  it('handles a thrown non-Error without itself throwing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await throwing('just a string')(req(), undefined);
    expect(res.status).toBe(500);
    expect((await body(res)).error).toBe('internal_error');
  });
});
