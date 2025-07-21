# Codexel: The AI-Native Coding Assessment Platform

**Codexel** is a developer assessment platform built for Software 3.0. Instead of testing candidates with abstract puzzles, we observe how they solve real-world problems using modern tools, including AI assistants. Our mission is to measure the skills that actually matter in modern software development: system thinking, tool orchestration, and AI-leveraged problem-solving.

## 1. The Problem: Hiring for the Past

Software development has fundamentally changed. We've moved from writing code line-by-line (Software 1.0) to orchestrating AI models with natural language (Software 3.0). Developers now use ChatGPT to debug, Claude to refactor, and Cursor to generate boilerplate.

Yet, technical hiring is stuck in the past. We still filter candidates with LeetCode puzzles and algorithm riddles—skills that test for a world that no longer exists. It's like testing a pilot's handwriting instead of their ability to fly the plane.

## 2. The Solution: Assess Real-World Workflow

Codexel measures how developers actually work. We give candidates a realistic task within a familiar environment and observe their process from a high level.

The output isn't a pass/fail score, but a rich, data-driven report for hiring managers that visualizes the candidate's workflow:

- How do they allocate their time between their IDE, a browser, and AI tools?
- What kinds of questions do they ask their AI assistants?
- How do they iterate from an idea to a working solution?

## 3. How It Works: The Telemetry System

To capture this workflow data, Codexel uses a two-part system that runs on the candidate's machine during a timed assessment.

**The Codexel Telemetry Agent (Electron App)**: This is the core desktop application. Its primary job is to run the FocusDetector, which polls the operating system every second to identify the active application (e.g., vscode, chrome, cursor).

**The Codexel Browser Extension**: This is a lightweight companion browser extension. Because a desktop app cannot see inside a browser's sandbox, this extension is required to detect prompts submitted to web-based AI tools. Its content script runs on sites like chat.openai.com and claude.ai to capture PROMPT_SUBMIT events.

These two components work in parallel, sending a stream of telemetry data to our backend for analysis.

## 4. Core Features (MVP Scope)

The current goal is to reliably capture two fundamental types of events.

| # | Event Stream | What It Captures | How It's Captured |
|---|--------------|------------------|------------------|
| 1 | **APP_FOCUS** | `{ts, appId}` each time the user switches between applications. | Electron App using the active-win library. |
| 2 | **PROMPT_SUBMIT** | `{ts, appId, prompt}` when the user submits a prompt to a web-based AI tool. | Browser Extension via a content script and Native Messaging. |

**Out of Scope for MVP**: Keystroke logging, screen recording, audio capture, and the hiring manager dashboard. The focus is solely on building a robust, privacy-first telemetry pipeline.

## 5. Technical Architecture & Data Flow

The data flows from the candidate's machine to our backend in a secure and reliable manner.

1. **Focus Detection**: The Core Main Process uses the FocusDetector service to poll for active windows using the `active-win` library and sends APP_FOCUS events via IPC.

2. **Assessment Workflow**: The AssessmentWindowManager creates and manages multiple windows (consent, ready, header, completion) with liquid glass effects on supported platforms.

3. **Telemetry Collection**: The TelemetryCollector receives focus events and other telemetry data, processing them through the TelemetryBuffer for batching and queuing.

4. **Event Processing**: The TelemetryBuffer implements sophisticated batching, retry logic with exponential backoff, and offline handling to ensure reliable data transmission.

5. **Backend Integration**: Events are uploaded to Supabase backend through secure endpoints with authentication and row-level security policies.

## 6. Project Structure

```
codexel/
├── src/
│   ├── core/                   # Core application infrastructure
│   │   ├── main/               # Electron main process
│   │   │   ├── main.js         # Main entry point
│   │   │   ├── focus/          # Focus detection system
│   │   │   └── windows/        # Window management
│   │   ├── preload/            # Preload scripts for secure IPC
│   │   └── shared/             # Shared utilities and types
│   ├── features/               # Feature modules
│   │   ├── assessment/         # Assessment workflow
│   │   │   ├── components/     # Assessment UI components
│   │   │   ├── services/       # Assessment business logic
│   │   │   └── types/          # Assessment type definitions
│   │   ├── telemetry/          # Telemetry collection and buffering
│   │   │   ├── buffer/         # Event batching and retry logic
│   │   │   ├── collectors/     # Data collectors (focus, prompts)
│   │   │   └── services/       # Telemetry services
│   │   ├── settings/           # Application settings
│   │   └── ui/                 # UI components and design system
│   │       ├── components/     # Reusable UI components
│   │       └── design/         # Design tokens and theme
│   ├── shared/                 # Shared application code
│   │   ├── config/             # Configuration (app signatures, etc.)
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   ├── app/                    # HTML templates for windows
│   │   ├── consent-window.html # Consent modal window
│   │   ├── header.html         # Assessment header
│   │   └── ready-window.html   # Ready/start window
│   └── assets/                 # Static assets (icons, vendor libs)
├── test/                       # Test suites
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test fixtures and mocks
├── build/                      # Build configuration
├── dist/                       # Build output
└── package.json
```

