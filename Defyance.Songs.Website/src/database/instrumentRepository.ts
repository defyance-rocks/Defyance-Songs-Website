import { randomUUID } from 'crypto';
import db from './index';
import { Instrument } from '../shared/models';

export const getAllInstruments = (): Promise<Instrument[]> => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT i.id, i.name FROM instruments i ORDER BY i.name ASC`, [], (err, rows) => {
      if (err) return reject(err);
      const instruments: Instrument[] = rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        musicians: [],
      }));
      resolve(instruments);
    });
  });
};

export const createInstrument = (name: string): Promise<Instrument> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(`INSERT INTO instruments (id, name) VALUES (?, ?)`, [id, name], function (err) {
      if (err) return reject(err);
      resolve({ id, name, musicians: [] });
    });
  });
};

export const deleteInstrument = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM musician_instruments WHERE instrumentId = ?`, [id]);
      db.run(`DELETE FROM instruments WHERE id = ?`, [id], (err) => {
        if (err) { db.run('ROLLBACK'); reject(err); }
        else { db.run('COMMIT'); resolve(); }
      });
    });
  });
};

export const assignInstrumentToMusician = (musicianId: string, instrumentId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO musician_instruments (musicianId, instrumentId) VALUES (?, ?)`,
      [musicianId, instrumentId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const removeInstrumentFromMusician = (musicianId: string, instrumentId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM musician_instruments WHERE musicianId = ? AND instrumentId = ?`,
      [musicianId, instrumentId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const getAllAssignments = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM musician_instruments`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

export const updateInstrument = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE instruments SET name = ? WHERE id = ?`, [name, id], (err) => {
      if (err) reject(err); else resolve();
    });
  });
};
