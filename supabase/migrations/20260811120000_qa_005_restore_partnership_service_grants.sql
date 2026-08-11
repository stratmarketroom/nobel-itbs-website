-- QA-005: keep approved server-only workflows operational for partnership data.
--
-- PCE-001 and PCE-002 granted public reads and actor-scoped authenticated CRUD,
-- but omitted the explicit table privileges required by Supabase's service_role.
-- RLS remains enabled and forced; this migration changes no public or
-- authenticated access policy.

grant select, insert, update, delete
  on table public.partners, public.partner_translations
  to postgres, service_role;

grant select, insert, update, delete
  on table public.experts, public.expert_translations
  to postgres, service_role;
