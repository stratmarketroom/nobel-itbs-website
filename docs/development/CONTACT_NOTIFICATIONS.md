# Contact Submission Notifications

Decision date: 2026-08-07

Current ticket: PCE-005 (Telegram manager notifications)

Implementation status: accepted in Production on 2026-08-13

## Channel Decision

The protected admin area is the source of truth for every contact submission.
Managers will receive optional one-way Telegram notifications instead of email
copies. The server-only adapter is implemented and remains inert when all three
Telegram variables are absent. Telegram delivery does not block or undo an
accepted contact submission.

VEDOS SMTP is the separate approved integration for sending credential PDFs to
learners. It is not used for contact-submission notifications.

## Runtime Configuration

PCE-005 requires server-only deployment values:

- `TELEGRAM_BOT_TOKEN`: token for a dedicated Nobel ITBS notification bot;
- `TELEGRAM_CONTACT_CHAT_ID`: private manager chat that receives notifications;
- `ADMIN_BASE_URL`: production origin used to build the protected-admin link.

Never expose these values through `NEXT_PUBLIC_*` variables or commit real
values. The bot must be limited to the approved private manager chat.

## Delivery Behaviour

1. The public route validates, rate-limits, and stores the submission.
2. Only after storage succeeds, a background task may call Telegram Bot API
   `sendMessage`.
3. The notification contains only submission type, locale, optional programme
   context, timestamp, and a link to `/admin/contact-submissions`.
4. The visitor's message, email, and phone are never copied into Telegram.
5. Missing configuration or a Telegram error never deletes or rejects an
   accepted submission and never exposes provider errors publicly.
6. Release 1 needs no Telegram webhook or inbound bot commands.

The previous dormant Google Workspace contact-email adapter and its environment
contract were removed. This does not affect VEDOS credential delivery, which is
a separate integration.

## Production Acceptance

- [x] dedicated bot and private manager supergroup created;
- [x] token, supergroup chat ID, and admin base URL stored as sensitive Vercel
  variables for Production and Preview;
- [x] general, partnership, organisation, and programme-question submissions
  returned `201` and delivered minimal notifications;
- [x] all five programmes and EN/UA/CZ were covered;
- [x] observed Telegram output contains no visitor name, email, phone, or
  message;
- [x] invalid pre-upgrade group ID produced no Telegram message while the public
  submission still returned `201`, confirming non-blocking failure handling;
- [x] corrected Production deployment reached `Ready` and delivery resumed.

Detailed evidence is recorded in
`docs/qa/PCE_005_TELEGRAM_MANAGER_NOTIFICATIONS_2026-08-13.md`.
