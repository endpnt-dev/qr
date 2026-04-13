import Link from 'next/link'
import { QrCode, Palette, Image, Target, Zap, Settings, ArrowRight, Code, Github } from 'lucide-react'
import dynamic from 'next/dynamic'
import CodeBlock from './components/CodeBlock'

// Import QRDemo with no SSR to avoid hydration issues
const QRDemo = dynamic(() => import('./components/QRDemo'), { ssr: false })

const features = [
  {
    icon: Palette,
    title: 'Custom colors',
    description: 'Choose any hex colors for QR code and background to match your brand'
  },
  {
    icon: Image,
    title: 'Logo embedding',
    description: 'Add your logo to QR codes with automatic error correction optimization'
  },
  {
    icon: Target,
    title: 'Multiple formats',
    description: 'PNG, JPEG, WebP, and SVG output formats for any use case'
  },
  {
    icon: Settings,
    title: 'Configurable error correction',
    description: 'Choose from L, M, Q, or H error correction levels for reliability'
  },
  {
    icon: Zap,
    title: 'Instant generation',
    description: 'Sub-second response times with optimized QR code generation'
  },
  {
    icon: Code,
    title: 'Simple API',
    description: 'Clean REST API that works with any programming language'
  }
]

const codeExamples = {
  curl: `curl -X POST https://qr.endpnt.dev/api/v1/generate \\
  -H "x-api-key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": "https://example.com",
    "format": "png",
    "size": 300,
    "color": "#000000",
    "background": "#ffffff",
    "margin": 2,
    "error_correction": "M"
  }'`,

  javascript: `const response = await fetch('https://qr.endpnt.dev/api/v1/generate', {
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
    logo_url: 'https://example.com/logo.png'
  })
});

const result = await response.json();
if (result.success) {
  const imageData = result.data.image; // base64 encoded
}`,

  python: `import requests
import base64

url = "https://qr.endpnt.dev/api/v1/generate"
headers = {
    "x-api-key": "your_api_key",
    "Content-Type": "application/json"
}
data = {
    "data": "https://example.com",
    "format": "png",
    "size": 300,
    "color": "#000000",
    "background": "#ffffff",
    "error_correction": "M"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

if result["success"]:
    image_data = base64.b64decode(result["data"]["image"])
    with open("qrcode.png", "wb") as f:
        f.write(image_data)`
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-mono font-bold">QR Code API</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-sm hover:text-primary-600 transition-colors">
              Docs
            </Link>
            <Link href="/pricing" className="text-sm hover:text-primary-600 transition-colors">
              Pricing
            </Link>
            <Link
              href="https://github.com/endpnt-dev/qr"
              className="text-sm hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Generate beautiful QR codes
                <br />
                <span className="text-primary-600">with one API call</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Fast, reliable QR code generation API with custom colors, logo embedding, and multiple formats.
                Perfect for automation, marketing, and integration.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <Code className="h-4 w-4" />
                View docs
              </Link>
            </div>

            {/* Quick example */}
            <div className="max-w-2xl mx-auto">
              <CodeBlock
                code={codeExamples.curl}
                language="bash"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful features for every use case</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with modern standards and optimized for speed, reliability, and ease of use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary-600/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Try it yourself</h2>
            <p className="text-muted-foreground text-lg">
              Interactive QR code generator with live preview
            </p>
          </div>

          <QRDemo />
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Easy integration</h2>
            <p className="text-muted-foreground text-lg">
              Works with any programming language that can make HTTP requests
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">JavaScript</h3>
                <CodeBlock
                  code={codeExamples.javascript}
                  language="javascript"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Python</h3>
                <CodeBlock
                  code={codeExamples.python}
                  language="python"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="text-muted-foreground text-lg">
              Join thousands of developers using our QR Code API for automation, marketing, and seamless integration.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium text-lg"
            >
              Get your free API key
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary-600" />
                <span className="font-mono font-bold">QR Code API</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Fast, reliable QR code generation API for developers.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Product</h4>
              <div className="space-y-2">
                <Link href="/docs" className="block text-sm text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
                <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
                <Link href="/api/v1/health" className="block text-sm text-muted-foreground hover:text-foreground">
                  Status
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Resources</h4>
              <div className="space-y-2">
                <Link href="https://github.com/endpnt-dev/qr" className="block text-sm text-muted-foreground hover:text-foreground">
                  GitHub
                </Link>
                <Link href="https://endpnt.dev" className="block text-sm text-muted-foreground hover:text-foreground">
                  endpnt.dev
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Support</h4>
              <div className="space-y-2">
                <a href="mailto:support@endpnt.dev" className="block text-sm text-muted-foreground hover:text-foreground">
                  Email Support
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 endpnt.dev. Part of the{' '}
              <Link href="https://endpnt.dev" className="text-primary-600 hover:underline">
                endpnt.dev platform
              </Link>
              . Built with Next.js and deployed on Vercel.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}