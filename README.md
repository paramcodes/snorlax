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

    state "Auth & Navigation Domain" as AuthWorkspace {
        Unauthenticated --> Authenticating : sign in / sign up / invite token
        Authenticating --> Authenticated : session established & token persisted
        Authenticated --> TokenRefreshed : silent TOKEN_REFRESHED (realtime auth sync)
        TokenRefreshed --> Authenticated : active session maintained
        Authenticated --> Unauthenticated : explicit sign out / terminal refresh failure

        [*] --> SelectWorkspace
        SelectWorkspace --> ActiveWorkspace : select workspace / consume invite
        ActiveWorkspace --> SelectChannel : choose channel (public/private)
    }

    state "Realtime Connection Domain" as RealtimeState {
        [*] --> Disconnected
        Disconnected --> Connecting : initialize Supabase client
        Connecting --> Connected : socket open & SUBSCRIBED
        Connected --> Reconnecting : network drop / timeout / channel error
        Reconnecting --> Connected : SUBSCRIBED & delta sync (lastSyncedAt watermark)
        Reconnecting --> Disconnected : max retries exceeded
    }

    state "Per-Channel Composer Domain" as ComposerState {
        [*] --> Idle
        Idle --> Composing : typing message
        Composing --> UploadingAttachments : asynchronous file upload (staged)
        UploadingAttachments --> Composing : upload complete / remove attachment (storage cleanup)
        Composing --> Sending : submit message
    }

    state "Persisted Message Entity Domain" as MessageLifecycle {
        [*] --> QueuedOptimistic
        QueuedOptimistic --> Sending : generate UUID & DB insert
        Sending --> Sent : database insert & realtime fanout reconciliation
        Sending --> SendFailed : DB insert error
        SendFailed --> Sending : user click retry
        Sent --> Edited : modify message content
        Edited --> Sent : update timestamp
        Sent --> SoftDeleted : delete message with active thread replies (tombstone)
        Sent --> HardDeleted : delete message with zero thread replies
        SoftDeleted --> [*]
        HardDeleted --> [*]

        state "Interactions" as SubInteractions {
            Sent --> ThreadActive : open thread panel & reply
            ThreadActive --> Sent : close thread panel
            Sent --> Reacted : atomic reaction upsert/delete & rollback
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
