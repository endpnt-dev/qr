# QR API — Code Review Findings (endpnt-dev/qr)
**Reviewed by:** Opus (Claude chat) — cross-repo code review
**Date:** April 17, 2026
**Scope reviewed:** `app/api/v1/*`, `app/api/v2/*`, `lib/*`, `.gitignore`, `.env.example`

---

## Critical issues

### C1 — v2 routes re-implement auth via HTTP call to v1/auth (architectural)
**File:** `app/api/v2/generate/route.ts` (lines ~25-42)
**File:** `app/api/v2/demo-generate/route.ts` (doesn't use auth — different problem)

The v2 `generate` route does NOT call `validateApiKey` from `@/lib/auth` directly. Instead it makes an internal HTTP request to `/api/v1/auth` on the same origin to validate the key:

```ts
async function validateApiKey(key: string | null, request: NextRequest): Promise<ApiKey | null> {
  if (!key) return null;
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/v1/auth`, {
    method: 'POST',
    headers: { 'x-api-key': key },
  });
  ...
}
```

**Problems this creates:**
1. **Latency.** Every v2 request now incurs an extra HTTP hop to its own server, cold-start overhead included. On Vercel serverless, this can add 50-300ms per request.
2. **Reliability.** If the v1/auth route crashes or is slow, every v2 request fails.
3. **Traceability.** A comment in the file reads `// Inlined auth functions to avoid module resolution issues` — suggesting this was a workaround for a build problem that was never properly fixed.
4. **Two sources of truth for auth.** `lib/auth.ts` (used by v1) and the inline `validateApiKey` in v2 route (used by v2). Drift risk.
5. **Unused imports.** The top of v2/generate/route.ts imports `NextResponse` but never uses it directly. Minor but symptomatic.

**Recommended fix:** Replace the inline HTTP-based `validateApiKey` with a direct import of `validateApiKey` from `@/lib/auth`. Investigate and resolve the original module resolution issue. Remove the `/api/v1/auth` endpoint entirely unless something else needs it.

### C2 — Demo rate limit is in-memory, not Redis-backed
**File:** `app/api/v2/demo-generate/route.ts` (line ~14)

```ts
const rateLimit = new Map<string, { count: number; resetTime: number }>();
```

The demo endpoint uses a process-local `Map` for rate limiting. On Vercel, each serverless function invocation can run on a different container — meaning the rate limit counter resets randomly, and a single IP could theoretically get far more than 5 requests per minute if their requests hit different containers.

**Also:** memory-based rate limits don't survive cold starts, so bot-like traffic that spins up new containers bypasses the limit entirely.

**Recommended fix:** Move demo rate limiting to the shared Upstash Redis instance with IP-based identifier and namespace `rl:qr:demo:{ip}`. Use the same `@upstash/ratelimit` library already used for the main rate limiter.

---

## Correctness issues

### M1 — QR v2 demo endpoint bypasses tier gating (user-facing bug)
**File:** `app/api/v2/demo-generate/route.ts`

The v1 production endpoint at `app/api/v2/generate/route.ts` correctly gates image borders, SVG borders, and overlays behind Starter+ tier:

```ts
const isImageFeatureRequest = (params.border && ['image', 'svg'].includes((params.border as any).mode)) || params.overlay;
if (isImageFeatureRequest && tier === 'free') {
  return errorResponse('FEATURE_TIER_RESTRICTED' as any, ...);
}
```

The demo endpoint does NOT have this check. The comment reads `// Generate QR code (all features available in demo)` — which is a deliberate design choice but creates a problem: **a public, unauthenticated endpoint allows the same image-fetching features that are premium-gated for authenticated users.** A user could get unlimited image-border + overlay generation by hitting the demo endpoint instead of authenticating.

Also relevant: the demo endpoint fetches external images via SSRF-sensitive operations (border images, overlay photos). This opens the attack surface on an unauthenticated endpoint.

**Recommended fix:** Apply the same tier gating to the demo endpoint. Treat demo as "free tier" and block image/SVG border modes + overlay. Users who want to demo those features can sign up. This aligns demo UX with the paid surface — what you see in the demo is what the free tier actually offers.

### M2 — `generateRequestId()` imported but not used consistently
**File:** `app/api/v2/generate/route.ts` (line ~7)
**File:** `app/api/v2/demo-generate/route.ts` (line ~8)

Both v2 routes import `generateRequestId` from `@/lib/response` but then generate their own request IDs inline using `Math.random().toString(36).substring(2, 15)`. The v1 route uses the imported helper. Inconsistency breeds drift — use one canonical request ID generator.

**Recommended fix:** Remove the inline request ID generation, use `generateRequestId()` everywhere.

### M3 — Tier type cast uses string union that may not match actual tiers
**File:** `app/api/v2/generate/route.ts` (line ~158)

```ts
const rateLimitResult = await checkRateLimit(apiKey, tier as "free" | "starter" | "pro" | "enterprise");
```

The cast narrows `tier` (a `string` returned from the HTTP auth call) to the known tier set. If the auth endpoint ever returns an unexpected tier string (e.g., `"trial"`, `"lifetime"`, a typo), this cast silently passes invalid data into `checkRateLimit`, which then falls through to the default allow-all path in rate-limit.ts.

