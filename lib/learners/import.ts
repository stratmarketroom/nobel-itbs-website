import 'server-only';
import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError, assertCanManageLearners, getSupabaseRequestClient, type AdminContext } from '@/lib/supabase/server';
import type { LearnerImportPreview, LearnerImportPreviewRow, LearnerImportResult, LearnerImportRow } from '@/lib/learners/types';

const maximumFileBytes = 5 * 1024 * 1024;
const maximumRows = 500;
const requiredHeaders = ['latinFirstName', 'latinLastName', 'ukrainianFullName'] as const;

const headerAliases: Record<string, keyof Omit<LearnerImportRow, 'rowNumber'>> = {
  latinfirstname: 'latinFirstName', latinlastname: 'latinLastName', ukrainianfullname: 'ukrainianFullName',
  email: 'email', phone: 'phone', telegram: 'hasTelegram', hastelegram: 'hasTelegram',
  telegramusername: 'telegramUsername', viber: 'hasViber', hasviber: 'hasViber',
  whatsapp: 'hasWhatsapp', haswhatsapp: 'hasWhatsapp', internalnote: 'internalNote',
};

type RawRow = Record<keyof Omit<LearnerImportRow, 'rowNumber'>, string>;

function key(value: string): string { return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, ''); }
function cellText(cell: ExcelJS.Cell): string { return cell.text.trim(); }

function booleanValue(value: string, field: string, issues: string[]): boolean {
  if (!value.trim()) return false;
  const normalized = value.trim().toLocaleLowerCase();
  if (['1', 'true', 'yes', 'y', 'так', 'ano'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'ні', 'ne'].includes(normalized)) return false;
  issues.push(`${field} must be Yes or No.`);
  return false;
}

function optional(value: string, maximum: number, field: string, issues: string[]): string | null {
  const result = value.trim();
  if (!result) return null;
  if (result.length > maximum) issues.push(`${field} is too long.`);
  return result;
}

function required(value: string, maximum: number, field: string, issues: string[]): string {
  const result = value.trim();
  if (!result) issues.push(`${field} is required.`);
  else if (result.length > maximum) issues.push(`${field} is too long.`);
  return result;
}

function normalizePhone(value: string, issues: string[]): string | null {
  if (!value.trim()) return null;
  const compact = value.trim().replace(/[\s().-]/g, '');
  const result = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
  if (!/^\+[1-9][0-9]{6,14}$/.test(result)) issues.push('Phone must use international format, for example +420123456789.');
  return result;
}

function normalizeRow(raw: RawRow, rowNumber: number): LearnerImportPreviewRow {
  const issues: string[] = [];
  const email = optional(raw.email, 320, 'Email', issues)?.toLocaleLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push('Email address is invalid.');
  const hasTelegram = booleanValue(raw.hasTelegram, 'Telegram', issues);
  const telegramUsername = optional(raw.telegramUsername.replace(/^@/, ''), 64, 'Telegram username', issues);
  if (telegramUsername && !hasTelegram) issues.push('Enable Telegram when a Telegram username is provided.');
  return {
    rowNumber,
    latinFirstName: required(raw.latinFirstName, 160, 'Latin first name', issues),
    latinLastName: required(raw.latinLastName, 160, 'Latin last name', issues),
    ukrainianFullName: required(raw.ukrainianFullName, 320, 'Ukrainian full name', issues),
    email,
    phone: normalizePhone(raw.phone, issues),
    hasTelegram,
    telegramUsername,
    hasViber: booleanValue(raw.hasViber, 'Viber', issues),
    hasWhatsapp: booleanValue(raw.hasWhatsapp, 'WhatsApp', issues),
    internalNote: optional(raw.internalNote, 4000, 'Internal note', issues),
    issues,
    valid: issues.length === 0,
  };
}

