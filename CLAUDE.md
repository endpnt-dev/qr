# CLAUDE.md — QR API Specific Rules

**This file supplements `C:\Repositories\endpnt\CLAUDE.md` (platform-wide rules).** Read both. Universal rules (definition of done, mandatory workflow, agent usage, spec archive procedure, status-report honesty) are in the platform file. Only QR-specific guidance lives here.

---

## What this API does

QR generates and decodes QR codes and 1D barcodes. Routes under `/api/v1/`:

- `generate` — create QR codes with customization (logo, colors, error correction, output format)
- `decode` — read QR codes and supported 1D formats from uploaded images or URLs
- Other supporting endpoints (see `app/api/v1/`)

Input: text/URL payload OR image upload/URL. Output: base64 image or decoded payload in the standard response envelope.

Note: Barcode generation for dedicated 1D formats (EAN, UPC, Code128, etc.) lives in the separate `barcode` API. QR's decode route may opportunistically detect some 1D formats via `@undecaf/zbar-wasm`.

---

## Library Choices

| Library | Purpose | Key gotcha |
|---|---|---|
| `@qr-platform/qr-code.js` | QR generation (high-end customization — logos, dots, frames) | Large module. Externalize. |
| `qrcode` | Fallback/simple QR generation | Pure JS. Safe. |
| `@resvg/resvg-js` | SVG-to-PNG rasterization | Native binary — platform-specific sub-package (`@resvg/resvg-js-linux-x64-gnu` on Vercel). Explicitly webpack-external in next.config.js. |
| `@undecaf/zbar-wasm` | QR/barcode decoding | WASM-based. Also webpack-external. Separate from rxing-wasm used in the barcode API. |
| `sharp` | Image preprocessing for decode (raw pixel extraction before zbar) | Native. Externalize. |

### zbar-wasm decode flow

zbar-wasm needs raw grayscale or RGBA pixel data, not an image file. Standard flow:

1. Accept image via multipart or `image_url`
2. Use `sharp(buffer).raw().toBuffer({ resolveWithObject: true })` to get raw pixels + dimensions
3. Pass pixel buffer + width + height to zbar-wasm's decode function
4. Return the payload from the first detected symbol

Verify exact zbar-wasm API in `node_modules/@undecaf/zbar-wasm/dist/*.d.ts` before writing. It has multiple exports (`scanImageData`, etc.) and the signatures matter.

### Resvg usage for logo compositing

When a QR is generated with a center logo, the flow is:

1. Generate QR as SVG with logo reservation in center
2. Optionally composite logo image into the reserved region
3. Rasterize final SVG to PNG via `@resvg/resvg-js`

Resvg's Linux sub-package (`@resvg/resvg-js-linux-x64-gnu`) is the one that ships on Vercel. The npm install pulls the right platform variant automatically — do NOT install a specific variant manually.

---

## Next.js Config — CORRECT (reference for other repos)

QR's `next.config.js` uses the correct Next 14 syntax:

```javascript
experimental: {
  serverComponentsExternalPackages: [
    'sharp',
    '@qr-platform/qr-code.js',
    '@resvg/resvg-js',
    '@undecaf/zbar-wasm'
  ]
},
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = { /* client-side fallbacks */ }
  } else {
    config.externals = config.externals || []
    config.externals.push({
      '@resvg/resvg-js-linux-x64-gnu': '@resvg/resvg-js-linux-x64-gnu',
      '@undecaf/zbar-wasm': '@undecaf/zbar-wasm'
    })
  }
  return config
}
```

This pattern is the model to copy when convert and preview fix their Next 14 config violations.

---

## Rate-Limit Namespace

QR uses `rl:qr:{tier}` as the Upstash key prefix. Correct and consistent. Do NOT change.

QR uses the `slidingWindow` algorithm. Matches peer APIs. Don't convert to fixedWindow.

---

## QR-Specific Error Codes

Beyond platform errors:

- `INVALID_PAYLOAD` (400) — empty or too-long payload for selected error correction level
- `INVALID_ERROR_CORRECTION` (400) — not one of L/M/Q/H
- `INVALID_LOGO_URL` (400) — logo image fetch failed or wrong format
- `INVALID_IMAGE` (400) — decode input couldn't be parsed
- `NO_CODE_FOUND` (404) — decode ran but no QR or barcode detected
- `IMAGE_FETCH_FAILED` (400) — URL fetch failed
- `GENERATION_FAILED` (500) — qr-code.js or resvg threw
- `DECODE_FAILED` (500) — zbar threw during decode

---

## Loose files at repo root — NEEDS CLEANUP

The repo has accumulated quite a bit of test scaffolding at root level:

- `test-complete-v2.sh`
- `test-v2-endpoint.js`
- `test-v2-http.sh`
- `test-v2.js`
- `test-qr.png` (binary test fixture)
- `spike-output/` directory
- `QR-API-V2-COMPLETION-REPORT.md`

These are mostly legacy from the V2 refactor spike. They should be either:

- Moved to `tests/` and `docs/` respectively, OR
- Deleted if no longer useful, OR
- Confirmed gitignored if they're local-only

`QR-API-V2-COMPLETION-REPORT.md` in particular is a good candidate for the new `docs/specs/archive/` folder per the platform CLAUDE.md archive rule — it's a completion report.

Not blocking, but this repo has more root-level clutter than any other.

---

## V2 Endpoint

QR has a V2 endpoint that was introduced in a separate build cycle. Review `QR-API-V2-COMPLETION-REPORT.md` (or its archived version) before modifying v2-related code — it captures decisions and tradeoffs made during that work.

---

## SSRF Protection for image_url and logo_url

QR's generate endpoint accepts `logo_url` and decode accepts `image_url`. Both are potential SSRF entry points. Verify QR has the Preview-style `isSSRFProtected` check before these fetches — if not, this is the same class of issue being fixed in Convert and should be tracked.

(TODO for Opus during next sweep: audit QR's URL fetching for SSRF protection parity with Preview.)

---

## DO NOT TOUCH (QR-specific)

- `next.config.js` externals list — adding/removing native packages here is high-risk; one wrong entry breaks Vercel deploy
- The V2 endpoint's migration code paths until the completion report has been read
- `@resvg/resvg-js-linux-x64-gnu` — it's installed automatically by npm for the Vercel build platform; do not explicitly add it to `dependencies`
