import { existsSync, readFileSync } from 'node:fs';
const files=['supabase/migrations/20260805130000_cnt_004_site_settings.sql','supabase/tests/database/cnt_004_site_settings.test.sql','lib/content/site-settings.ts','app/api/v1/admin/site-settings/route.ts','components/admin-site-settings.tsx','app/admin/site-settings/page.tsx'];
const errors=files.filter(file=>!existsSync(file)).map(file=>`Missing ${file}`);
const sql=existsSync(files[0])?readFileSync(files[0],'utf8'):'';
for(const value of ['for_organisations_application_url',"array['owner', 'super_admin']",'internal.is_mfa_requirement_satisfied()','audit_site_setting_change']) if(!sql.includes(value)) errors.push(`Migration missing ${value}`);
if(/content_manager/.test(sql)) errors.push('Content Manager must not edit Site Settings.');
if(errors.length){console.error('CNT-004 verification failed:');for(const error of errors)console.error(`- ${error}`);process.exit(1);}console.log('CNT-004 verification passed.');
