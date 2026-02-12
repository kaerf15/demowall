import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 256,
  height: 256,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 160,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%', // App-icon like shape
        }}
      >
        <div
          style={{
            backgroundImage: 'linear-gradient(to right, #608BC1, #A6CDC6, #608BC1)',
            backgroundClip: 'text',
            color: 'transparent',
            fontWeight: 900, // Extra bold
            fontFamily: 'sans-serif',
            letterSpacing: '-10px', // Tight tracking to make it compact
            display: 'flex',
            marginBottom: '20px', // Visual centering
            marginRight: '5px', // Visual centering
          }}
        >
          DW
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
