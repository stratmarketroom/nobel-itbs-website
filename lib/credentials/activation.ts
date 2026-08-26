import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseAdminClient,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import { decryptCredentialVerificationUrl } from '@/lib/credentials/token';
import { isCredentialSmtpConfigured, sendCredentialSmtpMessage } from '@/lib/email/credential-smtp';
import type {
  ActivateCredentialInput,
  ActivateCredentialResult,
  CredentialActivationDraft,
  CredentialEmailSendStatus,
} from '@/lib/credentials/activation-types';

type FileRow = {
  id: string;
  file_type_id: string;
  admin_label: string | null;
  size_bytes: number;
  is_primary: boolean;
};

type ActivationRow = {
  credential_id: string;
  credential_status: 'valid';
  activated_at: string;
  email_send_id: string;
  email_status: CredentialEmailSendStatus;
};

function client(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function databaseError(error: { code?: string } | null, fallback: string): ApiError {
  if (error?.code === '42501') return new ApiError('forbidden', 403, 'Credential activation is not permitted.');
  if (error?.code === '23514' || error?.code === '22023' || error?.code === '22P02') return new ApiError('bad_request', 400, fallback);
  return new ApiError('server_error', 500, fallback);
}

function siteOrigin(requestOrigin: string): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim() || requestOrigin;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('unsupported protocol');
    return url.origin;
  } catch {
    throw new ApiError('server_error', 500, 'Public site URL configuration is invalid.');
  }
}

function render(value: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce((result, [key, replacement]) => result.replaceAll(`{{${key}}}`, replacement), value);
}

function safeFileName(label: string, index: number): string {
  const base = label.replace(/[\r\n/\\]/g, '-').trim().slice(0, 160) || `credential-document-${index + 1}`;
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

async function currentFiles(db: SupabaseClient, credentialId: string) {
  const [filesResult, typesResult] = await Promise.all([
    db.from('credential_files').select('id, file_type_id, admin_label, size_bytes, is_primary').eq('credential_id', credentialId).order('is_primary', { ascending: false }).order('created_at'),
    db.from('credential_file_types').select('id, code, default_label'),
  ]);
  if (filesResult.error || typesResult.error) throw databaseError(filesResult.error ?? typesResult.error, 'Current credential PDFs could not be loaded.');
  const types = new Map((typesResult.data ?? []).map((row) => [row.id, { code: row.code, label: row.default_label }]));
  return ((filesResult.data ?? []) as FileRow[]).map((file, index) => {
    const type = types.get(file.file_type_id) ?? { code: 'document', label: 'Credential document' };
    return {
      file,
      manifest: {
        file_id: file.id,
        file_type_id: file.file_type_id,
        file_type: type.code,
        filename: safeFileName(file.admin_label ?? type.label, index),
        size_bytes: file.size_bytes,
        is_primary: file.is_primary,
      },
    };
  });
}

export async function getCredentialActivationDraft(
  context: AdminContext,
  credentialId: string,
  requestOrigin: string,
): Promise<CredentialActivationDraft | null> {
  const db = client(context);
  const { data: credential, error } = await db.from('credentials')
    .select('id, learner_id, status, language_code, document_number, public_holder_name, public_programme_title, public_credential_type, verification_token_encrypted, token_encryption_key_version')
    .eq('id', credentialId)
    .maybeSingle();
  if (error) throw databaseError(error, 'Credential activation draft could not be loaded.');
  if (!credential) throw new ApiError('not_found', 404, 'Credential was not found.');
  if (credential.status !== 'pending') return null;

  const templateLanguage = credential.language_code === 'ua' ? 'ua' : 'en';
  const [templateResult, emailResult, files] = await Promise.all([
    db.from('email_templates').select('subject, body').eq('template_key', 'credential_delivery').eq('language_code', templateLanguage).maybeSingle(),
    db.from('learner_emails').select('email').eq('learner_id', credential.learner_id).eq('is_primary', true).maybeSingle(),
    currentFiles(db, credentialId),
  ]);
  if (templateResult.error || !templateResult.data) throw databaseError(templateResult.error, 'Credential email template could not be loaded.');
  if (emailResult.error) throw databaseError(emailResult.error, 'Learner primary email could not be loaded.');
  const verificationPath = decryptCredentialVerificationUrl(
    credential.verification_token_encrypted,
    credential.token_encryption_key_version,
  );
  const variables = {
    holder_name: credential.public_holder_name,
    programme_title: credential.public_programme_title,
    credential_type: credential.public_credential_type,
    document_number: credential.document_number,
    verification_url: `${siteOrigin(requestOrigin)}${verificationPath}`,
  };
  return {
    recipientEmail: emailResult.data?.email ?? '',
    subject: render(templateResult.data.subject, variables),
    body: render(templateResult.data.body, variables),
    templateLanguage,
    hasPrimaryPdf: files.some(({ file }) => file.is_primary),
    fileCount: files.length,
  };
}

function deliveryFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('configuration') || message.includes('configured')) return 'Credential email configuration is incomplete.';
  if (message.includes('PDF')) return 'One or more private PDF files could not be loaded for delivery.';
  return 'VEDOS SMTP delivery failed.';
}

