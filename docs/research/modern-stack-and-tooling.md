# Modern stack and tooling research

Research date: 2026-10-23

## Recommendation in brief

For an app-first collaboration product, start with a single TypeScript React app built with Vite and React Router, Tailwind CSS, and HeroUI v3. Use Bun for package management and scripts, `tsrs` as the requested type checker, and Lefthook for pre-commit/pre-push checks. Use Supabase (Postgres, Auth, Storage, Realtime) as the managed backend, with database row-level security for membership boundaries. Keep durable messages in Postgres; use Realtime Broadcast for low-latency delivery and Presence for slowly changing online state. Add Trigger.dev only for durable background work such as scheduled digests, file processing, and retryable integrations.

Choose Next.js App Router instead of Vite if public, indexed pages and server-rendered product routes are important, or if the team wants a single React server runtime for web APIs and UI. Keep the chat workspace itself as an explicit client-side interactive surface. These are alternatives, not layers to stack together.

This recommendation optimizes for a focused product team and a reliable first version. It is not a claim that one stack is best for every scale or hosting constraint.

## Stack choices

| Concern | Recommended starting point | When to choose differently |
| --- | --- | --- |
| App framework | Vite + React + TypeScript + React Router for an app-first SPA. Vite provides a React/TypeScript starter, fast HMR, and a production build. [Vite guide](https://vite.dev/guide/) · [React Router modes](https://reactrouter.com/start/modes) | Choose [Next.js App Router](https://nextjs.org/docs/app) if SEO/public pages, server rendering, or server-side data access are central. Its pages and layouts are Server Components by default; interactive chat components need client boundaries. [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) |
| Runtime and package manager | Bun for install, scripts, workspace management, and the test runner where it fits. Commit `bun.lock` and pin the Bun version for reproducible CI. [Bun docs](https://bun.sh/docs) | Keep application libraries portable where practical. The app need not depend on Bun-specific runtime APIs simply because Bun manages the project. |
| Type checker | `tsrs` as the preferred fast type-check command. The project is a Rust port of the TypeScript 7 compiler/type checker. Pin the version and validate it on the actual app config. [tsrs repository](https://github.com/oxc-project/tsrs) | `tsrs` currently targets TypeScript 7.1 and documents that it is still pursuing full conformance. Keep the Microsoft TypeScript compiler as a CI parity check until the project and dependency set are confirmed compatible; reevaluate as `tsrs` releases stabilize. |
| UI system | Tailwind CSS v4 + HeroUI v3 for common accessible controls; build the chat layout and message rows as product-specific components. HeroUI v3 uses React Aria Components and CSS-based transitions. [HeroUI v3](https://heroui.com/en/docs/react/releases/v3-0-0) | Use Radix UI or React Aria directly if the product needs tighter control over primitives and visual treatment. Avoid layering several component systems; pick one source for each primitive. |
| Persistence and auth | Supabase Auth + Postgres + Storage; define channel/member/message constraints in Postgres and enforce access with RLS. Generate TypeScript DB types from migrations/schema. | A custom backend makes sense when tenancy, compliance, data residency, or operational needs exceed the managed service model. At that point, evaluate the team and hosting environment first. |
| Live updates | Supabase Realtime Broadcast for low-latency events; Presence for online status and other low-frequency state. Keep Postgres the durable source of truth. Supabase recommends Broadcast over Postgres Changes for scalability; Presence is not intended for high-frequency updates. [Database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) · [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) · [Presence](https://supabase.com/docs/guides/realtime/presence) | If custom socket routing, very high fan-out, or self-managed transport becomes a real requirement, add a dedicated Node service using a WebSocket stack such as Socket.IO. That adds deployment and authorization work; avoid it before load/requirements justify it. |
| Server data cache | TanStack Query for channel lists, history, search results, mutations, cache invalidation, and reconnect/refetch behavior. Treat it as the server-data cache, not a place for every UI flag. [TanStack Query](https://tanstack.com/query/latest) | A lighter client may use the backend SDK and a small amount of local state first; add a query cache when duplicated fetching and cache synchronization become real problems. |
| UI state | React local state first. Add [Zustand](https://zustand.docs.pmnd.rs/learn/getting-started/introduction) only for genuinely shared client state such as workspace-level panels or cross-route UI preferences. Keep navigation state in URLs. | Do not duplicate message/channel data in a global client store if the query cache owns it. |
| Background work | Trigger.dev for retryable/scheduled/long-running tasks: email digests, webhook retries, file extraction, retention jobs, and notifications. The repo demonstrates separate workers and service boundaries; its own infrastructure is much larger than this product needs. [Trigger.dev docs](https://trigger.dev/docs) | Use a small scheduled function or provider-native queue for a tiny product with no durable-work needs. Realtime message delivery should not wait on a background-job queue. |
| Validation and forms | [Zod](https://zod.dev/basics) for parsing untrusted inputs at API boundaries and React Hook Form for complex forms. Keep database constraints and authorization checks authoritative. | Avoid defining the same schema by hand in several layers; generate or share contracts where the system supports it. |
| Rich message editing | Start with a constrained composer (text, mentions, links, attachments). Add Tiptap/ProseMirror only when rich text requirements are defined; rich editors add serialization, paste, selection, and accessibility complexity. [Tiptap docs](https://tiptap.dev/docs/editor/introduction) | Lexical is another option if its extension model better fits the desired editor. Choose one editor after prototyping real mention/formatting behavior. |

### Realtime and persistence boundary

Treat these as separate responsibilities:

1. A validated, authorized write creates or updates the durable message row.
2. Clients receive a low-latency event and update their local view/cache.
3. On reconnect or missed events, clients reconcile against durable history.
4. Presence carries ephemeral/slow-changing connection state, not message truth.
5. Durable jobs handle work that can retry or run later; they do not sit in the interactive message-send path.

For Supabase, Realtime channel authorization and database RLS must match workspace and channel membership. Realtime Broadcast authorization is part of the design, not a later polish step.

## Repository design lessons from the named codebases

### Bulletproof React

Borrow its feature-first organization and separation of state concerns. A useful initial shape is `features/channels`, `features/messages`, `features/threads`, `features/search`, and `features/members`, with each owning its components, queries, schemas, and tests as needed. Keep dependencies flowing from shared code into features and compose features at the route/app layer. Do not import one feature's internals directly into another.

The state guidance separates local component state, shared client state, server cache, form state, and URL state. For this product, message history belongs in the server cache; composer drafts and open panels are client UI state; selected workspace/channel/thread belong in the URL when they should be linkable. Its API guidance favors a configured client and typed request/response contracts colocated with the feature.

Treat Bulletproof React as a set of patterns, not a framework or a folder tree to reproduce literally. Its project structure page has older revision history, so use the principles and verify tool-specific details against current docs.

Sources: [project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md), [state management](https://github.com/alan2207/bulletproof-react/blob/master/docs/state-management.md), [API layer](https://github.com/alan2207/bulletproof-react/blob/master/docs/api-layer.md), [project standards](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-standards.md).

### Trigger.dev

The repository is a large pnpm/Turborepo monorepo with separate apps and packages, local service dependencies, and explicit worker/service boundaries. That is an observation about Trigger.dev's repository; this project will use Bun. Its architecture is useful inspiration for isolating durable jobs and keeping package responsibilities explicit. For our app, apply that only where useful: a background task service can process files and scheduled notification digests without turning the message request path into a job system.

Do not reproduce its full monorepo, runtime services, or orchestration infrastructure for the first version. Start as one application. Split packages/services only when there is a real build, ownership, or runtime boundary.

Sources: [Trigger.dev repository guidance](https://github.com/triggerdotdev/trigger.dev/blob/main/AGENTS.md), [root package scripts and workspace](https://github.com/triggerdotdev/trigger.dev/blob/main/package.json), [Next.js integration](https://trigger.dev/docs/guides/frameworks/nextjs).

## Efficient development tooling

### Start with a small toolchain

- **Bun**: use `bun install`, `bun run <script>`, and the committed `bun.lock`; use Bun workspaces only when multiple real packages/apps exist. Bun combines package management, scripts, and a test runner. [Bun docs](https://bun.sh/docs) · [install](https://bun.sh/docs/pm/cli/install)
- **TypeScript strict mode** with generated database types and runtime validation at external boundaries.
- **`tsrs`** for the requested typecheck command (for example `bunx tsrs --noEmit`). Pin the version. Since it targets TypeScript 7.1 and aims for full conformance, retain a compiler parity check in CI until the project is comfortable relying on it alone. [Compatibility and status](https://github.com/oxc-project/tsrs/blob/main/docs/STATUS.md)
- **Biome** for a straightforward formatter/linter baseline ([formatter](https://biomejs.dev/formatter/), [linter](https://biomejs.dev/linter/)), or ESLint + Prettier if needed by the chosen component/framework plugins. Use one formatter, one canonical lint command, and a committed lockfile.
- **Vitest** for pure logic and feature-level tests when using Vite; it shares Vite's config and transforms. [Vitest](https://vitest.dev/guide/)
- **Vercel `agent-browser` CLI + Lightpanda** for agent-driven browser workflows. Use accessibility snapshots and element refs for workspace navigation, message sending, threads, search, and forms. Configure `--engine lightpanda` for fast headless runs. [agent-browser repo](https://github.com/vercel-labs/agent-browser) · [Lightpanda integration](https://lightpanda.io/blog/posts/using-lightpanda-with-agent-browser)
- **Visual review caveat:** Lightpanda has no graphics renderer, so its screenshot output is a placeholder. Use the same `agent-browser` CLI with its Chrome engine when a real screenshot or browser-rendering fidelity is needed; keep Lightpanda as the default for fast semantic interaction checks. [Lightpanda integration notes](https://lightpanda.io/blog/posts/using-lightpanda-with-agent-browser)
- **Supabase CLI** for local database and auth workflows, schema migrations, and generated types. Keep migrations in git and make local onboarding reproducible. [Local development](https://supabase.com/docs/guides/local-development/cli/getting-started) · [CLI source](https://github.com/supabase/cli)
- **Lefthook** to install and run Git hooks from a committed config. Use pre-commit for staged-file formatting/linting and pre-push for `tsrs`, unit checks, and the fast verification script. Keep slow browser workflows in CI. [Lefthook docs](https://lefthook.dev/)
- **Sentry** for client/server exception reporting once there is a deployed environment; add product analytics only for defined questions. Avoid adding observability SDKs that nobody monitors.
- **Storybook** only when the component system grows enough to benefit from isolated state/screen review; it is not required on day one. It is a component workshop for building and reviewing UI states outside the full app. [Storybook docs](https://storybook.js.org/docs)

### Add only when the project needs it

- **Turborepo / monorepo** when there are multiple deployable apps, shared packages, or build tasks that benefit from caching. Trigger.dev shows this can work at scale, but a single-product repo does not need it by default.
- **Knip** to detect unused exports and dependencies as the repo grows.
- **Dependency Cruiser / ESLint boundaries** to enforce one-way feature dependencies once the architecture has stable boundaries.
- **Sentry tracing/OpenTelemetry** when latency diagnosis across browser, API, database, and job runner is a real need.
- **Load testing** before setting realtime or search capacity assumptions; don't infer capacity from a local prototype.

Canonical scripts should remain easy to discover: `dev`, `check` (format/lint/`tsrs`), `test`, `test:browser` (driven by `agent-browser`), `build`, and `verify` (the agreed merge gate). Use Lefthook to run small, fast checks before commit and a broader deterministic gate before push. Keep longer browser scenarios in CI where their environment can be controlled.

## Skill workflow for this project

The skill catalog has overlapping choices. Use this small core in order and call in specialists only when that work begins.

### Core workflow

1. **`superpowers:brainstorming`** — shape the product and the distinct visual identity before creating features.
2. **`agent-skills:spec-driven-development`** — write acceptance criteria for the collaboration workflows and data rules.
3. **`codebase-architect`** — choose a proportional folder structure, dependency directions, and repo documentation.
4. **`frontend-design`** or **`impeccable`** — develop and critique the actual visual system; use one primary design workflow to avoid duplicate design passes.
5. **`agent-skills:incremental-implementation`** — ship vertical slices such as workspace shell, channels/messages, threads, search, then notifications.
6. **Vercel's `agent-browser` skill** from the [official repository](https://github.com/vercel-labs/agent-browser/tree/main/skills/agent-browser) — use the CLI with Lightpanda for browser interaction and Chrome when rendered screenshots are needed.
7. **`superpowers:verification-before-completion`** and **`agent-skills:code-review-and-quality`** — collect actual verification results and review the final diff.

### Specialists for the matching problem

- **`agent-skills:api-and-interface-design`** — stable contracts between web client, API, and jobs.
- **`domain-modeling`** — workspace, membership, channel, message, thread, reaction, and read-state vocabulary/invariants.
- **`agent-skills:security-and-hardening`** — authentication, authorization, RLS, uploads, and untrusted rich message content.
- **`agent-skills:source-driven-development`** — verify library/API choices against current official docs when implementing.
- **`agent-skills:observability-and-instrumentation`** — production diagnostics when backend and async jobs arrive.
- **`agent-skills:performance-optimization`** — message list virtualization, search, and realtime fan-out after measuring.
- **`good-css`** — responsive layout and CSS architecture.
- **`building-react-native-apps:react-native-best-practices`** — only if a native mobile app becomes in scope.
- **`agent-skills:documentation-and-adrs`** — record hard-to-reverse choices (auth, tenancy, realtime model, rich-text format).
- **`agent-skills:planning-and-task-breakdown`** — useful for a multi-phase implementation plan; can be skipped if brainstorming/spec work already produced an adequate plan.

Avoid invoking every skill on every change. Keep each skill focused on the decision or risk it covers, and prefer the project-local verification workflow once it exists.

## Open decisions before implementation

- Browser-only product or a native mobile client as well?
- Public marketing/invite pages that need SEO/server rendering?
- Required account model: one workspace per user, multiple workspaces, or external guest access?
- Rich text scope and attachment constraints?
- Hosting/data residency/compliance constraints?

These answers could change framework, auth, and realtime choices. Until clarified, the recommendation above assumes a browser-first SaaS prototype, multiple workspaces, and no special compliance requirement.
