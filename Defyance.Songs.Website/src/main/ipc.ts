import { ipcMain } from 'electron';
import { initDatabase } from '../database/index';
import {
  assignMusicianToBand,
  createBand,
  deleteBand,
  getAllBands,
  removeMusicianFromBand,
  updateBand,
} from '../database/bandRepository';
import { 
  createMusician, 
  deleteMusician, 
  getAllMusicians, 
  updateMusician 
} from '../database/musicianRepository';
import {
  assignInstrumentToMusician,
  createInstrument,
  deleteInstrument,
  getAllInstruments,
  removeInstrumentFromMusician,
  updateInstrument,
} from '../database/instrumentRepository';
import {
  createSong,
  deleteSong,
  getAllSongs,
  assignVocalistToSong,
  removeVocalistFromSong,
  updateSong,
} from '../database/songRepository';
import {
  addSongToSetList,
  createSetList,
  deleteSetList,
  getAllSetLists,
  removeSongFromSetList,
  reorderSongsInSetList,
  updateSetList,
} from '../database/setlistRepository';
import {
  addSetListToEvent,
  createEvent,
  deleteEvent,
  getAllEvents,
  removeSetListFromEvent,
  reorderSetListsInEvent,
  updateEvent,
} from '../database/eventRepository';
import {
  addEventToTour,
  createTour,
  deleteTour,
  getAllTours,
  removeEventFromTour,
  updateTour,
  reorderEventsInTour,
} from '../database/tourRepository';
import {
  addSetListToMaster,
  createMasterSetList,
  deleteMasterSetList,
  getAllMasterSetLists,
  removeSetListFromMaster,
  updateMasterSetList,
  reorderSetListsInMaster,
} from '../database/masterSetlistRepository';

