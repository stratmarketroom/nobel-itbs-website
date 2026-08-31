# QA-005 Lighthouse Post-Remediation Production Rerun — 2026-08-31

Ticket: `QA-005-CWV-002`
Mode: read-only Production audit; no remediation in this ticket

## Summary

The post-remediation Production Lighthouse rerun passed. All four audited
routes have a median mobile Performance score of 99 and a median desktop score
of 100. Accessibility, Best Practices, and SEO score 100 in every one of the 24
reports.

Median mobile LCP is 1.98–2.00 seconds, median desktop LCP is 0.43–0.47
seconds, and CLS is effectively zero throughout the matrix. No P0, P1, or P2
release defect was found.

The completed remediations are visible in the measurements:

- the Home cookie banner is no longer the LCP element;
- Manrope loads as a self-hosted WOFF2 without a font-display or CLS failure;
- no third-party request is made before analytics consent;
- the public/admin stylesheet separation reduced the audited public stylesheet
  transfer to about 22 KiB;
- image delivery passes on all four routes.

## Scope And Method

Audited on `https://nobel-itbs.eu`:

- Home `/`;
- catalogue `/programmes`;
- programme detail `/programmes/ai-production`;
- manual verification `/verify`.

Method:

- Lighthouse CLI 13.4.1 with Headless Chrome;
- three independent cold-navigation runs per route and form factor;
- default Lighthouse mobile simulated throttling;
- Lighthouse desktop preset;
- Performance, Accessibility, Best Practices, and SEO categories;
- medians are primary and ranges are shown for Performance and LCP;
- fresh browser profiles represent a first visit with no analytics consent;
- previous baseline: `docs/qa/QA_005_LIGHTHOUSE_CWV_2026-08-31.md`.

Raw Lighthouse JSON files remain in a temporary local directory and are not
committed. They contain only public Production URLs.

## Lighthouse Results

### Mobile

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT | Speed Index | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 99 (97–100) | 100 | 100 | 100 | 0.94 s | 1.98 s (1.84–2.13) | 0 | 37 ms | 0.94 s | 232 KiB |
| Catalogue | 99 (99–100) | 100 | 100 | 100 | 0.94 s | 1.98 s (1.92–1.98) | 0 | 29 ms | 1.32 s | 230 KiB |
| AI Production | 99 (97–99) | 100 | 100 | 100 | 0.94 s | 2.00 s (1.98–2.14) | 0 | 25 ms | 2.88 s | 239 KiB |
| Verify | 99 (98–99) | 100 | 100 | 100 | 0.93 s | 1.98 s (1.97–2.12) | 0 | 26 ms | 0.93 s | 242 KiB |

All four median mobile LCP values remain below the 2.5-second laboratory
“good” threshold. Laboratory Lighthouse results do not replace field data.

### Desktop

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT | Speed Index | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 100 | 100 | 100 | 100 | 0.27 s | 0.43 s (0.39–0.43) | 0 | 0 ms | 0.59 s | 239 KiB |
| Catalogue | 100 | 100 | 100 | 100 | 0.32 s | 0.46 s (0.44–0.46) | 0 | 0 ms | 0.72 s | 239 KiB |
| AI Production | 100 | 100 | 100 | 100 | 0.28 s | 0.46 s (0.42–0.46) | 0.00027 max | 0 ms | 0.63 s | 249 KiB |
| Verify | 100 | 100 | 100 | 100 | 0.31 s | 0.47 s (0.47–0.48) | 0 | 0 ms | 0.31 s | 256 KiB |

Median initial server response audit values are 17–22 ms across the matrix.

## Comparison With The Earlier Baseline

| Route | Mobile Performance | Mobile LCP | Mobile Speed Index | Desktop LCP |
| --- | ---: | ---: | ---: | ---: |
| Home | 97 → 99 | 2.00 → 1.98 s | 4.01 → 0.94 s | 0.57 → 0.43 s |
| Catalogue | 99 → 99 | 2.00 → 1.98 s | 2.28 → 1.32 s | 0.56 → 0.46 s |
| AI Production | 99 → 99 | 1.99 → 2.00 s | 1.59 → 2.88 s | 0.58 → 0.46 s |
| Verify | 97 → 99 | 2.14 → 1.98 s | 3.64 → 0.93 s | 0.57 → 0.47 s |

Home, Catalogue, and Verify show a material Speed Index improvement. AI
Production's mobile Speed Index is slower than the earlier median, but its
Performance score, FCP, LCP, TBT, CLS, transfer size, and desktop result all
remain green. This is recorded as a P3 observation rather than a release
defect.

## Findings

