import { randomUUID } from 'crypto';
import db from './index';
import { SetList } from '../shared/models';

export interface SetListWithEvent extends SetList {
  eventName?: string;
}

export const getAllSetLists = (): Promise<SetListWithEvent[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT sl.id, sl.name, ss.songId, ss.position, e.name as eventName
       FROM setlists sl
       LEFT JOIN setlist_songs ss ON sl.id = ss.setlistId
       LEFT JOIN event_setlists esl ON sl.id = esl.setlistId
       LEFT JOIN events e ON esl.eventId = e.id
       ORDER BY e.date ASC, sl.name ASC, ss.position ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        
        const setlistMap = new Map<string, SetListWithEvent>();
        rows.forEach((row: any) => {
          if (!setlistMap.has(row.id)) {
            setlistMap.set(row.id, { id: row.id, name: row.name, songs: [], eventName: row.eventName });
          }
          if (row.songId) {
            setlistMap.get(row.id)!.songs.push(row.songId);
          }
        });
        
        resolve(Array.from(setlistMap.values()));
      }
    );
  });
};

export const createSetList = (name: string): Promise<SetList> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(`INSERT INTO setlists (id, name) VALUES (?, ?)`, [id, name], function (err) {
      if (err) return reject(err);
      resolve({ id, name, songs: [] });
    });
  });
};

export const updateSetList = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE setlists SET name = ? WHERE id = ?`, [name, id], (err) => {
      if (err) reject(err); else resolve();
    });
  });
};

export const deleteSetList = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM setlist_songs WHERE setlistId = ?`, [id]);
      db.run(`DELETE FROM event_setlists WHERE setlistId = ?`, [id]);
      db.run(`DELETE FROM master_setlist_setlists WHERE setlistId = ?`, [id]);
      db.run(`DELETE FROM setlists WHERE id = ?`, [id], (err) => {
        if (err) { db.run('ROLLBACK'); reject(err); }
        else { db.run('COMMIT'); resolve(); }
      });
    });
  });
};

export const addSongToSetList = (setlistId: string, songId: string, position: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO setlist_songs (setlistId, songId, position) VALUES (?, ?, ?)`,
      [setlistId, songId, position],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const removeSongFromSetList = (setlistId: string, songId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM setlist_songs WHERE setlistId = ? AND songId = ?`,
      [setlistId, songId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const reorderSongsInSetList = (setlistId: string, songIds: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM setlist_songs WHERE setlistId = ?`, [setlistId], (err) => {
        if (err) { db.run('ROLLBACK'); return reject(err); }
        const stmt = db.prepare(`INSERT INTO setlist_songs (setlistId, songId, position) VALUES (?, ?, ?)`);
        songIds.forEach((songId, index) => {
          stmt.run(setlistId, songId, index);
        });
        stmt.finalize();
        db.run('COMMIT', (err) => {
          if (err) { db.run('ROLLBACK'); reject(err); }
          else resolve();
        });
      });
    });
  });
};
