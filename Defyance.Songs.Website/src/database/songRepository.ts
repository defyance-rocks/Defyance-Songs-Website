import { randomUUID } from 'crypto';
import db from './index';
import { Song } from '../shared/models';

export const getAllSongs = (): Promise<Song[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT s.*, sv.musicianId
       FROM songs s
       LEFT JOIN song_vocalists sv ON s.id = sv.songId
       ORDER BY s.name ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const songMap = new Map<string, Song>();
        rows.forEach((row: any) => {
          if (!songMap.has(row.id)) {
            songMap.set(row.id, {
              id: row.id,
              name: row.name,
              artist: row.artist,
              vocalRange: row.vocalRange || null,
              notes: row.notes || null,
              link: row.link || null,
              vocalists: [],
            });
          }
          if (row.musicianId) {
            songMap.get(row.id)!.vocalists.push(row.musicianId);
          }
        });
        resolve(Array.from(songMap.values()));
      }
    );
  });
};

export const createSong = (name: string, artist: string, vocalRange?: 'High' | 'Low' | null, notes?: string | null, link?: string | null): Promise<Song> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    db.run(
      `INSERT INTO songs (id, name, artist, vocalRange, notes, link) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, artist, vocalRange ?? null, notes ?? null, link ?? null],
      function (err) {
        if (err) return reject(err);
        resolve({ id, name, artist, vocalRange: vocalRange || null, notes: notes || null, link: link || null, vocalists: [] });
      }
    );
  });
};

export const deleteSong = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`DELETE FROM song_vocalists WHERE songId = ?`, [id]);
      db.run(`DELETE FROM setlist_songs WHERE songId = ?`, [id]);
      db.run(`DELETE FROM songs WHERE id = ?`, [id], (err) => {
        if (err) { db.run('ROLLBACK'); reject(err); }
        else { db.run('COMMIT'); resolve(); }
      });
    });
  });
};

export const assignVocalistToSong = (songId: string, musicianId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO song_vocalists (songId, musicianId) VALUES (?, ?)`,
      [songId, musicianId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const removeVocalistFromSong = (songId: string, musicianId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM song_vocalists WHERE songId = ? AND musicianId = ?`,
      [songId, musicianId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const updateSong = (id: string, name: string, artist: string, vocalRange?: 'High' | 'Low' | null, notes?: string | null, link?: string | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE songs SET name = ?, artist = ?, vocalRange = ?, notes = ?, link = ? WHERE id = ?`,
      [name, artist, vocalRange ?? null, notes ?? null, link ?? null, id],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};
