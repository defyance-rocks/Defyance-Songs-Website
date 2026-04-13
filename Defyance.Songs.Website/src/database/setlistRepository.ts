import { randomUUID } from 'crypto';
import db from './index';
import { SetList } from '../shared/models';

export const getAllSetLists = (): Promise<SetList[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT sl.id, sl.name, GROUP_CONCAT(sls.songId) AS songIds
       FROM setlists sl
       LEFT JOIN setlist_songs sls ON sl.id = sls.setlistId
       GROUP BY sl.id
       ORDER BY sl.name ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const setLists: SetList[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          songs: row.songIds ? row.songIds.split(',') : [],
        }));
        resolve(setLists);
      }
    );
  });
};

export const createSetList = (name: string): Promise<SetList> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(
      `INSERT INTO setlists (id, name) VALUES (?, ?)`,
      [id, name],
      function (err) {
        if (err) return reject(err);
        resolve({ id, name, songs: [] });
      }
    );
  });
};

export const updateSetList = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE setlists SET name = ? WHERE id = ?`,
      [name, id],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const deleteSetList = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Delete associations first
    db.run(`DELETE FROM setlist_songs WHERE setlistId = ?`, [id], (err) => {
      if (err) return reject(err);
      db.run(`DELETE FROM setlists WHERE id = ?`, [id], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

export const addSongToSetList = (setlistId: string, songId: string, position: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO setlist_songs (setlistId, songId, position) VALUES (?, ?, ?)`,
      [setlistId, songId, position],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const removeSongFromSetList = (setlistId: string, songId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM setlist_songs WHERE setlistId = ? AND songId = ?`,
      [setlistId, songId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const reorderSongsInSetList = (setlistId: string, songIds: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(`UPDATE setlist_songs SET position = ? WHERE setlistId = ? AND songId = ?`);
      songIds.forEach((songId, index) => {
        stmt.run(index, setlistId, songId);
      });
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};
