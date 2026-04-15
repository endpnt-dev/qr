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
      {/* QR Code placeholder */}
      <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="w-32 h-32 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <div className="w-24 h-24 bg-black" style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 3px, black 3px, black 6px),
              repeating-linear-gradient(90deg, transparent, transparent 3px, black 3px, black 6px)
            `,
            backgroundSize: '12px 12px'
          }}>
          </div>
        </div>
      </div>

      {/* SVG Border overlay */}
      {path && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 200 200"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={path}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={fill === 'none' ? 'none' : fill}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* Preview label */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Preview
      </div>
    </div>
  )
}

export default memo(SVGPreview)