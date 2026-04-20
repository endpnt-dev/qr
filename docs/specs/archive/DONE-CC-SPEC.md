# endpnt QR Code API — CC Spec (Part 2 of 6)
**Version:** 1.0
**Date:** April 13, 2026
**Author:** Opus (planning only — CC executes all code changes)
**Agent:** Start with architect → then frontend-agent + backend-agent for implementation
**Project:** endpnt.dev — Developer API platform
**Repo:** endpnt-dev/qr

---

## CRITICAL: Environment Setup (READ FIRST)

Before doing ANYTHING, run these commands to ensure you're in the right place:

```bash
cd /mnt/c/Repositories/endpnt/qr
pwd
# Must show: /mnt/c/Repositories/endpnt/qr

git branch
# Must show: * dev
# If not on dev, run: git checkout dev

git status
# Should be clean. If not, stash or commit existing changes.
```

**Git workflow for this project:**
- Work on `dev` branch
- Push to `dev` when done — Vercel auto-deploys a preview URL
- DO push to dev — this is different from BTS Staffing App workflow
- JK will review the preview, then open a PR to main on GitHub for production deploy

---

## Overview

Build the QR Code API — the second of 5 utility APIs for endpnt.dev. This API accepts text or a URL and generates a styled QR code image. It supports custom colors, embedded logos, multiple output formats, and configurable error correction levels.

