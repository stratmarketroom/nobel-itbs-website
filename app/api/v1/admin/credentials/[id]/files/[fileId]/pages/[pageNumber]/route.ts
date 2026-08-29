import { jsonError } from '@/lib/api/responses';
import { renderPdfPage } from '@/lib/credential-templates/page-preview';
import { downloadCredentialFileForPreview } from '@/lib/credentials/files';
import { assertUuid } from '@/lib/learners/admin-input';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string; fileId: string; pageNumber: string }> };

export async function GET(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const params = await props.params;
    const pageNumber = Number(params.pageNumber);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 500) {
      throw new ApiError('bad_request', 400, 'PDF page number is invalid.');
    }
    const png = await renderPdfPage(
      await downloadCredentialFileForPreview(
        context,
        assertUuid(params.id, 'credential ID'),
        assertUuid(params.fileId, 'credential file ID'),
      ),
      pageNumber,
      520,
    );
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
