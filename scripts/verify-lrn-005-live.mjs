import { createHmac, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = (process.env.QA_BASE_URL ?? 'http://localhost:3011').replace(/\/$/, '');

if (!url || !anonKey || !serviceKey) {
  console.error('LRN-005 live verification requires dev Supabase URL, anon key, and service role.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const actor = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const suffix = `${Date.now()}-${randomBytes(3).toString('hex')}`;
const email = `lrn-005-${suffix}@example.invalid`;
const password = `Qa!${randomBytes(20).toString('base64url')}`;
const learnerEmail = `learner-${suffix}@example.invalid`;
const learnerPhone = `+4207${String(Date.now()).slice(-8)}`;
let userId;
let learnerIds = [];
const errors = [];

function decodeBase32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const character of value.replace(/=+$/g, '').toUpperCase()) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('Unexpected TOTP secret.');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  return Buffer.from(bytes);
}

function totp(secret) {
  const counter = Math.floor(Date.now() / 30_000);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

async function api(path, init = {}, accessToken) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('json') ? await response.json().catch(() => null) : await response.arrayBuffer();
  return { response, body };
}

function csvFile() {
  const contents = [
    'Latin first name,Latin last name,Ukrainian full name,Email,Phone,Telegram,Telegram username,Viber,WhatsApp,Internal note',
    `Valid${suffix},Learner,Валідний Тестовий Учень,${learnerEmail},${learnerPhone},Yes,lrn005_${String(Date.now()).slice(-8)},No,Yes,LRN-005 live QA`,
    'Invalid,Learner,Невалідний Тестовий Учень,not-an-email,,No,,No,No,Must remain invalid',
  ].join('\r\n');
  return new File([contents], 'lrn-005-live.csv', { type: 'text/csv' });
}

function importRows(previewRows) {
  return previewRows.map((row) => ({
    rowNumber: row.rowNumber,
    latinFirstName: row.latinFirstName,
    latinLastName: row.latinLastName,
    ukrainianFullName: row.ukrainianFullName,
    email: row.email,
    phone: row.phone,
    hasTelegram: row.hasTelegram,
    telegramUsername: row.telegramUsername,
    hasViber: row.hasViber,
    hasWhatsapp: row.hasWhatsapp,
    internalNote: row.internalNote,
  }));
}

try {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw created.error ?? new Error('Temporary admin could not be created.');
  userId = created.data.user.id;

  const profile = await admin.from('user_profiles').insert({ id: userId, full_name: 'LRN-005 Live QA', is_active: true, is_owner: false, mfa_required: false });
  if (profile.error) throw profile.error;
  const contentRole = await admin.from('user_roles').insert({ user_id: userId, role: 'content_manager' });
  if (contentRole.error) throw contentRole.error;

  const signedIn = await actor.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) throw signedIn.error ?? new Error('Temporary admin sign-in failed.');
  let accessToken = signedIn.data.session.access_token;

  const deniedForm = new FormData(); deniedForm.set('file', csvFile());
  const contentDenied = await api('/api/v1/admin/learners/import/preview', { method: 'POST', body: deniedForm }, accessToken);
  if (contentDenied.response.status !== 403) errors.push(`Content Manager preview expected 403, received ${contentDenied.response.status}.`);

  const removedRole = await admin.from('user_roles').delete().eq('user_id', userId).eq('role', 'content_manager');
  if (removedRole.error) throw removedRole.error;
  const credentialRole = await admin.from('user_roles').insert({ user_id: userId, role: 'credential_manager' });
  if (credentialRole.error) throw credentialRole.error;

  const aal1Form = new FormData(); aal1Form.set('file', csvFile());
  const aal1Denied = await api('/api/v1/admin/learners/import/preview', { method: 'POST', body: aal1Form }, accessToken);
  if (aal1Denied.response.status !== 403) errors.push(`Credential Manager AAL1 preview expected 403, received ${aal1Denied.response.status}.`);

  const enrollment = await actor.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'LRN-005 Live QA' });
  if (enrollment.error) throw enrollment.error;
  const verified = await actor.auth.mfa.challengeAndVerify({ factorId: enrollment.data.id, code: totp(enrollment.data.totp.secret) });
  if (verified.error || !verified.data.access_token) throw verified.error ?? new Error('Temporary MFA verification failed.');
  accessToken = verified.data.access_token;

  const template = await api('/api/v1/admin/learners/import/template', {}, accessToken);
  const templateBytes = Buffer.from(template.body);
  if (template.response.status !== 200 || templateBytes.subarray(0, 2).toString('hex') !== '504b') errors.push('Controlled XLSX template download failed.');

  const xlsxPreviewForm = new FormData();
  xlsxPreviewForm.set('file', new File([templateBytes], 'learner-import-template.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const xlsxPreview = await api('/api/v1/admin/learners/import/preview', { method: 'POST', body: xlsxPreviewForm }, accessToken);
  if (xlsxPreview.response.status !== 200 || xlsxPreview.body?.preview?.totalRows !== 1) errors.push('Controlled XLSX template could not be parsed back into a one-row preview.');

  const previewForm = new FormData(); previewForm.set('file', csvFile());
  const preview = await api('/api/v1/admin/learners/import/preview', { method: 'POST', body: previewForm }, accessToken);
  if (preview.response.status !== 200) errors.push(`Mixed-file preview expected 200, received ${preview.response.status}.`);
  if (preview.body?.preview?.validRows?.length !== 1 || preview.body?.preview?.invalidRows?.length !== 1) {
    const summary = (preview.body?.preview?.invalidRows ?? []).map(({ rowNumber, issues }) => ({ rowNumber, issues }));
    errors.push(`Mixed-file preview did not split one valid and one invalid row: ${JSON.stringify(summary)}.`);
  }

  const validRows = importRows(preview.body?.preview?.validRows ?? []);
  const committed = await api('/api/v1/admin/learners/import/commit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rows: validRows }) }, accessToken);
  if (committed.response.status !== 201 || committed.body?.result?.importedCount !== 1) errors.push(`Confirmed import expected 201/1, received ${committed.response.status}/${committed.body?.result?.importedCount}.`);
  learnerIds = committed.body?.result?.learnerIds ?? [];

  const staleCommit = await api('/api/v1/admin/learners/import/commit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rows: validRows }) }, accessToken);
  if (staleCommit.response.status !== 409) errors.push(`Repeated stale commit expected 409, received ${staleCommit.response.status}.`);

  const duplicateForm = new FormData(); duplicateForm.set('file', csvFile());
  const duplicate = await api('/api/v1/admin/learners/import/preview', { method: 'POST', body: duplicateForm }, accessToken);
  if (duplicate.response.status !== 200 || duplicate.body?.preview?.validRows?.length !== 0 || duplicate.body?.preview?.invalidRows?.length !== 2) errors.push('Post-import preview did not classify both rows as invalid.');

  const [savedLearner, savedEmail, savedPhone, audit] = await Promise.all([
    admin.from('learners').select('id').in('id', learnerIds),
    admin.from('learner_emails').select('learner_id').eq('email', learnerEmail),
    admin.from('learner_phones').select('learner_id').eq('phone', learnerPhone),
    admin.from('audit_log').select('metadata').eq('actor_id', userId).eq('action', 'learners.imported').order('occurred_at', { ascending: false }).limit(1),
  ]);
  if (savedLearner.error || savedLearner.data?.length !== 1) errors.push('Imported learner identity was not persisted exactly once.');
  if (savedEmail.error || savedEmail.data?.length !== 1) errors.push('Imported primary email was not persisted exactly once.');
  if (savedPhone.error || savedPhone.data?.length !== 1) errors.push('Imported primary phone was not persisted exactly once.');
  const metadata = audit.data?.[0]?.metadata;
  if (audit.error || JSON.stringify(metadata) !== '{"count":1}') errors.push('Import audit metadata was not count-only.');
} finally {
  if (learnerIds.length) {
    await admin.from('learners').delete().in('id', learnerIds);
  } else {
    const contact = await admin.from('learner_emails').select('learner_id').eq('email', learnerEmail);
    const cleanupIds = (contact.data ?? []).map(({ learner_id }) => learner_id);
    if (cleanupIds.length) await admin.from('learners').delete().in('id', cleanupIds);
  }
  await actor.auth.signOut({ scope: 'local' }).catch(() => undefined);
  if (userId) await admin.auth.admin.deleteUser(userId).catch(() => undefined);
}

if (errors.length) {
  console.error('LRN-005 live verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('LRN-005 live verification passed: role/MFA denials, XLSX template round trip, mixed CSV preview, atomic valid-row import, duplicate recheck, count-only audit, and cleanup.');
