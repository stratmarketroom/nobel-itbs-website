# Contact Submission Notifications

Decision date: 2026-08-07

Current ticket: PCE-004 (admin storage and processing complete)

Deferred ticket: PCE-005 (Telegram manager notifications before launch)

## Channel Decision

The protected admin area is the source of truth for every contact submission.
Managers will receive optional one-way Telegram notifications instead of email
copies. Telegram is intentionally not connected now and does not block LRN/CRD
implementation.

Google Workspace remains a separate future integration for sending credential
PDFs to learners. It is not required for contact-submission notifications.

## Planned Runtime Configuration

PCE-005 will require server-only deployment secrets:

- `TELEGRAM_BOT_TOKEN`: token for a dedicated Nobel ITBS notification bot;
- `TELEGRAM_CONTACT_CHAT_ID`: private manager chat that receives notifications;
- `ADMIN_BASE_URL`: production origin used to build the protected-admin link.

Never expose these values through `NEXT_PUBLIC_*` variables or commit real
values. The bot must be limited to the approved private manager chat.

## Planned Delivery Behaviour

1. The public route validates, rate-limits, and stores the submission.
2. Only after storage succeeds, a background task may call Telegram Bot API
   `sendMessage`.
3. The notification contains only submission type, locale, optional programme
   context, timestamp, and a link to `/admin/contact-submissions`.
4. The visitor's message, email, and phone are never copied into Telegram.
5. Missing configuration or a Telegram error never deletes or rejects an
   accepted submission and never exposes provider errors publicly.
6. Release 1 needs no Telegram webhook or inbound bot commands.

## Pre-launch Acceptance

- create a dedicated bot and private manager chat;
- add the bot token and chat ID to private deployment settings;
- submit each public enquiry type and confirm the record appears in admin first;
- confirm one minimal Telegram notification arrives with a working admin link;
- confirm no visitor message, email, or phone appears in Telegram;
- simulate Telegram failure and confirm the form still returns success and the
  stored submission remains available;
- confirm status changes remain audit-logged without copying contact details.
