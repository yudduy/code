# Codexel — AI‑Native Coding Assessment Platform (Glass Frontend)

> **CLAUDE.md is the single source of truth for Claude Code.** Read this file first, follow it exactly, and keep it up‑to‑date when scope changes.

---

## 0  Mission (TL;DR)

Measure a candidate’s real‑world **AI‑collaboration skills** by observing how they solve a GitHub coding task while using tools like ChatGPT, Cursor, or Claude, all within a timed Glass (Electron) desktop session.

---

## 1  Quick Commands

The repo already provides a rich npm script suite; Claude should rely on these when building, linting, and testing.

### Development

| script                   | purpose                                      |
| ------------------------ | -------------------------------------------- |
| `npm run setup`          | Install deps & build web UI the first time   |
| `npm start`              | Build renderer & launch Electron in dev mode |
| `npm run watch:renderer` | Re‑build renderer on file change             |

### Building / Packaging

| script                   | purpose                                  |
| ------------------------ | ---------------------------------------- |
| `npm run build`          | Full production build (current platform) |
| `npm run build:win`      | Windows x64 build                        |
| `npm run build:renderer` | Renderer only                            |
| `npm run build:web`      | Next.js web UI only                      |
| `npm run build:all`      | Renderer + web UI                        |
| `npm run package`        | Package app via Electron Forge           |
| `npm run make`           | Create distributables                    |
| `npm run publish`        | Build & publish release                  |

### Code Quality

| script                         | purpose                         |
| ------------------------------ | ------------------------------- |
| `npm run lint`                 | ESLint for `.ts`, `.tsx`, `.js` |
| *(to‑be‑added)* `npm run test` | Vitest/Jest test suite (see §4) |

> **Best‑practice for every PR:** run `npm run lint && npm run test && npm run build` locally before committing.

---

## 2  Current Goal & MVP Scope (v0.1)

We are refactoring the legacy “Glass” screen‑recorder into **Codexel Telemetry** that captures only **(1) Interface Detection** and **(2) Prompt Tracking**.

| # | Stream             | What to log                                                                      | Out of scope             |
| - | ------------------ | -------------------------------------------------------------------------------- | ------------------------ |
| 1 | **APP\_FOCUS**     | `{ts, appId}` each time active window/tab changes                                | Screenshot diff, scoring |
| 2 | **PROMPT\_SUBMIT** | `{ts, appId, prompt?}` when user sends AI prompts (text optional, consent‑gated) | Full keystroke logging   |

Everything else (audio capture, Whisper, screen video, scoring engine, replay UI) **must not block MVP** but the architecture should stay pluggable.

---

## 3  Repository Layout & Key Files

| Layer                | Path(s)                                          | Notes                                                                          |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| **Electron Main**    | `src/main/main.js`                               | Add `active-win` polling, emit `APP_FOCUS_CHANGED` IPC                         |
| **Renderer (React)** | `src/features/listen/renderer/listenCapture.js`  | Listen for IPC, queue events                                                   |
|                      | `src/features/listen/renderer/PromptListener.js` | Detect prompt submits                                                          |
|                      | `src/features/listen/telemetryBuffer.js`         | Batch & retry uploads                                                          |
| **Config**           | `src/config/appSignatures.js`                    | Regex map of known apps/chats                                                  |
| **UI**               | `src/features/listen/ConsentModal.js` etc.       | Consent modal, timer, privacy review                                           |
| **Backend**          | `supabase/functions/ingest/index.ts`             | Edge Function that validates Firebase JWT & bulk‑inserts events into Postgres  |
|                      | `supabase/sql/schema.sql`                        | Creates `focus_events`, `prompt_events`, and `sessions` tables with `pgvector` |
|                      | `supabase/sql/policies.sql`                      | Row‑level security policies                                                    |
|                      | `supabase/tests/`                                | Vitest suite for the ingest handler                                            |

> **UI & Design Guidance**  ⋯ *(unchanged)*

\----- | ------- | ----- |
\| **Electron Main** | `src/main/main.js` | Add `active-win` polling, emit `APP_FOCUS_CHANGED` IPC |
\| **Renderer (React)** | `src/features/listen/renderer/listenCapture.js` | Listen for IPC, queue events |
\|  | `src/features/listen/renderer/PromptListener.js` | Detect prompt submits |
\|  | `src/features/listen/telemetryBuffer.js` | Batch & retry uploads |
\| **Config** | `src/config/appSignatures.js` | Regex map of known apps/chats |
\| **UI** | `src/features/listen/ConsentModal.js` etc. | Consent modal, timer, privacy review |
\| **Backend (stub)** | `/ingest` route | Accept event array (outside this repo) |

