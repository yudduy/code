# Codexel Project Overview

This document provides a high-level overview of the Codexel project.

## Project Structure

- `src/`: Source code.
  - `app/`: HTML files and main application logic.
  - `core/`: Electron core logic.
    - `main/`: Main process.
    - `renderer/`: Renderer process.
  - `features/`: Application features.
  - `shared/`: Shared code.
- `public/`: Public assets.
- `build.js`: Renderer build script.
- `package.json`: Dependencies and scripts.

## Build and Technologies

- **Build**: `npm run build` (builds the application), `npm run make` (creates a distributable).
- **Technologies**:
  - Electron
  - esbuild
  - Tailwind CSS
  - Supabase
  - Vitest