async function worksheetFrom(file: File): Promise<ExcelJS.Worksheet> {
  if (file.size === 0) throw new ApiError('bad_request', 400, 'The import file is empty.');
  if (file.size > maximumFileBytes) throw new ApiError('bad_request', 400, 'The import file must not exceed 5 MB.');
  const extension = file.name.toLocaleLowerCase().split('.').pop();
  if (extension !== 'xlsx' && extension !== 'csv') throw new ApiError('bad_request', 400, 'Upload an .xlsx or .csv file.');
  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.from(await file.arrayBuffer());
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  try {
    if (extension === 'xlsx') await workbook.xlsx.load(arrayBuffer);
    else {
      const firstLine = buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).split(/\r?\n/, 1)[0] ?? '';
      const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
      // Import every CSV cell as text so phone numbers, leading zeroes, and
      // date-like names are not silently coerced by ExcelJS.
      await workbook.csv.read(Readable.from([buffer]), { parserOptions: { delimiter }, map: (value) => value });
    }
  } catch {
    throw new ApiError('bad_request', 400, 'The spreadsheet could not be read. Use the provided template.');
  }
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new ApiError('bad_request', 400, 'The spreadsheet has no worksheet.');
  return worksheet;
}

async function parsedRows(file: File): Promise<LearnerImportPreviewRow[]> {
  const worksheet = await worksheetFrom(file);
  const headers = new Map<number, keyof Omit<LearnerImportRow, 'rowNumber'>>();
  const found = new Set<string>();
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, column) => {
    const mapped = headerAliases[key(cellText(cell))];
    if (mapped) {
      if (found.has(mapped)) throw new ApiError('bad_request', 400, `Duplicate column: ${cellText(cell)}.`);
      found.add(mapped); headers.set(column, mapped);
    }
  });
  const missing = requiredHeaders.filter((header) => !found.has(header));
  if (missing.length) throw new ApiError('bad_request', 400, `Missing required columns: ${missing.join(', ')}.`);
  const rows: LearnerImportPreviewRow[] = [];
  worksheet.eachRow({ includeEmpty: false }, (worksheetRow, rowNumber) => {
    if (rowNumber === 1) return;
    const raw: RawRow = { latinFirstName: '', latinLastName: '', ukrainianFullName: '', email: '', phone: '', hasTelegram: '', telegramUsername: '', hasViber: '', hasWhatsapp: '', internalNote: '' };
    headers.forEach((field, column) => { raw[field] = cellText(worksheetRow.getCell(column)); });
    if (Object.values(raw).every((value) => !value)) return;
    rows.push(normalizeRow(raw, rowNumber));
  });
  if (!rows.length) throw new ApiError('bad_request', 400, 'The spreadsheet contains no learner rows.');
  if (rows.length > maximumRows) throw new ApiError('bad_request', 400, 'Import at most 500 learners at a time.');
  return rows;
}

function identityKey(row: Pick<LearnerImportRow, 'latinFirstName' | 'latinLastName' | 'ukrainianFullName'>): string {
  return [row.latinFirstName, row.latinLastName, row.ukrainianFullName].map((value) => value.trim().toLocaleLowerCase()).join('\u0000');
}

function addIssue(row: LearnerImportPreviewRow, issue: string) {
  if (!row.issues.includes(issue)) row.issues.push(issue);
  row.valid = false;
}

function addFileDuplicates(rows: LearnerImportPreviewRow[]) {
  const identities = new Map<string, LearnerImportPreviewRow[]>();
  const emails = new Map<string, LearnerImportPreviewRow[]>();
  const phones = new Map<string, LearnerImportPreviewRow[]>();
  for (const row of rows) {
    const identity = identityKey(row); identities.set(identity, [...(identities.get(identity) ?? []), row]);
    if (row.email) emails.set(row.email, [...(emails.get(row.email) ?? []), row]);
    if (row.phone) phones.set(row.phone, [...(phones.get(row.phone) ?? []), row]);
  }
  for (const group of identities.values()) if (group.length > 1) group.forEach((row) => addIssue(row, 'Duplicate learner identity in this file.'));
  for (const group of emails.values()) if (group.length > 1) group.forEach((row) => addIssue(row, 'Duplicate email in this file.'));
  for (const group of phones.values()) if (group.length > 1) group.forEach((row) => addIssue(row, 'Duplicate phone in this file.'));
}

