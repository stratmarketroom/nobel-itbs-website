# PCE-005 Telegram Manager Notifications QA

Date: 2026-08-13

Status: accepted in Production

Documentation reconciled on 2026-08-24 from the original acceptance commit
`bf0af8c` after that documentation-only branch was found not to have been merged
into `main`.

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

## Production Acceptance

The Owner created the dedicated notification bot and private manager group.
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CONTACT_CHAT_ID`, and `ADMIN_BASE_URL` were
stored as sensitive Vercel variables for Production and Preview. No real value
was committed or retained in a workspace file.

The original group ID became invalid when Telegram automatically upgraded the
group to a supergroup. A public test submission still returned `201` and was
stored while Telegram delivery failed, confirming the required non-blocking
failure path. Telegram reported the replacement supergroup ID; the encrypted
Vercel value was corrected and Production deployment
`BGedqcRd7YCPw5uXnmEkWcYQ526N` reached `Ready` from merged commit `36ad7ed`.

The following Production matrix returned `201` for every submission and the
Owner confirmed every corresponding Telegram notification arrived:

| Submission | Locale | Programme |
| --- | --- | --- |
| General enquiry | EN | not applicable |
| Partnership enquiry | EN | not applicable |
| Organisation enquiry | EN | not applicable |
| Programme question | EN | `general-psychology` |
| Programme question | UA | `ai-production` |
| Programme question | CZ | `child-psychology` |
| Programme question | UA | `neuroplastic-reconstruction` |
| Programme question | EN | `space-business` |

The observed message contains only type, website locale, programme context,
UTC timestamp, and the protected-admin URL. It contains no visitor name, email,
phone, or message. All five programmes and all three public locales are covered.
The protected admin area remains the stored source of truth.

## Security Notes

Bot token and chat ID must remain encrypted deployment values. The bot is
restricted operationally to the approved private manager group. Telegram is an
alert channel only; the protected admin area remains the source of truth.

The private-group invitation link used during setup should be revoked and
replaced because it was shared outside Telegram during acceptance. This does
not affect the bot token, chat ID, or accepted transport path.
