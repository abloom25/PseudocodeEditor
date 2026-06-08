import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'Cambridge Pseudocode Editor for IGCSE 0478 and A Level 9618';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
          color: '#e2e8f0',
          background:
            'linear-gradient(135deg, #020617 0%, #111827 55%, #172554 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: '#93c5fd',
            marginBottom: 28,
            letterSpacing: 2,
          }}
        >
          FREE ONLINE IDE
        </div>
        <div
          style={{
            display: 'flex',
            maxWidth: 1000,
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.08,
          }}
        >
          Cambridge Pseudocode Editor
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 34,
            color: '#cbd5e1',
          }}
        >
          IGCSE 0478 and A Level 9618
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 48,
            gap: 18,
            fontSize: 23,
            color: '#a5b4fc',
          }}
        >
          Run code · Check syntax · Build trace tables
        </div>
      </div>
    ),
    size,
  );
}
