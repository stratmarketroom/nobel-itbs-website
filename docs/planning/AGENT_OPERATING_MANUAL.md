# Agent Operating Manual

Project: Nobel ITBS Website and Credential Registry
Status: mandatory operating instructions for implementation agents

## 1. Purpose

This manual defines how agents must work on the Nobel ITBS project.

It is designed to prevent scope drift, inconsistent interpretation of specifications, security regressions, and conflicting implementation styles.

## 2. Mandatory Reading Order

Before starting any ticket, read:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/planning/CODEX_TICKET_PACK_v2.md`
4. `docs/planning/IMPLEMENTATION_PLAN_RELEASE_1.md`
5. The v2 product/technical documents relevant to the ticket.

For frontend tickets, also read:

- `docs/design/DESIGN_GUIDELINES.md`

For auth, database, credential, storage, email, verification, or admin tickets, also read:

- `docs/security/SECURITY_IMPLEMENTATION_RULES.md`

## 3. Source Hierarchy

Priority order:

1. Explicit orchestrator ticket instructions.
2. v2 documents.
3. Existing code patterns.
4. v1 archive only for historical context.

If there is a conflict between v2 docs and v1 archive, v2 wins.

If there is a conflict between ticket instructions and v2 docs, stop and ask the orchestrator.

If a business rule is missing, do not invent it. Report an open question.

Technical choices may be made conservatively when they do not change product behaviour.

## 4. Allowed Actions

Agents may:

- read project documentation;
- inspect existing code;
- implement only the assigned ticket scope;
- create or edit files needed for the assigned ticket;
- add migrations for assigned database changes;
- add focused tests;
- update docs directly related to the ticket;
- run local validation commands;
- report blockers and open questions.

## 5. Prohibited Actions

Agents must not:

- implement future/backlog features;
- change Release 1 scope;
- modify archived v1 source documents unless explicitly asked;
- add services or vendors not approved in v2 docs;
- hardcode secrets;
- commit credentials or private keys;
- expose service role in browser/client code;
- create public PDF download;
- add public name-based verification;
- add News/Blog to Release 1;
- build a full page builder;
- replace structured content with uncontrolled rich layout logic;
- restore removed credential statuses `expired`, `cancelled`, or public `reissued`;
- replace multi-role user model with a single-role field;
- change language prefixes from `/ua` and `/cz`;
- bypass RLS with application shortcuts.

## 6. Ticket Discipline

Each ticket has:

- ticket ID;
- goal;
- scope;
- out-of-scope list;
- expected files or modules;
- acceptance criteria;
- required verification.

Agents must work only inside the ticket boundary.

When a ticket exposes a prerequisite, stop and report it instead of implementing the prerequisite silently.

## 7. Branch and Commit Discipline

Recommended workflow:

- one ticket per branch or at least one clearly scoped commit;
- branch prefix: `codex/`;
- no direct push to `main`;
- no merge without review;
- no unrelated formatting churn.

Commit message format:

`<ticket-id>: <short summary>`

Example:

`DBF-001: initialize Supabase project structure`

## 8. Definition of Done

A ticket is done only when:

- implementation matches the ticket scope;
- v2 documentation is followed;
- tests or verification are run;
- failures are reported honestly;
- security implications are noted;
- no unrelated changes are included;
- any schema/API/docs changes are documented;
- acceptance criteria are satisfied.

## 9. Required Report Format

Every agent must report:

```md
## Summary

## Files Changed

## Database Objects

## Tests / Verification

## Security Notes

## Deviations / Open Questions

## Next Dependency
```

If no database objects changed, write `None`.

If tests were not run, explain why.

## 10. Open Question Policy

Ask the orchestrator when a decision affects:

- business logic;
- public user experience;
- credential legal/trust behaviour;
- role permissions;
- security posture;
- Release 1 scope;
- external services or cost.

Do not ask the product owner directly unless the orchestrator asks you to.

## 11. Parallel Work Policy

Parallel work is allowed only when modules do not depend on each other.

Do not parallelize:

- database schema changes that touch the same entities;
- auth/RLS and dependent admin features;
- credential lifecycle and public verification before credential core is stable.

Safe candidates for later parallel work:

- public content UI after content schema is stable;
- admin UI screens after APIs are stable;
- QA/security tests after relevant modules exist.

## 12. Required Tools and Capabilities

Depending on ticket phase, agents may need:

- Git;
- Node.js/npm;
- Next.js;
- TypeScript;
- Supabase CLI;
- PostgreSQL/psql;
- database test tooling;
- ESLint/Prettier;
- Playwright;
- Gmail/Google Workspace credentials for integration stage;
- Leeloo test URLs for CTA validation;
- CAPTCHA provider configuration for anti-spam stage.

Never assume external credentials exist. Ask the orchestrator when needed.

