import { jsonError, jsonOk } from '@/lib/api/responses';
import { readCredentialTemplatePdfUpload } from '@/lib/credential-templates/input';
import { uploadCredentialTemplateDocument } from '@/lib/credential-templates/storage';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ versionId: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { versionId } = await props.params;
    return jsonOk({
      document: await uploadCredentialTemplateDocument(
        context,
        assertUuid(versionId, 'credential template version ID'),
        await readCredentialTemplatePdfUpload(request),
      ),
    }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
