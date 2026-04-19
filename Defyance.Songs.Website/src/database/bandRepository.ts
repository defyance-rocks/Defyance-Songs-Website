import { randomUUID } from 'crypto';
import db from './index';
import { Band } from '../shared/models';

export const getAllBands = (): Promise<Band[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT b.id, b.name, bm.musicianId
       FROM bands b
       LEFT JOIN band_musicians bm ON b.id = bm.bandId
       ORDER BY b.name ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const bandMap = new Map<string, Band>();
        rows.forEach((row: any) => {
          if (!bandMap.has(row.id)) {
            bandMap.set(row.id, { id: row.id, name: row.name, musicians: [] });
          }
          if (row.musicianId) {
            bandMap.get(row.id)!.musicians.push(row.musicianId);
          }
        });
        resolve(Array.from(bandMap.values()));
      }
    );
  });
};

export const createBand = (name: string): Promise<Band> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(`INSERT INTO bands (id, name) VALUES (?, ?)`, [id, name], function (err) {
      if (err) return reject(err);
      resolve({ id, name, musicians: [] });
    });
  });
};

export const deleteBand = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM band_musicians WHERE bandId = ?`, [id]);
      db.run(`DELETE FROM bands WHERE id = ?`, [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
        } else {
          db.run('COMMIT');
          resolve();
        }
      });
    });
  });
};

export const assignMusicianToBand = (bandId: string, musicianId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO band_musicians (bandId, musicianId) VALUES (?, ?)`,
      [bandId, musicianId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const removeMusicianFromBand = (bandId: string, musicianId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM band_musicians WHERE bandId = ? AND musicianId = ?`,
      [bandId, musicianId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const updateBand = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE bands SET name = ? WHERE id = ?`, [name, id], (err) => {
      if (err) reject(err); else resolve();
    });
  });
};
