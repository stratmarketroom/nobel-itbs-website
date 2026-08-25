import { jsonError, jsonOk } from '@/lib/api/responses';
import { createPackage, workspace } from '@/lib/credential-templates/admin';
import { jsonBody, packageInput } from '@/lib/credential-templates/admin-input';
import { getAdminContext } from '@/lib/supabase/server';
export async function GET(request:Request){try{return jsonOk(await workspace(await getAdminContext(request)));}catch(error){return jsonError(error);}}
export async function POST(request:Request){try{return jsonOk({package:await createPackage(await getAdminContext(request),packageInput(await jsonBody(request)))},{status:201});}catch(error){return jsonError(error);}}
