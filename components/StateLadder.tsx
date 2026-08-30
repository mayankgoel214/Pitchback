import { BUYER_STATES, rank, type BuyerState } from '@/lib/sim/buyer-state';

const LABEL: Record<BuyerState, string> = {
  hostile: 'Hostile',
  dismissive: 'Dismissive',
  skeptical: 'Skeptical',
  neutral: 'Neutral',
  curious: 'Curious',
  interested: 'Interested',
  committed: 'Committed',
};

export function stateColor(state: BuyerState): string {
  return `var(--state-${state})`;
}

export function StatePill({ state }: { state: BuyerState }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider"
      style={{ borderColor: stateColor(state), color: stateColor(state) }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: stateColor(state) }}
        aria-hidden
      />
      {LABEL[state]}
    </span>
  );
}

/**
 * The ladder as a vertical readout. The current rung is lit; the rest are
 * dimmed to their own colour rather than to grey, so the direction of
 * travel stays legible at a glance.
 */
export function StateLadder({ current }: { current: BuyerState }) {
  const here = rank(current);

  return (
    <ol className="flex flex-col-reverse gap-1" aria-label="Buyer receptivity">
      {BUYER_STATES.map((s) => {
        const i = rank(s);
        const active = i === here;
        return (
          <li
            key={s}
            aria-current={active ? 'step' : undefined}
            className="flex items-center gap-3"
          >
            <span
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: active ? '3rem' : '1.25rem',
                backgroundColor: stateColor(s),
                opacity: active ? 1 : 0.28,
              }}
            />
            <span
              className="font-mono text-xs uppercase tracking-wider transition-opacity duration-500"
              style={{
                color: active ? stateColor(s) : 'var(--muted-foreground)',
                opacity: active ? 1 : 0.5,
              }}
            >
              {LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export { LABEL as STATE_LABEL };
