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
      // 1. Independent Tables
      db.run(`CREATE TABLE IF NOT EXISTS bands (id TEXT PRIMARY KEY, name TEXT NOT NULL)`);
      db.run(`CREATE TABLE IF NOT EXISTS musicians (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT, bio TEXT)`);
      db.run(`CREATE TABLE IF NOT EXISTS instruments (id TEXT PRIMARY KEY, name TEXT NOT NULL)`);
      db.run(`CREATE TABLE IF NOT EXISTS songs (id TEXT PRIMARY KEY, name TEXT NOT NULL, artist TEXT NOT NULL, vocalRange TEXT, notes TEXT, link TEXT)`);
      db.run(`CREATE TABLE IF NOT EXISTS setlists (id TEXT PRIMARY KEY, name TEXT NOT NULL)`);
      db.run(`CREATE TABLE IF NOT EXISTS master_setlists (id TEXT PRIMARY KEY, name TEXT NOT NULL)`);
      db.run(`CREATE TABLE IF NOT EXISTS tours (id TEXT PRIMARY KEY, name TEXT NOT NULL)`);

      // 2. Tables with Foreign Keys
      db.run(`CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY, 
        name TEXT NOT NULL, 
        location TEXT NOT NULL, 
        date TEXT NOT NULL, 
        time TEXT NOT NULL, 
        tourId TEXT,
        FOREIGN KEY (tourId) REFERENCES tours(id)
      )`);

      // 3. Junction Tables
      db.run(`CREATE TABLE IF NOT EXISTS band_musicians (
        bandId TEXT, 
        musicianId TEXT, 
        PRIMARY KEY (bandId, musicianId), 
        FOREIGN KEY (bandId) REFERENCES bands(id), 
        FOREIGN KEY (musicianId) REFERENCES musicians(id)
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS musician_instruments (
        musicianId TEXT, 
        instrumentId TEXT, 
        PRIMARY KEY (musicianId, instrumentId), 
        FOREIGN KEY (musicianId) REFERENCES musicians(id), 
        FOREIGN KEY (instrumentId) REFERENCES instruments(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS song_vocalists (
        songId TEXT, 
        musicianId TEXT, 
        PRIMARY KEY (songId, musicianId), 
        FOREIGN KEY (songId) REFERENCES songs(id), 
        FOREIGN KEY (musicianId) REFERENCES musicians(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS setlist_songs (
        setlistId TEXT, 
        songId TEXT, 
        position INTEGER, 
        PRIMARY KEY (setlistId, songId), 
        FOREIGN KEY (setlistId) REFERENCES setlists(id), 
        FOREIGN KEY (songId) REFERENCES songs(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS event_setlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eventId TEXT NOT NULL, 
        setlistId TEXT, 
        masterSetlistId TEXT,
        position INTEGER, 
        FOREIGN KEY (eventId) REFERENCES events(id), 
        FOREIGN KEY (setlistId) REFERENCES setlists(id),
        FOREIGN KEY (masterSetlistId) REFERENCES master_setlists(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS master_setlist_setlists (
        masterSetlistId TEXT, 
        setlistId TEXT, 
        position INTEGER, 
        PRIMARY KEY (masterSetlistId, setlistId), 
        FOREIGN KEY (masterSetlistId) REFERENCES master_setlists(id), 
        FOREIGN KEY (setlistId) REFERENCES setlists(id)
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

export { initDatabase };
export default db;
