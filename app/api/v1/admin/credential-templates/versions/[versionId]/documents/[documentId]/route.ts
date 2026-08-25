import { jsonError, jsonOk } from '@/lib/api/responses';
import {
  deleteCredentialTemplateDocument,
  previewCredentialTemplateDocument,
} from '@/lib/credential-templates/storage';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ versionId: string; documentId: string }> };

async function ids(props: RouteProps) {
  const params = await props.params;
  return {
    templateVersionId: assertUuid(params.versionId, 'credential template version ID'),
    documentId: assertUuid(params.documentId, 'credential template document ID'),
  };
}

export async function GET(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { templateVersionId, documentId } = await ids(props);
    const bytes = await previewCredentialTemplateDocument(context, templateVersionId, documentId);
    return new Response(bytes, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': 'inline; filename="template-preview.pdf"',
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { templateVersionId, documentId } = await ids(props);
    await deleteCredentialTemplateDocument(context, templateVersionId, documentId);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
