# LRN-005 Production Acceptance Report

Date: 2026-08-13  
Environment: Vercel Production + `nobel-itbs-prod` Supabase  
Result: **Accepted**

## Summary

LRN-005 Learner List Import is promoted and accepted in production. The forward-only migration is applied, the 50-migration local/production histories match, and the real protected manager workflow passed under the production Owner account with verified MFA/AAL2.

The acceptance used a synthetic two-row CSV: one valid learner and one row with an invalid email. No real learner data was used. The valid row was imported once, the same file was checked again to confirm duplicate rejection, and the temporary learner plus its email and phone were then permanently removed. Production returned to its original zero-learner state.

## Database Objects

- Applied existing migration `20260812110000_lrn_005_learner_import.sql` to production.
- Production now contains `public.import_learners(jsonb)` with the reviewed role/MFA guard, atomic persistence, no-overwrite rules, and count-only Audit metadata.
- No new migration or schema change was created during acceptance.

## Production Verification

- Pre-push dry run listed only `20260812110000_lrn_005_learner_import.sql`.
- Production migration push completed successfully.
- Post-push migration list matched all 50 local migrations.
- Post-push dry run reported the remote database as up to date.
- Protected `/admin/learners` loaded for the production Owner with MFA verified.
- Import controls and the controlled template action were present.
- Synthetic CSV preview returned 2 total rows, 1 ready, and 1 requiring attention.
- The invalid-email row was excluded before confirmation.
- Persistence remained disabled until explicit confirmation.
- Confirmed import created exactly one learner with its normalized email and international phone.
- Rechecking the identical file returned 0 ready and 2 requiring attention.
- The duplicate row reported identity, email, and phone conflicts; the invalid-email row remained invalid.
- Import with 0 valid rows remained disabled.
- Exact cleanup removed the synthetic learner and cascade-deleted its email and phone.
- Direct cleanup verification returned learner `0`, email `0`, and phone `0`.
- Final browser reload showed 0 learners.

## Security Notes

- The browser exercised the real Owner/AAL2 session; no password, MFA code, service-role key, or database password was exposed in logs or committed files.
- The uploaded fixture contained synthetic data under the reserved `.invalid` email domain.
- Duplicate protection prevented overwrite of the existing temporary record.
- Cleanup was safety-scoped to the exact synthetic email, phone, and learner identity before deletion.
- The privacy-minimal `learners.imported` Audit event remains as expected and contains the imported count only, not learner PII.

## Deviations / Open Questions

- The complete pgTAP suite remains dependent on a Docker-compatible runner, as already recorded globally.
- Production launch readiness still has separate operational dependencies; none are part of LRN-005.

## Next Dependency

Return to the ordered QA-005 launch-readiness work: VEDOS credential-delivery alignment and acceptance, Telegram contact alerts, final CTA destinations, backup coverage, canonical domain, analytics/consent, and final device/accessibility/cross-browser acceptance.
