# CNT-003 Home Visual Baseline Audit

Date: 2026-08-11
Ticket: CNT-003 documentation alignment
Status: completed, visual integration remains open

## Summary

The production Preview mismatch was caused by documentation and Git-history divergence, not by Vercel or Supabase rendering.

The Owner confirmed the locally recovered August 2 Home version as the correct visual direction. That version is now preserved in branch `codex/cnt-003-approved-home-visual-baseline` at commit `24f728b` and documented in `docs/design/HOME_VISUAL_BASELINE.md`.

## Findings

- The approved visual work existed only as uncommitted changes on top of older public UX prototype commit `e36b11b`.
- Later stabilization work did not include those uncommitted visual changes.
- `.agents/context/DESIGN.md` still required a large 3D Nobel `N`, a separate light verification column, and optional hero programme slides.
- The rejected recovery branch followed those stale requirements and therefore rebuilt the wrong Home composition.
- Vercel deployed the branch contents correctly. The deployment platform was not the source of the visual regression.

## Accepted Reference

- branch: `codex/cnt-003-approved-home-visual-baseline`;
- commit: `24f728bc3c8731ecb9ca9d9082dfeb92332ee326`;
- owner confirmation: 2026-08-11;
- canonical documentation: `docs/design/HOME_VISUAL_BASELINE.md`.

## Rejected Reference

- branch: `codex/cnt-003-home-design-recovery`;
- commit: `2c088b5088d1e0915a64800fe4f7437b322354b6`;
- GitHub PR: `#3`;
- reason: it restored the stale 3D-`N` and separate light verification-panel layout.

PR #3 must not be merged and cannot be used as CNT-003 visual acceptance evidence.

## Current Completion Status

Completed:

- CNT-003 data and route foundation;
- structured content model and manager operations;
- public shell/navigation foundation;
- owner-approved Home visual baseline preservation;
- documentation source alignment.

Still open:

- port the approved visual layer into the current structured Supabase-backed Home;
- keep programme content catalogue-driven rather than statically duplicated;
- retain WF-008 server-mediated document-number/QR verification;
- localize all visible EN/UA/CZ controls;
- run desktop/mobile, accessibility, overflow, browser, and owner Preview acceptance.

## Files Changed By This Documentation Ticket

- `AGENTS.md`;
- `.agents/context/DESIGN.md`;
- `docs/README.md`;
- `docs/design/DESIGN_GUIDELINES.md`;
- `docs/design/HOME_VISUAL_BASELINE.md`;
- `docs/preparation/UI_DESIGN_SYSTEM_BRIEF.md`;
- `docs/planning/PROJECT_MASTER_CHECKLIST.md`;
- `docs/development/IMPLEMENTATION_STATUS.md`;
- `docs/qa/CNT_003_HOME_VISUAL_BASELINE_AUDIT_2026-08-11.md`.

## Database Objects

None.

## Security Notes

- No application code, migration, environment value, secret, or database object changed.
- The approved production port must retain WF-008 privacy rules and server-mediated verification.
- The visual baseline branch must not be merged wholesale because it uses an older static content architecture.

## Next Dependency

Implement the scoped CNT-003 Home visual integration on top of current `main`, then obtain owner approval on a Vercel Preview before production merge.
