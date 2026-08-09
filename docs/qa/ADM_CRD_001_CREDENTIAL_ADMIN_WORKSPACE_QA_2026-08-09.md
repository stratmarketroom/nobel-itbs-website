# ADM-CRD-001 Credential Admin Workspace QA — 2026-08-09

## Summary

ADM-CRD-001 is implemented and accepted at the current dev level. It closes the manager-operations gap between the accepted Credential Core/WF-001/WF-002 backend and the next lifecycle ticket. Owner, Super Admin, and Credential Manager receive one protected operational workspace; Content Manager receives no route navigation or API access.

## Implemented Surface

- `/admin/credentials` with Credentials, Credential Sets, and Number Log sections;
- pending-credential creation form backed by the existing WF-001 route;
- credential list, status/search controls, and private detail view;
- summary of current approved public fields without exposing token material;
- current private PDF list/upload/download/primary/replace/delete operations backed by WF-002;
- read-only Credential Sets and permanent Document Number Log;
- append-only History and controlled internal Notes;
- real linked credential summaries in the learner editor;
- role-aware desktop/mobile admin navigation.

## API

- `GET|POST /api/v1/admin/credentials`;
- `GET /api/v1/admin/credentials/{id}`;
- `GET /api/v1/admin/credential-sets`;
- `GET /api/v1/admin/document-numbers`;
- `POST /api/v1/admin/credentials/{id}/notes`;
- `PATCH|DELETE /api/v1/admin/credentials/{id}/notes/{noteId}`;
- existing WF-002 file routes are consumed without changing their contract.

Every route establishes the admin actor and MFA state first. Database reads and Notes RPC calls use the request JWT so existing forced RLS remains authoritative. The workspace never selects or returns verification lookup hashes, encrypted token material, raw tokens, private Storage paths, or PDF bytes. Physical Storage operations remain confined to the already accepted WF-002 server module.

## Scope Boundary

This ticket deliberately does not implement:

- activation or delivery;
- resend;
- revoke;
- void pending;
- valid public-data changes;
- public verification;
- email templates;
- dashboard or global audit UI.

Those operations remain WF-003..008 or later admin modules. No database object or migration changed.

## Automated Verification

Passed:

- `npm run verify:adm-crd-001`;
- TypeScript with `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`;
- all new unauthenticated list APIs returned `401` without a Bearer token.

## Authenticated Browser QA

Passed in the linked dev application with the existing Owner/AAL2 session:

- role navigation exposes Credentials and shows MFA verified;
- real empty Credentials, Credential Sets, and Number Log states load without error;
- pending form loads five published programme references and Certificate/Diploma types;
- no learner exists in dev, so creation is safely disabled rather than consuming a number with incomplete data;
- manual-number controls are present for Owner only;
- switching between Sets and Number Log loads their real tables;
- browser console contains no errors or warnings;
- at 390 × 844 the page has no horizontal overflow (`scrollWidth = innerWidth = 390`);
- no credential was created during UI QA, so the permanent automatic number sequence remains untouched.

## Security Notes

- the shared admin shell restricts the route to Owner, Super Admin, and Credential Manager;
- Content Manager is absent from the route role list and is still denied by the underlying RLS/API assertions;
- Notes update/delete first verifies that the note belongs to the credential ID in the route;
- note edit remains author-only; note deletion remains author or Owner/Super Admin;
- credential numbers are read-only in this workspace and can never be deleted or reused;
- no service-role value exists in client code;
- no public PDF endpoint was added.

## Result and Next Dependency

ADM-CRD-001 is complete. The manager workflow checkpoint before activation is now closed. The next ticket remains `WF-003 Activate and Email`: require a pending credential and primary PDF, activate/issue independently of delivery success, record delivery outcome, and defer real Google Workspace acceptance until credentials are supplied.
