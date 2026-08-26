import { ApiError } from '@/lib/supabase/server';
import { assertUuid } from '@/lib/learners/admin-input';

export async function readSingleGenerationInput(request: Request): Promise<{ templateVersionId: string }> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError('bad_request', 400, 'Request body must be valid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('bad_request', 400, 'Request body must be a JSON object.');
  }
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'templateVersionId') {
    throw new ApiError('bad_request', 400, 'Only templateVersionId is accepted.');
  }
  if (typeof body.templateVersionId !== 'string') {
    throw new ApiError('bad_request', 400, 'Template version ID is required.');
  }
  return { templateVersionId: assertUuid(body.templateVersionId, 'template version ID') };
}
