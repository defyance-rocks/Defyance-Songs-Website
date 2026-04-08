## Plan: Defyance Songs Website

Build a local Windows desktop app to manage bands, musicians, instruments, songs, setlists, events, and tours with full CRUD and relationship management. The app should support ordered setlists within events, allow assigning/copying/moving relationships, and include an event calendar and print-ready pages.

**TL;DR**
- Implement core domain models with many-to-many relationships and ordered collections.
- Use Electron for a local desktop app on Windows, with React frontend and SQLite backend for isolated, replaceable data layer.
- Build CRUD pages for each entity plus relationship management views, event-song view, event calendar with .cal downloads, and print-ready setlist/event pages.
- Include copy/move semantics for relationships and support event/tour assignment rules. Design for potential future authentication.

**Steps**
1. Clarify architecture and persistence requirements.
   - App is single-user/local-only for now, but design data layer and UI to accommodate future authentication.
   - Use SQLite for persistence, with an abstracted data layer (e.g., repository pattern) for easy replacement with a more robust DB or API.
   - Use Electron to build a local desktop app for Windows.

2. Define the domain model and relationships.
   - Band: name, musician references.
   - Musician: name, phone, email, bio, instrument references, band references.
   - Instrument: name, musician references.
   - Song: name, artist, vocalist references, vocal range, notes, link.
   - SetList: name, ordered list of song references.
   - Event: name, location, date, time, ordered list of setlist references.
   - Tour: name, ordered list of event references.
   - Enforce event-to-tour exclusivity.
   - Support many-to-many entity linking and ordered membership lists.

3. Choose a concrete tech stack.
   - Electron + React + TypeScript + SQLite + Prisma or TypeORM for the data layer.
   - Use component libraries like Material UI or Ant Design for faster CRUD UI.
   - Add libraries for calendar views (e.g., react-calendar) and print functionality (e.g., react-to-print or CSS print styles).

4. Scaffold the project and establish data layer.
   - Create project structure: `src/main` (Electron main process), `src/renderer` (React frontend), `src/shared/models`, `src/database`.
   - Implement persistence layer with SQLite and a schema matching the domain model.
   - Add abstracted repository interfaces for data operations.
   - Add API-like handlers in Electron main process for CRUD and relationship operations.
   - Add helper logic for copy/move operations and ordered list updates.

5. Implement frontend CRUD and relationship management.
   - Build pages/forms for bands, musicians, instruments, songs, setlists, events, and tours.
   - Implement listing, create, edit, delete operations for all entities.
   - Add relationship assignment UI controls and copy/move actions.
   - Add reorder controls for songs in setlists and setlists in events.
   - Build relationship views: e.g., band details with musicians, song details with vocalists.
   - Add special event view: all songs grouped by setlist in order.
   - Add event calendar view with .cal export functionality.
   - Add print-ready pages for individual setlists and full events, incorporating page breaks via CSS.

6. Add validation and business rules.
   - Prevent assigning an event to multiple tours.
   - Validate required fields for each model.
   - Ensure relationship copy vs move operations are clear in the UI.
   - Validate date/time formats for events.

7. Testing and verification.
   - Test CRUD flows for each entity.
   - Test relationship assignment, copy, and move semantics.
   - Test ordered setlist and event song view correctness.
   - Test tour event assignment and exclusivity.
   - Test calendar view and .cal downloads.
   - Test print functionality for setlists and events.

**Relevant files**
- `docs/InitialPrompt.md` — source requirements.
- New files likely to create:
  - `src/main/*` — Electron main process and IPC handlers.
  - `src/renderer/*` — React components, pages, and forms.
  - `src/shared/models/*` — domain entities and relationship types.
  - `src/database/*` — SQLite schema, migrations, and repository implementations.

**Verification**
1. Run the app locally and manually verify creating, updating, deleting all entities.
2. Verify relationship management by assigning/copying/moving musicians, songs, setlists, events, and tours.
3. Confirm the event detail page shows songs grouped by setlist order.
4. Confirm no event can exist in more than one tour.
5. Verify event calendar displays correctly and .cal files download properly.
6. Confirm print-ready pages render with appropriate page breaks for setlists and events.

**Further Considerations**
1. For the data layer isolation, use interfaces/abstract classes so swapping to a remote API later only requires new implementations.
2. For print pages, use CSS media queries and page-break properties to handle layout in print mode.
3. If calendar complexity grows, consider integrating a library like FullCalendar for better event management.
