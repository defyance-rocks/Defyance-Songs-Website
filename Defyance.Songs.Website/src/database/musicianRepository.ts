import { randomUUID } from 'crypto';
import db from './index';
import { Musician } from '../shared/models';

export const getAllMusicians = (): Promise<Musician[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT m.id, m.name, m.phone, m.email, m.bio,
              GROUP_CONCAT(DISTINCT i.id) AS instrumentIds,
              GROUP_CONCAT(DISTINCT bm.bandId) AS bandIds
       FROM musicians m
       LEFT JOIN musician_instruments mi ON m.id = mi.musicianId
       LEFT JOIN instruments i ON mi.instrumentId = i.id
       LEFT JOIN band_musicians bm ON m.id = bm.musicianId
       GROUP BY m.id`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        console.log('Raw musician rows:', rows);
        const musicians: Musician[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          bio: row.bio,
          instruments: row.instrumentIds ? row.instrumentIds.split(',') : [],
          bands: row.bandIds ? row.bandIds.split(',') : [],
        }));
        console.log('Processed musicians:', musicians.map(m => ({ name: m.name, instruments: m.instruments })));
        resolve(musicians);
      }
    );
  });
};

export const createMusician = (
  name: string,
  phone?: string,
  email?: string,
  bio?: string
): Promise<Musician> => {
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
    db.run(`DELETE FROM musicians WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
};

export const updateMusician = (
  id: string,
  name: string,
  phone?: string,
  email?: string,
  bio?: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE musicians SET name = ?, phone = ?, email = ?, bio = ? WHERE id = ?`,
      [name, phone || null, email || null, bio || null, id],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};