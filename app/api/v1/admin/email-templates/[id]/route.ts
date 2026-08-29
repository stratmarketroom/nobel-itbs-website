import { jsonError, jsonOk } from '@/lib/api/responses';
import { updateEmailTemplate } from '@/lib/email-templates/admin';
import { readEmailTemplateUpdate } from '@/lib/email-templates/input';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    const template = await updateEmailTemplate(
      context,
      assertUuid(id, 'email template ID'),
      await readEmailTemplateUpdate(request),
    );
    return jsonOk({ template });
  } catch (error) {
    return jsonError(error);
  }
}
