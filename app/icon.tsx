import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(45deg, #10b981, #059669)',
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          {/* QR code style grid pattern */}
          <rect x="2" y="2" width="2" height="2" />
          <rect x="5" y="2" width="2" height="2" />
          <rect x="8" y="2" width="2" height="2" />
          <rect x="14" y="2" width="2" height="2" />
          <rect x="17" y="2" width="2" height="2" />
          <rect x="20" y="2" width="2" height="2" />

          <rect x="2" y="5" width="2" height="2" />
          <rect x="8" y="5" width="2" height="2" />
          <rect x="11" y="5" width="2" height="2" />
          <rect x="17" y="5" width="2" height="2" />
          <rect x="20" y="5" width="2" height="2" />

          <rect x="2" y="8" width="2" height="2" />
          <rect x="5" y="8" width="2" height="2" />
          <rect x="11" y="8" width="2" height="2" />
          <rect x="14" y="8" width="2" height="2" />
          <rect x="20" y="8" width="2" height="2" />

          <rect x="5" y="11" width="2" height="2" />
          <rect x="8" y="11" width="2" height="2" />
          <rect x="14" y="11" width="2" height="2" />
          <rect x="17" y="11" width="2" height="2" />

          <rect x="2" y="14" width="2" height="2" />
          <rect x="8" y="14" width="2" height="2" />
          <rect x="11" y="14" width="2" height="2" />
          <rect x="17" y="14" width="2" height="2" />
          <rect x="20" y="14" width="2" height="2" />

          <rect x="2" y="17" width="2" height="2" />
          <rect x="5" y="17" width="2" height="2" />
          <rect x="11" y="17" width="2" height="2" />
          <rect x="14" y="17" width="2" height="2" />
          <rect x="17" y="17" width="2" height="2" />

          <rect x="2" y="20" width="2" height="2" />
          <rect x="8" y="20" width="2" height="2" />
          <rect x="14" y="20" width="2" height="2" />
          <rect x="17" y="20" width="2" height="2" />
          <rect x="20" y="20" width="2" height="2" />
        </svg>
      </div>
    ),
    { ...size }
  )
}