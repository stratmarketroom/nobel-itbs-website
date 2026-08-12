# Home Visual Baseline

Product: Nobel ITBS Website and Credential Registry
Status: Owner-approved visual source of truth
Approved: 2026-08-11
Scope: Home composition, hierarchy, interaction direction, and responsive behaviour

## 1. Canonical Reference

The approved Home version is preserved in Git:

- branch: `codex/cnt-003-approved-home-visual-baseline`;
- commit: `24f728bc3c8731ecb9ca9d9082dfeb92332ee326`;
- commit message: `CNT-003: preserve approved home visual baseline`;
- reference files at that commit:
  - `app/globals.css`;
  - `components/public-shell.tsx`;
  - `components/home-verification-card.tsx`.

The Owner visually confirmed this version on 2026-08-11. The commit is the immutable implementation reference. A localhost URL is not a durable source of truth and must not be cited as the baseline.

## 2. Source Precedence

When Home sources conflict, apply this order:

1. v2 product, security, content, localization, and verification specifications;
2. this Home visual baseline;
3. `docs/design/DESIGN_GUIDELINES.md` and `.agents/context/DESIGN.md`;
4. archived v1 material for historical atmosphere only.

The archived `docs/source/v1/design-concept-site.png` is not an approved layout specification. It cannot override this baseline.

## 3. Approved First Viewport

The approved Home first viewport has:

- a dark, full-width premium hero rather than a split dark/light page;
- the full Nobel ITBS identity in the header;
- primary navigation, a prominent `Verify` utility action, and EN/UA/CZ switching;
- a large left-aligned editorial heading with deliberate localized line breaks;
- a concise supporting paragraph and one primary programme-catalogue CTA;
- a compact dark verification card inside the hero composition;
- document-number and QR tabs in the compact verification card;
- restrained gold detail, deep Nobel blue, and tinted dark neutrals;
- a clear responsive transition to a single-column mobile composition and an intentional mobile menu.

The approved first viewport does not have:

- a large decorative 3D Nobel `N` as the hero object;
- a separate light `Verify a Document` column;
- a hero programme slider;
- a second competing hero CTA;
- a public name, surname, email, or phone verification field;
- a public PDF-download action.

## 4. Interaction And Accessibility Rules

- Header, mobile menu, tabs, inputs, and buttons must remain keyboard accessible.
- Focus states must be visible on dark and light surfaces.
- Verification tabs must expose correct tab semantics and selected state.
- Mobile must preserve content priority, avoid horizontal overflow, and not compress the desktop grid.
- Verification remains a compact utility and must not compete with the primary programme CTA.
- Motion is optional and restrained. A slider or decorative loop is not part of the approved baseline.

## 5. Current Architecture Integration

The canonical commit preserves the visual direction only. It is based on an older static `HomeCopy` implementation and is not production-ready by itself.

The production integration must:

- port the visual layer into the current structured, Supabase-backed Home architecture;
- keep Home sections editable through the approved manager fields;
- load programme cards and programme facts from the programme catalogue rather than duplicating them in static copy;
- preserve the existing server-mediated WF-008 verification flow and privacy projection;
- localize every visible action and label in EN, UA, and CZ;
- retain English fallback behaviour;
- avoid exposing service-role credentials or protected verification data to browser code.

Do not merge or cherry-pick the baseline branch wholesale into current `main`. Port the approved composition deliberately into the current architecture.

## 6. Rejected Recovery

The following recovery is not an approved visual source:

- branch: `codex/cnt-003-home-design-recovery`;
- commit: `2c088b5088d1e0915a64800fe4f7437b322354b6`;
- GitHub PR: `#3`.

That recovery followed stale v1-derived instructions and restored the large 3D `N` plus the separate light verification panel. It must not be merged or used as visual acceptance evidence.

## 7. Acceptance For The Production Port

The Home visual integration is complete only when:

- desktop and mobile match the hierarchy and composition of commit `24f728b`;
- Home continues to read approved structured content and catalogue data from Supabase;
- EN, UA, and CZ routes render localized controls without hardcoded English UI;
- document-number and QR paths continue to use WF-008 behaviour;
- no old 3D-`N` or light-side-panel layout returns;
- responsive, keyboard, focus, overflow, and browser smoke checks pass;
- the Owner approves the Vercel Preview before production merge.
