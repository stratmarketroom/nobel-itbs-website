# QA-005 VEDOS SMTP Alignment — 2026-08-13

Ticket: `QA-005-EMAIL-001`

## Summary

The active Release 1 source-of-truth documents and WF-003 credential-delivery
code are aligned with the Owner-approved VEDOS SMTP mailbox. Credential
activation keeps the accepted failure-independent transaction: the credential
becomes `valid`, its permanent number becomes `issued`, and private send history
is created before the external mail provider is called.

The Owner created and verified `documents@nobel-itbs.eu` with the display name
`Nobel ITBS` and aliases `certificates` and `diplomas`. Owner-supplied provider
acceptance evidence confirmed outbound delivery to Gmail, an inbound reply,
alias delivery, inbox placement, and `PASS` results for SPF, DKIM, and DMARC.

Code-level alignment is complete. Encrypted Vercel configuration, a
Vercel-origin transport smoke, and the first approved real credential delivery
remain operational acceptance steps; no real credential or permanent document
number was created for this alignment ticket.

## Files Changed

- credential SMTP transport: `lib/email/credential-smtp.ts`;
- WF-003 coordination and manager copy: `lib/credentials/activation.ts`,
  `components/admin-credentials.tsx`;
- dependency/configuration contract: `package.json`, `package-lock.json`,
  `.env.example`;
- verification: `scripts/verify-wf-003.mjs`,
  `scripts/verify-qa-005-vedos-smtp.mjs`;
- active agent/product/technical/security/planning documents under `AGENTS.md`
  and `docs/`;
- current implementation/checklist records and this QA report.

Historical QA reports and already-applied migrations were not rewritten. They
remain evidence of the implementation state at the time they were produced.

## Database Objects

None.

The existing `credential_email_send_status`, `email_templates`,
`credential_email_sends`, `activate_credential(...)`, and
`complete_credential_email_send(...)` contracts remain provider-neutral and did
not require a migration.

## Implemented Behaviour

- credential delivery uses a dedicated server-only Nodemailer SMTP adapter;
- the approved default endpoint is `wes1-smtp.wedos.net:587` with STARTTLS;
- port `465` with implicit TLS is supported as a controlled alternative;
- port `25`, non-VEDOS hosts, certificate-verification bypass, incomplete
  configuration, and invalid sender/recipient headers are rejected;
- TLS requires at least TLS 1.2 with certificate verification enabled;
- connection, greeting, and socket timeouts are bounded;
- sender is `Nobel ITBS <documents@nobel-itbs.eu>` and replies return to the
  same mailbox;
- all current private PDFs remain server-loaded and attached;
- SMTP `sent` means the provider accepted the recipient/message for delivery;
  it is not represented as proof of final inbox delivery;
- missing configuration records `not_configured`; SMTP/Storage failure records
  `failed`; neither outcome rolls back activation;
- the VEDOS credential secrets are separate from the dormant legacy PCE-004
  contact-email adapter, so they cannot activate contact-email copies.

## Tests / Verification

Passed locally:

- `npm run verify:qa-005:vedos-smtp`;
- `npm run verify:wf-003`;
- `npm run verify:pce-004` regression;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`;
- dependency audit during installation: zero reported vulnerabilities.

Provider-side Owner acceptance passed:

- outbound VEDOS Webmail message received in Gmail inbox;
- Gmail reply received in the VEDOS mailbox;
- `certificates@...` and `diplomas@...` aliases delivered to the documents
  mailbox;
- Gmail original-message authentication summary: SPF `PASS`, DKIM `PASS`,
  DMARC `PASS`.

Not yet run:

- SMTP authentication/connectivity from a Vercel Function;
- a Vercel-origin smoke message with a non-sensitive test PDF;
- real WF-003 credential activation/delivery using the approved mailbox.

## Security Notes

- No SMTP password or provider credential is committed or written to this
  report.
- `CREDENTIAL_SMTP_PASSWORD` must exist only in encrypted Vercel environment
  settings and must never use a `NEXT_PUBLIC_*` name.
- The adapter does not log provider errors, recipients, message bodies, PDF
  bytes, private paths, or credentials.
- Actor role/MFA checks still happen before private Storage access.
- Private PDFs remain unavailable to public/browser clients.
- History/Audit still store only bounded outcome metadata and file counts, not
  recipient/message text or private file content.

## Deviations / Open Questions

- The historical PCE-004 contact-email adapter remains dormant and unchanged;
  replacing it with one-way Telegram notifications belongs to PCE-005.
- WF-004 resend and the Email Templates editing UI/API remain separate tickets.
- VEDOS SMTP documents provider acceptance, not guaranteed final recipient
  delivery or bounce processing; bounce/webhook processing is outside Release 1.

## Next Dependency

Add the approved `CREDENTIAL_SMTP_*` and `CREDENTIAL_EMAIL_*` values to the
Vercel Preview environment, with the mailbox password entered directly by the
Owner. Run one Vercel-origin transport smoke to the approved Owner-controlled
recipient. Only after that passes, promote the same encrypted configuration to
Production and perform one explicitly approved real credential delivery.
