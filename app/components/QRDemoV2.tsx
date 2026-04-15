'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { QRCode } from 'qrcode'
import { Download, Palette, Square, Circle, Sparkles, Image as ImageIcon, Brush, Camera } from 'lucide-react'
import CodeBlock from './CodeBlock'
import { DrawingCanvas } from './DrawingCanvas'

// Types for v2 API
interface GradientStop {
  offset: number
  color: string
}

interface Gradient {
  type: 'linear' | 'radial'
  rotation?: number
  colors: GradientStop[]
}

interface BorderStyled {
  mode: 'styled'
  width?: number
  color?: string
  radius?: number
  padding?: number
  label?: {
    text: string
    position?: 'top' | 'bottom'
    font_size?: number
    font_color?: string
  }
}

interface BorderImage {
  mode: 'image'
  image_url: string
  width?: number
  padding?: number
  opacity?: number
}

interface BorderSVG {
  mode: 'svg'
  svg_path: string
  viewBox: string
  stroke_color?: string
  stroke_width?: number
  fill?: string
  padding?: number
}

type Border = BorderStyled | BorderImage | BorderSVG

interface Overlay {
  photo_url: string
  position: { x: number; y: number }
  qr_size?: number
  opacity?: number
}

interface QRParams {
  data: string
  size: number
  format: 'png' | 'svg' | 'jpeg' | 'webp'
  color: string
  background: string
  margin: number
  error_correction: 'L' | 'M' | 'Q' | 'H'
  logo_url?: string
  logo_size?: number
  dot_style?: 'square' | 'dot' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'
  eye_shape?: 'square' | 'dot' | 'rounded' | 'classy'
  eye_inner_shape?: 'square' | 'dot' | 'rounded' | 'classy'
  eye_color?: string
  eye_inner_color?: string
  gradient?: Gradient
  border?: Border
  overlay?: Overlay
}

const DOT_STYLES = [
  { id: 'square', name: 'Square', icon: Square, preview: '⬜' },
  { id: 'dot', name: 'Dots', icon: Circle, preview: '⚫' },
  { id: 'rounded', name: 'Rounded', icon: Square, preview: '⬛' },
  { id: 'extra-rounded', name: 'Extra Rounded', icon: Square, preview: '🔳' },
  { id: 'classy', name: 'Classy', icon: Sparkles, preview: '◆' },
  { id: 'classy-rounded', name: 'Classy Rounded', icon: Sparkles, preview: '◇' }
] as const

const EYE_STYLES = [
  { id: 'square', name: 'Square', preview: '⬜' },
  { id: 'dot', name: 'Dot', preview: '⚫' },
  { id: 'rounded', name: 'Rounded', preview: '🔳' },
  { id: 'classy', name: 'Classy', preview: '◆' }
] as const

const SAMPLE_IMAGES = [
  'https://picsum.photos/400/400?random=1',
  'https://picsum.photos/400/400?random=2',
  'https://picsum.photos/600/400?random=3',
  'https://picsum.photos/500/300?random=4'
]

