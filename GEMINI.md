# Defyance Songs Website - Project Overview

A desktop application built with Electron, React, and TypeScript to manage band song lists, musicians, instruments, setlists, events, and tours.

## Tech Stack
- **Framework:** Electron
- **Frontend:** React (TypeScript)
- **Styling:** Inline CSS with a custom theme
- **Backend:** Node.js (Electron Main Process)
- **Database:** SQLite3
- **Build Tools:** Webpack, TypeScript (tsc), electron-builder

## Project Structure
- `Defyance.Songs.Website/`: Main application directory.
  - `src/main/`: Electron main process (IPC setup, window management).
  - `src/renderer/`: React frontend (App.tsx, components).
  - `src/database/`: SQLite database initialization and repository patterns.
  - `src/shared/`: Shared models and types.
  - `data/`: Local storage for the SQLite database (`app.db`).

## Core Concepts & Models
The application manages the following entities:
- **Bands:** Groups of musicians.
- **Musicians:** Individual performers with contact info and bios.
- **Instruments:** Musical instruments assigned to musicians.
- **Songs:** Musical pieces with artist, vocal range, and notes.
- **SetLists:** Ordered collections of songs.
- **Events:** Gigs or performances at specific locations/dates, containing setlists.
- **Tours:** Collections of events.

## Key Workflows
### Data Access
- The main process interacts with SQLite using the `sqlite3` library.
- Repositories in `src/database/` encapsulate SQL queries and return Promises.
- `initDatabase` in `src/database/index.ts` handles schema creation.

### Communication (IPC)
- `ipcMain` (Main) and `ipcRenderer` (Renderer) are used for communication.
- `src/main/ipc.ts` defines the handlers for all data operations.
- The React app uses `window.require('electron').ipcRenderer.invoke` to call these handlers.

## Development Commands
- `npm start`: Runs the app in development mode (Webpack dev server + Electron).
- `npm run build`: Builds the production-ready application.
- `npm run dev:electron`: Builds the main process and waits for the renderer before launching Electron.

## Current Status
- CRUD operations and relationship management for all entities (**Bands**, **Musicians**, **Instruments**, **Songs**, **SetLists**, **Events**, **Tours**) are fully implemented in both the backend and UI.
- All core relationships described in the initial prompt are functional.
- The application is ready for testing and further feature expansion.
