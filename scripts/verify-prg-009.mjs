import { existsSync, readFileSync } from 'node:fs';

const paths = {
  migration: 'supabase/migrations/20260804170000_prg_009_programme_question_form.sql',
  test: 'supabase/tests/database/prg_009_programme_question_form.test.sql',
  api: 'app/api/v1/public/contact-submissions/route.ts',
  model: 'lib/contact/programme-question.ts',
  form: 'components/programme-question-form.tsx',
  landing: 'components/programme-landing.tsx',
};
const errors = [];

for (const path of Object.values(paths)) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (existsSync(paths.migration)) {
  const sql = readFileSync(paths.migration, 'utf8');
  for (const snippet of [
    'create type public.contact_submission_type',
    "'programme_question'",
    'create table public.contact_submissions',
    'programme_id uuid null references public.programmes',
    'force row level security',
    'contact_submissions_authorized_read',
    "array['owner', 'super_admin', 'credential_manager']",
    'internal.is_mfa_requirement_satisfied()',
    'create table internal.contact_submission_rate_limits',
    'create_programme_question_submission',
    "message = 'CONTACT_RATE_LIMITED'",
  ]) if (!sql.includes(snippet)) errors.push(`Migration missing required SQL behavior: ${snippet}`);
  if (/array\[[^\]]*'content_manager'[^\]]*\][\s\S]{0,100}contact_submissions/i.test(sql)) errors.push('Content Manager must not receive contact-submission access.');
  if (/grant\s+(select|insert|update|delete|all)[^;]*contact_submissions[^;]*\banon\b/i.test(sql)) errors.push('Anonymous users must not receive direct contact-submission table access.');
}

if (existsSync(paths.api)) {
  const api = readFileSync(paths.api, 'utf8');
  for (const snippet of ['validateProgrammeQuestion', "createHmac('sha256'", 'CONTACT_RATE_LIMIT_SECRET', 'captchaValid', "code: 'rate_limited'", 'getSupabaseAdminClient().rpc']) {
    if (!api.includes(snippet)) errors.push(`Public form API missing required behavior: ${snippet}`);
  }
  if (/console\.(log|error)|message:\s*error\.message/i.test(api)) errors.push('Public form API must not log or return raw server errors.');
}

if (existsSync(paths.form)) {
  const form = readFileSync(paths.form, 'utf8');
  for (const snippet of ['privacyAccepted', 'aria-invalid', 'programme-question-success', "status === 'submitting'", "fetch('/api/v1/public/contact-submissions'", 'form-honeypot']) {
    if (!form.includes(snippet)) errors.push(`Programme question form missing required behavior: ${snippet}`);
  }
}

if (existsSync(paths.landing)) {
  const landing = readFileSync(paths.landing, 'utf8');
  for (const snippet of ['QuestionCta', 'ProgrammeQuestionForm', "'#programme-question'"]) {
    if (!landing.includes(snippet)) errors.push(`Programme landing missing secondary question CTA behavior: ${snippet}`);
  }
  if (/mailto:info@nobel-itbs\.eu\?subject/.test(landing)) errors.push('Programme CTA fallback should use the on-site question form, not mailto.');
}

if (existsSync(paths.test)) {
  const test = readFileSync(paths.test, 'utf8').toLowerCase();
  for (const snippet of ['select plan(29);', 'programme context', 'privacy acknowledgement', 'contact_rate_limited', 'anonymous users', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`Database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('.env.example')) {
  const env = readFileSync('.env.example', 'utf8');
  if (!env.includes('CONTACT_RATE_LIMIT_SECRET=')) errors.push('.env.example must document the server-only contact rate-limit secret.');
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-009'] !== 'node scripts/verify-prg-009.mjs') errors.push('package.json must expose verify:prg-009.');
}

if (errors.length) {
  console.error('PRG-009 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PRG-009 verification passed.');