This is a greenfield build. Use the same architecture patterns established in the Screenshot API (repo #1): same folder structure, same response format, same auth system, same rate limiting. Copy the shared scaffolding (lib/auth.ts, lib/rate-limit.ts, lib/response.ts, lib/config.ts, middleware.ts) from the screenshot repo and adapt.

The API will be deployed to Vercel and accessible at qr.endpnt.dev.

---

## Requirements

1. API accepts text or a URL and returns a QR code as PNG, JPEG, WebP, or SVG
2. Supports custom foreground/background colors, embedded logo images, configurable size, margin, and error correction level
3. API key authentication via `x-api-key` header — keys prefixed with `ek_` (same system as screenshot API)
4. Rate limiting via Upstash Redis (same config as screenshot API)
5. Consistent JSON response envelope: `{ success, data, meta }`
6. GET and POST methods on the generate endpoint
7. Landing page at `/` with hero, code examples, live demo (generate a QR code in the browser)
8. Interactive docs page at `/docs`
9. Pricing page at `/pricing`
10. Health check at `/api/v1/health`

---

## Suggestions & Context

### Tech Stack
- **Framework:** Next.js 14+ App Router, TypeScript
- **QR Generation:** `qrcode` npm package — handles QR matrix generation and rendering to PNG/SVG
- **Image Compositing:** `sharp` — for embedding logos onto QR codes and format conversion
- **Rate Limiting:** `@upstash/ratelimit` + `@upstash/redis` (same as screenshot API)
- **Styling:** Tailwind CSS, dark theme matching screenshot API aesthetic

### Folder Structure
Same pattern as screenshot API:

```
qr/
  app/
    api/
      v1/
        generate/
          route.ts            ← Core QR generation logic
        health/
          route.ts            ← Health check
    page.tsx                  ← Landing page
    docs/
      page.tsx                ← Interactive API docs
    pricing/
      page.tsx                ← Pricing tiers
    layout.tsx                ← Root layout
    globals.css
  lib/
    auth.ts                   ← API key validation (copy from screenshot)
    rate-limit.ts             ← Upstash rate limiter (copy from screenshot)
    response.ts               ← Standard response builder (copy from screenshot)
    qr.ts                     ← QR code generation logic
    config.ts                 ← Constants, tiers, defaults
  middleware.ts               ← CORS handling (copy from screenshot)
  package.json
  tsconfig.json
  next.config.js
  tailwind.config.ts
  postcss.config.js
  .env.example
  vercel.json
  README.md
```

### API Endpoint: POST /api/v1/generate

**Request parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| data | string | Yes | — | Text or URL to encode. Max 4,296 characters |
| size | number | No | 400 | Image size in px (square). Range: 100-2000 |
| format | string | No | "png" | Output: "png", "svg", "jpeg", "webp" |
| color | string | No | "#000000" | Foreground color as hex |
| background | string | No | "#FFFFFF" | Background color as hex |
| margin | number | No | 4 | Quiet zone margin in modules. Range: 0-10 |
| error_correction | string | No | "M" | "L" (7%), "M" (15%), "Q" (25%), "H" (30%) |
| logo_url | string | No | — | URL to image to embed in center. Requires error_correction: "H" |
| logo_size | number | No | 20 | Logo size as percentage of QR code. Range: 10-30 |

**Success response:**
```json
{
  "success": true,
  "data": {
    "image": "base64_encoded_png...",
    "format": "png",
    "size": 400,
    "file_size_bytes": 12480
  },
  "meta": {
    "request_id": "req_q1r2s3",
    "processing_ms": 45,
    "remaining_credits": 98
  }
}
```

For SVG format, return the SVG string in `data.svg` instead of base64 in `data.image`.

**Error codes:**
- `AUTH_REQUIRED` (401) — missing x-api-key header
- `INVALID_API_KEY` (401) — key doesn't exist
- `RATE_LIMIT_EXCEEDED` (429) — too many requests
- `INVALID_PARAMS` (400) — validation failed (bad color format, size out of range, etc.)
- `DATA_TOO_LONG` (400) — data exceeds 4,296 character limit
- `LOGO_FETCH_FAILED` (400) — couldn't download the logo from logo_url
- `GENERATION_FAILED` (500) — QR generation failed unexpectedly

### Logo Embedding Logic
When `logo_url` is provided:
1. Generate QR code with error_correction: "H" (required — logo covers part of the QR)
2. Fetch the logo image from the URL
3. Use `sharp` to resize the logo to `logo_size`% of the QR image
4. Composite the logo centered on top of the QR code
5. Return the combined image

If `logo_url` is provided but `error_correction` is not "H", auto-upgrade to "H" and include a note in the response.

### Landing Page
- Hero: "Generate beautiful QR codes with one API call"
- Live demo: Text input + color pickers + size slider → generates QR code in real-time in the browser
- Show QR codes with different styles (colors, logos, sizes) as examples
- Code examples in curl, JavaScript, Python
- CTA linking to /pricing

### Docs Page
- Interactive QR generator with all parameters exposed as form fields
- Live preview that updates as parameters change
- Parameter reference table
- Code examples in multiple languages

### Design Direction
- Same dark theme as screenshot API
- Same color accent (#0F6E56)
- Consistent header/footer/navigation pattern
- "Part of the endpnt.dev platform" in footer linking back to hub site

---

## DO NOT TOUCH

- Do not modify any files outside `/mnt/c/Repositories/endpnt/qr/`
- Do not touch any other endpnt repos
- Do not delete existing README.md — update it instead

---

## Edge Cases

1. Empty data string — return INVALID_PARAMS
2. Data exceeding 4,296 chars — return DATA_TOO_LONG
3. Invalid hex color (e.g., "red" instead of "#FF0000") — return INVALID_PARAMS
4. Logo URL that returns 404 or non-image — return LOGO_FETCH_FAILED
5. Logo URL that's very slow — timeout after 5 seconds
6. Logo with logo_url but error_correction not "H" — auto-upgrade to H
7. Size of 100px with a logo — logo might be too small to see, warn in response
8. SVG format with logo — logo should be embedded as base64 image inside SVG
9. Transparent background requested — should work with PNG and WebP (not JPEG)
10. Very long URL as data — QR code density increases, may be hard to scan at small sizes

---

## Environment Variables

Same as screenshot API. Create `.env.example`:

```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
API_KEYS={"ek_live_yourkey":{"tier":"free","name":"Demo Key"}}
NEXT_PUBLIC_SITE_URL=https://qr.endpnt.dev
```

---

## Git Commit & Push

```bash
git add -A && git commit -m "feat: initial QR Code API — endpoints, landing page, docs, pricing" && git push origin dev
```

**DO push to dev.**

---

## Smoke Tests

| # | Scenario | Steps | Expected Result | Pass/Fail |
|---|----------|-------|-----------------|-----------|
| 1 | Health check | GET /api/v1/health | Returns { status: "ok" } | |
| 2 | Basic QR code | POST /api/v1/generate with data: "https://endpnt.dev" | Returns success with base64 PNG | |
| 3 | SVG format | POST with format: "svg" | Returns success with SVG string in data.svg | |
| 4 | Custom colors | POST with color: "#0F6E56", background: "#1a1a2e" | QR code uses specified colors | |
| 5 | Custom size | POST with size: 800 | Returns 800x800 image | |
| 6 | Logo embedding | POST with logo_url pointing to a valid image, error_correction: "H" | QR code has logo centered | |
| 7 | Missing API key | POST without x-api-key | Returns 401 AUTH_REQUIRED | |
| 8 | Empty data | POST with data: "" | Returns 400 INVALID_PARAMS | |
| 9 | Data too long | POST with data > 4296 chars | Returns 400 DATA_TOO_LONG | |
| 10 | GET method | GET /api/v1/generate?data=test&size=200 | Same result as POST | |
| 11 | Landing page | Visit / | Renders with hero, demo, code examples | |
| 12 | Docs page | Visit /docs | Renders with interactive generator | |
| 13 | Live demo works | On landing page, type text, adjust colors | QR code updates in real-time | |
| 14 | Invalid color | POST with color: "not-a-color" | Returns 400 INVALID_PARAMS | |
| 15 | Rate limiting | Send 11+ requests in 1 min with free key | 11th returns 429 | |


---

## ✅ Completion Record

- **Completed:** 2026-04-13
- **Final commit:** [commit hash from original buildout]
- **Vercel deployment:** green
- **Agents invoked:** architect, backend-agent, review-qa-agent
- **Smoke tests:** [N of N] passing
- **Notes:** Retired as part of 2026-04-20 housekeeping sweep. Content absorbed into platform CLAUDE.md and repo CLAUDE.md files. QR API successfully built and deployed.
