import { randomUUID } from 'crypto';
import db from './index';
import { Instrument } from '../shared/models';

export const getAllInstruments = (): Promise<Instrument[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT i.id, i.name
       FROM instruments i`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const instruments: Instrument[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          musicians: [], // Will be populated separately if needed
        }));
        resolve(instruments);
      }
    );
  });
};

export const createInstrument = (name: string): Promise<Instrument> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(
      `INSERT INTO instruments (id, name) VALUES (?, ?)`,
      [id, name],
      function (err) {
        if (err) return reject(err);
        resolve({ id, name, musicians: [] });
      }
    );
  });
};

export const deleteInstrument = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM instruments WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
};

export const assignInstrumentToMusician = (musicianId: string, instrumentId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`Assigning instrument ${instrumentId} to musician ${musicianId}`);
    
    // First check if both exist
    db.get(`SELECT id FROM musicians WHERE id = ?`, [musicianId], (err, musicianRow) => {
      if (err) return reject(err);
      if (!musicianRow) return reject(new Error(`Musician ${musicianId} not found`));
      
      db.get(`SELECT id FROM instruments WHERE id = ?`, [instrumentId], (err, instrumentRow) => {
        if (err) return reject(err);
        if (!instrumentRow) return reject(new Error(`Instrument ${instrumentId} not found`));
        
        db.run(
          `INSERT OR IGNORE INTO musician_instruments (musicianId, instrumentId) VALUES (?, ?)`,
          [musicianId, instrumentId],
          function (err) {
            if (err) {
              console.error('Error inserting assignment:', err);
              return reject(err);
            }
            console.log(`Successfully assigned instrument ${instrumentId} to musician ${musicianId}, changes: ${this.changes}`);
            resolve();
          }
        );
      });
    });
  });
};

export const removeInstrumentFromMusician = (musicianId: string, instrumentId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM musician_instruments WHERE musicianId = ? AND instrumentId = ?`,
      [musicianId, instrumentId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const getAllAssignments = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM musician_instruments`, [], (err, rows) => {
      if (err) return reject(err);
      console.log('Current assignments:', rows);
      resolve(rows);
    });
  });
};

export const updateInstrument = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE instruments SET name = ? WHERE id = ?`,
      [name, id],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};