### No P0, P1, Or P2 Release Defect

- Every audited category score is green.
- All median mobile LCP values are under 2.5 seconds.
- TBT medians are 25–37 ms on mobile and 0 ms on desktop.
- CLS is zero except for one desktop AI Production run at 0.00027, which is
  operationally negligible and far below the 0.1 good threshold.

### [P3] The Shared Public CSS And Next.js Runtime Retain Small Unused Portions

- **Location:** `app/(public)/layout.tsx:2`; `app/public.css`; generated public
  Next.js runtime chunk.
- **Evidence:** Lighthouse estimates 18–21 KiB unused in the approximately
  22 KiB public stylesheet and 27–29 KiB unused in the approximately 71 KiB
  shared JavaScript chunk. The CSS opportunity estimates 80–150 ms only in
  some mobile runs. The earlier public/admin split already removed the former
  approximately 51 KiB cross-surface stylesheet burden.
- **Impact:** no current Core Web Vitals failure, but route-level CSS extraction
  could recover a small amount of mobile headroom.
- **Recommendation:** do not reopen the completed public/admin split. If further
  optimization is desired, use a separate low-priority ticket to remove dead
  legacy public selectors or introduce route/component-level CSS, then rerun
  this same matrix.

### [P3] AI Production Has A Slower Mobile Speed Index Than The Earlier Run

- **Location:** `/programmes/ai-production`; programme sales hero in
  `components/programme-landing.tsx:110-138` and `app/public.css:2479-2511`.
- **Evidence:** median Speed Index is 2.88 seconds (2.39–3.62), compared with
  1.59 seconds in the earlier baseline. Median LCP remains 2.00 seconds and the
  mobile Performance median remains 99.
- **Impact:** the measured visual completion is less consistent than the other
  three routes, but there is no CWV or release failure.
- **Recommendation:** monitor on the next Lighthouse rerun. Open an optimization
  ticket only if the regression repeats or field data identifies this route.

### [P3] Production INP Is Still Not Available From Lighthouse

- **Location:** field monitoring, not application code.
- **Evidence:** Lighthouse reports TBT as a laboratory responsiveness proxy but
  does not provide a field INP result. The earlier same-day CrUX check had no
  eligible field dataset.
- **Impact:** an evidence-based field INP pass cannot yet be claimed.
- **Recommendation:** recheck PageSpeed/Search Console after the production
  domain has accumulated sufficient eligible real-user traffic. Do not label
  Lighthouse TBT as INP.

## Additional Diagnostics

- LCP elements are visible server-rendered text, not late images or the cookie
  banner.
- Home's LCP element is the hero line `moves you forward` in all three mobile
  runs.
- Manrope loads from one self-hosted WOFF2 resource of about 25 KiB; the
  font-display insight passes.
- The image-delivery insight passes on all audited routes.
- Fresh first-visit reports contain no Google Analytics or other third-party
  request before consent.
- Lighthouse reports back/forward cache exclusion because the dynamic response
  uses `Cache-Control: no-store`. It classifies both reasons as not actionable.
  This should not be changed casually because public rendering includes dynamic
  content and consent-dependent behavior.

## Files Changed

- `docs/qa/QA_005_LIGHTHOUSE_POST_REMEDIATION_2026-08-31.md`;
- `docs/README.md`.

No application code, UI, dependency, deployment setting, or Production state
was changed.

## Database Objects

None.

## Tests / Verification

- 24 Lighthouse Production reports: four routes × mobile/desktop × three runs;
- all reports completed without runtime errors or redirects;
- raw score and metric aggregation verified from the generated JSON;
- LCP elements, font requests, image-delivery diagnostics, third-party requests,
  CSS/JavaScript opportunities, and bfcache diagnostics inspected;
- comparison made against `QA_005_LIGHTHOUSE_CWV_2026-08-31.md`.

## Security Notes

- The audit was read-only and used public Production routes only.
- No admin route, credential number, QR token, learner data, private API,
  service role, environment secret, or authenticated session was used.
- Google Analytics remained absent in all fresh no-consent runs.

## Deviations / Open Questions

- Partnerships was not repeated because the approved rerun scope was the four
  routes named after the final remediation sequence. Its logo remediation was
  already accepted separately.
- INP remains unknown until sufficient field traffic exists.
- Lighthouse results are laboratory measurements and naturally vary between
  runs; medians, not individual runs, are the acceptance evidence.

## Next Dependency

No blocking Lighthouse remediation. Recheck field Core Web Vitals after enough
eligible traffic accumulates, or approve one separate low-priority optimization
ticket if further CSS/runtime reduction is desired.
