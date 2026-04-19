import { randomUUID } from 'crypto';
import db from './index';
import { MasterSetList } from '../shared/models';

export const getAllMasterSetLists = (): Promise<MasterSetList[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT ms.id, ms.name, mss.setlistId, mss.position
       FROM master_setlists ms
       LEFT JOIN master_setlist_setlists mss ON ms.id = mss.masterSetlistId
       ORDER BY ms.name ASC, mss.position ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const mslMap = new Map<string, MasterSetList>();
        rows.forEach((row: any) => {
          if (!mslMap.has(row.id)) {
            mslMap.set(row.id, { id: row.id, name: row.name, setlists: [] });
          }
          if (row.setlistId) {
            mslMap.get(row.id)!.setlists.push(row.setlistId);
          }
        });
        resolve(Array.from(mslMap.values()));
      }
    );
  });
};

export const createMasterSetList = (name: string): Promise<MasterSetList> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(`INSERT INTO master_setlists (id, name) VALUES (?, ?)`, [id, name], function (err) {
      if (err) return reject(err);
      resolve({ id, name, setlists: [] });
    });
  });
};

export const updateMasterSetList = (id: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE master_setlists SET name = ? WHERE id = ?`, [name, id], (err) => {
      if (err) reject(err); else resolve();
    });
  });
};

export const deleteMasterSetList = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM master_setlist_setlists WHERE masterSetlistId = ?`, [id]);
      db.run(`DELETE FROM event_setlists WHERE masterSetlistId = ?`, [id]);
      db.run(`DELETE FROM master_setlists WHERE id = ?`, [id], (err) => {
        if (err) { db.run('ROLLBACK'); reject(err); }
        else { db.run('COMMIT'); resolve(); }
      });
    });
  });
};

export const addSetListToMaster = (masterId: string, setlistId: string, position: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO master_setlist_setlists (masterSetlistId, setlistId, position) VALUES (?, ?, ?)`,
      [masterId, setlistId, position],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const removeSetListFromMaster = (masterId: string, setlistId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM master_setlist_setlists WHERE masterSetlistId = ? AND setlistId = ?`,
      [masterId, setlistId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const reorderSetListsInMaster = (masterId: string, setlistIds: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM master_setlist_setlists WHERE masterSetlistId = ?`, [masterId], (err) => {
        if (err) { db.run('ROLLBACK'); return reject(err); }
        const stmt = db.prepare(`UPDATE master_setlist_setlists SET position = ? WHERE masterSetlistId = ? AND setlistId = ?`);
        setlistIds.forEach((id, index) => {
          stmt.run(index, masterId, id);
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
