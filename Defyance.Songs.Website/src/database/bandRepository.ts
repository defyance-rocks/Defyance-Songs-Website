import { randomUUID } from 'crypto';
import db from './index';
import { Band } from '../shared/models';

export const getAllBands = (): Promise<Band[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT b.id, b.name, GROUP_CONCAT(bm.musicianId) AS musicianIds
       FROM bands b
       LEFT JOIN band_musicians bm ON b.id = bm.bandId
       GROUP BY b.id`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const bands: Band[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          musicians: row.musicianIds ? row.musicianIds.split(',') : [],
        }));
        resolve(bands);
      }
    );
  });
};

export const createBand = (name: string): Promise<Band> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(
      `INSERT INTO bands (id, name) VALUES (?, ?)`,
      [id, name],
      function (err) {
        if (err) return reject(err);
        resolve({ id, name, musicians: [] });
      }
    );
  });
};

export const deleteBand = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM bands WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
};

export const assignMusicianToBand = (bandId: string, musicianId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO band_musicians (bandId, musicianId) VALUES (?, ?)`,
      [bandId, musicianId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const removeMusicianFromBand = (bandId: string, musicianId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM band_musicians WHERE bandId = ? AND musicianId = ?`,
      [bandId, musicianId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const updateBand = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE bands SET name = ? WHERE id = ?`,
      [name, id],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};