> **UI & Design Guidance**
> • All frontend/UI changes must preserve the existing Glass look‑and‑feel.
> • Coordinate with any shared design‑system components (see potential Figma links under `docs/design-system/`).
> • After significant UI changes, perform a manual visual review to ensure modals, timers, and event logs align with the style guide and do not break dark/light theming.

---

## 4  Testing & CI Guidelines  Testing & CI Guidelines

Claude Code must ship **unit tests** alongside new modules and wire them into `npm run test` (add `"test": "vitest"` or Jest).

### 4.1  Unit Tests

* **FocusDetector**: feed synthetic `active-win` snapshots and assert emitted IPC events.
* **PromptListener**: simulate key events / DOM mutations, ensure prompt submits are detected.
* **TelemetryBuffer**: mock network failures; verify retry & dedup logic.

### 4.2  Type Safety & Lint

* Repo uses **TypeScript strict**—all new `.ts` files must compile with `tsc --noEmit`.
* Run `npm run lint` before each diff submission.

### 4.3  Manual Smoke Test (macOS & Windows)

1. `npm start` → Electron window appears.
2. Open VSCode, browser, ChatGPT; confirm APP\_FOCUS events in devtools console.
3. Send a prompt in ChatGPT; confirm PROMPT\_SUBMIT event.
4. Close app at 60 min or via Stop button; ensure events POST to `/ingest` (check Network tab).

### 4.4  CI Suggestion

> Optional: add GitHub Action that runs `lint`, `test`, and `build:renderer` on PR.

---

## 5  Data Storage & Schema

### 5.1  Postgres tables (Supabase)

```sql
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz
);

CREATE TABLE focus_events (
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL,
  app_id text NOT NULL
);

CREATE TABLE prompt_events (
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL,
  app_id text NOT NULL,
  prompt_text text,
  embedding vector(1536)  -- pgvector extension
);

CREATE INDEX ON focus_events(session_id);
CREATE INDEX ON prompt_events USING ivfflat (embedding);
```

### 5.2  TypeScript event types

```ts
type AppFocusEvent = { sessionId: string; ts: number; type: 'APP_FOCUS'; appId: string };

type PromptSubmitEvent = { sessionId: string; ts: number; type: 'PROMPT_SUBMIT'; appId: string; prompt?: string };
```

**Example APP\_FOCUS event JSON**

```json
{ "sessionId": "abc123", "ts": 1720378210000, "type": "APP_FOCUS", "appId": "vscode" }
```

---

## 6  Milestones & Acceptance Criteria

| # | Milestone              | Must‑have acceptance tests                                                                  |
| - | ---------------------- | ------------------------------------------------------------------------------------------- |
| 1 | **Interface Detector** | 95 %+ window switches captured in unit test fixture; manual log shows correct appId mapping |
| 2 | **Prompt Tracker**     | Detect Ctrl+Enter submit in ChatGPT, Enter in Cursor & Claude; unit tests pass              |
| 3 | **Buffer & Upload**    | Offline → online scenario replays events without loss                                       |
| 4 | **Consent & Timer**    | No events until consent; auto‑stop exactly at 60 min                                        |
| 5 | **Supabase Ingest**    | Edge Function passes vitest; rows appear in `focus_events` & `prompt_events`; RLS enforced  |

\---|-----------|---------------------------|
\| 1 | **Interface Detector** | 95 %+ of window switches captured in unit test fixture; manual log shows correct appId mapping |
\| 2 | **Prompt Tracker** | Detect Ctrl+Enter submit in ChatGPT, Enter in Cursor & Claude; unit tests pass |
\| 3 | **Buffer & Upload** | Offline → online scenario replays events without loss |
\| 4 | **Consent & Timer** | No events until consent; auto‑stop exactly at 60 min |

---

## 7  Privacy & Security Requirements

* Explicit consent modal before any capture.
* Prompt text capture is **opt‑in** (default off).
* TLS for uploads; encrypt data at rest.

---

## 8  Coding Conventions

* **TypeScript strict** everywhere.
* ESLint + Prettier (run via script).
* IPC channels: ALL\_CAPS\_SNAKE\_CASE.
* Keep each PR ≤ 5 files when possible; large changes → separate milestones.

---

### End of CLAUDE.md
