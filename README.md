# QR Code API | endpnt.dev

Generate beautiful, customizable QR codes with a simple API call. Part of the [endpnt.dev](https://endpnt.dev) developer tools platform.

## 🚀 Features

- **Multiple Formats**: PNG, SVG, JPEG, WebP output
- **Custom Styling**: Foreground/background colors, custom sizes, margins
- **Logo Embedding**: Add your brand logo to QR codes with automatic error correction
- **Configurable Error Correction**: Choose from 4 levels (L, M, Q, H) for different use cases
- **Simple API**: RESTful endpoints with consistent JSON responses
- **Rate Limited**: Built-in protection with tier-based limits
- **Fast & Reliable**: Optimized for serverless deployment

## 📋 Quick Start

### Generate a Basic QR Code

```bash
curl -X POST https://qr.endpnt.dev/api/v1/generate \
  -H "x-api-key: ek_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"data": "https://endpnt.dev"}'
```

### With Custom Styling

```bash
curl -X POST https://qr.endpnt.dev/api/v1/generate \
  -H "x-api-key: ek_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://endpnt.dev",
    "size": 800,
    "color": "#0F6E56",
    "background": "#FFFFFF",
    "format": "png"
  }'
```

### With Logo Embedding

```bash
curl -X POST https://qr.endpnt.dev/api/v1/generate \
  -H "x-api-key: ek_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://endpnt.dev",
    "logo_url": "https://endpnt.dev/logo.png",
    "error_correction": "H",
    "logo_size": 20
  }'
```

## 📖 API Reference

### Endpoints

- `POST /api/v1/generate` - Generate QR code
- `GET /api/v1/generate` - Generate QR code (query params)
- `GET /api/v1/health` - Health check

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `data` | string | Yes | — | Text or URL to encode (max 4,296 chars) |
| `size` | number | No | 400 | Image size in pixels (100-2000) |
| `format` | string | No | "png" | Output format: png, svg, jpeg, webp |
| `color` | string | No | "#000000" | Foreground color (hex) |
| `background` | string | No | "#FFFFFF" | Background color (hex) |
| `margin` | number | No | 4 | Border margin in modules (0-10) |
| `error_correction` | string | No | "M" | Error correction: L, M, Q, H |
| `logo_url` | string | No | — | Logo image URL (requires error_correction: H) |
| `logo_size` | number | No | 20 | Logo size as percentage (10-30) |

### Response Format

```json
{
  "success": true,
  "data": {
    "image": "base64_encoded_image_data",
    "format": "png",
    "size": 400,
    "file_size_bytes": 12480,
    "warnings": ["optional warnings"]
  },
  "meta": {
    "request_id": "req_abc123",
    "processing_ms": 45,
    "remaining_credits": 98
  }
}
```

## 🛠 Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Environment Variables

Create a `.env.local` file:

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
API_KEYS={"ek_demo123":{"tier":"free","name":"Demo Key"}}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Testing the API

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Generate QR code
curl -X POST http://localhost:3000/api/v1/generate \
  -H "x-api-key: ek_demo123" \
  -H "Content-Type: application/json" \
  -d '{"data": "Hello World"}'
```

## 🏗 Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js with TypeScript
- **QR Generation**: `qrcode` package
- **Image Processing**: `sharp` (for logos and format conversion)
- **Rate Limiting**: Upstash Redis
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Project Structure

```
app/
  api/v1/
    generate/route.ts     # Main QR generation endpoint
    health/route.ts       # Health check
  components/             # React components
    QRDemo.tsx           # Live demo component
    ApiTester.tsx        # API testing form
    CodeBlock.tsx        # Syntax highlighting
    PricingTable.tsx     # Pricing display
  page.tsx               # Landing page
  docs/page.tsx          # Documentation
  pricing/page.tsx       # Pricing page
  layout.tsx             # Root layout
  globals.css            # Global styles
lib/
  auth.ts               # API key validation
  qr.ts                 # QR generation engine
  rate-limit.ts         # Rate limiting logic
  response.ts           # Response utilities
  config.ts             # Constants and types
```

## 🔧 Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_REQUIRED` | 401 | Missing x-api-key header |
| `INVALID_API_KEY` | 401 | Invalid API key |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_PARAMS` | 400 | Parameter validation failed |
| `DATA_TOO_LONG` | 400 | Data exceeds 4,296 characters |
| `LOGO_FETCH_FAILED` | 400 | Could not fetch logo image |
| `GENERATION_FAILED` | 500 | QR generation failed |

## 📈 Rate Limits

| Tier | Requests/Min | Features |
|------|--------------|----------|
| Free | 10 | Basic QR codes, PNG/SVG |
| Starter | 100 | All formats, custom colors, logos |
| Pro | 1000 | Higher resolution, priority support |
| Enterprise | Custom | Custom integration, SLA |

## 🤝 Contributing

This is part of the endpnt.dev platform. For issues or feature requests, please contact the development team.

## 📄 License

Proprietary software. All rights reserved to endpnt.dev.

---

**Part of the [endpnt.dev](https://endpnt.dev) developer tools platform**
