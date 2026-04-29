import { useCallback } from 'react';
import { supabase } from '../supabase';
import { Band, Musician, Instrument, Song, SetList, Event, Tour, MasterSetList, EntityDocument } from '../../shared/models';

export const useDataSync = (
  setBands: React.Dispatch<React.SetStateAction<Band[]>>,
  setMusicians: React.Dispatch<React.SetStateAction<Musician[]>>,
  setInstruments: React.Dispatch<React.SetStateAction<Instrument[]>>,
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>,
  setSetlists: React.Dispatch<React.SetStateAction<SetList[]>>,
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
  setTours: React.Dispatch<React.SetStateAction<Tour[]>>,
  setMasterSetlists: React.Dispatch<React.SetStateAction<MasterSetList[]>>,
  setDocuments: React.Dispatch<React.SetStateAction<EntityDocument[]>>
) => {

  const syncBandData = useCallback(async () => {
    const [ { data: b }, { data: m }, { data: i }, { data: bm }, { data: mi } ] = await Promise.all([
        supabase.from('bands').select('*'),
        supabase.from('musicians').select('*'),
        supabase.from('instruments').select('*'),
        supabase.from('band_musicians').select('*'),
        supabase.from('musician_instruments').select('*')
    ]);
    
    setBands((b || []).map(band => ({ ...band, musicians: (bm || []).filter(x => x.band_id === band.id).map(x => x.musician_id) })));
    setMusicians((m || []).map(musician => ({ ...musician, instruments: (mi || []).filter(x => x.musician_id === musician.id).map(x => x.instrument_id), bands: (bm || []).filter(x => x.band_id === musician.id).map(x => x.band_id) })));
    setInstruments((i || []).map(inst => ({ ...inst, musicians: (mi || []).filter(x => x.instrument_id === inst.id).map(x => x.musician_id) })));
  }, [setBands, setMusicians, setInstruments]);

  const loadAll = useCallback(async () => {
    console.log('[Data] Syncing with Supabase...');
    try {
      const [
        { data: b }, { data: m }, { data: i }, { data: s }, 
        { data: sl }, { data: e }, { data: t }, { data: ms },
        { data: bm }, { data: mi }, { data: sls }, { data: esl }, { data: msls },
        { data: doc }
      ] = await Promise.all([
        supabase.from('bands').select('*'),
        supabase.from('musicians').select('*'),
        supabase.from('instruments').select('*'),
        supabase.from('songs').select('*'),
        supabase.from('setlists').select('*'),
        supabase.from('events').select('*'),
        supabase.from('tours').select('*'),
        supabase.from('master_setlists').select('*'),
        supabase.from('band_musicians').select('*'),
        supabase.from('musician_instruments').select('*'),
        supabase.from('setlist_songs').select('*, linked_to').order('position'),
        supabase.from('event_setlists').select('*').order('position'),
        supabase.from('master_setlist_setlists').select('*').order('position'),
        supabase.from('entity_documents').select('*')
      ]);

      setBands((b || []).map(band => ({ ...band, musicians: (bm || []).filter(x => x.band_id === band.id).map(x => x.musician_id) })));
      setMusicians((m || []).map(musician => ({ ...musician, instruments: (mi || []).filter(x => x.musician_id === musician.id).map(x => x.instrument_id), bands: (bm || []).filter(x => x.band_id === musician.id).map(x => x.band_id) })));
      setInstruments((i || []).map(inst => ({ ...inst, musicians: (mi || []).filter(x => x.instrument_id === inst.id).map(x => x.musician_id) })));
      setSongs((s || []).map(song => ({ ...song, vocalRange: song.vocal_range, key: song.key, vocalists: [] })));
      setSetlists((sl || []).map(setlist => ({ ...setlist, songs: (sls || []).filter(x => x.setlist_id === setlist.id).map(x => ({ id: x.song_id, linked_to: x.linked_to })), eventId: (esl || []).find(x => x.setlist_id === setlist.id)?.event_id, masterSetlistId: (msls || []).find(x => x.setlist_id === setlist.id)?.master_setlist_id })));
      setEvents((e || []).map(event => ({ ...event, tourId: event.tour_id, setLists: (esl || []).filter(x => x.event_id === event.id).map(x => ({ id: x.setlist_id || x.master_setlist_id, type: x.setlist_id ? 'setlist' : 'master', position: x.position })) })));
      setTours((t || []).map(tour => ({ ...tour, events: (e || []).filter(event => event.tour_id === tour.id).map(event => event.id) })));
      setMasterSetlists((ms || []).map(msl => ({ ...msl, setlists: (msls || []).filter(x => x.master_setlist_id === msl.id).map(x => x.setlist_id), eventId: (esl || []).find(x => x.master_setlist_id === msl.id)?.event_id })));
      setDocuments(doc || []);
    } catch (err) {
      console.error('Failed to load data from Supabase', err);
    }
  }, [setBands, setMusicians, setInstruments, setSongs, setSetlists, setEvents, setTours, setMasterSetlists, setDocuments]);

  const syncSetlistData = useCallback(async () => {
    const [ { data: sl }, { data: e }, { data: ms }, { data: sls }, { data: esl }, { data: msls } ] = await Promise.all([
      supabase.from('setlists').select('*'),
      supabase.from('events').select('*'),
      supabase.from('master_setlists').select('*'),
      supabase.from('setlist_songs').select('*, linked_to').order('position'),
      supabase.from('event_setlists').select('*').order('position'),
      supabase.from('master_setlist_setlists').select('*').order('position')
    ]);
    
    setSetlists((sl || []).map(setlist => ({ 
        ...setlist, 
        songs: (sls || []).filter(x => x.setlist_id === setlist.id).map(x => ({ id: x.song_id, linked_to: x.linked_to })), 
        eventId: (esl || []).find(x => x.setlist_id === setlist.id)?.event_id, 
        masterSetlistId: (msls || []).find(x => x.setlist_id === setlist.id)?.master_setlist_id 
    })));

    setEvents((e || []).map(event => ({ 
        ...event, 
        tourId: (event as any).tour_id, 
        setLists: (esl || []).filter(x => x.event_id === event.id).map(x => ({ id: x.setlist_id || x.master_setlist_id, type: x.setlist_id ? 'setlist' : 'master', position: x.position })) 
    })));

    setMasterSetlists((ms || []).map(msl => ({ 
        ...msl, 
        setlists: (msls || []).filter(x => x.master_setlist_id === msl.id).map(x => x.setlist_id), 
        eventId: (esl || []).find(x => x.master_setlist_id === msl.id)?.event_id 
    })));
  }, [setSetlists, setEvents, setMasterSetlists]);

  const fetchEntity = useCallback(async (entityType: string) => {
    try {
        const tableName = entityType === 'masterSetlists' ? 'master_setlists' : entityType;
        
        if (tableName === 'songs') {
            const { data } = await supabase.from('songs').select('*');
            if (data) setSongs(data.map(s => ({ ...s, vocalRange: s.vocal_range, key: s.key, vocalists: [] })));
        } else if (tableName === 'entity_documents') {
            const { data } = await supabase.from('entity_documents').select('*');
            if (data) setDocuments(data || []);
        } else if (tableName === 'tours') {
            await loadAll(); 
        } else if (['bands', 'musicians', 'instruments', 'band_musicians', 'musician_instruments'].includes(tableName)) {
            await syncBandData();
        } else if (['setlists', 'events', 'master_setlists', 'setlist_songs', 'event_setlists', 'master_setlist_setlists'].includes(tableName)) {
            await syncSetlistData();
        }
    } catch (err) {
        console.error(`[fetchEntity] Failed to fetch ${entityType}:`, err);
    }
  }, [syncBandData, syncSetlistData, loadAll, setSongs, setDocuments]);

  return { fetchEntity, loadAll, syncSetlistData, syncBandData };
};
