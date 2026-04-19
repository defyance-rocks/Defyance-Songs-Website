import { randomUUID } from 'crypto';
import db from './index';
import { Tour } from '../shared/models';

export const getAllTours = (): Promise<Tour[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT t.id, t.name, e.id AS eventId, e.position
       FROM tours t
       LEFT JOIN events e ON t.id = e.tourId
       ORDER BY t.name ASC, e.position ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const tourMap = new Map<string, Tour>();
        rows.forEach((row: any) => {
          if (!tourMap.has(row.id)) {
            tourMap.set(row.id, { id: row.id, name: row.name, events: [] });
          }
          if (row.eventId) {
            tourMap.get(row.id)!.events.push(row.eventId);
          }
        });
        resolve(Array.from(tourMap.values()));
      }
    );
  });
};

export const createTour = (name: string): Promise<Tour> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(`INSERT INTO tours (id, name) VALUES (?, ?)`, [id, name], function (err) {
      if (err) return reject(err);
      resolve({ id, name, events: [] });
    });
  });
};

export const updateTour = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE tours SET name = ? WHERE id = ?`, [name, id], (err) => {
      if (err) reject(err); else resolve();
    });
  });
};

export const deleteTour = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`UPDATE events SET tourId = NULL, position = NULL WHERE tourId = ?`, [id]);
      db.run(`DELETE FROM tours WHERE id = ?`, [id], (err) => {
        if (err) reject(err); else resolve();
      });
    });
  });
};

export const addEventToTour = (tourId: string, eventId: string, position: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE events SET tourId = ?, position = ? WHERE id = ?`,
      [tourId, position, eventId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const removeEventFromTour = (eventId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE events SET tourId = NULL, position = NULL WHERE id = ?`,
      [eventId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const reorderEventsInTour = (tourId: string, eventIds: string[]): Promise<void> => {
  console.log(`[Repo] Reordering Tour ${tourId} with ${eventIds.length} events`);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(`UPDATE events SET position = ? WHERE id = ? AND tourId = ?`);
      eventIds.forEach((id, idx) => {
        stmt.run(idx, id, tourId);
      });
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if (err) { console.error('[Repo] Tour reorder failed:', err); db.run('ROLLBACK'); reject(err); }
        else { console.log('[Repo] Tour reorder successful'); resolve(); }
      });
    });
  });
};
