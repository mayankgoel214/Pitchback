import { ImageResponse } from 'next/og';
import { BUYER_STATES } from '@/lib/sim/buyer-state';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt =
  'Pitchback — practise the call before it counts. A voice sales trainer scored on discovery, talk-to-listen, objection handling and the close.';

/**
 * Rendered from `BUYER_STATES` rather than drawn by hand, so the card
 * cannot advertise a ladder the code no longer has. Verity shipped an
 * og:image still naming a product and a library it had stopped using.
 */
const RAMP: Record<string, string> = {
  hostile: '#e05252',
  dismissive: '#d4713f',
  skeptical: '#c39a3d',
  neutral: '#8a8580',
  curious: '#4fb79b',
  interested: '#45b183',
  committed: '#3fbf7f',
};

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#141210',
          color: '#f5f2ee',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#8a8580',
            }}
          >
            Pitchback
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 34,
              fontSize: 82,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <div>Practise the call</div>
            <div>before it counts.</div>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 29,
              lineHeight: 1.45,
              color: '#a9a49e',
              maxWidth: 830,
            }}
          >
            Talk to a simulated buyer who pushes back, then get scored on four
            things you can check for yourself.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            {BUYER_STATES.map((s, i) => (
              <div
                key={s}
                style={{
                  width: 96,
                  height: 10 + i * 9,
                  borderRadius: 6,
                  background: RAMP[s],
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', fontSize: 21, color: '#8a8580', letterSpacing: 1 }}>
            {`${BUYER_STATES[0]} → ${BUYER_STATES[BUYER_STATES.length - 1]} · ${BUYER_STATES.length}-state buyer model`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
