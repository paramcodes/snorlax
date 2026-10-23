# Implementation Plan: Greenfield Team Collaboration App

Planning method: [Addy Osmani's `planning-and-task-breakdown` skill](https://github.com/addyosmani/agent-skills/blob/main/skills/planning-and-task-breakdown/SKILL.md). Detailed tasks live here; [todo.md](./todo.md) is the execution checklist.

## Overview

Build a browser-first, Slack-inspired team collaboration app with an original brand and a Duolingo-green-led visual system. The first release should let a user create or join a workspace, participate in public/private channels, send and search messages, reply in threads, react, and receive useful unread/mention signals. The app will use a feature-first React codebase and managed Supabase services. This is an implementation plan, not a claim that the whole Slack feature set is in scope.

## Goals and initial scope

### In scope for the first useful release

- Account sign-up/sign-in and a user profile.
- Multiple workspaces per account, with membership and invite flow.
- Public and private channels, membership rules, channel navigation.
- Durable messages, edits/deletes, reactions, threaded replies, unread state, and mention notifications.
- Search across only the workspaces/channels the user is allowed to see.
- Optional file attachments with private storage access.
- Responsive desktop and mobile-web layouts, keyboard navigation, accessible contrast, and useful loading/error/empty states.
- Local development, browser workflow verification, reproducible migrations, and a deployable first environment.

### Explicitly deferred unless product decisions expand scope

- Huddles/audio/video, enterprise SSO, Slack Connect/external organizations, workflow automation, AI features, native mobile apps, end-to-end encryption, complex retention/legal holds, and advanced admin billing.
- Rich document editing. Begin with a constrained message composer; choose Tiptap or another editor only after formatting and mention requirements are approved.

## Architecture decisions and constraints

- **Frontend:** Vite + React + TypeScript + React Router; client-first app shell. Switch to Next.js only if public SEO pages/server rendering become a real requirement.
- **Styling and primitives:** Tailwind CSS v4 + HeroUI v3 for accessible common controls. Build the workspace shell, channel list, message rows, and composer as product-specific UI. Avoid mixing component libraries.
- **Brand:** establish original product name, logo, type, and component styling. Treat the familiar Duolingo green as palette inspiration; choose and contrast-check actual tokens rather than asserting an official brand hex.
- **Runtime/package manager:** Bun for installs, scripts, workspace use if needed, and tests. Commit `bun.lock`; pin Bun in development/CI.
- **Type checking:** `tsrs` is the requested primary checker. Pin its version and compare against Microsoft's TypeScript compiler in CI while `tsrs` compatibility stabilizes.
- **Backend:** Supabase Auth, Postgres, Storage, and Realtime. Keep message state durable in Postgres and enforce workspace/channel membership in database RLS and Realtime authorization.
- **Realtime:** use Broadcast for low-latency message events and Presence for slow-changing online status. Clients reconcile after reconnect from the durable message history; realtime events are not the message database.
- **Background jobs:** add Trigger.dev only for retryable/scheduled work (for example, digest delivery or attachment processing). Do not route ordinary message send through a durable job queue.
- **Client state:** TanStack Query owns server data. Local component state owns ephemeral UI state; use Zustand only for genuinely cross-route UI state. Put selected workspace/channel/thread in the URL when the location should be linkable.
- **Tooling:** Biome, Vitest, Supabase CLI, `agent-browser` CLI with Lightpanda for semantic browser workflows, Chrome via the same CLI for rendered screenshots, and Lefthook for fast pre-commit and broader pre-push gates.
- **Codebase shape:** start as one app with feature-first modules and explicit dependency direction. Do not start with a monorepo. See [modern stack research](../docs/research/modern-stack-and-tooling.md).

## Dependency map

```text
Product scope, domain vocabulary, and access rules
                    │
        App scaffold and design tokens
                    │
    Auth + workspace membership + RLS
                    │
         Channels and membership
                    │
 Durable messages + Realtime Broadcast
                    │
    Threads/reactions/unread state
                    │
   Search + notifications + uploads
                    │
 Responsive/accessibility/performance
                    │
       Deployment and observability
```

The feature work should be delivered vertically: each major slice should include its schema/RLS, typed contract, data access, UI, and focused verification before the next slice expands it.

## Task list

### Phase 0: Lock product scope and data rules

#### Task 1: Confirm the MVP workflows and product boundaries

**Description:** Convert the goals above into a short product spec for the first release. Resolve whether invite links, email notifications, and attachments are required at launch; keep voice/video and native clients deferred unless explicitly added.

**Acceptance criteria:**
- [ ] The MVP includes a prioritized set of user journeys and a clear deferred list.
- [ ] Account/workspace assumptions and invite behavior are recorded.
- [ ] Each journey has a user-visible success condition.

**Verification:** Product owner reviews the journeys and signs off on the launch boundary.

**Dependencies:** None.

**Files likely touched:** `docs/product/PRODUCT_SPEC.md`.

**Estimated scope:** Small.

#### Task 2: Define collaboration domain model and authorization matrix

**Description:** Define workspace, user profile, workspace membership, channel, channel membership, message, thread reply, reaction, read marker, invitation, and attachment concepts. Record who can read/write each object and the rules for public/private channels.

**Acceptance criteria:**
- [ ] Entity relationships and invariants are documented in plain language.
- [ ] A role/action matrix covers workspace members, channel members, invited users, and unauthenticated users.
- [ ] Search, realtime topics, and attachment access use the same visibility rules.

**Verification:** Review the matrix against each MVP journey; no operation relies on client-only filtering for privacy.

**Dependencies:** Task 1.

**Files likely touched:** `docs/product/DOMAIN_MODEL.md`, `docs/product/AUTHORIZATION.md`.

**Estimated scope:** Small.

#### Task 3: Create the original visual system and screen-state blueprint

**Description:** Define brand identity and design tokens, then map the workspace shell and key desktop/mobile screens. Include loading, empty, error, selected, unread, mention, thread-open, and search states.

**Acceptance criteria:**
- [ ] Palette includes accessible green, dark-green, neutral, border, and focus tokens with contrast values recorded.
- [ ] Desktop and mobile wireframes cover workspace navigation, channel conversation, thread panel, search, and account/workspace menus.
- [ ] The design has original visual markers and does not reuse Slack branding or exact visual treatment.

**Verification:** Review token contrast and screen states against the approved product journeys; capture approved reference frames.

**Dependencies:** Task 1.

**Files likely touched:** `docs/design/DESIGN_SYSTEM.md`, `docs/design/WIREFRAMES.md` (and approved design source, if used).

**Estimated scope:** Medium.

### Checkpoint: Scope and foundations

- [ ] Tasks 1–3 are reviewed; the launch boundary and authorization model are approved.
- [ ] The visual direction is distinct and green contrast tokens are tested.
- [ ] Do not begin persistent data implementation until the workspace/channel access matrix is accepted.

### Phase 1: Establish the app and local development path

#### Task 4: Scaffold the Vite, React, TypeScript, and Bun app

**Description:** Create the single application, establish strict TypeScript settings, route structure, Bun lockfile/version, environment variable handling, and canonical scripts. Keep dependencies minimal and compatible with the selected stack.

**Acceptance criteria:**
- [ ] `bun install`, `bun run dev`, and `bun run build` work from a clean checkout.
- [ ] `bun.lock` and the Bun version are committed/documented.
- [ ] `tsrs` is pinned as the primary typecheck, with a Microsoft compiler parity script in CI until compatibility is accepted.

**Verification:** Run clean install, development startup, build, `tsrs`, and TypeScript parity commands; capture the actual results in the PR.

**Dependencies:** Tasks 1–3.

**Files likely touched:** `package.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`.

**Estimated scope:** Medium.

#### Task 5: Set up quality commands and Lefthook gates

**Description:** Configure Biome and the canonical `check`, `test`, `test:browser`, `build`, and `verify` commands. Add Lefthook pre-commit checks for staged files and pre-push checks for the fast full gate; install hooks via a documented Bun-compatible command.

**Acceptance criteria:**
- [ ] Formatting, linting, type checking, unit tests, browser checks, build, and full verification have one documented command each.
- [ ] Pre-commit is limited to fast staged-file checks; pre-push runs the agreed local verification gate.
- [ ] CI runs the same canonical checks and does not silently skip failures.

**Verification:** Demonstrate each command succeeds on clean code and that a deliberate formatting/lint/type violation is caught by its intended gate.

**Dependencies:** Task 4.

**Files likely touched:** `biome.json`, `lefthook.yml`, `package.json`, `.github/workflows/ci.yml`, `README.md`.

**Estimated scope:** Medium.

#### Task 6: Configure agent-browser and local Supabase development

**Description:** Add repeatable local setup for Supabase and the Vercel `agent-browser` CLI. Default semantic interaction checks to Lightpanda; document Chrome engine use for screenshot-based review because Lightpanda does not render screenshots.

**Acceptance criteria:**
- [ ] Local Supabase can start from a documented command and exposes Auth, Postgres, Realtime, and Storage.
- [ ] `agent-browser` can open the local app and produce an accessibility snapshot using Lightpanda.
- [ ] Screenshot review command uses Chrome through `agent-browser` and is documented separately.

**Verification:** From a fresh checkout, start local dependencies, open the app in each configured engine, and exercise a smoke route.

**Dependencies:** Tasks 4–5.

**Files likely touched:** `supabase/config.toml`, `.env.example`, `package.json`, `agent-browser.json`, `README.md`.

**Estimated scope:** Medium.

#### Task 7: Build the branded responsive app shell

**Description:** Implement the authenticated workspace frame with workspace switcher, primary navigation, channel/DM sidebar, top bar, content region, and responsive navigation collapse using the approved design tokens.

**Acceptance criteria:**
- [ ] The shell matches the approved desktop/mobile references and uses the original green token system.
- [ ] Navigation can be used by keyboard with visible focus and selected/unread states.
- [ ] All major app routes have intentional loading, empty, and error surfaces.

**Verification:** Use `agent-browser` snapshots for navigation and `agent-browser` with Chrome to review rendered desktop/mobile screenshots.

**Dependencies:** Tasks 3–6.

**Files likely touched:** `src/app/routes.tsx`, `src/app/layout.tsx`, `src/shared/ui/*`, `src/styles/*`, `src/features/navigation/*`.

**Estimated scope:** Medium.

### Checkpoint: Local app foundation

- [ ] Clean checkout can install, start, typecheck, and build.
- [ ] Lefthook and CI use the same named commands.
- [ ] App shell has been reviewed in Lightpanda interactions and Chrome screenshots.

### Phase 2: Ship account and workspace membership as one vertical slice

#### Task 8: Add Supabase migrations, generated types, and authorization primitives

**Description:** Create the initial schema and migration workflow for profiles, workspaces, memberships, and invitations. Add indexes, constraints, RLS policies, and generated TypeScript types in the same slice.

**Acceptance criteria:**
- [ ] Migrations recreate the schema on a fresh local Supabase instance.
- [ ] RLS prevents users from reading or mutating workspaces where they have no membership.
- [ ] Generated DB types are checked into the expected source location and stay synchronized with migrations.

**Verification:** Run migration reset/type generation and database-level positive/negative authorization checks with separate users.

**Dependencies:** Tasks 2, 4, 6.

**Files likely touched:** `supabase/migrations/*`, `supabase/seed.sql`, `src/shared/db/database.types.ts`, `src/features/workspaces/workspaces.schema.ts`.

**Estimated scope:** Medium.

#### Task 9: Implement sign-up, sign-in, sign-out, and profile setup

**Description:** Add the authenticated session flow and profile onboarding with route guards and clear session/error states.

**Acceptance criteria:**
- [ ] A new user can register, confirm/complete the configured auth flow, sign in, and sign out.
- [ ] Protected routes redirect unauthenticated users without exposing workspace data.
- [ ] Profile display name and avatar state are available to subsequent collaboration features.

**Verification:** Browser flow covers successful registration/login/logout and invalid/expired-session paths; server/database checks verify unauthenticated access is denied.

**Dependencies:** Task 8.

**Files likely touched:** `src/features/auth/*`, `src/features/members/*`, `src/app/routes.tsx`, `src/shared/supabase/*`.

**Estimated scope:** Medium.

#### Task 10: Implement workspace creation, switching, and invitations

**Description:** Allow an authenticated user to create a workspace, switch between memberships, invite another user using the chosen invite mechanism, and land on a valid workspace route.

**Acceptance criteria:**
- [ ] Users can create and switch between workspaces they belong to.
- [ ] Valid invitations grant only the intended workspace membership; invalid/expired invitations fail clearly.
- [ ] Workspace selection and navigation are represented by stable linkable routes.

**Verification:** Exercise two accounts, multiple workspaces, valid/expired invite cases, and unauthorized membership attempts.

**Dependencies:** Tasks 8–9.

**Files likely touched:** `src/features/workspaces/*`, `src/features/invitations/*`, `src/app/routes.tsx`, `supabase/migrations/*`.

**Estimated scope:** Medium.

### Checkpoint: Account and tenant isolation

- [ ] Two independent accounts can create/join different workspaces without seeing each other's data.
- [ ] Auth redirects, invite expiry, and workspace switching behave as intended.
- [ ] RLS tests cover both allowed and denied access.

### Phase 3: Channels and durable live messaging

#### Task 11: Implement channel creation, discovery, and channel membership

**Description:** Add public/private channel creation, descriptions, channel browsing/joining, and private channel membership management.

**Acceptance criteria:**
- [ ] Members can create and join public channels in their workspace.
- [ ] Private channel content and metadata are visible only to authorized members.
- [ ] Channel membership changes update the user interface and authorization consistently.

**Verification:** Browser flows cover create/browse/join/leave and a second account proves private channel isolation at query and route boundaries.

**Dependencies:** Task 10.

**Files likely touched:** `src/features/channels/*`, `supabase/migrations/*`, `src/features/navigation/*`.

**Estimated scope:** Medium.

#### Task 12: Add durable message history and send/edit/delete

**Description:** Create message persistence, authorization, chronological history loading, composer submit, edit/delete behavior, and safe display of plain text/links. Add idempotency or another retry-safe send strategy.

**Acceptance criteria:**
- [ ] Authorized members can send and retrieve channel messages in stable order.
- [ ] Retry/reconnect does not create duplicate messages; edits/deletes follow the approved policy.
- [ ] Unauthorized users cannot read, create, edit, or delete messages through direct data access.

**Verification:** Integration checks cover persistence, ordering, retries, and RLS; browser checks cover send/edit/delete and empty/loading/error history.

**Dependencies:** Task 11.

**Files likely touched:** `supabase/migrations/*`, `src/features/messages/*`, `src/shared/query/*`, `src/shared/supabase/*`.

**Estimated scope:** Medium.

#### Task 13: Add Broadcast delivery, Presence, and reconnect reconciliation

**Description:** Broadcast persisted message events to authorized channel subscribers; show basic online presence; reconcile from the database after reconnect and remove subscriptions on route change/unmount.

**Acceptance criteria:**
- [ ] Two authorized clients see a newly persisted message without manual refresh.
- [ ] Unauthorized users cannot join private channel topics or receive private events.
- [ ] Reconnect recovers missed history without duplicate or out-of-order messages; presence is not treated as durable state.

**Verification:** Multi-session browser workflow covers two users, channel switching, disconnect/reconnect, and private-topic denial.

**Dependencies:** Task 12.

**Files likely touched:** `src/features/messages/*`, `src/features/members/*`, `src/shared/realtime/*`, `supabase/migrations/*`.

**Estimated scope:** Medium.

### Checkpoint: Channel messaging

- [ ] An invited user can enter a workspace, join a public channel, and exchange durable messages live with another user.
- [ ] Private channel RLS and Realtime authorization deny a non-member.
- [ ] Reconnect and retry paths preserve message correctness.

### Phase 4: Threads, reactions, read state, and search

#### Task 14: Implement message threads

**Description:** Allow a user to open a thread from a parent message, see parent context and replies, post replies, and navigate/share a link to the thread.

**Acceptance criteria:**
- [ ] Thread replies retain their parent relationship and appear in channel/thread context correctly.
- [ ] Thread permissions follow the parent channel's membership rules.
- [ ] Thread route/state can be opened, refreshed, and closed without losing the selected channel.

**Verification:** Browser scenarios cover parent/reply creation, refresh/deep link, and private-channel access denial.

**Dependencies:** Task 13.

**Files likely touched:** `src/features/threads/*`, `src/features/messages/*`, `supabase/migrations/*`, `src/app/routes.tsx`.

**Estimated scope:** Medium.

#### Task 15: Add emoji reactions and message actions

**Description:** Add reaction add/remove, counts, and accessible message action menus while retaining optimistic UI and server reconciliation.

**Acceptance criteria:**
- [ ] Members can add/remove a reaction and see counts update consistently.
- [ ] Repeated action or network retry does not duplicate a user's reaction.
- [ ] Message actions have keyboard access and announce their state to assistive technology.

**Verification:** Unit/integration checks cover uniqueness and authorization; browser check covers keyboard and multi-client updates.

**Dependencies:** Task 12.

**Files likely touched:** `src/features/reactions/*`, `src/features/messages/*`, `supabase/migrations/*`.

**Estimated scope:** Medium.

#### Task 16: Add unread markers and mention activity

**Description:** Track per-user read position and mention events; update channel/sidebar unread badges and an in-app activity view. Decide whether email/push delivery is launch scope before implementing external notifications.

**Acceptance criteria:**
- [ ] Unread state is per user and updates when a conversation is read.
- [ ] Mentions are recognized from the approved composer syntax and link to the source message/thread.
- [ ] Activity/unread queries respect workspace and private-channel authorization.

**Verification:** Two-user scenarios cover read positions, mention delivery, and hidden private-channel notifications.

**Dependencies:** Tasks 12 and 14.

**Files likely touched:** `src/features/notifications/*`, `src/features/messages/*`, `src/features/navigation/*`, `supabase/migrations/*`.

**Estimated scope:** Medium.

#### Task 17: Implement permission-aware message search

**Description:** Search messages by text, channel, author, and date range using Postgres full-text search or an explicitly chosen provider. Keep result ranking/filtering server-side and permission-aware.

**Acceptance criteria:**
- [ ] Search returns matching messages with useful context and navigation to the conversation.
- [ ] Search filters do not expose messages outside the user's authorized workspace/channel set.
- [ ] Common query path has an index and pagination/limits to control load.

**Verification:** Seeded search checks cover terms, filters, pagination, and a private-channel negative case for both direct query and browser flow.

**Dependencies:** Tasks 12 and 14.

**Files likely touched:** `supabase/migrations/*`, `src/features/search/*`, `src/features/messages/*`, `src/app/routes.tsx`.

**Estimated scope:** Medium.

### Checkpoint: Find and follow conversation

- [ ] Users can reply in threads, react, track unread/mentions, and find accessible messages.
- [ ] Each feature is verified for both allowed and denied access paths.
- [ ] Search latency and message-list rendering are measured before optimization work is chosen.

### Phase 5: Attachments, background work, and product polish

#### Task 18: Add private file attachments

**Description:** Upload, list, download, and remove attachments through Supabase Storage with per-workspace/channel access checks, size/type limits, and safe UI states.

**Acceptance criteria:**
- [ ] Authorized channel members can upload and retrieve permitted attachments.
- [ ] Non-members cannot enumerate or download private channel files.
- [ ] Upload limits, rejected types, progress, and failure/retry states are visible.

**Verification:** Test allowed/denied Storage policies and browser upload/download/failure flows with multiple accounts.

**Dependencies:** Task 11; Task 12 for attaching to messages.

**Files likely touched:** `src/features/attachments/*`, `src/features/messages/*`, `supabase/migrations/*`, `.env.example`.

**Estimated scope:** Medium.

#### Task 19: Add durable notification and attachment jobs where needed

**Description:** Integrate Trigger.dev for approved scheduled digests, retryable delivery, or expensive attachment processing. Add idempotency keys and observability for each task. Keep immediate in-app Broadcast separate.

**Acceptance criteria:**
- [ ] Only confirmed launch jobs are implemented; no job is used for ordinary message persistence/delivery.
- [ ] Retries are idempotent and failures are visible for support/debugging.
- [ ] Job payloads contain references/IDs rather than unnecessary sensitive message contents.

**Verification:** Trigger success/retry/failure paths in development and verify users receive no duplicate effects.

**Dependencies:** Tasks 16 and/or 18; skip this task if background work is not required for launch.

**Files likely touched:** `src/trigger/*`, `trigger.config.ts`, `src/features/notifications/*`, `src/features/attachments/*`.

**Estimated scope:** Medium.

#### Task 20: Complete responsive behavior, keyboard access, and accessibility review

**Description:** Review all primary workflows at mobile-web and desktop widths. Close gaps in keyboard navigation, screen-reader names/state, contrast, reduced motion, focus management, and overlay behavior.

**Acceptance criteria:**
- [ ] Workspace navigation, message reading/composing, thread use, search, and menus work at supported viewport widths.
- [ ] Keyboard-only use is possible for every launch-critical action with visible focus and no keyboard trap.
- [ ] Green and status colors are not the sole indicator of meaning; text/UI contrast meets the selected WCAG target.

**Verification:** Agent-browser semantic interaction checks plus Chrome screenshot review at documented viewport sizes; manual keyboard and screen-reader review on the critical flows.

**Dependencies:** Tasks 7, 9–18.

**Files likely touched:** `src/shared/ui/*`, `src/features/*/components/*`, `src/styles/*`, `docs/design/*`.

**Estimated scope:** Medium.

#### Task 21: Measure and address message/search performance

**Description:** Measure realistic message history and channel counts, then add only needed pagination, list virtualization, indexes, or query tuning. Record target budgets and observed baseline.

**Acceptance criteria:**
- [ ] Baseline includes navigation, opening a busy channel, scrolling history, and a common search.
- [ ] Any optimization has before/after measurements and preserves ordering, accessibility, and realtime updates.
- [ ] Large history loading is bounded and does not fetch the entire workspace into browser memory.

**Verification:** Use seeded development data and repeat the same browser/database workload before and after the change.

**Dependencies:** Tasks 13 and 17.

**Files likely touched:** `src/features/messages/*`, `src/features/search/*`, `supabase/migrations/*`, `docs/architecture/PERFORMANCE.md`.

**Estimated scope:** Medium.

### Checkpoint: Launch candidate

- [ ] Approved MVP journeys work end-to-end on desktop and mobile-web.
- [ ] RLS, Realtime, Storage, search, and notification access are verified with multiple users.
- [ ] Browser interaction and screenshot review are complete; unresolved visual/accessibility defects are listed.
- [ ] Performance work is based on recorded measurements.

### Phase 6: Production readiness and release

#### Task 22: Add error reporting, logs, and operational signals

**Description:** Instrument client errors, server/edge errors, and Trigger.dev failures if jobs are in scope. Define useful alerts and avoid capturing message content or secrets unnecessarily.

**Acceptance criteria:**
- [ ] Errors include enough route/workspace/request context to diagnose without leaking message bodies or credentials.
- [ ] Auth, realtime disconnect, job retry, and database failures are observable.
- [ ] An owner and response path are recorded for each production alert.

**Verification:** Trigger representative failure events in a non-production environment and confirm the expected issue/log/alert appears.

**Dependencies:** Tasks 9, 13, and 19 if included.

**Files likely touched:** `src/shared/telemetry/*`, `src/app/*`, `src/trigger/*`, deployment configuration.

**Estimated scope:** Medium.

#### Task 23: Harden secrets, authorization, abuse limits, and deployment config

**Description:** Review Supabase RLS/Storage/Realtime policies, secret handling, environment validation, rate limits, invite abuse, attachment validation, and production deployment settings.

**Acceptance criteria:**
- [ ] No privileged service key is shipped to the browser; environment values are validated and secrets are not committed.
- [ ] Authorization and rate limits cover workspace creation/invites, message send, search, and uploads.
- [ ] Production and preview environments use separate Supabase resources/migration processes.

**Verification:** Security review walks a written abuse checklist and re-runs denied-access integration checks against staging.

**Dependencies:** Tasks 8–19.

**Files likely touched:** `supabase/*`, `.env.example`, CI/deployment files, `src/shared/server/*`, `docs/operations/SECURITY.md`.

**Estimated scope:** Medium.

#### Task 24: Publish runbooks and release the MVP

**Description:** Document setup, migrations, backup/restore expectations, user support triage, and rollback. Deploy a staging candidate, run the full browser workflow, then release to the chosen production environment.

**Acceptance criteria:**
- [ ] A new developer can install, start local dependencies, and run checks using the README.
- [ ] Staging and production migration/rollback steps are documented and reviewed.
- [ ] Release candidate passes the agreed acceptance suite and has an owner for monitoring.

**Verification:** Fresh-checkout onboarding; staging smoke journey using two accounts; release checklist and rollback rehearsal.

**Dependencies:** Tasks 20–23.

**Files likely touched:** `README.md`, `docs/operations/*`, `.github/workflows/*`, deployment configuration.

**Estimated scope:** Medium.

### Checkpoint: Release

- [ ] All approved acceptance criteria are met.
- [ ] Typecheck, lint/format, focused tests, build, and browser journey results are recorded.
- [ ] Security/privacy review and rollback plan are complete.
- [ ] Human release approval is recorded before production release.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| `tsrs` is still tracking TypeScript 7.1 and pursuing full conformance | Incorrect or missing diagnostics | Pin the version; run TypeScript compiler parity in CI until the team accepts `tsrs` as the sole check. |
| RLS/Realtime/Storage policies diverge | Private workspace data exposure | Define authorization once in the domain model, test positive and negative paths with multiple accounts, and review every new data surface. |
| Realtime duplicates or drops messages | Confusing conversation history | Persist first, use retry-safe IDs, treat events as notifications, and reconcile from Postgres on reconnect. |
| Lightpanda differs from a rendered browser | UI bugs or screenshot gaps | Use Lightpanda for semantic interaction checks and Chrome through `agent-browser` for screenshots/rendering-sensitive review. |
| The MVP grows into full Slack parity | Schedule and architecture churn | Keep explicit deferrals; require a product decision before expanding voice/video, integrations, AI, or enterprise controls. |
| Rich text and attachments increase XSS/storage risk | Stored content abuse or private-file exposure | Start with constrained text; define sanitization and upload rules before adding richer content. |
| Managed backend limits or cost change the design | Migration effort | Keep domain/query boundaries explicit and record constraints before scale decisions; do not build speculative infrastructure. |

## Open decisions

- Product name and original logo/brand identity.
- Invite mechanism at launch: invite link, email invitation, or both.
- Whether email notifications and file attachments are launch blockers.
- Message retention/edit/delete policy.
- Hosting region and any compliance/data residency requirements.
- TypeScript version and accepted `tsrs` release after evaluating the first app scaffold.
- Supported browser/viewport matrix for launch.

Default planning assumption: browser-first SaaS MVP, multiple workspaces per user, public/private channels, and no special compliance requirement. Resolve the open decisions in Task 1 or before the dependent task starts.
