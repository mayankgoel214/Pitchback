import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * The receptivity ladder, reduced to three rungs. It is the one idea in the
 * product that survives being drawn at 32 pixels: resistance at the bottom,
 * commitment at the top, and the distance between them is the exercise.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#141210',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 4,
          padding: 6,
        }}
      >
        <div style={{ width: 20, height: 4, borderRadius: 2, background: '#3fbf7f' }} />
        <div style={{ width: 13, height: 4, borderRadius: 2, background: '#8a8580' }} />
        <div style={{ width: 8, height: 4, borderRadius: 2, background: '#e05252' }} />
      </div>
    ),
    size,
  );
}
