# Snorlax — Team Collaboration Platform

Snorlax is a browser-first, Slack-inspired team collaboration app built with an original brand identity and Duolingo-green-led visual system. 

## ✨ 100% Plan Completion (`tasks/plan.md`)
- **Phase 0 (Scope & Data Rules):** Product spec (`docs/product/PRODUCT_SPEC.md`), domain model (`docs/product/DOMAIN_MODEL.md`), authorization matrix (`AUTHORIZATION.md`), and design system (`docs/design/DESIGN_SYSTEM.md`).
- **Phase 1 (App & Local Development):** Vite, React, TypeScript, Bun, Tailwind CSS v4, responsive app shell, and `agent-browser` workflow configuration.
- **Phase 2 (Auth & Workspaces):** Supabase migrations with RLS security policies (`supabase/migrations/`), generated database types (`src/shared/db/database.types.ts`), Supabase Auth integration (`src/features/auth/`), workspace creation, membership, and invitation token verification (`src/features/workspaces/`).
- **Phase 3 (Channels & Live Messaging):** Public/private channels, durable message history, and Supabase Realtime Broadcast & Presence subscriptions (`src/shared/realtime/`).
- **Phase 4 (Threads, Reactions & Search):** Message threads, emoji reaction pickers, read markers, unread/mention activity badges, and permission-aware workspace full-text search.
- **Phase 5 (Attachments & Polish):** Supabase Storage file uploads with bucket RLS policies (`src/features/attachments/`), responsive layouts, and keyboard navigation.
- **Phase 6 (Readiness & Release):** Error reporting telemetry (`src/shared/telemetry/`), GitHub Actions CI workflow (`.github/workflows/ci.yml`), runbooks, and release docs.

---

## 📸 Screenshots & UI Showcase

### 1. Channel Navigation, Unread Badges & Mentions
![Channel View](./frontend-channel.png)

### 2. Message Composition & Live Chat
![Message Sent](./message-sent.png)

### 3. Workspace Search
![Search Modal](./search-modal.png)

### 4. Teammate Invites & Sharing
![Invite Modal](./invite-modal.png)

---

## 🎥 Cursor-Recorded Demo (agent-browser CLI)

![Snorlax Demo](./demo.gif)

---
## 🗺️ System State Architecture

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    state "Authentication & Workspace" as AuthWorkspace {
        Unauthenticated --> Authenticating : sign in / sign up
        Authenticating --> Authenticated : session established
        Authenticated --> Unauthenticated : sign out / token expired

        [*] --> SelectWorkspace
        SelectWorkspace --> ActiveWorkspace : select workspace / invite token
        ActiveWorkspace --> SelectChannel : choose channel (public/private)
    }

    state "Realtime Connection" as RealtimeState {
        [*] --> Disconnected
        Disconnected --> Connecting : initialize Supabase client
        Connecting --> Connected : socket open & channel subscribed
        Connected --> Reconnecting : network drop / heartbeat timeout
        Reconnecting --> Connected : reconnect success & sync
        Reconnecting --> Disconnected : max retries exceeded
    }

    state "Message Lifecycle" as MessageLifecycle {
        [*] --> Idle
        Idle --> Composing : user types content / attaches file
        Composing --> Sending : submit message / upload
        Sending --> Sent : broadcast success & database insert
        Sent --> Edited : modify message content
        Edited --> Sent : save update timestamp
        Sent --> Deleted : remove message (cascades threads/reactions)
        Deleted --> [*]

        state "Interactions" as SubInteractions {
            Sent --> ThreadActive : open thread panel & reply
            ThreadActive --> Sent : close thread panel
            Sent --> Reacted : toggle emoji reaction
        }
    }

    Authenticated --> ActiveWorkspace
    ActiveWorkspace --> Idle : channel loaded & subscribed
```

---


## 🚀 Getting Started & Verification

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run typecheck & build
bun run build

# Run automated browser workflows & video capture
agent-browser open http://localhost:3000
```
