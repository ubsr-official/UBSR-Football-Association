# UFA League — Next.js Production Blueprint

## Product identity and delivery status

The product-facing name will become **UBSR FA League**. **UFA League** and **UFL** will be treated as approved short forms across the navigation, metadata, application copy, repository documentation, and future team-facing communications.

The existing source has been pushed non-destructively to the authorized GitHub repository: <https://github.com/ubsr-official/UBSR-Football-Association>. The repository was found to be public and contained only an initial `LICENSE` commit before the UFA League project was added. It should be made private if its source, league data, or operational history must remain restricted.

The current Vite and Express application completed a local production build, but the requested target is a **Next.js App Router** rebuild. Vercel supports Express and Node.js server entrypoints, yet its documentation also confirms that deployed Express applications become a single Vercel Function. The Next.js rebuild is recommended because it gives UFA League native route handling, server rendering, server actions, image optimisation, and a clearer Vercel deployment model. [1] [2]

## Recommended production architecture

| Layer | Recommended production choice | Purpose |
| --- | --- | --- |
| Application | Next.js App Router, TypeScript, Tailwind CSS, Server Components and Route Handlers | Vercel-native rendering, secure server mutations, responsive UI, and a maintainable route structure. |
| Database | Supabase Postgres with SQL migrations and row-level policies | Transactional league records, audit history, standings queries, and invite-linked member data. |
| Authentication | Supabase Auth, invite-only, Google or magic-link sign-in | Secure 54-member access, role mapping, administrator seats, and approved account linking. |
| Storage | Supabase Storage with signed uploads and private object policies | Manager-uploaded team logos and future match-media attachments. |
| Hosting | Vercel connected to the GitHub `main` branch | Preview deployments for review and production deployment only after environment variables and access controls are configured. |
| Observability | Vercel runtime logs, error monitoring, database audit events, health checks, and backup exports | Fast diagnosis, traceable administrator actions, and operational continuity. |

> **Deployment boundary:** The present managed database, login system, and storage helpers do not transfer automatically to Vercel. The Next.js rebuild must use independently configured production services and Vercel environment variables before deployment.

Supabase’s documented server-side authentication and Row Level Security model should be used for all member and manager data access. The browser receives only a publishable key; restricted data mutations and service-role operations stay in server-side Next.js code. Supabase Storage policies will restrict team-logo uploads to the authenticated team manager or an administrator, while database RLS policies will keep private team messages unavailable to other teams and administrators unless the policy explicitly grants access. [3]

## Core domain model

The rebuilt database will preserve the present member, manager, auction, roster, public-trade, private-team-message, and audit concepts. It will extend them with the following first-class records.

| Record | Key fields | Operational rule |
| --- | --- | --- |
| `teams` | manager, display name, short name, logo path, accent colour, active status | A manager controls their own name and logo subject to administrator moderation. |
| `fixture_windows` | home team, away team, allowed start day, allowed end day, state, created by | Only administrators can create a window between two specific teams. Dates are **day-only**; no time field exists. |
| `manager_day_availability` | fixture window, manager team, available calendar day, submitted at | Each manager may submit eligible days only inside the administrator-defined window. |
| `fixture_proposals` | fixture window, proposed day, home accepted, away accepted, published by, state | Every shared day is proposed. A day is publishable only after both managers accept and an administrator publishes it. |
| `fixtures` | approved proposal, home/away teams, match day, class, state, result confirmation | A fixture is either `competitive` or `friendly`; friendlies never enter standings. |
| `match_events` | fixture, minute, type, player, assist player, card type, note | Stores full match logs: goals, assists, cards, substitutions if required later, player of the match, and committee notes. |
| `standings_snapshots` | competition, generated at, team record | Derived from confirmed competitive fixtures; snapshots make historical corrections explainable. |
| `audit_events` | actor, action, entity, before/after JSON, created at | Append-only history for roles, auction edits, roster corrections, market changes, fixture approval, and results. |

## Day-based fixture workflow

1. An administrator creates a fixture window for a named pair of teams and defines the inclusive start and end **days**.
2. Each manager selects every day on which their team is available. Dates outside the window are rejected at both the interface and database layers.
3. The system computes the set intersection of the two teams’ submitted days and creates a proposal for **each** shared day.
4. Each manager accepts or rejects each proposed day. Neither manager can publish the match.
5. When both managers have accepted the same day, the proposal becomes administrator-reviewable.
6. An administrator publishes the fixture. The chosen day becomes immutable without a logged postponement or reschedule action.

This workflow ensures that fixture matching remains deterministic, transparent, and manual at its final publication step. It deliberately contains no timing or automatic background scheduling parameter.

## Match records and standings rules

Competitive results must be explicitly confirmed by an administrator before affecting the table. The live points table is then calculated with **3 points for a win, 1 point for a draw, and 0 points for a loss**. Teams rank by points, then goal difference, then goals scored. Further tie-breakers—such as head-to-head result, fair-play score, or playoff—should be recorded in a published competition rulebook before the first competitive fixture.

