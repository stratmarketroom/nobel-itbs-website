# QA-005 Lighthouse And Core Web Vitals — 2026-08-31

Ticket: `QA-005-CWV-001`  
Mode: read-only Production audit; no remediation in this ticket

## Summary

The audited Production pages are fast and stable in Lighthouse laboratory
testing. All median mobile Performance scores are 97–99; all median desktop
scores are 100. Median mobile LCP is 1.99–2.14 seconds, median desktop LCP is
0.56–0.58 seconds, and CLS is 0 in every run.

No P0 or P1 performance defect was found. Four P2 opportunities remain:

1. the single public/admin global CSS bundle is mostly unused on every public
   page and blocks first render;
2. partner logos on Partnerships bypass `next/image` and waste about 93 KB;
3. the brand font Manrope is declared but is not actually loaded;
4. the client-rendered cookie banner becomes the mobile Home LCP element and
   contributes to first-visit visual-completion variability.

Production PageSpeed Insights reports **No data** for real-user field metrics
on both mobile and desktop. Therefore Production INP cannot yet be measured or
declared passing. Lighthouse TBT is reported only as a laboratory responsiveness
indicator and is not presented as INP.

## Scope And Method

Audited on `https://nobel-itbs.eu`:

- Home `/`;
- catalogue `/programmes`;
- programme detail `/programmes/ai-production`;
- manual verification `/verify`;
- image-heavy information page `/partnerships`.

Method:

- Lighthouse CLI 13.4.1 with Headless Chrome 151;
- three independent cold-navigation runs per route and form factor;
- mobile default simulated throttling: Moto G Power viewport, 150 ms RTT,
  1,638 Kbps throughput, 4× CPU slowdown;
- desktop Lighthouse preset;
- medians are primary; observed ranges are shown in parentheses;
- PageSpeed Insights UI checked separately for CrUX field availability and one
  external lab corroboration run;
- source review covered font loading, image components, global CSS, and the
  cookie-consent rendering path.

Raw Lighthouse JSON files were kept in a temporary local directory and are not
committed because the compact evidence below is sufficient and reproducible.

## Lighthouse Results

### Mobile

| Route | Performance | LCP | CLS | TBT | Speed Index | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 97 (95–99) | 2.00 s (1.98–2.13) | 0 | 18 ms (12–26) | 4.01 s | 242 KiB |
| Catalogue | 99 (96–99) | 2.00 s (1.99–2.15) | 0 | 27 ms (15–27) | 2.28 s | 239 KiB |
| AI Production | 99 (99–99) | 1.99 s (1.99–1.99) | 0 | 29 ms (28–49) | 1.59 s | 248 KiB |
| Verify | 97 (97–98) | 2.14 s (2.12–2.14) | 0 | 40 ms (16–54) | 3.64 s | 245 KiB |
| Partnerships | 99 (97–99) | 2.14 s (2.00–2.29) | 0 | 19 ms (14–24) | 1.97 s | 352 KiB |

All median laboratory mobile LCP results are below the 2.5-second “good” Core
Web Vitals threshold. This does not substitute for field data.

### Desktop

| Route | Performance | LCP | CLS | TBT | Speed Index | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 100 | 0.57 s | 0 | 0 ms | 0.53 s | 245 KiB |
| Catalogue | 100 | 0.56 s | 0 | 0 ms | 0.83 s | 246 KiB |
| AI Production | 100 | 0.58 s | 0 | 0 ms | 0.75 s | 254 KiB |
| Verify | 100 | 0.57 s | 0 | 0 ms | 0.69 s | 253 KiB |
| Partnerships | 100 | 0.56 s | 0 | 0 ms | 0.85 s | 358 KiB |

Initial server response audit values were 15–21 ms across the sample, consistent
with a fast cached Production edge response.

### External PageSpeed Corroboration

PageSpeed Insights at 2026-08-31 07:23 Europe/Prague reported for Home:

- mobile lab: Performance 99, FCP 1.1 s, LCP 2.3 s, TBT 0 ms, CLS 0,
  Speed Index 1.5 s;
- desktop lab: Performance 100, FCP 0.3 s, LCP 0.4 s, TBT 0 ms, CLS 0,
  Speed Index 0.5 s;
- field/CrUX: **No data** for both mobile and desktop.

CrUX and PageSpeed field data use a rolling 28-day aggregation window. INP is
a field responsiveness metric evaluated at the 75th percentile; a good INP is
200 ms or less. References:

