import { jsonError } from '@/lib/api/responses';
import { learnerImportTemplate } from '@/lib/learners/import';
import { assertCanManageLearners, getAdminContext } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request); assertCanManageLearners(context);
    const template = await learnerImportTemplate();
    const body = template.buffer.slice(template.byteOffset, template.byteOffset + template.byteLength) as ArrayBuffer;
    return new Response(body, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="nobel-itbs-learners-template.xlsx"', 'Cache-Control': 'private, no-store' } });
  } catch (error) { return jsonError(error); }
}
