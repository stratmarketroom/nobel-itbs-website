# Contact Submission Notifications

Ticket: PCE-004  
Provider: Gmail / Google Workspace  
Scope: server-only notification after a contact submission is stored

## Runtime Configuration

Configure these values in `.env.local` for local development and in the hosting
platform's private environment settings for deployment:

- `CONTACT_NOTIFICATION_EMAIL`: the Nobel ITBS inbox that receives new enquiries;
- `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL`: the Workspace-enabled service account;
- `GOOGLE_WORKSPACE_PRIVATE_KEY`: its private key, stored only as a server secret;
- `GOOGLE_WORKSPACE_DELEGATED_USER`: the authorized Nobel ITBS mailbox used as the sender.

The Workspace administrator must authorize the service account for the narrow
`https://www.googleapis.com/auth/gmail.send` scope. Do not place any of these
private credentials in `NEXT_PUBLIC_*` variables or commit real values.

## Delivery Behaviour

1. The public route validates, rate-limits, and stores the submission.
2. After storage succeeds, a background task attempts the Gmail notification.
3. The message contains the form type, locale, programme context where present,
   and the contact information needed for a response.
4. The sender's reply action points to the visitor's validated email address.
5. Missing configuration or a temporary Gmail error never deletes or rejects an
   already accepted submission.
6. Provider responses and public contact data are not written to application logs.

The protected admin list remains the source of truth even when notification
delivery is unavailable.

## Smoke Check

- submit a programme question through a published programme page;
- confirm the public route returns `201`;
- confirm the new record appears under `/admin/contact-submissions`;
- confirm the configured destination inbox receives the notification;
- change the status and confirm the audit log records only the old and new
  statuses, without copying the contact message or contact details.
