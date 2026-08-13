import { jsonError, jsonOk } from '@/lib/api/responses';
import { sendCredentialSmtpMessage } from '@/lib/email/credential-smtp';
import { ApiError, assertCanManageUsers, getAdminContext } from '@/lib/supabase/server';

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

    const context = await getAdminContext(request);
    assertCanManageUsers(context);
    const recipient = context.user.email?.trim().toLowerCase();
    if (!recipient) {
      throw new ApiError('bad_request', 400, 'The authenticated Owner account has no email address.');
    }

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
