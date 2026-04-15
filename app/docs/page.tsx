import Link from 'next/link'
import { QrCode, Key, AlertTriangle, ArrowLeft } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'
import ApiTester from '../components/ApiTester'

const parameters = [
  {
    name: 'data',
    type: 'string',
    required: true,
    default: '—',
    description: 'Text, URL, or any data to encode in the QR code'
  },
  {
    name: 'format',
    type: 'string',
    required: false,
    default: 'png',
    description: 'Output format: "png", "jpeg", "webp", "svg"'
  },
  {
    name: 'size',
    type: 'number',
    required: false,
    default: '300',
    description: 'QR code size in pixels (100-2000)'
  },
  {
    name: 'color',
    type: 'string',
    required: false,
    default: '#000000',
    description: 'QR code color in hex format (e.g., #000000)'
  },
  {
    name: 'background',
    type: 'string',
    required: false,
    default: '#ffffff',
    description: 'Background color in hex format (e.g., #ffffff)'
  },
  {
    name: 'margin',
    type: 'number',
    required: false,
    default: '2',
    description: 'Margin around QR code (0-10)'
  },
  {
    name: 'error_correction',
    type: 'string',
    required: false,
    default: 'M',
    description: 'Error correction level: "L", "M", "Q", "H"'
  },
  {
    name: 'logo_url',
    type: 'string',
    required: false,
    default: '—',
    description: 'URL to logo image for embedding (HTTP/HTTPS only)'
  },
  {
    name: 'logo_size',
    type: 'number',
    required: false,
    default: '20',
    description: 'Logo size as percentage of QR code (5-30)'
  }
]

const errorCodes = [
  {
    code: 'AUTH_REQUIRED',
    status: '401',
    description: 'Missing x-api-key header'
  },
  {
    code: 'INVALID_API_KEY',
    status: '401',
    description: 'API key does not exist or is invalid'
  },
  {
    code: 'RATE_LIMIT_EXCEEDED',
    status: '429',
    description: 'Too many requests for your tier'
  },
  {
    code: 'INVALID_PARAMS',
    status: '400',
    description: 'Parameter validation failed'
  },
  {
    code: 'DATA_TOO_LONG',
    status: '400',
    description: 'Input data exceeds maximum length'
  },
  {
    code: 'LOGO_FETCH_FAILED',
    status: '400',
    description: 'Could not fetch or process logo image'
  },
  {
    code: 'GENERATION_FAILED',
    status: '500',
    description: 'QR code generation failed'
  },
  {
    code: 'INTERNAL_ERROR',
    status: '500',
    description: 'Internal server error'
  }
]

