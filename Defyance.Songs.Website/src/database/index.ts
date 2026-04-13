import { Database } from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

// Create tables
const initDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS bands (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating bands table:', err);
          reject(err);
          return;
        }
        console.log('Bands table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS musicians (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          bio TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating musicians table:', err);
          reject(err);
          return;
        }
        console.log('Musicians table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS instruments (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating instruments table:', err);
          reject(err);
          return;
        }
        console.log('Instruments table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS musician_instruments (
          musicianId TEXT NOT NULL,
          instrumentId TEXT NOT NULL,
          PRIMARY KEY (musicianId, instrumentId),
          FOREIGN KEY (musicianId) REFERENCES musicians(id),
          FOREIGN KEY (instrumentId) REFERENCES instruments(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating musician_instruments table:', err);
          reject(err);
          return;
        }
        console.log('Musician_instruments table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS songs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          artist TEXT NOT NULL,
          vocalRange TEXT,
          notes TEXT,
          link TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating songs table:', err);
          reject(err);
          return;
        }
        console.log('Songs table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS setlists (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating setlists table:', err);
          reject(err);
          return;
        }
        console.log('Setlists table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          tourId TEXT,
          FOREIGN KEY (tourId) REFERENCES tours(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating events table:', err);
          reject(err);
          return;
        }
        console.log('Events table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS tours (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tours table:', err);
          reject(err);
          return;
        }
        console.log('Tours table created');
      });

      // Junction tables for many-to-many
      db.run(`
        CREATE TABLE IF NOT EXISTS band_musicians (
          bandId TEXT,
          musicianId TEXT,
          PRIMARY KEY (bandId, musicianId),
          FOREIGN KEY (bandId) REFERENCES bands(id),
          FOREIGN KEY (musicianId) REFERENCES musicians(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating band_musicians table:', err);
          reject(err);
          return;
        }
        console.log('Band_musicians table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS song_vocalists (
          songId TEXT,
          musicianId TEXT,
          PRIMARY KEY (songId, musicianId),
          FOREIGN KEY (songId) REFERENCES songs(id),
          FOREIGN KEY (musicianId) REFERENCES musicians(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating song_vocalists table:', err);
          reject(err);
          return;
        }
        console.log('Song_vocalists table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS setlist_songs (
          setlistId TEXT,
          songId TEXT,
          position INTEGER,
          PRIMARY KEY (setlistId, songId),
          FOREIGN KEY (setlistId) REFERENCES setlists(id),
          FOREIGN KEY (songId) REFERENCES songs(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating setlist_songs table:', err);
          reject(err);
          return;
        }
        console.log('Setlist_songs table created');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS event_setlists (
          eventId TEXT,
          setlistId TEXT,
          position INTEGER,
          PRIMARY KEY (eventId, setlistId),
          FOREIGN KEY (eventId) REFERENCES events(id),
          FOREIGN KEY (setlistId) REFERENCES setlists(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating event_setlists table:', err);
          reject(err);
          return;
        }
        console.log('Event_setlists table created');
        resolve(); // Resolve after all tables are created
      });
    });
  });
};

export { initDatabase };
export default db;