async function addDatabaseConflicts(db: SupabaseClient, rows: LearnerImportPreviewRow[]) {
  const [learners, emails, phones] = await Promise.all([
    db.from('learners').select('latin_first_name, latin_last_name, ukrainian_full_name').limit(10000),
    db.from('learner_emails').select('email').limit(10000),
    db.from('learner_phones').select('phone').limit(10000),
  ]);
  for (const result of [learners, emails, phones]) if (result.error) throw new ApiError('server_error', 500, 'Existing learners could not be checked.');
  const identities = new Set((learners.data ?? []).map((item) => identityKey({ latinFirstName: item.latin_first_name, latinLastName: item.latin_last_name, ukrainianFullName: item.ukrainian_full_name })));
  const existingEmails = new Set((emails.data ?? []).map((item) => String(item.email).toLocaleLowerCase()));
  const existingPhones = new Set((phones.data ?? []).map((item) => item.phone));
  for (const row of rows) {
    if (identities.has(identityKey(row))) addIssue(row, 'A learner with the same full identity already exists. Review manually.');
    if (row.email && existingEmails.has(row.email)) addIssue(row, 'This email already belongs to an existing learner.');
    if (row.phone && existingPhones.has(row.phone)) addIssue(row, 'This phone already belongs to an existing learner.');
  }
}

function db(context: AdminContext): SupabaseClient { assertCanManageLearners(context); return getSupabaseRequestClient(context.accessToken); }

export async function previewLearnerImport(context: AdminContext, file: File): Promise<LearnerImportPreview> {
  const rows = await parsedRows(file); addFileDuplicates(rows); await addDatabaseConflicts(db(context), rows);
  return { fileName: file.name, totalRows: rows.length, validRows: rows.filter(({ valid }) => valid), invalidRows: rows.filter(({ valid }) => !valid) };
}

function importPayload(row: LearnerImportPreviewRow) {
  return { row_number: row.rowNumber, latin_first_name: row.latinFirstName, latin_last_name: row.latinLastName, ukrainian_full_name: row.ukrainianFullName, email: row.email, phone: row.phone, has_telegram: row.hasTelegram, telegram_username: row.telegramUsername, has_viber: row.hasViber, has_whatsapp: row.hasWhatsapp, internal_note: row.internalNote };
}

export async function commitLearnerImport(context: AdminContext, rows: LearnerImportRow[]): Promise<LearnerImportResult> {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > maximumRows) throw new ApiError('bad_request', 400, 'Import between 1 and 500 validated learners.');
  const normalized = rows.map((row) => normalizeRow({ latinFirstName: row.latinFirstName, latinLastName: row.latinLastName, ukrainianFullName: row.ukrainianFullName, email: row.email ?? '', phone: row.phone ?? '', hasTelegram: String(row.hasTelegram), telegramUsername: row.telegramUsername ?? '', hasViber: String(row.hasViber), hasWhatsapp: String(row.hasWhatsapp), internalNote: row.internalNote ?? '' }, row.rowNumber));
  addFileDuplicates(normalized); await addDatabaseConflicts(db(context), normalized);
  const invalid = normalized.filter(({ valid }) => !valid);
  if (invalid.length) throw new ApiError('conflict', 409, 'The import changed or now conflicts with existing data. Run preview again.', { rows: invalid.map(({ rowNumber, issues }) => ({ rowNumber, issues })) });
  const { data, error } = await db(context).rpc('import_learners', { p_rows: normalized.map(importPayload) });
  if (error || !data) {
    if (error?.code === '23505') throw new ApiError('conflict', 409, 'The import conflicts with existing learner data. Run preview again.');
    if (error?.code === '22023' || error?.code === '23514') throw new ApiError('bad_request', 400, 'The learner import is invalid. Run preview again.');
    if (error?.code === '42501') throw new ApiError('forbidden', 403, 'Learner import requires an authorized MFA session.');
    throw new ApiError('server_error', 500, 'Learners could not be imported. No rows were saved.');
  }
  return data as LearnerImportResult;
}

export async function learnerImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'Nobel ITBS';
  const sheet = workbook.addWorksheet('Learners');
  sheet.addRow(['Latin first name', 'Latin last name', 'Ukrainian full name', 'Email', 'Phone', 'Telegram', 'Telegram username', 'Viber', 'WhatsApp', 'Internal note']);
  sheet.addRow(['Ivan', 'Levchenkov', 'Іван Петрович Левченков', 'learner@example.com', '+420123456789', 'Yes', 'ivan_levchenkov', 'No', 'Yes', 'Example row, remove before import']);
  sheet.columns = [18, 20, 34, 30, 20, 12, 24, 10, 12, 38].map((width) => ({ width }));
  sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: 'frozen', ySplit: 1 }]; sheet.autoFilter = 'A1:J1';
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
