# QA-005 Documentation Status Refresh — 2026-08-31

Ticket: `QA-005-DOC-STATUS-001`

## Summary

Current Release 1 documentation now reflects the accepted Production state of
three completed launch items:

- consent-gated GA4 page-view analytics is merged, deployed, and detected;
- the canonical `https://nobel-itbs.eu` domain and its HTTP/`www` redirect
  matrix are accepted;
- the approved Manrope font is self-hosted by Next.js and deployed.

Historical QA baselines were not rewritten as if their original observations
had never occurred. They instead carry dated follow-up notes that distinguish
the earlier audit state from the later remediation state.

## Files Changed

- active preparation, implementation-status, master-checklist, and v2
  launch-readiness wording;
- Analytics and Manrope ticket acceptance records;
- dated follow-up notes in the earlier SEO cutover, legacy URL, Lighthouse,
  and WF-008 QA records;
- this report.

No archived `docs/source/v1/` file changed.

## Database Objects Changed

None. No migration, policy, function, grant, table, row, Auth user, Storage
object, environment value, or Production data changed.

## Tests / Verification

- source review confirmed GA4 measurement ID `G-RT0GQGPC6V`, the admin-route
  exclusion, token-free verification projection, and consent guard;
- source review confirmed Manrope is mounted through `next/font/google` with
  self-hosting, `display: swap`, and the shared font variable;
- Git history confirmed Analytics PR #65 (`5646ac0`) and Manrope PR #66
  (`fd91a3d`) are merged to `main`;
- live read-only canonical-edge checks passed:
  - canonical HTTPS `200`;
  - apex HTTP direct `308` to canonical HTTPS;
  - HTTP and HTTPS `www` direct `301` to canonical HTTPS;
- the live canonical response preloads a same-origin `.woff2` font asset,
  restricts `font-src` to self/data, and returns HSTS with
  `max-age=63072000`;
- `verify:qa-005:seo`, `verify:qa-005:google-analytics`,
  `verify:qa-005:manrope-font`, `verify:qa-005:public-admin-boundary`, and
  `verify:qa-005:security-headers` passed;
- Markdown whitespace validation passed with `git diff --check`.

## Security Notes

- The live checks used public routes only and sent no credentials, learner
  data, document number, QR token, or secret.
- The documentation retains the accepted rule that admin routes are excluded
  from analytics and indexing.
- No analytics expansion was implemented. Custom events remain separate and
  must stay free of PII, document numbers, and verification tokens.

## Deviations / Open Questions

- Production INP remains unknown until sufficient CrUX field data exists; this
  does not reopen the completed Manrope or laboratory Lighthouse work.
- Custom CTA, contact-submit, and verification-success analytics events remain
  intentionally outside the completed basic page-view ticket.
- One approved real credential VEDOS activation/delivery and the
  Owner-deferred backup/restore drill remain operationally open.

## Next Dependency

Review this documentation-only diff and merge it after the focused checks pass.
