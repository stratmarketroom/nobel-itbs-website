begin;

select plan(30);

select has_type('public', 'programme_publication_status', 'programme publication status enum should exist');
select has_type('public', 'programme_format', 'programme format enum should exist');
select has_type('public', 'programme_application_provider', 'programme application provider enum should exist');
select has_table('public', 'programmes', 'programmes table should exist');
select has_table('public', 'programme_translations', 'programme translations table should exist');
select col_is_pk('public', 'programmes', 'id', 'programmes.id should be the primary key');
select col_is_pk(
  'public',
  'programme_translations',
  array['programme_id', 'language_code'],
  'programme translations should be unique by programme and language'
);
select has_column('public', 'programmes', 'area_id', 'programme area should exist');
select has_column('public', 'programmes', 'type_id', 'programme type should exist');
select has_column('public', 'programmes', 'slug', 'programme slug should exist');
select has_column('public', 'programmes', 'publication_status', 'publication status should exist');
select has_column('public', 'programmes', 'format', 'programme format should exist');
select has_column('public', 'programmes', 'application_provider', 'application provider should exist');
select has_column('public', 'programmes', 'application_url', 'external application URL should exist');
select has_column('public', 'programme_translations', 'sections', 'structured sales sections should exist');
select has_column('public', 'programme_translations', 'og_title', 'OG title should exist');
select has_column('public', 'programme_translations', 'og_description', 'OG description should exist');
select has_trigger('public', 'programmes', 'programmes_set_updated_at', 'programmes should maintain updated_at');
select has_trigger(
  'public',
  'programme_translations',
  'programme_translations_set_updated_at',
  'programme translations should maintain updated_at'
);

select results_eq(
  $$ select slug, publication_status::text, format::text
     from public.programmes
     order by slug $$,
  $$ values
       ('ai-production'::text, 'published'::text, 'blended_distance'::text),
       ('child-psychology'::text, 'published'::text, 'distance'::text),
       ('general-psychology'::text, 'published'::text, 'distance'::text),
       ('neuroplastic-reconstruction'::text, 'published'::text, 'blended_distance'::text),
       ('space-business'::text, 'published'::text, 'distance'::text) $$,
  'the five approved launch programmes should be published with approved formats'
);

select results_eq(
  $$ select language_code, translation_status::text, count(*)::bigint
     from public.programme_translations
     group by language_code, translation_status
     order by language_code $$,
  $$ values
       ('cz'::text, 'published'::text, 5::bigint),
       ('en'::text, 'published'::text, 5::bigint),
       ('ua'::text, 'published'::text, 5::bigint) $$,
  'all fifteen approved programme translations should be published'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_translations
     where sections ?& array[
       'eyebrow', 'primary_cta_label', 'facts', 'value', 'audience', 'outcomes',
       'curriculum', 'learning_experience', 'assessment_document', 'faq', 'closing_cta'
     ]
       and jsonb_array_length(sections #> '{faq,items}') > 0 $$,
  $$ values (15::bigint) $$,
  'every translation should contain the complete fixed sales-section contract'
);

select results_eq(
  $$ select sections #>> '{current_cohort,fields,start_date}'
     from public.programme_translations translation_record
     join public.programmes programme_record on programme_record.id = translation_record.programme_id
     where programme_record.slug = 'neuroplastic-reconstruction'
       and translation_record.language_code = 'ua' $$,
  $$ values ('5 жовтня 2026 року'::text) $$,
  'Neuroplastic Reconstruction should use the owner-approved full cohort date'
);

select results_eq(
  $$ select
       sections #>> '{assessment_document,fields,issuer}',
       sections #> '{assessment_document,fields,hours_on_certificate}'
     from public.programme_translations translation_record
     join public.programmes programme_record on programme_record.id = translation_record.programme_id
     where programme_record.slug = 'space-business'
       and translation_record.language_code = 'ua' $$,
  $$ values ('Університет імені Альфреда Нобеля'::text, 'false'::jsonb) $$,
  'Space Business should name the University issuer and state that hours are absent from the certificate'
);

select results_eq(
  $$ select slug, application_provider::text, application_url
     from public.programmes
     order by slug $$,
  $$ values
       ('ai-production'::text, 'partner_site'::text, null::text),
       ('child-psychology'::text, 'leeloo'::text, null::text),
       ('general-psychology'::text, 'leeloo'::text, null::text),
       ('neuroplastic-reconstruction'::text, 'partner_site'::text, 'https://school.kholodenko.net/'::text),
       ('space-business'::text, 'leeloo'::text, null::text) $$,
  'programme application routes should match the owner-approved external destinations'
);

select results_eq(
  $$ select bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class
     where oid in (
       'public.programmes'::regclass,
       'public.programme_translations'::regclass
     ) $$,
  $$ values (true) $$,
  'programme tables should enable and force row level security'
);

select has_policy('public', 'programmes', 'programmes_public_read', 'published programmes should have a public read policy');
select has_policy('public', 'programmes', 'programmes_content_update', 'content roles should have an update policy');
select has_policy('public', 'programme_translations', 'programme_translations_public_read', 'published translations should have a public read policy');
select has_policy('public', 'programme_translations', 'programme_translations_content_update', 'content roles should manage translations');

select * from finish();

rollback;
