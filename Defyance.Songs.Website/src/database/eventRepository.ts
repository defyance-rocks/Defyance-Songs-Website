import { randomUUID } from 'crypto';
import db from './index';
import { Event } from '../shared/models';

export const getAllEvents = (): Promise<Event[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT e.id, e.name, e.location, e.date, e.time, e.tourId, GROUP_CONCAT(esl.setlistId) AS setListIds
       FROM events e
       LEFT JOIN event_setlists esl ON e.id = esl.eventId
       GROUP BY e.id
       ORDER BY e.date DESC, e.time DESC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const events: Event[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          location: row.location,
          date: row.date,
          time: row.time,
          tourId: row.tourId || null,
          setLists: row.setListIds ? row.setListIds.split(',') : [],
        }));
        resolve(events);
      }
    );
  });
};

export const createEvent = (
  name: string,
  location: string,
  date: string,
  time: string,
  tourId?: string | null
): Promise<Event> => {
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

export const updateEvent = (
  id: string,
  name: string,
  location: string,
  date: string,
  time: string,
  tourId?: string | null
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE events SET name = ?, location = ?, date = ?, time = ?, tourId = ? WHERE id = ?`,
      [name, location, date, time, tourId || null, id],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const deleteEvent = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM event_setlists WHERE eventId = ?`, [id], (err) => {
      if (err) return reject(err);
      db.run(`DELETE FROM events WHERE id = ?`, [id], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

export const addSetListToEvent = (eventId: string, setlistId: string, position: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO event_setlists (eventId, setlistId, position) VALUES (?, ?, ?)`,
      [eventId, setlistId, position],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const removeSetListFromEvent = (eventId: string, setlistId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM event_setlists WHERE eventId = ? AND setlistId = ?`,
      [eventId, setlistId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const reorderSetListsInEvent = (eventId: string, setlistIds: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(`UPDATE event_setlists SET position = ? WHERE eventId = ? AND setlistId = ?`);
      setlistIds.forEach((setlistId, index) => {
        stmt.run(index, eventId, setlistId);
      });
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};