export default function QRDemoV2() {
  // Basic QR parameters
  const [params, setParams] = useState<QRParams>({
    data: 'https://endpnt.dev',
    size: 400,
    format: 'png',
    color: '#000000',
    background: '#FFFFFF',
    margin: 4,
    error_correction: 'M'
  })

  // UI state
  const [activeTab, setActiveTab] = useState<'styling' | 'borders' | 'overlay'>('styling')
  const [borderMode, setBorderMode] = useState<'styled' | 'image' | 'svg'>('styled')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)

  // SVG path state for custom borders
  const [svgPath, setSvgPath] = useState('')

  // Generate QR code
  const generateQR = useCallback(async () => {
    if (!params.data.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/v2/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ek_live_hoWnzx74NUf04esiG8pv' // Live demo key (free tier)
        },
        body: JSON.stringify(params)
      })

      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorResult = await response.json()
          if (errorResult.error) {
            if (typeof errorResult.error === 'string') {
              errorMessage = errorResult.error
            } else if (errorResult.error.message) {
              errorMessage = errorResult.error.message
            } else if (errorResult.error.code) {
              errorMessage = `Error: ${errorResult.error.code}`
            }
          }
        } catch (jsonErr) {
          // If we can't parse the error response, use the HTTP status
        }

        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please check your API key.'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.'
        } else if (response.status === 402) {
          errorMessage = 'This feature requires a premium subscription.'
        }

        setError(errorMessage)
        return
      }

      const result = await response.json()

      if (result.success) {
        setGeneratedQR(`data:image/${params.format};base64,${result.data.image}`)

        if (result.data.warnings && result.data.warnings.length > 0) {
          console.warn('QR Generation Warnings:', result.data.warnings)
        }
      } else {
        // Handle API-level errors (when response is 200 but success: false)
        let errorMessage = 'QR generation failed'
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMessage = result.error
          } else if (result.error.message) {
            errorMessage = result.error.message
          } else if (result.error.code) {
            errorMessage = `Error: ${result.error.code}`
          }
        }
        setError(errorMessage)
      }
    } catch (err) {
      console.error('QR Generation Error:', err)
      setError(err instanceof Error ? err.message : 'Network error. Please check your connection.')
    } finally {
      setIsGenerating(false)
    }
  }, [params])

  // Auto-generate on parameter change
  useEffect(() => {
    const timeoutId = setTimeout(generateQR, 500)
    return () => clearTimeout(timeoutId)
  }, [generateQR])

  // Update parameter helper
  const updateParam = useCallback(<K extends keyof QRParams>(key: K, value: QRParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])

  // Download QR code
  const downloadQR = useCallback(() => {
    if (!generatedQR) return

    const link = document.createElement('a')
    link.href = generatedQR
    link.download = `qr-code.${params.format}`
    link.click()
  }, [generatedQR, params.format])

  // Handle path changes from DrawingCanvas
  const handlePathChange = useCallback((path: string) => {
    setSvgPath(path)
    if (path) {
      updateParam('border', {
        mode: 'svg',
        svg_path: path,
        viewBox: '0 0 200 200',
        stroke_color: params.border?.mode === 'svg' ? (params.border.stroke_color || '#2196F3') : '#2196F3',
        stroke_width: params.border?.mode === 'svg' ? (params.border.stroke_width || 3) : 3,
        fill: params.border?.mode === 'svg' ? (params.border.fill || 'none') : 'none',
        padding: 10
      } as BorderSVG)
    } else {
      // Clear border if no path
      updateParam('border', undefined)
    }
  }, [updateParam, params.border])

  // Generate API code example
  const generateCodeExample = useCallback(() => {
    const cleanParams = { ...params }
    // Remove undefined values for cleaner code
    Object.keys(cleanParams).forEach(key => {
      if (cleanParams[key as keyof QRParams] === undefined) {
        delete cleanParams[key as keyof QRParams]
      }
    })

    return `curl -X POST https://qr.endpnt.dev/api/v2/generate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '${JSON.stringify(cleanParams, null, 2)}'`
  }, [params])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">QR Code API v2 Demo</h1>
        <p className="text-xl text-muted-foreground mb-2">
          Premium QR Code Generation with Advanced Styling
        </p>
        <p className="text-sm text-muted-foreground">
          Dot shapes • Eye customization • Gradients • Custom borders • Photo overlays
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-green-700">FREE: Styling & gradients</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-blue-700">STARTER+: Advanced borders & overlays</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Panel */}
        <div className="space-y-6">
          {/* Basic Parameters */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Basic Parameters</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data to encode</label>
                <input
                  type="text"
                  value={params.data}
                  onChange={(e) => updateParam('data', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-background"
                  placeholder="Enter text or URL..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  <select
                    value={params.size}
                    onChange={(e) => updateParam('size', parseInt(e.target.value))}
                    className="w-full p-3 border rounded-lg bg-background"
                  >
                    <option value={200}>200px</option>
                    <option value={300}>300px</option>
                    <option value={400}>400px</option>
                    <option value={500}>500px</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <select
                    value={params.format}
                    onChange={(e) => updateParam('format', e.target.value as any)}
                    className="w-full p-3 border rounded-lg bg-background"
                  >
                    <option value="png">PNG</option>
                    <option value="svg">SVG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Foreground Color</label>
                  <input
                    type="color"
                    value={params.color}
                    onChange={(e) => updateParam('color', e.target.value)}
                    className="w-full h-12 border rounded-lg bg-background cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Background Color</label>
                  <input
                    type="color"
                    value={params.background}
                    onChange={(e) => updateParam('background', e.target.value)}
                    className="w-full h-12 border rounded-lg bg-background cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Styling Tabs */}
          <div className="bg-card rounded-lg border">
            {/* Tab Headers */}
            <div className="flex border-b">
              {[
                { id: 'styling', label: 'Styling', icon: Palette },
                { id: 'borders', label: 'Borders', icon: Square },
                { id: 'overlay', label: 'Overlay', icon: Camera }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'styling' && (
                <div className="space-y-6">
                  {/* Dot Styles */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Dot Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DOT_STYLES.map(({ id, name, preview }) => (
                        <button
                          key={id}
                          onClick={() => updateParam('dot_style', id as any)}
                          className={`p-3 text-center border rounded-lg transition-colors ${
                            params.dot_style === id
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-lg mb-1">{preview}</div>
                          <div className="text-xs">{name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Eye Styles */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Eye Pattern</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-2">Outer Shape</label>
                        <select
                          value={params.eye_shape || 'square'}
                          onChange={(e) => updateParam('eye_shape', e.target.value as any)}
                          className="w-full p-2 text-sm border rounded bg-background"
                        >
                          {EYE_STYLES.map(({ id, name }) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-2">Inner Shape</label>
                        <select
                          value={params.eye_inner_shape || 'square'}
                          onChange={(e) => updateParam('eye_inner_shape', e.target.value as any)}
                          className="w-full p-2 text-sm border rounded bg-background"
                        >
                          {EYE_STYLES.map(({ id, name }) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Eye Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Eye Color</label>
                      <input
                        type="color"
                        value={params.eye_color || params.color}
                        onChange={(e) => updateParam('eye_color', e.target.value)}
                        className="w-full h-10 border rounded bg-background cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Eye Inner Color</label>
                      <input
                        type="color"
                        value={params.eye_inner_color || params.color}
                        onChange={(e) => updateParam('eye_inner_color', e.target.value)}
                        className="w-full h-10 border rounded bg-background cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Gradient */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">Gradient</label>
                      <button
                        onClick={() => updateParam('gradient', params.gradient ? undefined : {
                          type: 'linear',
                          rotation: 45,
                          colors: [
                            { offset: 0, color: '#0F6E56' },
                            { offset: 1, color: '#2196F3' }
                          ]
                        })}
                        className={`px-3 py-1 text-xs rounded ${
                          params.gradient
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {params.gradient ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {params.gradient && (
                      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium mb-1">Type</label>
                          <select
                            value={params.gradient.type}
                            onChange={(e) => updateParam('gradient', {
                              ...params.gradient!,
                              type: e.target.value as 'linear' | 'radial'
                            })}
                            className="w-full p-2 text-sm border rounded bg-background"
                          >
                            <option value="linear">Linear</option>
                            <option value="radial">Radial</option>
                          </select>
                        </div>

                        {params.gradient.type === 'linear' && (
                          <div>
                            <label className="block text-xs font-medium mb-1">Rotation (degrees)</label>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={params.gradient.rotation || 0}
                              onChange={(e) => updateParam('gradient', {
                                ...params.gradient!,
                                rotation: parseInt(e.target.value)
                              })}
                              className="w-full"
                            />
                            <div className="text-center text-xs text-gray-500">
                              {params.gradient.rotation || 0}°
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Start Color</label>
                            <input
                              type="color"
                              value={params.gradient.colors[0]?.color || '#0F6E56'}
                              onChange={(e) => {
                                const newColors = [...params.gradient!.colors]
                                newColors[0] = { offset: 0, color: e.target.value }
                                updateParam('gradient', { ...params.gradient!, colors: newColors })
                              }}
                              className="w-full h-8 border rounded cursor-pointer bg-background"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">End Color</label>
                            <input
                              type="color"
                              value={params.gradient.colors[1]?.color || '#2196F3'}
                              onChange={(e) => {
                                const newColors = [...params.gradient!.colors]
                                newColors[1] = { offset: 1, color: e.target.value }
                                updateParam('gradient', { ...params.gradient!, colors: newColors })
                              }}
                              className="w-full h-8 border rounded cursor-pointer bg-background"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'borders' && (
                <div className="space-y-6">
                  {/* Border Mode Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Border Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'styled', name: 'Styled', icon: Square, desc: 'Color & text' },
                        { id: 'image', name: 'Image', icon: ImageIcon, desc: 'Photo frame', tier: 'starter' },
                        { id: 'svg', name: 'Freehand', icon: Brush, desc: 'Draw custom', tier: 'starter' }
                      ].map(({ id, name, icon: Icon, desc, tier }) => (
                        <button
                          key={id}
                          onClick={() => {
                            setBorderMode(id as any)
                            if (id === 'styled') {
                              updateParam('border', {
                                mode: 'styled',
                                width: 20,
                                color: '#2C3E50',
                                radius: 8,
                                padding: 12
                              } as BorderStyled)
                            } else if (id === 'image') {
                              updateParam('border', {
                                mode: 'image',
                                image_url: SAMPLE_IMAGES[0],
                                width: 40,
                                padding: 8
                              } as BorderImage)
                            } else {
                              updateParam('border', undefined)
                            }
                          }}
                          className={`p-3 text-center border rounded-lg transition-colors ${
                            borderMode === id
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="relative">
                            <Icon className="w-5 h-5 mx-auto mb-1" />
                            {tier === 'starter' && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <div className="text-sm font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">{desc}</div>
                          {tier === 'starter' && (
                            <div className="text-xs text-blue-600 font-medium">STARTER+</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Styled Border Controls */}
                  {borderMode === 'styled' && params.border?.mode === 'styled' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Width</label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={params.border?.width || 20}
                            onChange={(e) => updateParam('border', {
                              ...params.border,
                              width: parseInt(e.target.value)
                            } as BorderStyled)}
                            className="w-full"
                          />
                          <div className="text-center text-xs text-gray-500">
                            {params.border?.width || 20}px
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Border Color</label>
                          <input
                            type="color"
                            value={params.border?.color || '#2C3E50'}
                            onChange={(e) => updateParam('border', {
                              ...params.border,
                              color: e.target.value
                            } as BorderStyled)}
                            className="w-full h-10 border rounded cursor-pointer bg-background"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Label Text</label>
                        <input
                          type="text"
                          value={params.border?.label?.text || ''}
                          onChange={(e) => {
                            if (params.border?.mode === 'styled') {
                              updateParam('border', {
                                ...params.border,
                                label: {
                                  ...params.border?.label || {},
                                  text: e.target.value,
                                  position: 'bottom',
                                  font_size: 14,
                                  font_color: '#FFFFFF'
                                }
                              } as BorderStyled)
                            }
                          }}
                          placeholder="Enter border label..."
                          className="w-full p-2 border rounded bg-background"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Border Controls */}
                  {borderMode === 'image' && params.border?.mode === 'image' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-2">Frame Image</label>
                        <div className="grid grid-cols-2 gap-2">
                          {SAMPLE_IMAGES.map((url, index) => (
                            <button
                              key={url}
                              onClick={() => updateParam('border', {
                                ...params.border,
                                image_url: url
                              } as BorderImage)}
                              className={`aspect-square border-2 rounded-lg overflow-hidden transition-colors ${
                                params.border?.mode === 'image' && params.border?.image_url === url
                                  ? 'border-primary'
                                  : 'border-gray-300'
                              }`}
                            >
                              <img src={url} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Frame Width</label>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={params.border?.width || 40}
                          onChange={(e) => updateParam('border', {
                            ...params.border,
                            width: parseInt(e.target.value)
                          } as BorderImage)}
                          className="w-full"
                        />
                        <div className="text-center text-xs text-gray-500">
                          {params.border?.width || 40}px
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SVG Border Controls */}
                  {borderMode === 'svg' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <DrawingCanvas
                        onPathChange={handlePathChange}
                        strokeColor={params.border?.mode === 'svg' ? (params.border.stroke_color || '#2196F3') : '#2196F3'}
                        strokeWidth={params.border?.mode === 'svg' ? (params.border.stroke_width || 3) : 3}
                        fill={params.border?.mode === 'svg' ? (params.border.fill || 'none') : 'none'}
                        initialPath={svgPath}
                        className="w-full"
                      />

                      {/* SVG Style Controls */}
                      {params.border?.mode === 'svg' && (
                        <div className="mt-4 space-y-3 p-3 bg-white border rounded">
                          <h5 className="text-sm font-medium">Border Style</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Stroke Color</label>
                              <input
                                type="color"
                                value={params.border?.mode === 'svg' ? (params.border.stroke_color || '#2196F3') : '#2196F3'}
                                onChange={(e) => {
                                  if (params.border?.mode === 'svg') {
                                    updateParam('border', {
                                      ...params.border,
                                      stroke_color: e.target.value
                                    } as BorderSVG)
                                  }
                                }}
                                className="w-full h-8 border rounded cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Stroke Width</label>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={params.border?.mode === 'svg' ? (params.border.stroke_width || 3) : 3}
                                onChange={(e) => {
                                  if (params.border?.mode === 'svg') {
                                    updateParam('border', {
                                      ...params.border,
                                      stroke_width: parseInt(e.target.value)
                                    } as BorderSVG)
                                  }
                                }}
                                className="w-full"
                              />
                              <div className="text-center text-xs text-gray-500">
                                {params.border?.mode === 'svg' ? (params.border.stroke_width || 3) : 3}px
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Fill Color (optional)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={(params.border?.mode === 'svg' && params.border.fill === 'none') ? '#FFFFFF' : (params.border?.mode === 'svg' ? params.border.fill : undefined) || '#FFFFFF'}
                                onChange={(e) => {
                                  if (params.border?.mode === 'svg') {
                                    updateParam('border', {
                                      ...params.border,
                                      fill: e.target.value
                                    } as BorderSVG)
                                  }
                                }}
                                className="flex-1 h-8 border rounded cursor-pointer"
                                disabled={params.border?.mode === 'svg' && params.border.fill === 'none'}
                              />
                              <button
                                onClick={() => {
                                  if (params.border?.mode === 'svg') {
                                    updateParam('border', {
                                      ...params.border,
                                      fill: params.border.fill === 'none' ? '#FFFFFF' : 'none'
                                    } as BorderSVG)
                                  }
                                }}
                                className={`px-3 py-1 text-xs rounded ${
                                  params.border?.mode === 'svg' && params.border.fill === 'none'
                                    ? 'bg-gray-200 text-gray-700'
                                    : 'bg-primary text-primary-foreground'
                                }`}
                              >
                                {(params.border?.mode === 'svg' && params.border.fill === 'none') ? 'No Fill' : 'Filled'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Border Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enable Border</span>
                    <button
                      onClick={() => updateParam('border', params.border ? undefined : {
                        mode: 'styled',
                        width: 20,
                        color: '#2C3E50',
                        padding: 12
                      } as BorderStyled)}
                      className={`px-3 py-1 text-xs rounded ${
                        params.border
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {params.border ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'overlay' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-muted-foreground">
                        Place your QR code on top of a photo at a custom position.
                      </p>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                        STARTER+
                      </span>
                    </div>

                    {/* Background Photo Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Background Photo</label>
                      <div className="grid grid-cols-2 gap-2">
                        {SAMPLE_IMAGES.map((url, index) => (
                          <button
                            key={url}
                            onClick={() => updateParam('overlay', {
                              photo_url: url,
                              position: { x: 0.75, y: 0.75 },
                              qr_size: 25,
                              opacity: 0.95
                            })}
                            className={`aspect-video border-2 rounded-lg overflow-hidden transition-colors ${
                              params.overlay?.photo_url === url
                                ? 'border-primary'
                                : 'border-gray-300'
                            }`}
                          >
                            <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {params.overlay && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium mb-2">QR Size on Photo</label>
                          <input
                            type="range"
                            min="15"
                            max="50"
                            value={params.overlay.qr_size || 25}
                            onChange={(e) => updateParam('overlay', {
                              ...params.overlay!,
                              qr_size: parseInt(e.target.value)
                            })}
                            className="w-full"
                          />
                          <div className="text-center text-xs text-gray-500">
                            {params.overlay.qr_size || 25}% of photo
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">X Position</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={params.overlay.position.x}
                              onChange={(e) => updateParam('overlay', {
                                ...params.overlay!,
                                position: {
                                  ...params.overlay!.position,
                                  x: parseFloat(e.target.value)
                                }
                              })}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Y Position</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={params.overlay.position.y}
                              onChange={(e) => updateParam('overlay', {
                                ...params.overlay!,
                                position: {
                                  ...params.overlay!.position,
                                  y: parseFloat(e.target.value)
                                }
                              })}
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Opacity</label>
                          <input
                            type="range"
                            min="0.3"
                            max="1"
                            step="0.05"
                            value={params.overlay.opacity || 0.95}
                            onChange={(e) => updateParam('overlay', {
                              ...params.overlay!,
                              opacity: parseFloat(e.target.value)
                            })}
                            className="w-full"
                          />
                          <div className="text-center text-xs text-gray-500">
                            {Math.round((params.overlay.opacity || 0.95) * 100)}%
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overlay Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Enable Photo Overlay</span>
                      <button
                        onClick={() => updateParam('overlay', params.overlay ? undefined : {
                          photo_url: SAMPLE_IMAGES[0],
                          position: { x: 0.75, y: 0.75 },
                          qr_size: 25,
                          opacity: 0.95
                        })}
                        className={`px-3 py-1 text-xs rounded ${
                          params.overlay
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {params.overlay ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* QR Code Preview */}
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {showCode ? 'Hide Code' : 'Show Code'}
                </button>
                {generatedQR && (
                  <button
                    onClick={downloadQR}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
            </div>

            <div className="aspect-square border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
              {isGenerating ? (
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Generating QR code...</p>
                </div>
              ) : error ? (
                <div className="text-center p-4">
                  <p className="text-red-500 text-sm mb-2">Generation Error</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
              ) : generatedQR ? (
                <img
                  src={generatedQR}
                  alt="Generated QR Code"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-muted-foreground">Enter data to generate QR code</p>
              )}
            </div>

            {/* Feature Indicators */}
            {generatedQR && (
              <div className="flex flex-wrap gap-1 mt-3">
                {params.dot_style && params.dot_style !== 'square' && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {params.dot_style} dots
                  </span>
                )}
                {params.gradient && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                    {params.gradient.type} gradient
                  </span>
                )}
                {params.border && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                    {params.border?.mode} border
                  </span>
                )}
                {params.overlay && (
                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                    photo overlay
                  </span>
                )}
              </div>
            )}
          </div>

          {/* API Code Example */}
          {showCode && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">API Code</h3>
              <CodeBlock
                code={generateCodeExample()}
                language="bash"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}