export const setupIPC = async () => {
  await initDatabase();

  // BANDS
  ipcMain.handle('bands:list', async () => await getAllBands());
  ipcMain.handle('bands:create', async (_event, name: string) => await createBand(name));
  ipcMain.handle('bands:update', async (_event, id: string, name: string) => await updateBand(id, name));
  ipcMain.handle('bands:delete', async (_event, id: string) => await deleteBand(id));
  ipcMain.handle('bands:assign-musician', async (_event, bandId: string, musicianId: string) => await assignMusicianToBand(bandId, musicianId));
  ipcMain.handle('bands:remove-musician', async (_event, bandId: string, musicianId: string) => await removeMusicianFromBand(bandId, musicianId));

  // MUSICIANS
  ipcMain.handle('musicians:list', async () => await getAllMusicians());
  ipcMain.handle('musicians:create', async (_event, name: string, phone?: string, email?: string, bio?: string) => await createMusician(name, phone, email, bio));
  ipcMain.handle('musicians:update', async (_event, id: string, name: string, phone?: string, email?: string, bio?: string) => await updateMusician(id, name, phone, email, bio));
  ipcMain.handle('musicians:delete', async (_event, id: string) => await deleteMusician(id));

  // INSTRUMENTS
  ipcMain.handle('instruments:list', async () => await getAllInstruments());
  ipcMain.handle('instruments:create', async (_event, name: string) => await createInstrument(name));
  ipcMain.handle('instruments:update', async (_event, id: string, name: string) => await updateInstrument(id, name));
  ipcMain.handle('instruments:delete', async (_event, id: string) => await deleteInstrument(id));
  ipcMain.handle('instruments:assign-to-musician', async (_event, musicianId: string, instrumentId: string) => await assignInstrumentToMusician(musicianId, instrumentId));
  ipcMain.handle('instruments:remove-from-musician', async (_event, musicianId: string, instrumentId: string) => await removeInstrumentFromMusician(musicianId, instrumentId));

  // SONGS
  ipcMain.handle('songs:list', async () => await getAllSongs());
  ipcMain.handle('songs:create', async (_event, name: string, artist: string, vocalRange?: 'High' | 'Low' | null, notes?: string, link?: string) => {
    return await createSong(name, artist, vocalRange || null, notes || null, link || null);
  });
  ipcMain.handle('songs:update', async (_event, id: string, name: string, artist: string, vocalRange?: 'High' | 'Low' | null, notes?: string, link?: string) => {
    return await updateSong(id, name, artist, vocalRange || null, notes || null, link || null);
  });
  ipcMain.handle('songs:delete', async (_event, id: string) => await deleteSong(id));
  ipcMain.handle('songs:assign-vocalist', async (_event, songId: string, musicianId: string) => await assignVocalistToSong(songId, musicianId));
  ipcMain.handle('songs:remove-vocalist', async (_event, songId: string, musicianId: string) => await removeVocalistFromSong(songId, musicianId));

  // SETLISTS
  ipcMain.handle('setlists:list', async () => await getAllSetLists());
  ipcMain.handle('setlists:create', async (_event, name: string) => await createSetList(name));
  ipcMain.handle('setlists:update', async (_event, id: string, name: string) => await updateSetList(id, name));
  ipcMain.handle('setlists:delete', async (_event, id: string) => await deleteSetList(id));
  ipcMain.handle('setlists:add-song', async (_event, setlistId: string, songId: string, position: number) => await addSongToSetList(setlistId, songId, position));
  ipcMain.handle('setlists:remove-song', async (_event, setlistId: string, songId: string) => await removeSongFromSetList(setlistId, songId));
  ipcMain.handle('setlists:reorder-songs', async (_event, setlistId: string, songIds: string[]) => {
    console.log(`[IPC] Reordering songs for setlist ${setlistId}`);
    return await reorderSongsInSetList(setlistId, songIds);
  });

  // EVENTS
  ipcMain.handle('events:list', async () => await getAllEvents());
  ipcMain.handle('events:create', async (_event, name: string, location: string, date: string, time: string, tourId?: string | null) => await createEvent(name, location, date, time, tourId));
  ipcMain.handle('events:update', async (_event, id: string, name: string, location: string, date: string, time: string, tourId?: string | null) => await updateEvent(id, name, location, date, time, tourId));
  ipcMain.handle('events:delete', async (_event, id: string) => await deleteEvent(id));
  ipcMain.handle('events:add-setlist', async (_event, eventId: string, id: string, type: 'setlist' | 'master', position: number) => {
    return await addSetListToEvent(eventId, id, type, position);
  });
  ipcMain.handle('events:remove-setlist', async (_event, eventId: string, id: string, type?: 'setlist' | 'master') => {
    return await removeSetListFromEvent(eventId, id, type);
  });
  ipcMain.handle('events:reorder-setlists', async (_event, eventId: string, entries: { id: string, type: 'setlist' | 'master' }[]) => {
    console.log(`[IPC] Reordering setlists for event ${eventId}`);
    return await reorderSetListsInEvent(eventId, entries);
  });

  // TOURS
  ipcMain.handle('tours:list', async () => await getAllTours());
  ipcMain.handle('tours:create', async (_event, name: string) => await createTour(name));
  ipcMain.handle('tours:update', async (_event, id: string, name: string) => await updateTour(id, name));
  ipcMain.handle('tours:delete', async (_event, id: string) => await deleteTour(id));
  ipcMain.handle('tours:add-event', async (_event, tourId: string, eventId: string, position: number) => await addEventToTour(tourId, eventId, position));
  ipcMain.handle('tours:remove-event', async (_event, eventId: string) => await removeEventFromTour(eventId));
  ipcMain.handle('tours:reorder-events', async (_event, tourId: string, eventIds: string[]) => {
    console.log(`[IPC] Reordering events for tour ${tourId}`);
    return await reorderEventsInTour(tourId, eventIds);
  });

  // MASTER SETLISTS
  ipcMain.handle('master-setlists:list', async () => await getAllMasterSetLists());
  ipcMain.handle('master-setlists:create', async (_event, name: string) => await createMasterSetList(name));
  ipcMain.handle('master-setlists:update', async (_event, id: string, name: string) => await updateMasterSetList(id, name));
  ipcMain.handle('master-setlists:delete', async (_event, id: string) => await deleteMasterSetList(id));
  ipcMain.handle('master-setlists:add-setlist', async (_event, masterId: string, setlistId: string, position: number) => await addSetListToMaster(masterId, setlistId, position));
  ipcMain.handle('master-setlists:remove-setlist', async (_event, masterId: string, setlistId: string) => await removeSetListFromMaster(masterId, setlistId));
  ipcMain.handle('master-setlists:reorder-setlists', async (_event, masterId: string, setlistIds: string[]) => {
    console.log(`[IPC] Reordering setlists for master setlist ${masterId}`);
    return await reorderSetListsInMaster(masterId, setlistIds);
  });
};