## 7. Privacy & Security

User trust is paramount. Our telemetry system is designed with strict privacy controls:

- **Explicit Consent**: No data is captured until the candidate explicitly agrees via a consent modal at the start of the session.
- **Minimal Data**: We only collect application names and prompt text. We do not log keystrokes, record the screen, or capture any other PII.
- **Optional Prompt Capture**: The candidate can opt-out of sharing the text of their prompts.
- **Secure Transmission**: All data is sent over HTTPS.

## 8. Quick Start

### Prerequisites

- **Node.js** version 20.x.x (required for native dependencies)
- **Python** (for build tools)
- **Windows**: Build Tools for Visual Studio

```bash
# Check your Node.js version
node --version

# If you need Node.js 20.x.x, use nvm:
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# nvm install 20 && nvm use 20
```

### Installation & Development

```bash
# Install dependencies and build
npm run setup

# Start development server
npm start

# Watch for renderer changes
npm run watch:renderer
```

### Building & Packaging

```bash
# Production build (current platform)
npm run build

# Windows x64 build
npm run build:win

# Package app
npm run package

# Create distributables
npm run make
```

### Code Quality

```bash
# Lint code
npm run lint

# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

## 9. Development Scripts

| Script | Purpose |
|--------|---------|
| `npm run setup` | Install deps & build web UI the first time |
| `npm start` | Build renderer & launch Electron in dev mode |
| `npm run watch:renderer` | Re-build renderer on file change |
| `npm run build` | Full production build (current platform) |
| `npm run lint` | ESLint for `.ts`, `.tsx`, `.js` |
| `npm run test` | Run test suite |

**Best practice**: Run `npm run lint && npm run test && npm run build` before every commit.

## 10. Data Schema

### Event Types

```typescript
type AppFocusEvent = {
  sessionId: string;
  ts: number;
  type: 'APP_FOCUS';
  appId: string;
};

type PromptSubmitEvent = {
  sessionId: string;
  ts: number;
  type: 'PROMPT_SUBMIT';
  appId: string;
  prompt?: string; // Optional, consent-gated
};
```

### Database Schema (Supabase)

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
```

## 11. Contributing

We welcome contributions! Please:

1. **Fork the repository** and create a feature branch
2. **Follow coding conventions**: TypeScript strict mode, ESLint, Prettier
3. **Write tests** for new functionality
4. **Run quality checks**: `npm run lint && npm run test && npm run build`
5. **Submit a pull request** with a clear description

### Development Guidelines

- **TypeScript strict** everywhere
- **ESLint + Prettier** for code formatting
- **IPC channels**: ALL_CAPS_SNAKE_CASE
- **Keep PRs small**: ≤ 5 files when possible
- **Privacy-first**: Never log sensitive data

## 12. Milestones & Roadmap

| # | Milestone | Status | Acceptance Criteria |
|---|-----------|--------|-------------------|
| 1 | **Interface Detector** | ✅ Complete | 95%+ window switches captured; correct appId mapping |
| 2 | **Prompt Tracker** | ✅ Complete | Detect submissions in ChatGPT, Cursor, Claude |
| 3 | **Buffer & Upload** | ✅ Complete | Offline → online scenario replays without loss |
| 4 | **Consent & Timer** | ✅ Complete | No events until consent; auto-stop at 60 min |
| 5 | **Supabase Ingest** | 🚧 In Progress | Edge Function with authentication and RLS |
| 6 | **Browser Extension** | 📋 Planned | Native messaging for web-based AI tools |
| 7 | **Analytics Dashboard** | 📋 Planned | Visualize candidate workflow patterns |

## License

GPL-3.0 License - see LICENSE file for details.