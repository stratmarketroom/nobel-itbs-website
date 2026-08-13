import { jsonError, jsonOk } from '@/lib/api/responses';
import { sendCredentialSmtpMessage } from '@/lib/email/credential-smtp';
import { ApiError } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ownerEmail = 'nobelitbs@gmail.com';

function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) throw new ApiError('unauthorized', 401, 'Authentication required.');
  return authorization.slice(7).trim();
}

async function assertProductionOwnerAal2(request: Request): Promise<string> {
  const url = process.env.NEXT_PUBLIC_RECOVERY_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_RECOVERY_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new ApiError('server_error', 500, 'Production smoke authentication is not configured.');

  const token = bearerToken(request);
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const verified = await client.auth.getUser(token);
  const email = verified.data.user?.email?.trim().toLowerCase();
  if (verified.error || email !== ownerEmail) throw new ApiError('forbidden', 403, 'Production Owner authentication required.');

  const segments = token.split('.');
  if (segments.length !== 3) throw new ApiError('unauthorized', 401, 'Invalid authentication token.');
  let claims: { aal?: string };
  try {
    claims = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8')) as { aal?: string };
  } catch {
    throw new ApiError('unauthorized', 401, 'Invalid authentication token.');
  }
  if (claims.aal !== 'aal2') throw new ApiError('forbidden', 403, 'AAL2 authentication required.');
  return email;
}

function smokePdf(): Buffer {
  const content = 'BT /F1 18 Tf 72 720 Td (Nobel ITBS VEDOS SMTP transport smoke) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
}

function maskedMailbox(mailbox: string): string {
  const [local, domain] = mailbox.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function POST(request: Request) {
  try {
    if (process.env.VERCEL_ENV !== 'preview') {
      throw new ApiError('not_found', 404, 'Not found.');
    }

    const recipient = await assertProductionOwnerAal2(request);

    const sentAt = new Date().toISOString();
    const result = await sendCredentialSmtpMessage({
      to: recipient,
      subject: `Nobel ITBS VEDOS SMTP transport smoke — ${sentAt}`,
      text: [
        'This is a controlled Vercel Preview transport smoke for Nobel ITBS credential delivery.',
        'It does not represent a real credential and did not create or change any database record.',
        `Vercel timestamp: ${sentAt}`,
      ].join('\n\n'),
      attachments: [{
        filename: 'nobel-itbs-vedos-smtp-smoke.pdf',
        contentType: 'application/pdf',
        content: smokePdf(),
      }],
    });
    if (result !== 'sent') {
      throw new ApiError('server_error', 500, 'Credential SMTP is not configured in Preview.');
    }

    return jsonOk({
      smoke: {
        status: 'sent',
        recipient: maskedMailbox(recipient),
        sentAt,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
