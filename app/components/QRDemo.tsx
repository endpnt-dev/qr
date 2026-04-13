'use client'

import { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'

export default function QRDemo() {
  const [data, setData] = useState('https://endpnt.dev')
  const [color, setColor] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')
  const [size, setSize] = useState(300)
  const [margin, setMargin] = useState(2)
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [qrImage, setQrImage] = useState('')

  const debouncedValues = useMemo(() => ({
    data,
    color,
    background,
    size,
    margin,
    errorCorrection
  }), [data, color, background, size, margin, errorCorrection])

  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataURL = await QRCode.toDataURL(debouncedValues.data, {
          errorCorrectionLevel: debouncedValues.errorCorrection,
          color: {
            dark: debouncedValues.color,
            light: debouncedValues.background,
          },
          width: debouncedValues.size,
          margin: debouncedValues.margin,
        })
        setQrImage(dataURL)
      } catch (error) {
        console.error('QR generation error:', error)
      }
    }

    const timer = setTimeout(generateQR, 150)
    return () => clearTimeout(timer)
  }, [debouncedValues])

  return (
    <div className="bg-muted/30 rounded-lg p-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold mb-6 text-center">Live QR Code Generator</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Data Input */}
            <div>
              <label htmlFor="data" className="block text-sm font-medium mb-2">
                Data to encode
              </label>
              <textarea
                id="data"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md resize-none"
                rows={3}
                placeholder="Enter text, URL, or any data..."
              />
            </div>

            {/* Color Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="color" className="block text-sm font-medium mb-2">
                  QR Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-8 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm font-mono"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="background" className="block text-sm font-medium mb-2">
                  Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="background"
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-12 h-8 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm font-mono"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            </div>

            {/* Size Slider */}
            <div>
              <label htmlFor="size" className="block text-sm font-medium mb-2">
                Size: {size}px
              </label>
              <input
                id="size"
                type="range"
                min="100"
                max="500"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Margin Slider */}
            <div>
              <label htmlFor="margin" className="block text-sm font-medium mb-2">
                Margin: {margin}
              </label>
              <input
                id="margin"
                type="range"
                min="0"
                max="8"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Error Correction */}
            <div>
              <label htmlFor="errorCorrection" className="block text-sm font-medium mb-2">
                Error Correction Level
              </label>
              <select
                id="errorCorrection"
                value={errorCorrection}
                onChange={(e) => setErrorCorrection(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              >
                <option value="L">L (Low) - ~7%</option>
                <option value="M">M (Medium) - ~15%</option>
                <option value="Q">Q (Quartile) - ~25%</option>
                <option value="H">H (High) - ~30%</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-background rounded-lg p-6 border border-border shadow-lg">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt="Generated QR Code"
                  className="max-w-full h-auto"
                  style={{ width: size, height: size }}
                />
              ) : (
                <div
                  className="bg-muted flex items-center justify-center rounded-lg"
                  style={{ width: size, height: size }}
                >
                  <span className="text-muted-foreground">Generating...</span>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Want logo embedding or different formats?
              </p>
              <p className="text-sm text-primary-600 font-medium">
                Try the API tester in our documentation →
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}