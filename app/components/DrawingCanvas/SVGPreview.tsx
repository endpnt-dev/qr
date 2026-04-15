'use client'

import { memo } from 'react'

interface SVGPreviewProps {
  path: string
  strokeColor: string
  strokeWidth: number
  fill: string
  className?: string
}

function SVGPreview({ path, strokeColor, strokeWidth, fill, className = '' }: SVGPreviewProps) {
  return (
    <div className={`relative ${className}`}>
      {/* SVG Preview */}
      <div className="w-full aspect-square bg-gray-100 border-2 border-gray-300 rounded-lg">
        <svg
          className="w-full h-full"
          viewBox="0 0 200 200"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* QR Code guide rectangle */}
          <rect
            x="30"
            y="30"
            width="140"
            height="140"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* QR Code placeholder pattern */}
          <rect x="30" y="30" width="140" height="140" fill="white" />
          <defs>
            <pattern id="qr-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="4" height="4" fill="black" />
              <rect x="4" y="4" width="4" height="4" fill="black" />
            </pattern>
          </defs>
          <rect x="35" y="35" width="130" height="130" fill="url(#qr-pattern)" opacity="0.3" />

          {/* User's drawn border path */}
          {path && (
            <path
              d={path}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill={fill === 'none' ? 'none' : fill}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      {/* Preview label */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Preview
      </div>
    </div>
  )
}

export default memo(SVGPreview)