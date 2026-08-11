# LRN-004 Learner Admin UI QA Report

Date: 2026-08-07
Scope: protected learner API, profile and contact management, duplicate navigation, archive workflow, credential placeholder, responsive UI, roles, MFA, and cleanup

## Summary

LRN-004 is complete. Authorized managers can list, search, create, update, archive, and restore learner profiles; manage multiple email addresses and phone numbers; change primary contacts; maintain Telegram, Viber, and WhatsApp flags; and open an existing learner directly when a duplicate contact is detected.

The Credentials tab is an intentional placeholder. It does not query or create credential records before Credential Core exists.

## API and UI

- protected list/create learner endpoint;
- protected learner detail/update endpoint;
- protected create/update/remove endpoints for emails and phones;
- active, archived, and all-record filters;
- search by Latin/Ukrainian name, email, or phone;
- duplicate email/phone response uses HTTP `409` and returns a protected existing-learner reference;
- phone input is normalized to the canonical database format;
- learner records use archive/restore instead of authenticated hard delete;
- responsive list/detail workspace with Profile, Contacts, and Credentials tabs;
- inline validation, loading, empty, success, conflict, and error states.

## Security Results

- unauthenticated API access: `401`;
- Content Manager API access: `403`;
- Credential Manager at AAL1: `403`;
- Credential Manager at AAL2: allowed;
- all learner data operations use the signed-in actor's access token and remain subject to RLS;
- no learner API or browser module uses the Supabase service role;
- duplicate references are returned only inside the protected admin API;
- Content Manager does not see Learners in role-aware navigation.

## Live API Results

- learner creation: `201`;
- primary email creation: passed;
- duplicate case-insensitive email: `409` with the correct existing learner;
- formatted phone normalization: passed;
- duplicate phone: `409` with the correct existing learner;
- messenger and phone update: passed;
- search by contact: passed;
- archive filter: passed;
- contact removal: passed;
- temporary learners and auth users after cleanup: `0`.

## Browser Results

The authenticated Owner interface was checked on the default desktop viewport and at `390 × 844`:

- role navigation and Learners active state: passed;
- empty state and inline create form: passed;
- profile creation and automatic transition to Contacts: passed;
- email creation and post-save form reset: passed after a browser-found lifecycle fix;
- Profile, Contacts, and Credentials tabs: passed;
- credential placeholder: passed;
- mobile toolbar, learner list, editor, contact forms, and status badges: passed after a badge-alignment fix;
- no new console errors after the fixes;
- browser-created learner and contacts removed after QA.

## Automated Verification

- `npm run verify:lrn-004` passed;
- ESLint passed;
- TypeScript passed;
- `git diff --check` passed;
- production build passed.

## Database Objects

None. LRN-004 uses the LRN-001..003 tables, constraints, grants, and RLS policies. The migration chain remains at 31 migrations and matches remote dev.

## Result

LRN-004 and Stage 5 Learner Foundation are accepted in dev. The next dependency is CRD-001 Credential Types.