async function finalize(
  db: SupabaseClient,
  emailSendId: string,
  status: 'sent' | 'failed' | 'not_configured',
  technicalError: string | null,
  batchActivation?: { itemId: string; leaseToken: string },
): Promise<boolean> {
  const { error } = batchActivation
    ? await db.rpc('complete_credential_generation_batch_email_send', {
      p_activation_request_item_id: batchActivation.itemId,
      p_lease_token: batchActivation.leaseToken,
      p_status: status,
      p_technical_error: technicalError,
    })
    : await db.rpc('complete_credential_email_send', {
      p_email_send_id: emailSendId,
      p_status: status,
      p_technical_error: technicalError,
    });
  return !error;
}

export async function deliverCredentialEmailSend(
  context: AdminContext,
  credentialId: string,
  emailSendId: string,
  recipientEmail: string,
  subject: string,
  body: string,
  batchActivation?: { itemId: string; leaseToken: string },
): Promise<ActivateCredentialResult['delivery']> {
  const db = client(context);
  const files = await currentFiles(db, credentialId);
  let deliveryStatus: 'sent' | 'failed' | 'not_configured' = 'failed';
  let technicalError: string | null = null;
  try {
    if (!isCredentialSmtpConfigured()) {
      deliveryStatus = 'not_configured';
      technicalError = 'Credential SMTP is not configured.';
    } else {
      const storage = getSupabaseAdminClient().storage.from('private-credentials');
      const attachments = await Promise.all(files.map(async ({ file, manifest }) => {
        const downloaded = await storage.download(`${credentialId}/${file.id}.pdf`);
        if (downloaded.error || !downloaded.data) throw new Error('Private PDF download failed.');
        return {
          filename: manifest.filename,
          contentType: 'application/pdf' as const,
          content: Buffer.from(await downloaded.data.arrayBuffer()),
        };
      }));
      const sendResult = await sendCredentialSmtpMessage({
        to: recipientEmail,
        subject,
        text: body,
        attachments,
      });
      deliveryStatus = sendResult === 'sent' ? 'sent' : 'not_configured';
      technicalError = sendResult === 'sent' ? null : 'Credential SMTP is not configured.';
    }
  } catch (caughtError) {
    deliveryStatus = 'failed';
    technicalError = deliveryFailure(caughtError);
  }

  const resultRecorded = await finalize(
    db,
    emailSendId,
    deliveryStatus,
    technicalError,
    batchActivation,
  );
  return {
    status: resultRecorded ? deliveryStatus : 'pending',
    technicalError: resultRecorded
      ? technicalError
      : 'The credential is valid, but the delivery result could not be finalized. Do not retry activation.',
    resultRecorded,
  };
}

export async function activateCredential(
  context: AdminContext,
  credentialId: string,
  input: ActivateCredentialInput,
  batchActivation?: { itemId: string; leaseToken: string },
): Promise<ActivateCredentialResult> {
  const db = client(context);
  const files = await currentFiles(db, credentialId);
  const { data, error } = await db.rpc('activate_credential', {
    p_credential_id: credentialId,
    p_recipient_email: input.recipientEmail,
    p_subject: input.subject,
    p_body: input.body,
    p_files: files.map(({ manifest }) => manifest),
  });
  const row = (data as ActivationRow[] | null)?.[0];
  if (error || !row) throw databaseError(error, 'Credential could not be activated. Confirm that it is pending and has a primary PDF.');

  if (batchActivation) {
    const linked = await db.rpc('bind_credential_generation_batch_activation_email_send', {
      p_activation_request_item_id: batchActivation.itemId,
      p_lease_token: batchActivation.leaseToken,
      p_email_send_id: row.email_send_id,
    });
    if (linked.error) {
      throw databaseError(linked.error, 'Credential is valid, but its batch delivery record could not be linked for safe resume.');
    }
  }

  if (row.email_status === 'skipped_empty_recipient') {
    return {
      credentialId: row.credential_id,
      status: row.credential_status,
      activatedAt: row.activated_at,
      emailSendId: row.email_send_id,
      delivery: { status: row.email_status, technicalError: 'Recipient email is empty; no delivery was attempted.', resultRecorded: true },
    };
  }

  const delivery = await deliverCredentialEmailSend(
    context,
    credentialId,
    row.email_send_id,
    input.recipientEmail as string,
    input.subject,
    input.body,
    batchActivation,
  );
  return {
    credentialId: row.credential_id,
    status: row.credential_status,
    activatedAt: row.activated_at,
    emailSendId: row.email_send_id,
    delivery,
  };
}
