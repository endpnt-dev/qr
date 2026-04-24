# BUGS.md — QR API Bug Tracker

**Scope:** Bugs specific to the QR API (`qr.endpnt.dev`). Cross-cutting bugs live at `../BUGS.md`.

**ID prefix:** `Q-NNN` (sequential, do not reuse).

**Last updated:** 2026-04-24 (biweekly audit: Q-001 confirmed and detailed; Q-002 partially resolved; Q-003 and Q-004 added).

---

## Open bugs

### Q-001 — SSRF unprotected on v1 `logo_url`; redirect gap on v2 fetch paths

- **Severity:** High on v1 (launch blocker); Medium on v2 (redirect gap)
- **Files:** `lib/qr.ts` `fetchLogo()` (v1, HIGH); `lib/qr-v2/fetch-image.ts` (v2, MEDIUM)
- **Discovered:** 2026-04-24 (confirmed by biweekly code health audit; originally a TODO)
- **Symptom — v1 (HIGH):** `lib/qr.ts` `fetchLogo()` calls `fetch(logoUrl, ...)` with no SSRF protection. Only checks that the URL has `http:` or `https:` scheme — no private-IP blocklist. An attacker can submit `http://169.254.169.254/latest/meta-data/` as `logo_url` and the server will fetch AWS IMDS.
- **Symptom — v2 (MEDIUM):** `lib/qr-v2/fetch-image.ts` `fetchImage()` performs a real DNS lookup via `dns/promises` and checks resolved IPs against private IPv4/IPv6 ranges — this is STRONGER than Preview's string-based check. However, it does NOT set `redirect: 'manual'`. If the initial URL resolves safely but then 301-redirects to a private IP, the redirect is followed automatically without re-validation.
- **Root cause:** v1 was built before SSRF conventions were established. v2 added DNS-based protection but omitted redirect control.
- **Impact:**
  - v1: Exploitable SSRF — fetch AWS IMDS, probe internal network from Vercel egress. Pre-launch blocker.
  - v2: Redirect-based SSRF bypass. Requires attacker to control a server that responds with a redirect to a private IP. Lower likelihood than v1 but still a real gap.
- **Fix approach:**
  - v1: Copy `preview/lib/url-utils.ts` `isSSRFProtected()` into `qr/lib/url-utils.ts`. Call before `fetch()` in `fetchLogo()`. Set `redirect: 'manual'` with post-redirect re-validation.
  - v2: Add `redirect: 'manual'` in `fetchImage()`. After any redirect, re-run the DNS-based validation against the redirect target URL.
  - Add smoke tests for 169.254.169.254, 127.0.0.1, and a redirect-to-private-IP scenario.
- **Cross-reference:** `../BUGS.md#P-003`
- **Status:** Open. v1 is a launch blocker; v2 redirect gap is medium priority.

### Q-002 — Loose test files at repo root (partially resolved)

- **Severity:** Low
- **Files:** `test-complete-v2.sh`, `test-v2-endpoint.js`, `test-v2-http.sh`, `test-v2.js`, `test-qr.png` (remaining). `spike-output/` and `QR-API-V2-COMPLETION-REPORT.md` already cleaned up.
- **Discovered:** Pre-2026-04-24 (flagged in `qr/CLAUDE.md`)
- **Symptom:** Legacy test scaffolding from V2 refactor spike remains at repo root. As of audit 2026-04-24: `spike-output/` directory is GONE (cleaned up). `QR-API-V2-COMPLETION-REPORT.md` is ARCHIVED to `docs/specs/archive/`. Remaining: 4 test scripts and 1 PNG still at root.
- **Impact:** Visual clutter. When CC lists the repo, these files obscure the actual structure.
- **Fix approach:**
  - `test-complete-v2.sh`, `test-v2-http.sh` — move to `tests/` if still useful, else delete.
  - `test-v2-endpoint.js`, `test-v2.js` — move to `tests/` if still useful, else delete.
  - `test-qr.png` — move to `tests/fixtures/` if referenced by any test, else delete.
- **Cross-reference:** `../BUGS.md#P-004`
- **Status:** Partially resolved. `spike-output/` and completion report done. 5 files remain.

### Q-003 — `@resvg/resvg-js` and `@undecaf/zbar-wasm` in `next.config.js` externals but absent from `package.json`

- **Severity:** Medium (potential runtime failure if v2 code paths reference these packages)
- **Files:** `next.config.js`, `package.json`
- **Discovered:** 2026-04-24 (biweekly code health audit)
- **Symptom:** `next.config.js` externalizes `@resvg/resvg-js` and `@undecaf/zbar-wasm` in both `serverComponentsExternalPackages` and the webpack `externals` block. Neither package appears in `package.json`. `CLAUDE.md` documents both as part of the active tech stack, but they are not installed.
- **Root cause:** Either (a) the packages were removed from `package.json` without updating `next.config.js` and `CLAUDE.md`, or (b) they were never installed and the config/docs were written assuming they would be.
- **Impact:** If any v2 code path actually imports `@resvg/resvg-js` or `@undecaf/zbar-wasm`, it will fail at build time (missing dependency) or runtime (module not found). The externalization in `next.config.js` tells webpack to skip them — so a missing package won't be caught by the bundler, it'll fail at runtime when the import is actually executed.
- **Fix approach:**
  1. Audit v2 source files (`lib/qr-v2/**`, `app/api/v2/**`) for actual imports of these packages.
  2. If imported but not installed: add both packages to `package.json` and run `npm install`.
  3. If not imported anywhere: remove the externalization entries from `next.config.js` and update `CLAUDE.md` to not describe them as in-use.
- **Status:** Open. Investigate before next deployment that touches v2 code.

### Q-004 — v2 image fetch does not use `redirect: 'manual'` (redirect SSRF gap)

- **Severity:** Medium
- **File:** `lib/qr-v2/fetch-image.ts`
- **Discovered:** 2026-04-24 (biweekly code health audit — see also Q-001 for the related v1 gap)
- **Symptom:** The v2 `fetchImage()` function performs strong DNS-based SSRF protection (resolves hostname and checks all returned IPs against private ranges). However, it uses default redirect following (`fetch(url, ...)` without `redirect: 'manual'`). If the initially-validated URL redirects to a private IP via a 301/302, the redirect is followed automatically without re-validating the redirect target.
- **Root cause:** DNS-based pre-fetch validation was implemented but redirect re-validation was not added.
- **Impact:** An attacker who controls a server with a valid public hostname can return a 301 redirect to `http://169.254.169.254/...`. The DNS check passes (the original hostname is public), then the unmonitored redirect fetches the private IP. Lower probability than v1's complete absence of protection, but still exploitable.
- **Fix approach:** Add `redirect: 'manual'` to the fetch in `fetchImage()`. On 3xx response, extract `Location` header, construct the redirect URL, re-run `validateHostname()` against it, then follow the redirect manually. Bundle with Q-001 v1 fix spec.
- **Cross-reference:** Q-001
- **Status:** Open. Medium priority. Bundle fix with Q-001 spec.

---

## Resolved bugs

*(None resolved yet.)*
