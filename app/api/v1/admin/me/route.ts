import { getAdminContext } from '@/lib/supabase/server';
import { jsonError, jsonOk } from '@/lib/api/responses';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);

    return jsonOk({
      user: {
        id: context.user.id,
        email: context.user.email ?? null,
      },
      profile: context.profile,
      roles: context.roles,
      mfa: {
        required: context.profile.mfa_required,
        aal: context.aal,
        satisfied: context.mfaSatisfied,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
