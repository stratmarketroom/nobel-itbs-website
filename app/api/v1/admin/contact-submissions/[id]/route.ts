import {
  contactSubmissionStatuses,
  getContactSubmission,
  updateContactSubmissionStatus,
  type ContactSubmissionStatus,
} from '@/lib/contact/admin';
import { jsonError, jsonOk } from '@/lib/api/responses';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

type ContactSubmissionRouteProps = {
  params: Promise<{ id: string }>;
};

type UpdateStatusBody = {
  status?: unknown;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function routeId(props: ContactSubmissionRouteProps): Promise<string> {
  const { id } = await props.params;
  if (!uuidPattern.test(id)) throw new ApiError('bad_request', 400, 'Invalid contact submission ID.');
  return id;
}

export async function GET(request: Request, props: ContactSubmissionRouteProps) {
  try {
    const context = await getAdminContext(request);
    return jsonOk({ submission: await getContactSubmission(context, await routeId(props)) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, props: ContactSubmissionRouteProps) {
  try {
    const context = await getAdminContext(request);
    let body: UpdateStatusBody;
    try {
      body = await request.json() as UpdateStatusBody;
    } catch {
      throw new ApiError('bad_request', 400, 'Valid JSON body is required.');
    }

    if (typeof body.status !== 'string' || !contactSubmissionStatuses.includes(body.status as ContactSubmissionStatus)) {
      throw new ApiError('bad_request', 400, 'Status must be new, processed, or archived.');
    }

    const submission = await updateContactSubmissionStatus(
      context,
      await routeId(props),
      body.status as ContactSubmissionStatus,
    );

    return jsonOk({ submission });
  } catch (error) {
    return jsonError(error);
  }
}
