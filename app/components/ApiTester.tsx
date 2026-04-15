'use client'

import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import CodeBlock from './CodeBlock'

interface ApiResponse {
  success: boolean
  data?: {
    image?: string
    svg?: string
    format: string
    size: number
    file_size_bytes: number
    warnings?: string[]
  }
  error?: {
    code: string
    message: string
  }
  meta: {
    request_id: string
    processing_ms: number
    remaining_credits?: number
  }
}

export default function ApiTester() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [params, setParams] = useState({
    data: 'https://endpnt.dev',
    format: 'png',
    size: 300,
    color: '#000000',
    background: '#ffffff',
    margin: 2,
    error_correction: 'M',
    logo_url: '',
    logo_size: 20,
  })

  const handleTest = async () => {
    setLoading(true)
    setResponse(null)

    try {
      const requestBody = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {} as any)

      const res = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ek_live_74qlNSbK5jTwQ28Y',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await res.json()
      setResponse(result)
    } catch (error) {
      setResponse({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to API',
        },
        meta: {
          request_id: 'unknown',
          processing_ms: 0,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">API Parameters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Data */}
          <div className="md:col-span-2 lg:col-span-3">
            <label htmlFor="api-data" className="block text-sm font-medium mb-1">
              Data <span className="text-red-400">*</span>
            </label>
            <textarea
              id="api-data"
              value={params.data}
              onChange={(e) => setParams(prev => ({ ...prev, data: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md resize-none"
              rows={2}
              placeholder="Text or URL to encode"
            />
          </div>

          {/* Format */}
          <div>
            <label htmlFor="api-format" className="block text-sm font-medium mb-1">
              Format
            </label>
            <select
              id="api-format"
              value={params.format}
              onChange={(e) => setParams(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
              <option value="svg">SVG</option>
            </select>
          </div>

          {/* Size */}
          <div>
            <label htmlFor="api-size" className="block text-sm font-medium mb-1">
              Size (px)
            </label>
            <input
              id="api-size"
              type="number"
              min="100"
              max="2000"
              value={params.size}
              onChange={(e) => setParams(prev => ({ ...prev, size: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            />
          </div>

          {/* Margin */}
          <div>
            <label htmlFor="api-margin" className="block text-sm font-medium mb-1">
              Margin
            </label>
            <input
              id="api-margin"
              type="number"
              min="0"
              max="10"
              value={params.margin}
              onChange={(e) => setParams(prev => ({ ...prev, margin: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            />
          </div>

          {/* Color */}
          <div>
            <label htmlFor="api-color" className="block text-sm font-medium mb-1">
              QR Color
            </label>
            <input
              id="api-color"
              type="color"
              value={params.color}
              onChange={(e) => setParams(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 bg-background border border-border rounded-md"
            />
          </div>

          {/* Background */}
          <div>
            <label htmlFor="api-background" className="block text-sm font-medium mb-1">
              Background
            </label>
            <input
              id="api-background"
              type="color"
              value={params.background}
              onChange={(e) => setParams(prev => ({ ...prev, background: e.target.value }))}
              className="w-full h-10 bg-background border border-border rounded-md"
            />
          </div>

          {/* Error Correction */}
          <div>
            <label htmlFor="api-error" className="block text-sm font-medium mb-1">
              Error Correction
            </label>
            <select
              id="api-error"
              value={params.error_correction}
              onChange={(e) => setParams(prev => ({ ...prev, error_correction: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="L">L (Low)</option>
              <option value="M">M (Medium)</option>
              <option value="Q">Q (Quartile)</option>
              <option value="H">H (High)</option>
            </select>
          </div>

          {/* Logo URL */}
          <div className="md:col-span-2">
            <label htmlFor="api-logo-url" className="block text-sm font-medium mb-1">
              Logo URL (optional)
            </label>
            <input
              id="api-logo-url"
              type="url"
              value={params.logo_url}
              onChange={(e) => setParams(prev => ({ ...prev, logo_url: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Logo Size */}
          <div>
            <label htmlFor="api-logo-size" className="block text-sm font-medium mb-1">
              Logo Size (%)
            </label>
            <input
              id="api-logo-size"
              type="number"
              min="5"
              max="30"
              value={params.logo_size}
              onChange={(e) => setParams(prev => ({ ...prev, logo_size: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={handleTest}
            disabled={loading || !params.data}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Generate QR Code
          </button>
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="space-y-6">
          {/* Generated Image */}
          {response.success && response.data && (
            <div className="bg-background rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4">Generated QR Code</h3>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 text-center">
                  {response.data.svg ? (
                    <div
                      className="inline-block border border-border rounded-lg p-4"
                      dangerouslySetInnerHTML={{ __html: response.data.svg }}
                    />
                  ) : response.data.image ? (
                    <img
                      src={`data:image/${response.data.format};base64,${response.data.image}`}
                      alt="Generated QR Code"
                      className="inline-block border border-border rounded-lg p-4 bg-white"
                    />
                  ) : null}

                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    <div>Format: {response.data.format.toUpperCase()}</div>
                    <div>Size: {response.data.size}px</div>
                    <div>File size: {Math.round(response.data.file_size_bytes / 1024)} KB</div>
                    {response.data.warnings && (
                      <div className="text-yellow-600">
                        Warnings: {response.data.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw JSON Response */}
          <div>
            <h3 className="text-lg font-semibold mb-4">API Response</h3>
            <CodeBlock
              code={JSON.stringify(response, null, 2)}
              language="json"
            />
          </div>
        </div>
      )}
    </div>
  )
}