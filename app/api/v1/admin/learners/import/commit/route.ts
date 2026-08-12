import { jsonError, jsonOk } from '@/lib/api/responses';
import { readObject } from '@/lib/learners/admin-input';
import { commitLearnerImport } from '@/lib/learners/import';
import type { LearnerImportRow } from '@/lib/learners/types';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request); const body = await readObject(request);
    if (Object.keys(body).some((key) => key !== 'rows') || !Array.isArray(body.rows)) throw new ApiError('bad_request', 400, 'Validated learner rows are required.');
    return jsonOk({ result: await commitLearnerImport(context, body.rows as LearnerImportRow[]) }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
