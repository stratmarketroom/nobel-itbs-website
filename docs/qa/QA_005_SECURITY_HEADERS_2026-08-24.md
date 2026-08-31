# QA-005 Browser Security Headers — 2026-08-24

Ticket: `QA-005-SEC-001`

## Summary

The Release 1 application now emits a browser-security baseline on every route
through the Next.js response-header configuration. The policy is deny-by-default
and permits only same-origin application resources plus HTTPS/WSS connections to
Supabase from the browser.

The ticket adds:

- a production Content Security Policy for all application paths;
- framing protection through both `frame-ancestors 'none'` and
  `X-Frame-Options: DENY`;
- MIME-sniffing, referrer, and browser-capability restrictions;
- a production-only insecure-request upgrade directive;
- a focused `verify:qa-005:security-headers` regression verifier.

## Files Changed

- security-header configuration: `next.config.mjs`;
- verification: `scripts/verify-qa-005-security-headers.mjs`, `package.json`;
- directly related QA, status, checklist, and documentation-index records.

## Database Objects

None. No migration, policy, grant, database row, Storage object, environment
value, or production configuration was changed.

## Tests / Verification

Passed:

- all 65 non-live `verify:*` package scripts: 65 passed, 0 failed;
- `npm run verify:qa-005:security-headers`;
- `npm run verify:qa-005:seo`;
- `npx tsc --noEmit`;
- `npm run lint`;
- `CONTENT_DATA_SOURCE=seed npm run build`;
- local production HTTP smoke on representative HTML, API, static, and removed
  legacy routes:
  - CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and
    `X-Frame-Options` are present;
  - `X-Powered-By` is absent;
  - the headers remain present on `405` API and `410` responses;
  - the existing Blog `X-Robots-Tag` remains intact;
- in-app Chromium production smoke:
  - the Programme catalogue rendered under CSP;
  - EN to UA client navigation completed and rendered localized content;
  - manual verification rendered its interactive form;
  - no browser console warning or error was recorded on those flows.

## Security Notes

- `default-src 'self'`, `object-src 'none'`, `frame-src 'none'`, and
  `frame-ancestors 'none'` establish the default containment boundary.
- Browser network access is limited to same-origin requests and Supabase
  `https://*.supabase.co` / `wss://*.supabase.co`; SMTP, Telegram, private PDF
  Storage operations, and service-role access remain server-only.
- Inline event-handler attributes are forbidden with `script-src-attr 'none'`.
- The current Next.js output requires inline bootstrap scripts, and the existing
  UI uses inline styles. Accordingly, production currently retains
  `'unsafe-inline'` for `script-src` and `style-src`. `unsafe-eval` is scoped to
  the Next.js development runtime and is absent from production.
- HSTS is not duplicated in application code. It remains an HTTPS edge/platform
  responsibility. The canonical Production response was rechecked on
  2026-08-31 and returns `Strict-Transport-Security: max-age=63072000`.

## Deviations / Open Questions

- A nonce-based CSP would remove the production `script-src 'unsafe-inline'`
  exception, but it would require request-scoped nonces and force dynamic
  rendering across affected routes. That is a separate, measured hardening
  decision rather than an unscoped change to this ticket.
- Analytics and conditional CAPTCHA are not enabled. If either is approved
  later, its exact script/frame/connect origins must be reviewed and added
  narrowly; this CSP intentionally blocks undeclared vendors.
- Local production smoke used explicit seed mode because this worktree has no
  `.env.local`. Post-deploy header and authenticated admin acceptance against
  the configured Production Supabase project remains required.

## Next Dependency

Proceed with the next single QA-005 launch-hardening ticket after review.
Production deployment acceptance must confirm these headers at the canonical
edge and check that the platform does not duplicate or override the policy.
