import { ipcMain } from 'electron';
import { initDatabase } from '../database/index';
import {
  assignMusicianToBand,
  createBand,
  deleteBand,
  getAllBands,
  removeMusicianFromBand,
} from '../database/bandRepository';
import { createMusician, deleteMusician, getAllMusicians } from '../database/musicianRepository';
import {
  assignInstrumentToMusician,
  createInstrument,
  deleteInstrument,
  getAllAssignments,
  getAllInstruments,
  removeInstrumentFromMusician,
} from '../database/instrumentRepository';
import {
  createSong,
  deleteSong,
  getAllSongs,
  assignVocalistToSong,
  removeVocalistFromSong,
} from '../database/songRepository';

export const setupIPC = async () => {
  await initDatabase();

  ipcMain.handle('bands:list', async () => {
    return await getAllBands();
  });

  ipcMain.handle('bands:create', async (_event, name: string) => {
    return await createBand(name);
  });

  ipcMain.handle('bands:delete', async (_event, id: string) => {
    await deleteBand(id);
  });

  ipcMain.handle('bands:assign-musician', async (_event, bandId: string, musicianId: string) => {
    await assignMusicianToBand(bandId, musicianId);
  });

  ipcMain.handle('bands:remove-musician', async (_event, bandId: string, musicianId: string) => {
    await removeMusicianFromBand(bandId, musicianId);
  });

  ipcMain.handle('musicians:list', async () => {
    return await getAllMusicians();
  });

  ipcMain.handle(
    'musicians:create',
    async (_event, name: string, phone?: string, email?: string, bio?: string) => {
      return await createMusician(name, phone, email, bio);
    }
  );

  ipcMain.handle('musicians:delete', async (_event, id: string) => {
    await deleteMusician(id);
  });

  ipcMain.handle('songs:list', async () => {
    return await getAllSongs();
  });

  ipcMain.handle(
    'songs:create',
    async (
      _event,
      name: string,
      artist: string,
      setlistId?: string | null,
      position?: number,
      vocalRange?: 'High' | 'Low' | null,
      notes?: string,
      link?: string
    ) => {
      return await createSong(
        name,
        artist,
        setlistId || null,
        position,
        vocalRange || null,
        notes || null,
        link || null
      );
    }
  );

  ipcMain.handle('songs:delete', async (_event, id: string) => {
    await deleteSong(id);
  });

  ipcMain.handle('songs:assign-vocalist', async (_event, songId: string, musicianId: string) => {
    await assignVocalistToSong(songId, musicianId);
  });

  ipcMain.handle('songs:remove-vocalist', async (_event, songId: string, musicianId: string) => {
    await removeVocalistFromSong(songId, musicianId);
  });

  ipcMain.handle('instruments:list', async () => {
    return await getAllInstruments();
  });

  ipcMain.handle('instruments:create', async (_event, name: string) => {
    return await createInstrument(name);
  });

  ipcMain.handle('instruments:delete', async (_event, id: string) => {
    await deleteInstrument(id);
  });

  ipcMain.handle('instruments:assign-to-musician', async (_event, musicianId: string, instrumentId: string) => {
    await assignInstrumentToMusician(musicianId, instrumentId);
  });

  ipcMain.handle('instruments:remove-from-musician', async (_event, musicianId: string, instrumentId: string) => {
    await removeInstrumentFromMusician(musicianId, instrumentId);
  });

  ipcMain.handle('debug:assignments', async () => {
    return await getAllAssignments();
  });
};
