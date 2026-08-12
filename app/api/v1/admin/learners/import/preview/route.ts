import { jsonError, jsonOk } from '@/lib/api/responses';
import { previewLearnerImport } from '@/lib/learners/import';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const file = (await request.formData()).get('file');
    if (!(file instanceof File)) throw new ApiError('bad_request', 400, 'Choose an .xlsx or .csv file.');
    return jsonOk({ preview: await previewLearnerImport(context, file) });
  } catch (error) { return jsonError(error); }
}