Friendlies use the same fixture and match-log experience, but are classified as `friendly` before kickoff. They remain visible in a team’s match history, do not affect the competitive points table, and cannot be reclassified without a logged administrator action. Full logs include final score, goalscorers, assists, cards, player of the match, and committee notes.

## Product surfaces

| Surface | Intended users | Essential behaviour |
| --- | --- | --- |
| League home | All approved members | Market state, next fixtures, current table, league notices, and recent approved activity. |
| Team profile | Manager, rostered players, viewers | Team identity, logo, current roster, results, friendly history, and manager-controlled availability. |
| Fixture workspace | Relevant managers and administrators | Availability calendar, all shared-day proposals, accept/reject decisions, publish state, postponements, and audit trail. |
| Match centre | Administrators and approved viewers | Full match log, outcome confirmation, friendly badge, scorer and discipline records, and result history. |
| Standings | All approved members | Live competitive table, form, matches played, wins, draws, losses, goals for/against, goal difference, and points. |
| Administration | Owner and Arish | Team moderation, account mapping, fixture windows, publication, match confirmation, audit exports, corrections, and operational controls. |

## Production-readiness workstreams

| Workstream | Required controls |
| --- | --- |
| Access control | Invite-only registration; explicit `owner`, `admin`, `manager`, and `player` policies; least-privilege database rules; administrator-seat recovery procedure. |
| Data integrity | Database transactions for auction assignment, roster transfer, confirmed fixture publication, and result confirmation; unique constraints preventing duplicate player ownership and duplicate fixture proposals. |
| Security | Server-side role checks, CSRF-aware mutations, rate limits for messaging and uploads, input schemas, private storage policies, audit trails, secure headers, and no client-exposed service secrets. |
| Moderation | Message-reporting option, image moderation workflow, administrator edit/void tools with required reasons, and preserved action history. |
| Operations | Daily database backup/export, CSV and Markdown league exports, pre-season data import checks, staging previews, rollback checklist, and incident runbook. |
| Quality | Unit tests for standings and day overlap; integration tests for role checks and fixture publication; end-to-end tests for manager acceptance; mobile, accessibility, and performance budgets. |
| Governance | Published competition rules, roster-lock dates, result-confirmation deadline, postponement policy, friendlies policy, and administrator escalation path. |

## Vercel readiness checklist

The Next.js application can be linked to the GitHub repository once the rewrite is committed. The authorized Vercel account currently has no linked project, so no deployment has been created or published. A Vercel project should be created only after the following values are available and verified.

| Required configuration | Use |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser access to the Supabase project endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser authentication and permitted read operations. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only invitations, moderation, and administrative operations. |
| `DATABASE_URL` | Server-side Postgres connection for migrations and constrained transactional operations, if used. |
| `NEXTAUTH_SECRET` or equivalent session secret | Cryptographic session protection if an Auth.js-compatible layer is selected. |
| OAuth provider credentials | Invite-only sign-in provider setup, if using Google sign-in. |
| Storage bucket and upload policy | Validated team-logo uploads and future match-media access. |
| Production domain and allowed redirect URLs | Correct sign-in callbacks and protected URL access. |

Vercel automatically detects Node.js and Express entrypoints and supports TypeScript functions, but platform-compatible assets, secure environment variables, and robust error handling still need to be part of the Next.js migration. [1] [2]

## Security verification record

After the UFA League schema, fixture workflow, and trade workflow migrations were applied, Supabase Security Advisor was run against the active project. Anonymous execution was revoked for every UFA League `SECURITY DEFINER` function. The remaining advisor notices identify authenticated execution of the deliberately role-checked server procedures; those procedures validate the current administrator or participating manager before changing data. The generated `rls_auto_enable` helper was separately revoked from all API roles before release. The advisor remediation guidance remains available at [Supabase’s database linter documentation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Implementation order

1. **Foundation:** Rename all visible product text; create the Next.js App Router shell; port the visual system; establish Supabase projects, roles, and migrations.
2. **League core:** Migrate members, managers, auction records, rosters, account linking, administrator seats, and audit history.
3. **Team identity:** Add editable team names and private, validated logo uploads.
4. **Fixtures:** Implement fixture windows, day availability, all-overlap proposals, dual manager acceptance, administrator publication, postponements, and logs.
5. **Results:** Implement competitive versus friendly fixtures, complete match logs, result confirmation, and live standings.
6. **Production hardening:** Add exports, moderation, tests, accessibility checks, observability, data backups, preview environments, and deployment documentation.
7. **Release:** Create the Vercel project from the GitHub repository, configure verified production secrets, review the preview environment, then publish only through the deployment owner’s explicit approval.

## Decisions still needed before the production launch

The next build iteration can begin immediately, but production deployment requires an approved Supabase project or another production database/authentication provider. It also needs the real email addresses used for invitations, the preferred logo file limits and aspect ratio, a published tie-breaker policy beyond the first three rules, and the season’s competition format.

## References

[1]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[2]: https://vercel.com/docs/functions/runtimes/node-js "Using the Node.js Runtime with Vercel Functions"
[3]: https://supabase.com/docs/guides/getting-started/features "Supabase Features: RLS, server-side auth, and storage"