**Recommended fix:** Validate the tier string against the known set BEFORE calling checkRateLimit. If invalid, return an explicit error.

---

## Polish / consistency issues

### P1 — Request ID generation format differs across files
**Files:** `lib/response.ts` uses `req_{8chars}`. `app/api/v2/generate/route.ts` and `v2/demo-generate/route.ts` generate raw strings without the `req_` prefix.

Inconsistent request IDs make log correlation harder. Adopt the `req_` format everywhere.

### P2 — `.env.example` exposes real-looking API keys instead of placeholders
**File:** `.env.example` (line 3)

```
API_KEYS={"ek_live_yourkey":{"tier":"free","name":"Demo Key"}}
```

`ek_live_yourkey` is not a valid key so it won't work — but the `ek_live_` prefix is the PRODUCTION key prefix. Using `ek_test_yourkey` or `ek_placeholder_replace_me` makes the intent clearer and avoids any GitGuardian false positives on the literal string `ek_live_`.

### P3 — `ERROR_CODES` type cast with `as any` in demo-generate
**File:** `app/api/v2/demo-generate/route.ts`

```ts
return errorResponse('ORIGIN_NOT_ALLOWED' as any, ...);
```

Multiple places in v2 demo-generate cast error codes as `any` because they're not in the `ERROR_CODES` enum. Either add these codes to `lib/config.ts` or don't use `errorResponse()` for them.

### P4 — Demo API keys are hardcoded in frontend (known issue — Pattern A)
**Files:** `app/components/ApiTester.tsx:59`, `app/docs/page.tsx:117`, `app/docs/page.tsx:283`

The key `ek_live_hoWnzx74NUf04esiG8pv` appears hardcoded in three places. This is Pattern A (documented in Cipher's CC-SPEC as the pattern being phased out). Not a tonight fix — will be addressed in the platform-wide Pattern B migration after Cipher ships.

### P5 — Error message table in config is incomplete vs error codes used in routes
**File:** `lib/response.ts` `getErrorMessage()` — covers 8 codes.
**File:** `app/api/v2/generate/route.ts` and `v2/demo-generate/route.ts` use 50+ error codes not in the `ERROR_CODES` enum (INVALID_DOT_STYLE, INVALID_BORDER_WIDTH, etc.)

The v2 routes return error codes that have no corresponding friendly message in the `getErrorMessage()` table. The user receives the raw technical message from the QRProcessingError instead of a curated one.

**Recommended fix:** Expand `ERROR_CODES` to cover the v2 codes and populate `getErrorMessage()` accordingly. Or accept that the raw technical messages are fine for v2 and document it.

---

## Security considerations

### S1 — QR v2 demo does SSRF-sensitive fetches without auth
See M1 above. Tier gating on demo endpoint also doubles as SSRF mitigation — blocking `image` border mode and `overlay` on the demo prevents unauthenticated callers from making your server fetch arbitrary URLs.

### S2 — Request IDs use `Math.random()` (not cryptographically random)
Not a real security issue — request IDs aren't secrets — but worth noting for consistency with Cipher spec (which uses `crypto.randomBytes` for tokens). Low priority.

### S3 — Logging of request parameters includes potentially sensitive fields
**File:** `app/api/v2/generate/route.ts` (line ~140)

```ts
console.log(`[${requestId}] Generating QR with params:`, {
  data_length: params.data?.length,
  ...
});
```

The logging only captures metadata (length, format, has_border) — not the actual `data` field content. This is correctly handled. No issue. Flagging only to confirm I checked.

---

## Suggested fix specs (priority ordered)

1. **C2 — Move demo rate limit to Redis.** Micro spec, maybe 30 lines of changes. High leverage because current behavior is genuinely broken at scale.
2. **M1 — Apply tier gating to demo endpoint.** Micro spec, 10 lines of changes. Aligns demo UX with paid surface and closes SSRF on unauth path.
3. **C1 — Fix v2 auth to use direct import.** Full spec, requires investigation of original "module resolution issue." 30-60 minutes of agent work.
4. **M3 — Validate tier string before cast.** Micro spec, 5 lines.
5. **P1, P2, P3, P5 — Cosmetic / consistency.** Batch into a single cleanup micro spec. 15 minutes.

P4 (demo keys in frontend) is deferred to the platform-wide Pattern B migration.

---

## Review notes for CC review-qa-agent

When running CC's `review-qa-agent` on the QR repo tonight or tomorrow:

1. **Confirm my findings.** Re-read the files I flagged and verify each issue exists as described. Report back with file:line citations.
2. **Check what I couldn't.** Run `npm run build` from the repo root and report any TypeScript errors that might surface once the fixes are applied.
3. **Look for things I may have missed.** I didn't deeply read `lib/qr-v2.ts` or `lib/qr.ts` — just skimmed for structure. A careful read of those files may surface additional issues, especially around:
   - Error object construction (QRValidationError / QRProcessingError)
   - SSRF protection on image fetching (borders, overlays)
   - Request size validation before expensive operations
4. **Sanity check the tests.** I did not run the smoke tests in this review. Confirm they still pass against production.
