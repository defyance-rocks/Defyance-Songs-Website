# Defyance Songs Website - Project Overview

A web application built with React and TypeScript to manage band song lists, musicians, instruments, setlists, events, and tours.

## Tech Stack
- **Framework:** React (TypeScript)
- **Backend/Database:** Supabase (PostgreSQL)
- **Styling:** Inline CSS with a custom theme
- **Build Tools:** Webpack, TypeScript (tsc)
- **Deployment:** Vercel (configured via `vercel.json`)

## Project Structure
- `Defyance.Songs.Website/`: Main application directory.
  - `src/renderer/`: React frontend (App.tsx, components, hooks).
  - `src/shared/`: Shared models and types.
  - `supabase/`: Supabase configuration and migration metadata.
  - `dist/`: Build output.

## Core Concepts & Models
The application manages the following entities via Supabase tables:
- **Bands:** Groups of musicians.
- **Musicians:** Individual performers with contact info and bios.
- **Instruments:** Musical instruments assigned to musicians.
- **Songs:** Musical pieces with artist, vocal range, and notes.
- **SetLists:** Ordered collections of songs.
- **Events:** Gigs or performances at specific locations/dates, containing setlists.
- **Tours:** Collections of events.
- **Master SetLists:** Reusable collections of setlists.

## Key Workflows
### Data Access
- The application interacts directly with Supabase using `@supabase/supabase-js`.
- `src/renderer/hooks/useAppData.ts` handles all data fetching, syncing, and state management.
- Real-time updates are simulated using background polling of a `data_versions` table.

### Relationship Management
- Junction tables in Supabase (e.g., `band_musicians`, `setlist_songs`) manage many-to-many relationships.
- The UI handles assigning/unassigning entities and reordering items (songs in setlists, etc.).

## Development Commands
- `npm start`: Runs the app in development mode using Webpack Dev Server.
- `npm run build`: Builds the production-ready application.

## Current Status
- Fully migrated to Supabase web architecture.
- All legacy Electron and SQLite code has been removed.
- CRUD operations, relationship management, and reordering logic are fully functional.
- Polling mechanism ensures data stays in sync across clients.
