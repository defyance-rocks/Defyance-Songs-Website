import { randomUUID } from 'crypto';
import db from './index';
import { Song } from '../shared/models';

export const getAllSongs = (): Promise<Song[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT s.id, s.name, s.artist, s.vocalRange, s.notes, s.link,
              GROUP_CONCAT(sv.musicianId) AS vocalistIds
       FROM songs s
       LEFT JOIN song_vocalists sv ON s.id = sv.songId
       GROUP BY s.id`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        const songs: Song[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          artist: row.artist,
          vocalRange: row.vocalRange || null,
          notes: row.notes || null,
          link: row.link || null,
          vocalists: row.vocalistIds ? row.vocalistIds.split(',') : [],
        }));
        resolve(songs);
      }
    );
  });
};

export const createSong = (
  name: string,
  artist: string,
  vocalRange?: 'High' | 'Low' | null,
  notes?: string | null,
  link?: string | null
): Promise<Song> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const params: any[] = [
      id,
      name,
      artist,
      vocalRange ?? null,
      notes ?? null,
      link ?? null,
    ];
    db.run(
      `INSERT INTO songs (id, name, artist, vocalRange, notes, link) VALUES (?, ?, ?, ?, ?, ?)`,
      params,
      function (err) {
        if (err) return reject(err);
        resolve({
          id,
          name,
          artist,
          vocalRange: vocalRange || null,
          notes: notes || null,
          link: link || null,
          vocalists: [],
        });
      }
    );
  });
};

export const deleteSong = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM songs WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
};

export const assignVocalistToSong = (songId: string, musicianId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO song_vocalists (songId, musicianId) VALUES (?, ?)`,
      [songId, musicianId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const removeVocalistFromSong = (songId: string, musicianId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM song_vocalists WHERE songId = ? AND musicianId = ?`,
      [songId, musicianId],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export const updateSong = (
  id: string,
  name: string,
  artist: string,
  vocalRange?: 'High' | 'Low' | null,
  notes?: string | null,
  link?: string | null
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const params: any[] = [
      name,
      artist,
      vocalRange ?? null,
      notes ?? null,
      link ?? null,
      id,
    ];
    db.run(
      `UPDATE songs SET name = ?, artist = ?, vocalRange = ?, notes = ?, link = ? WHERE id = ?`,
      params,
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};
