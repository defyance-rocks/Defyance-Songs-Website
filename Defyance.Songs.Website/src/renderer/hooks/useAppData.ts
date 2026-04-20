import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Band, Musician, Instrument, Song, SetList, Event, Tour, MasterSetList, NavState 
} from '../../shared/models';

export const useAppData = () => {
  const [bands, setBands] = useState<Band[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<SetList[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [masterSetlists, setMasterSetlists] = useState<MasterSetList[]>([]);

  const loadAll = useCallback(async () => {
    console.log('[Data] Syncing with Supabase...');
    try {
      const [
        { data: b }, { data: m }, { data: i }, { data: s }, 
        { data: sl }, { data: e }, { data: t }, { data: ms },
        { data: bm }, { data: mi }, { data: sls }, { data: esl }, { data: msls }
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
        supabase.from('setlist_songs').select('*').order('position'),
        supabase.from('event_setlists').select('*').order('position'),
        supabase.from('master_setlist_setlists').select('*').order('position')
      ]);

      const bandsData = (b || []).map(band => ({
        ...band,
        musicians: (bm || []).filter(x => x.band_id === band.id).map(x => x.musician_id)
      }));

      const musiciansData = (m || []).map(musician => ({
        ...musician,
        instruments: (mi || []).filter(x => x.musician_id === musician.id).map(x => x.instrument_id),
        bands: (bm || []).filter(x => x.musician_id === musician.id).map(x => x.band_id)
      }));

      const instrumentsData = (i || []).map(inst => ({
        ...inst,
        musicians: (mi || []).filter(x => x.instrument_id === inst.id).map(x => x.musician_id)
      }));

      const songsData = (s || []).map(song => ({
        ...song,
        vocalRange: song.vocal_range,
        vocalists: []
      }));

      const setlistsData = (sl || []).map(setlist => {
        const eventId = (esl || []).find(x => x.setlist_id === setlist.id)?.event_id;
        const masterSetlistId = (msls || []).find(x => x.setlist_id === setlist.id)?.master_setlist_id;
        return {
          ...setlist,
          songs: (sls || []).filter(x => x.setlist_id === setlist.id).map(x => x.song_id),
          eventId,
          masterSetlistId
        };
      });

      const eventsData = (e || []).map(event => ({
        ...event,
        tourId: event.tour_id,
        setLists: (esl || []).filter(x => x.event_id === event.id).map(x => ({
          id: x.setlist_id || x.master_setlist_id,
          type: x.setlist_id ? 'setlist' : 'master',
          position: x.position
        }))
      }));

      const toursData = (t || []).map(tour => ({
        ...tour,
        events: (e || []).filter(event => event.tour_id === tour.id).map(event => event.id)
      }));

      const masterSetlistsData = (ms || []).map(msl => ({
        ...msl,
        setlists: (msls || []).filter(x => x.master_setlist_id === msl.id).map(x => x.setlist_id),
        eventId: (esl || []).find(x => x.master_setlist_id === msl.id)?.event_id
      }));

      setBands(bandsData as any);
      setMusicians(musiciansData as any);
      setInstruments(instrumentsData as any);
      setSongs(songsData as any);
      setSetlists(setlistsData as any);
      setEvents(eventsData as any);
      setTours(toursData as any);
      setMasterSetlists(masterSetlistsData as any);
    } catch (err) {
      console.error('Failed to load data from Supabase', err);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSave = async (tab: NavState['tab'], selectedId: string | null, isEditing: boolean, payload: any) => {
    const table = tab === 'master-setlists' ? 'master_setlists' : tab;
    if (isEditing && selectedId) {
      await supabase.from(table).update(payload).eq('id', selectedId);
    } else {
      await supabase.from(table).insert(payload);
    }
    loadAll();
  };

  const handleDelete = async (tab: NavState['tab'], id: string) => {
    if (!window.confirm('Are you sure?')) return;
    const table = tab === 'master-setlists' ? 'master_setlists' : tab;
    await supabase.from(table).delete().eq('id', id);
    loadAll();
  };

  const handleAssign = async (tab: NavState['tab'], selectedId: string, assignId: string, item: any) => {
    const [type, id] = assignId.split(':');
    if (tab === 'bands') await supabase.from('band_musicians').insert({ band_id: selectedId, musician_id: assignId });
    else if (tab === 'musicians') await supabase.from('musician_instruments').insert({ musician_id: selectedId, instrument_id: assignId });
    else if (tab === 'songs') await supabase.from('setlist_songs').insert({ setlist_id: assignId, song_id: selectedId, position: (setlists.find(s => s.id === assignId)?.songs.length || 0) });
    else if (tab === 'setlists') {
      if (type === 'parent-event') await supabase.from('event_setlists').insert({ event_id: id, setlist_id: selectedId, position: (events.find(e => e.id === id)?.setLists.length || 0) });
      else if (type === 'parent-master') await supabase.from('master_setlist_setlists').insert({ master_setlist_id: id, setlist_id: selectedId, position: (masterSetlists.find(m => m.id === id)?.setlists.length || 0) });
      else if (type === 'song') await supabase.from('setlist_songs').insert({ setlist_id: selectedId, song_id: id, position: (item as SetList).songs.length });
      else await supabase.from('setlist_songs').insert({ setlist_id: selectedId, song_id: assignId, position: (item as SetList).songs.length });
    }
    else if (tab === 'master-setlists') {
      if (type === 'parent-event') await supabase.from('event_setlists').insert({ event_id: id, master_setlist_id: selectedId, position: (events.find(e => e.id === id)?.setLists.length || 0) });
      else if (type === 'setlist') await supabase.from('master_setlist_setlists').insert({ master_setlist_id: selectedId, setlist_id: id, position: (item as MasterSetList).setlists.length });
      else await supabase.from('master_setlist_setlists').insert({ master_setlist_id: selectedId, setlist_id: assignId, position: (item as MasterSetList).setlists.length });
    }
    else if (tab === 'events') { 
      if (type === 'parent-tour') await supabase.from('events').update({ tour_id: id }).eq('id', selectedId);
      else {
        const payload: any = { event_id: selectedId, position: (item as Event).setLists.length };
        if (type === 'setlist') payload.setlist_id = id; else payload.master_setlist_id = id;
        await supabase.from('event_setlists').insert(payload);
      }
    }
    else if (tab === 'tours') await supabase.from('events').update({ tour_id: selectedId }).eq('id', assignId);
    loadAll();
  };

  const handleUnassign = async (tab: NavState['tab'], selectedId: string, targetId: string, targetType?: string) => {
    if (tab === 'bands') await supabase.from('band_musicians').delete().eq('band_id', selectedId).eq('musician_id', targetId);
    else if (tab === 'musicians') await supabase.from('musician_instruments').delete().eq('musician_id', selectedId).eq('instrument_id', targetId);
    else if (tab === 'songs') await supabase.from('setlist_songs').delete().eq('setlist_id', targetId).eq('song_id', selectedId);
    else if (tab === 'setlists') {
      if (targetType === 'parent-event') await supabase.from('event_setlists').delete().eq('setlist_id', selectedId);
      else if (targetType === 'parent-master') await supabase.from('master_setlist_setlists').delete().eq('setlist_id', selectedId);
      else await supabase.from('setlist_songs').delete().eq('setlist_id', selectedId).eq('song_id', targetId);
    }
    else if (tab === 'master-setlists') {
      if (targetType === 'parent-event') await supabase.from('event_setlists').delete().eq('master_setlist_id', selectedId);
      else await supabase.from('master_setlist_setlists').delete().eq('master_setlist_id', selectedId).eq('setlist_id', targetId);
    }
    else if (tab === 'events') {
      if (targetType === 'parent-tour') await supabase.from('events').update({ tour_id: null }).eq('id', selectedId);
      else {
        const query = supabase.from('event_setlists').delete().eq('event_id', selectedId);
        if (targetType === 'setlist') query.eq('setlist_id', targetId); else query.eq('master_setlist_id', targetId);
        await query;
      }
    }
    else if (tab === 'tours') await supabase.from('events').update({ tour_id: null }).eq('id', targetId);
    loadAll();
  };

  const handleMove = async (tab: NavState['tab'], selectedId: string, list: any[], index: number, target: number) => {
    const newList = [...list];
    const [moved] = newList.splice(index, 1);
    newList.splice(target, 0, moved);
    
    if (tab === 'setlists') {
      await Promise.all(newList.map((id, i) => supabase.from('setlist_songs').update({ position: i }).eq('setlist_id', selectedId).eq('song_id', id)));
    } else if (tab === 'master-setlists') {
      await Promise.all(newList.map((id, i) => supabase.from('master_setlist_setlists').update({ position: i }).eq('master_setlist_id', selectedId).eq('setlist_id', id)));
    } else if (tab === 'events') {
      await Promise.all(newList.map((e, i) => {
        const query = supabase.from('event_setlists').update({ position: i }).eq('event_id', selectedId);
        if (e.type === 'setlist') query.eq('setlist_id', e.id); else query.eq('master_setlist_id', e.id);
        return query;
      }));
    }
    loadAll();
  };

  return {
    bands, musicians, instruments, songs, setlists, events, tours, masterSetlists,
    loadAll, handleSave, handleDelete, handleAssign, handleUnassign, handleMove
  };
};
