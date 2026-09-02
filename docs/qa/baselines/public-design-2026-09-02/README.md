# Public Design Production Baseline — 2026-09-02

## Purpose

This directory records the public-site visual state before the public design
remediation sequence begins. The images are reference evidence, not approved
target designs.

## Source state

- Repository base: `origin/main` at `9004d9f`
- Working branch: `codex/public-design-remediation`
- Production inspected: `https://nobel-itbs-website.vercel.app`
- Canonical public host reported by the pages: `https://nobel-itbs.eu`
- Locale captured: Ukrainian (`/ua`)
- Browser: external Google Chrome
- Capture date: 2026-09-02, Europe/Prague
- Desktop viewport: 1512 × 900
- Mobile viewport: 390 × 844

Each page was scrolled before capture so that lazy-loaded partner and expert
assets were requested. No public form was submitted. The verification result
uses a synthetic invalid token.

## Desktop captures

| File | Route | Template/state |
| --- | --- | --- |
| `desktop-home-ua.jpg` | `/ua/` | Owner-approved Home baseline |
| `desktop-programmes-ua.jpg` | `/ua/programmes` | Programme catalogue |
| `desktop-taxonomy-technology-ua.jpg` | `/ua/programmes/technology-innovation` | Taxonomy landing |
| `desktop-programme-space-business-ua.jpg` | `/ua/programmes/space-business` | Programme landing |
| `desktop-programme-neuroplastic-ua.jpg` | `/ua/programmes/neuroplastic-reconstruction` | Long programme landing |
| `desktop-about-ua.jpg` | `/ua/about` | Managed institutional page |
| `desktop-partnerships-ua.jpg` | `/ua/partnerships` | Managed partnership page |
| `desktop-for-organisations-ua.jpg` | `/ua/for-organisations` | Managed B2B page |
| `desktop-verify-ua.jpg` | `/ua/verify` | Verification input state |
| `desktop-verify-not-found-ua.jpg` | `/ua/verify/ui-audit-baseline-invalid-token-2099` | Verification not-found state |
| `desktop-privacy-policy-ua.jpg` | `/ua/privacy-policy` | Legal page, including known publication defect |
| `desktop-404-ua.jpg` | `/ua/ui-audit-baseline-404` | Public 404 state |

## Mobile captures

| File | Route | Template/state |
| --- | --- | --- |
| `mobile-home-ua.jpg` | `/ua/` | Home |
| `mobile-programmes-ua.jpg` | `/ua/programmes` | Programme catalogue |
| `mobile-programme-neuroplastic-ua.jpg` | `/ua/programmes/neuroplastic-reconstruction` | Long-title and long-page case |
| `mobile-partnerships-ua.jpg` | `/ua/partnerships` | Partnership page |
| `mobile-for-organisations-ua.jpg` | `/ua/for-organisations` | B2B page |
| `mobile-verify-not-found-ua.jpg` | `/ua/verify/ui-audit-baseline-invalid-token-2099` | Verification not-found state |
| `mobile-privacy-policy-ua.jpg` | `/ua/privacy-policy` | Legal page |

## Known conditions captured intentionally

- The Ukrainian Privacy Policy exposes an internal Release 1 note and raw
  Markdown emphasis.
- Ukrainian managed pages contain mixed-language headings and flattened list
  content.
- Programme pages are visually repetitive and contain limited
  programme-specific imagery.
- The mobile Neuroplastic Reconstruction title slightly exceeds its content
  box and is clipped by the page overflow rule.

These conditions are retained in the baseline so later tickets can demonstrate
the exact before/after result.