- [CrUX tools and 28-day data](https://developer.chrome.com/docs/crux/methodology/tools);
- [Interaction to Next Paint](https://web.dev/articles/inp);
- [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds);
- [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

## Findings

### [P2] Public pages load a mostly unused global CSS bundle

- **Location:** `app/layout.tsx:3`; `app/globals.css` (239,592 source bytes and
  public plus admin styles in one root import).
- **Evidence:** Production serves one approximately 51 KB CSS transfer on each
  audited public route. Lighthouse estimates 46–48 KB unused and reports the
  stylesheet as render-blocking: approximately 300 ms in the CLI mobile runs
  and 430 ms in the PageSpeed mobile run.
- **Impact:** Current scores remain green, but this consumes most of the
  remaining mobile LCP margin and makes every public visitor download admin and
  unrelated page styles.
- **Recommendation:** create a separate performance-remediation ticket to split
  public shared styles from admin/feature styles using route-level layouts and
  component CSS modules, then repeat the five-route Lighthouse matrix.

### [P2] Partnerships sends oversized partner logos

- **Location:** `components/managed-content-page.tsx:108-110`.
- **Evidence:** the partner logo uses a raw `<img>`. Lighthouse image delivery
  estimates 93,035 wasted bytes: Nobel Mental Health 44,515; Alfred Nobel
  University 30,786; e-launch 12,221; Nataliia Kholodenko Psychology Centre
  5,513. The page transfers about 116 KB of logo images and 352 KiB overall on
  mobile.
- **Impact:** The page still scores 99 mobile, but visitors download source
  dimensions up to 686×300 for rendered logos around 96 pixels high.
- **Recommendation:** in a separate ticket, move partner logos to `next/image`
  with accurate intrinsic dimensions and `sizes`, or supply purpose-sized
  optimized logo variants. Preserve aspect ratio and existing visual layout.

### [P2] Manrope is declared but not loaded

- **Location:** `app/globals.css:112-115` and later uses of
  `var(--font-manrope)`; no `@font-face`, `next/font`, or definition of
  `--font-manrope` exists.
- **Evidence:** none of the 30 Lighthouse reports contains a Font network
  request. The font-display audit passes only because the browser immediately
  uses a platform fallback.
- **Impact:** font performance is currently cheap and stable, but the site does
  not reliably render the approved Manrope brand typography and can differ by
  operating system.
- **Recommendation:** decide explicitly whether system UI or Manrope is the
  approved Production font. If Manrope remains required, add a self-hosted
  subset through `next/font/local`, use WOFF2 variable weights, `display: swap`,
  and a metric-compatible fallback; remeasure LCP and CLS before acceptance.

### [P2] Cookie consent becomes Home mobile LCP

- **Location:** `components/cookie-consent.tsx:15-34` and
  `app/globals.css:100-105`.
- **Evidence:** in all three mobile Home runs the fixed consent paragraph was
  the LCP element. The component's server snapshot returns `unknown`, then the
  banner appears after hydration when local storage resolves to `pending`.
  Home mobile Speed Index ranged from 2.56 to 5.54 seconds, with a 4.01-second
  median, while CLS remained 0 because the banner is fixed-position.
- **Impact:** first-visit lab LCP measures the consent layer rather than the
  actual hero, and visual completion is more variable than on the other pages.
- **Recommendation:** handle consent rendering as a dedicated UX/performance
  ticket. Preserve consent correctness while making first paint deterministic;
  retest first visit, accepted visit, EN/UA/CZ, and keyboard flow.

### [P3] Production INP is not yet observable

- **Location:** operational monitoring; no current CrUX sample or project RUM
  evidence was found.
- **Evidence:** PageSpeed Insights displays “No data” for both mobile and
  desktop field performance.
- **Impact:** the site cannot yet make an evidence-based Core Web Vitals pass
  claim for INP. Lab TBT medians are excellent, but TBT measures blocking during
  load and is not INP.
- **Recommendation:** recheck PageSpeed/Search Console after the domain has
  accumulated sufficient eligible traffic. If an earlier answer is required,
  approve a separate privacy-aware RUM ticket that records `web-vitals` only
  under the agreed consent policy.

## Positive Findings

- CLS is exactly 0 on all 30 route/device runs.
- Mobile median LCP remains in the laboratory “good” range on all five routes;
  desktop LCP is under 0.6 seconds.
- Mobile TBT medians are 18–40 ms and desktop TBT is 0; no current lab evidence
  suggests main-thread responsiveness risk.
- Four non-image-heavy routes pass Lighthouse image-delivery checks with zero
  estimated image waste and no unsized-image finding.
- Expert photographs use `next/image`, responsive `sizes`, and lazy loading;
  they did not inflate the initial image transfer in the audited viewport.
- No web-font download, FOIT, font render delay, or font-caused CLS occurs in
  the current build; the separate finding is brand consistency, not present
  loading performance.
- The new OG images from `QA-005-OG-001` are social metadata assets, not page
  render resources, so they are not expected to change these CWV results after
  deployment.

## Files Changed

- `docs/qa/QA_005_LIGHTHOUSE_CWV_2026-08-31.md` only.

No application code, UI, metadata, dependency, deployment setting, or
Production state was changed by this audit ticket.

## Database Objects

None.

## Tests / Verification

- 30 Lighthouse Production runs: five routes × mobile/desktop × three runs;
- PageSpeed Insights mobile and desktop field-data check;
- PageSpeed Insights Home lab corroboration;
- source review of root CSS, fonts, cookie consent, partner logos, and expert
  image loading;
- audit evidence summarized as medians and ranges above.

## Security Notes

- Audit activity was read-only and used public Production routes only.
- No credentials, verification number, QR token, learner data, private API,
  admin route, service role, or environment secret was used or recorded.
- Raw reports remained temporary and contain only public request URLs.

## Deviations / Open Questions

- INP remains unknown until CrUX has sufficient eligible traffic or an approved
  privacy-aware RUM implementation exists.
- The Production deployment audited here predates the unmerged OG image commit;
  OG images are not render resources, so this does not invalidate page-load
  measurements.
- This ticket deliberately reports findings and does not fix them. Remediation
  must proceed one separately approved ticket at a time.

## Next Dependency

Recommended safe order of separate remediation tickets:

1. split public/admin CSS and repeat Lighthouse;
2. optimize Partnerships partner logos and repeat its image audit;
3. decide and implement the Production font strategy;
4. review cookie-consent first-paint behavior;
5. recheck CrUX/Search Console after sufficient traffic, or approve RUM.
