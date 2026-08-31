# QA-005 Open Graph Images — 2026-08-31

Ticket: `QA-005-OG-001`

## Summary

Release 1 public metadata now has branded 1200 × 630 social-preview images and
Twitter/X `summary_large_image` cards. The implementation includes:

- one institutional image for Home, About, Partnerships, For Organisations,
  legal pages, 404 fallback, and other generic public surfaces;
- one catalogue image;
- three area-specific programme images;
- one neutral learning-format image shared by the three programme types;
- five programme-specific images;
- one neutral document-verification image with no sample number, QR token,
  learner, holder, partner, or result data;
- absolute Production image URLs, explicit width/height/type, localized alt
  text, OG locale/alternate locale, and Twitter/X image metadata.

Programme catalogue OG title and description copy was aligned with the
approved EN/UA/CZ master-copy files. Programme area/type/detail copy continues
to use the existing localized DB fields.

## Files Changed

- shared metadata integration: `lib/seo/social.ts`, root layout, managed content,
  legal, catalogue, programme landing, Verify, and token-Verify metadata;
- catalogue copy: `lib/programmes/catalogue-copy.ts`;
- social assets: `public/brand/social/*.png`;
- deterministic asset generation and verification:
  `scripts/generate-qa-005-social-images.mjs`,
  `scripts/verify-qa-005-og-images.mjs`, and `package.json`;
- SEO register and this QA record.

## Database Objects

None. No migration, table, policy, function, Storage object, secret, or
Production configuration was changed.

## Tests / Verification

Passed:

- visual inspection of all 12 generated social images;
- `npm run verify:qa-005:og-images` — 12/12 PNG files exist, are exactly
  1200 × 630, and remain below 300 KB;
- `npm run verify:qa-005:seo`;
- `npm run verify:prg-007`;
- `npx tsc --noEmit`;
- `npm run lint` — zero errors; one pre-existing unrelated warning remains in
  `components/admin-shell.tsx`;
- `npm run build`;
- local production HTTP smoke in explicit seed mode for EN/UA/CZ catalogue,
  programme, manual Verify, and token-Verify routes:
  - absolute `og:image` and `twitter:image` URLs;
  - explicit `og:image:width=1200` and `og:image:height=630`;
  - localized image alt text;
  - `twitter:card=summary_large_image`;
  - token page remains `noindex, nofollow`, canonicalizes to manual Verify,
    and contains no raw token in head metadata;
  - PNG endpoint returns `200` and `Content-Type: image/png`.

## Security Notes

- Social metadata is fully public and uses only static brand assets.
- Verify images and metadata contain no document number, raw token, holder,
  credential, partner, PDF, internal ID, history, reason, or success result.
- Token/result pages remain `noindex, nofollow`; their social URL is the safe
  manual Verify canonical.
- No service role, private environment variable, or database read was added.

## Deviations / Open Questions

- The v2 SEO master-copy register requires separate `og_title` and
  `og_description` values for managed Home/About/Partnerships/For Organisations
  pages. The current `content_page_translations` schema and loader expose only
  `seo_title` and `seo_description`. This ticket does not expand the schema;
  those pages therefore use their current localized SEO title/description as a
  safe OG/Twitter fallback. Programme entities already use their dedicated DB
  OG fields, while catalogue and Verify use approved localized in-code copy.
- External platform cache rendering cannot be accepted before deployment.
  Facebook/LinkedIn/X preview validators must be refreshed after merge and
  Production rollout.

## Next Dependency

Proceed with the separate read-only Production Lighthouse/Core Web Vitals
audit for mobile and desktop. Any performance remediation discovered there
must be handled as a later, separately approved implementation ticket.