const codeExamples = {
  curl: `curl -X POST https://qr.endpnt.dev/api/v1/generate \\
  -H "x-api-key: ek_live_74qlNSbK5jTwq28Y" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": "https://example.com",
    "format": "png",
    "size": 300,
    "color": "#000000",
    "background": "#ffffff",
    "error_correction": "M"
  }'`,

  javascript: `// Using fetch
const response = await fetch('https://qr.endpnt.dev/api/v1/generate', {
  method: 'POST',
  headers: {
    'x-api-key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: 'https://example.com',
    format: 'png',
    size: 300,
    color: '#000000',
    background: '#ffffff',
    logo_url: 'https://example.com/logo.png',
    logo_size: 20
  })
});

const result = await response.json();
if (result.success) {
  // result.data.image contains base64 image data
  const img = document.createElement('img');
  img.src = \`data:image/\${result.data.format};base64,\${result.data.image}\`;
  document.body.appendChild(img);
}`,

  python: `import requests
import base64

# Make the API request
response = requests.post(
    'https://qr.endpnt.dev/api/v1/generate',
    headers={
        'x-api-key': 'your_api_key',
        'Content-Type': 'application/json'
    },
    json={
        'data': 'https://example.com',
        'format': 'png',
        'size': 300,
        'color': '#000000',
        'background': '#ffffff',
        'error_correction': 'M'
    }
)

result = response.json()
if result['success']:
    # Decode and save the QR code
    image_data = base64.b64decode(result['data']['image'])
    with open('qrcode.png', 'wb') as f:
        f.write(image_data)
    print(f"Saved QR code: {result['data']['size']}px")`,

  node: `// Using Node.js with axios
const axios = require('axios');
const fs = require('fs');

async function generateQR(data) {
  try {
    const response = await axios.post(
      'https://qr.endpnt.dev/api/v1/generate',
      {
        data: data,
        format: 'png',
        size: 300,
        color: '#000000',
        background: '#ffffff'
      },
      {
        headers: {
          'x-api-key': 'your_api_key',
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      const imageBuffer = Buffer.from(response.data.data.image, 'base64');
      fs.writeFileSync('qrcode.png', imageBuffer);
      console.log('QR code generated!');
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

generateQR('https://example.com');`
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary-600" />
              <span className="text-xl font-mono font-bold">QR Code API</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm hover:text-primary-600 transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to integrate the QR Code API into your application
            </p>
          </div>

          {/* Table of Contents */}
          <div className="bg-muted rounded-lg p-6 mb-12">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <a href="#authentication" className="text-sm text-muted-foreground hover:text-primary-600 transition-colors">Authentication</a>
              <a href="#endpoint" className="text-sm text-muted-foreground hover:text-primary-600 transition-colors">API Endpoint</a>
              <a href="#parameters" className="text-sm text-muted-foreground hover:text-primary-600 transition-colors">Parameters</a>
              <a href="#response" className="text-sm text-muted-foreground hover:text-primary-600 transition-colors">Response Format</a>
              <a href="#tester" className="text-sm text-muted-foreground hover:text-primary-600 transition-colors">API Tester</a>
              <a href="#examples" className="text-sm text-muted-foreground hover:text-primary-600 transition-colors">Code Examples</a>
              <a href="#errors" className="text-sm text-muted-foreground hover:text-primary-600 transition-colors">Error Codes</a>
              <a href="#rate-limits" className="text-sm text-muted-foreground hover:text-primary-600 transition-colors">Rate Limits</a>
            </div>
          </div>

          {/* Authentication */}
          <section id="authentication" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Key className="h-6 w-6" />
              Authentication
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                All API requests require an API key passed in the <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">x-api-key</code> header.
              </p>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Demo API Key</p>
                    <p className="text-sm text-muted-foreground">
                      Use <code className="bg-background px-1.5 py-0.5 rounded font-mono">ek_live_74qlNSbK5jTwq28Y</code> for testing.
                      This key has free tier limits (10 requests/minute, 100/month).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* API Endpoint */}
          <section id="endpoint" className="mb-16">
            <h2 className="text-2xl font-bold mb-6">API Endpoint</h2>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-1 bg-primary-600 text-white text-xs font-mono rounded">POST</span>
                    <code className="font-mono">https://qr.endpnt.dev/api/v1/generate</code>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-mono rounded">GET</span>
                    <code className="font-mono">https://qr.endpnt.dev/api/v1/generate?data=...</code>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                Both GET and POST methods are supported. For POST requests, send parameters in the request body as JSON.
                For GET requests, send parameters as URL query parameters.
              </p>
            </div>
          </section>

          {/* Parameters */}
          <section id="parameters" className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Parameters</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-lg">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Parameter</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Required</th>
                    <th className="text-left p-3 font-medium">Default</th>
                    <th className="text-left p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, index) => (
                    <tr key={param.name} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="p-3">
                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">{param.name}</code>
                      </td>
                      <td className="p-3 text-sm">{param.type}</td>
                      <td className="p-3 text-sm">
                        {param.required ? (
                          <span className="text-red-400">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="p-3 text-sm font-mono">{param.default}</td>
                      <td className="p-3 text-sm text-muted-foreground">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Response Format */}
          <section id="response" className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Response Format</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Success Response</h3>
                <CodeBlock
                  code={`{
  "success": true,
  "data": {
    "image": "base64_encoded_image_data...",
    "format": "png",
    "size": 300,
    "file_size_bytes": 12840,
    "warnings": []
  },
  "meta": {
    "request_id": "req_a1b2c3d4",
    "processing_ms": 245,
    "remaining_credits": 99
  }
}`}
                  language="json"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">Error Response</h3>
                <CodeBlock
                  code={`{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "data field is required and must be a string"
  },
  "meta": {
    "request_id": "req_a1b2c3d4",
    "processing_ms": 12
  }
}`}
                  language="json"
                />
              </div>
            </div>
          </section>

          {/* API Tester */}
          <section id="tester" className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Interactive API Tester</h2>
            <p className="text-muted-foreground mb-6">
              Test the API directly from this page. The demo key is pre-filled for convenience.
            </p>
            <ApiTester />
          </section>

          {/* Code Examples */}
          <section id="examples" className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Code Examples</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-3">cURL</h3>
                <CodeBlock code={codeExamples.curl} language="bash" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">JavaScript (Browser/Node.js)</h3>
                <CodeBlock code={codeExamples.javascript} language="javascript" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">Node.js with axios</h3>
                <CodeBlock code={codeExamples.node} language="javascript" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">Python</h3>
                <CodeBlock code={codeExamples.python} language="python" />
              </div>
            </div>
          </section>

          {/* Error Codes */}
          <section id="errors" className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Error Codes</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-lg">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Code</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {errorCodes.map((error, index) => (
                    <tr key={error.code} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="p-3">
                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">{error.code}</code>
                      </td>
                      <td className="p-3 text-sm font-mono">{error.status}</td>
                      <td className="p-3 text-sm text-muted-foreground">{error.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits" className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Rate Limits</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Rate limits depend on your subscription tier:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Free Tier</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>10 requests per minute</div>
                    <div>100 requests per month</div>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Starter ($29/month)</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>60 requests per minute</div>
                    <div>5,000 requests per month</div>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Pro ($99/month)</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>300 requests per minute</div>
                    <div>25,000 requests per month</div>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Enterprise (Custom)</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>1,000+ requests per minute</div>
                    <div>100,000+ requests per month</div>
                  </div>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Rate Limit Headers</p>
                    <p className="text-sm text-muted-foreground">
                      Check the <code className="bg-background px-1.5 py-0.5 rounded font-mono">remaining_credits</code> field in the response
                      to track your usage. When limits are exceeded, you'll receive a 429 status code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Support */}
          <section className="bg-muted rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Need Help?</h2>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                View Pricing
              </Link>
              <a
                href="mailto:support@endpnt.dev"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Email Support
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}