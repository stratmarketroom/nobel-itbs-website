# PCE-005 Telegram Manager Notifications QA

Date: 2026-08-13

Status: code and static verification complete; external configuration and live
transport acceptance pending

## Scope

PCE-005 replaces the dormant Google Workspace contact-email adapter with a
one-way Telegram Bot API notification after successful contact-submission
storage. No database object, public form, admin permission, or contact-status
workflow changes in this ticket.

## Implemented Contract

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CONTACT_CHAT_ID`, and `ADMIN_BASE_URL` are
  read only in server code;
- no Telegram call occurs when all three values are absent;
- partial or invalid configuration and provider errors return a local `failed`
  result without rejecting or deleting the stored submission;
- the public route schedules notification only after its storage RPC succeeds;
- the route passes only submission type, locale, optional programme slug, and
  an application timestamp to the notification adapter;
- Telegram text adds only the protected `/admin/contact-submissions` link;
- visitor name, email, phone, and message never enter the notification adapter;
- the request has a five-second timeout, disables link previews, uses no rich
  text mode, and logs neither contact data nor provider errors;
- no webhook, inbound command, or browser-exposed Telegram configuration exists.

## Removed Legacy Path

`lib/email/google-workspace.ts` and the obsolete contact-email environment
variables were removed. VEDOS SMTP credential delivery is independent and is
unchanged by this ticket.

## Verification

Run:

```text
npm run verify:pce-004
npm run verify:pce-005
npx tsc --noEmit
npm run lint
npm run build
```

The dedicated PCE-005 verifier checks server-only configuration, the Telegram
endpoint and timeout, the protected-admin link, non-blocking result paths, the
absence of visitor PII in the notification call, removal of legacy Google
Workspace configuration, and the documented environment contract.

## External Acceptance Still Required

1. Create a dedicated bot through BotFather and add it to the approved private
   manager group.
2. Obtain the numeric group `chat_id` without exposing it or the token in Git or
   chat history.
3. Configure all three encrypted variables in Vercel Preview and Production.
4. Send one approved test for each enquiry type and confirm storage precedes the
   minimal Telegram message.
5. Confirm the admin link opens the protected contact-submission list and that
   no visitor PII appears in Telegram.
6. Temporarily test an invalid destination and confirm the public submission
   still succeeds and remains available in admin, then restore the valid value.

## Security Notes

Bot token and chat ID must remain encrypted deployment values. The bot is
restricted operationally to the approved private manager group. Telegram is an
alert channel only; the protected admin area remains the source of truth.
