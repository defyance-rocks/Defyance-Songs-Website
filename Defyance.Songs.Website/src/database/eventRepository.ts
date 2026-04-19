import { randomUUID } from 'crypto';
import db from './index';
import { Event, EventSetListEntry } from '../shared/models';

export const getAllEvents = (): Promise<Event[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT e.*, esl.setlistId, esl.masterSetlistId, esl.position
       FROM events e
       LEFT JOIN event_setlists esl ON e.id = esl.eventId
       ORDER BY e.date ASC, e.time ASC, esl.position ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const eventMap = new Map<string, Event>();
        rows.forEach((row: any) => {
          if (!eventMap.has(row.id)) {
            eventMap.set(row.id, {
              id: row.id,
              name: row.name,
              location: row.location,
              date: row.date,
              time: row.time,
              tourId: row.tourId || null,
              setLists: [],
            });
          }
          if (row.setlistId || row.masterSetlistId) {
            eventMap.get(row.id)!.setLists.push({
              id: (row.setlistId || row.masterSetlistId) as string,
              type: row.setlistId ? 'setlist' : 'master',
              position: row.position,
            });
          }
        });
        resolve(Array.from(eventMap.values()));
      }
    );
  });
};

export const createEvent = (name: string, location: string, date: string, time: string, tourId?: string | null): Promise<Event> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(
      `INSERT INTO events (id, name, location, date, time, tourId) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, location, date, time, tourId || null],
      function (err) {
        if (err) return reject(err);
        resolve({ id, name, location, date, time, tourId: tourId || null, setLists: [] });
      }
    );
  });
};

export const updateEvent = (id: string, name: string, location: string, date: string, time: string, tourId?: string | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE events SET name = ?, location = ?, date = ?, time = ?, tourId = ? WHERE id = ?`,
      [name, location, date, time, tourId || null, id],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const deleteEvent = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM event_setlists WHERE eventId = ?`, [id]);
      db.run(`DELETE FROM events WHERE id = ?`, [id], (err) => {
        if (err) reject(err); else resolve();
      });
    });
  });
};

export const addSetListToEvent = (eventId: string, targetId: string, type: 'setlist' | 'master', position: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const column = type === 'setlist' ? 'setlistId' : 'masterSetlistId';
    db.run(
      `INSERT INTO event_setlists (eventId, ${column}, position) VALUES (?, ?, ?)`,
      [eventId, targetId, position],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const removeSetListFromEvent = (eventId: string, targetId: string, type?: 'setlist' | 'master'): Promise<void> => {
  return new Promise((resolve, reject) => {
    let query = `DELETE FROM event_setlists WHERE eventId = ? AND (setlistId = ? OR masterSetlistId = ?)`;
    let params = [eventId, targetId, targetId];
    if (type) {
      const column = type === 'setlist' ? 'setlistId' : 'masterSetlistId';
      query = `DELETE FROM event_setlists WHERE eventId = ? AND ${column} = ?`;
      params = [eventId, targetId];
    }
    db.run(query, params, (err) => { if (err) reject(err); else resolve(); });
  });
};

export const reorderSetListsInEvent = (eventId: string, entries: { id: string; type: 'setlist' | 'master' }[]): Promise<void> => {
  console.log(`[Repo] Reordering Event ${eventId} with ${entries.length} items`);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM event_setlists WHERE eventId = ?`, [eventId], (err) => {
        if (err) { db.run('ROLLBACK'); return reject(err); }
        const stmt = db.prepare(`INSERT INTO event_setlists (eventId, setlistId, masterSetlistId, position) VALUES (?, ?, ?, ?)`);
        entries.forEach((entry, idx) => {
          const slId = entry.type === 'setlist' ? entry.id : null;
          const mslId = entry.type === 'master' ? entry.id : null;
          stmt.run(eventId, slId, mslId, idx);
        });
        stmt.finalize();
        db.run('COMMIT', (err) => {
          if (err) { console.error('[Repo] Event reorder failed:', err); db.run('ROLLBACK'); reject(err); }
          else { console.log('[Repo] Event reorder successful'); resolve(); }
        });
      });
    });
  });
};
