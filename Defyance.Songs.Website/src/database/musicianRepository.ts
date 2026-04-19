import { randomUUID } from 'crypto';
import db from './index';
import { Musician } from '../shared/models';

export const getAllMusicians = (): Promise<Musician[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT m.*, mi.instrumentId, bm.bandId
       FROM musicians m
       LEFT JOIN musician_instruments mi ON m.id = mi.musicianId
       LEFT JOIN band_musicians bm ON m.id = bm.musicianId
       ORDER BY m.name ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const musicianMap = new Map<string, Musician>();
        rows.forEach((row: any) => {
          if (!musicianMap.has(row.id)) {
            musicianMap.set(row.id, {
              id: row.id,
              name: row.name,
              phone: row.phone,
              email: row.email,
              bio: row.bio,
              instruments: [],
              bands: [],
            });
          }
          const mus = musicianMap.get(row.id)!;
          if (row.instrumentId && !mus.instruments.includes(row.instrumentId)) {
            mus.instruments.push(row.instrumentId);
          }
          if (row.bandId && !mus.bands.includes(row.bandId)) {
            mus.bands.push(row.bandId);
          }
        });
        resolve(Array.from(musicianMap.values()));
      }
    );
  });
};

export const createMusician = (name: string, phone?: string, email?: string, bio?: string): Promise<Musician> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(
      `INSERT INTO musicians (id, name, phone, email, bio) VALUES (?, ?, ?, ?, ?)`,
      [id, name, phone || null, email || null, bio || null],
      function (err) {
        if (err) return reject(err);
        resolve({ id, name, phone, email, bio, instruments: [], bands: [] });
      }
    );
  });
};

export const deleteMusician = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM band_musicians WHERE musicianId = ?`, [id]);
      db.run(`DELETE FROM musician_instruments WHERE musicianId = ?`, [id]);
      db.run(`DELETE FROM song_vocalists WHERE musicianId = ?`, [id]);
      db.run(`DELETE FROM musicians WHERE id = ?`, [id], (err) => {
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

export const updateMusician = (id: string, name: string, phone?: string, email?: string, bio?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE musicians SET name = ?, phone = ?, email = ?, bio = ? WHERE id = ?`,
      [name, phone || null, email || null, bio || null, id],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};
