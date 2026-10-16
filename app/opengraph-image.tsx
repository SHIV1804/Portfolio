import { ImageResponse } from 'next/og';
import { siteConfig } from '@/shared/config/site';

export const alt = siteConfig.name;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B0D0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          color: '#E7E4DC',
          fontFamily: 'sans-serif',
          border: '20px solid #14171B',
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 'bold',
            lineHeight: 1.1,
            color: '#E7E4DC',
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 34,
            marginTop: '28px',
            color: '#E8A33D',
          }}
        >
          {siteConfig.role}
        </div>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.35,
            marginTop: '34px',
            maxWidth: '1000px',
            color: '#9B9C97',
          }}
        >
          {siteConfig.description}
        </div>
      </div>
    ),
    { ...size },
  );
}
