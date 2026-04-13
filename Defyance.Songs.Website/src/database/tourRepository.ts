import { randomUUID } from 'crypto';
import db from './index';
import { Tour } from '../shared/models';

export const getAllTours = (): Promise<Tour[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT t.id, t.name, GROUP_CONCAT(e.id) AS eventIds
       FROM tours t
       LEFT JOIN events e ON t.id = e.tourId
       GROUP BY t.id
       ORDER BY t.name ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const tours: Tour[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          events: row.eventIds ? row.eventIds.split(',') : [],
        }));
        resolve(tours);
      }
    );
  });
};

export const createTour = (name: string): Promise<Tour> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(
      `INSERT INTO tours (id, name) VALUES (?, ?)`,
      [id, name],
      function (err) {
        if (err) return reject(err);
        resolve({ id, name, events: [] });
      }
    );
  });
};

export const updateTour = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tours SET name = ? WHERE id = ?`,
      [name, id],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const deleteTour = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // We don't delete events, just unassign them from the tour
    db.run(`UPDATE events SET tourId = NULL WHERE tourId = ?`, [id], (err) => {
      if (err) return reject(err);
      db.run(`DELETE FROM tours WHERE id = ?`, [id], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

export const addEventToTour = (tourId: string, eventId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE events SET tourId = ? WHERE id = ?`,
      [tourId, eventId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const removeEventFromTour = (eventId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE events SET tourId = NULL WHERE id = ?`,
      [eventId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};
