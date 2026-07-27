# Agent Prompt Template

Use this template when assigning implementation work to an agent.

```md
You are implementing ticket <TICKET-ID>: <TITLE>.

## Mandatory Reading

Read first:

- AGENTS.md
- docs/README.md
- docs/planning/AGENT_OPERATING_MANUAL.md
- docs/planning/CODEX_TICKET_PACK_v2.md
- docs/planning/IMPLEMENTATION_PLAN_RELEASE_1.md

Then read these ticket-specific documents:

- <DOC-1>
- <DOC-2>
- <DOC-3>

For frontend/UI work, also read:

- docs/design/DESIGN_GUIDELINES.md

For auth/database/credential/storage/email/verification/admin work, also read:

- docs/security/SECURITY_IMPLEMENTATION_RULES.md

## Goal

<One-paragraph goal.>

## Scope

- <Allowed task 1>
- <Allowed task 2>
- <Allowed task 3>

## Out of Scope

- <Forbidden task 1>
- <Forbidden task 2>
- <Forbidden task 3>

## Expected Files / Areas

- <path-or-module>
- <path-or-module>

## Acceptance Criteria

- <criterion 1>
- <criterion 2>
- <criterion 3>

## Required Verification

Run:

- <command or test>

If a command cannot run because dependencies or credentials are missing, report it clearly.

## Security Requirements

- <security rule 1>
- <security rule 2>

## Report Format

Use:

### Summary

### Files Changed

### Database Objects

### Tests / Verification

### Security Notes

### Deviations / Open Questions

### Next Dependency
```

## Example: DBF-001

```md
You are implementing ticket DBF-001: Supabase Foundation.

## Mandatory Reading

Read first:

- AGENTS.md
- docs/README.md
- docs/planning/AGENT_OPERATING_MANUAL.md
- docs/planning/CODEX_TICKET_PACK_v2.md
- docs/planning/IMPLEMENTATION_PLAN_RELEASE_1.md
- docs/technical/SQL_MIGRATION_PLAN_v2.md

Also read:

- docs/security/SECURITY_IMPLEMENTATION_RULES.md

## Goal

Initialize the Supabase project structure and local database foundation without creating business tables.

## Scope

- Create/verify Supabase directory structure.
- Create migrations and tests folders.
- Add or verify Supabase config.
- Add basic local scripts if package setup exists.
- Document how to run local Supabase.

## Out of Scope

- No programme tables.
- No learner tables.
- No credential tables.
- No frontend.
- No RLS policies beyond foundation defaults unless explicitly required.

## Expected Files / Areas

- supabase/
- package.json, only if needed for scripts
- docs/database or docs/planning notes, only if needed

## Acceptance Criteria

- Supabase structure exists.
- Migration folder exists.
- Test folder exists.
- Local setup instructions are documented.
- No business tables are created.

## Required Verification

Run available local checks. If Supabase CLI is unavailable, report it.

## Security Requirements

- Do not create service role usage in frontend.
- Do not commit secrets.

## Report Format

Use the standard report format from AGENT_OPERATING_MANUAL.
```

