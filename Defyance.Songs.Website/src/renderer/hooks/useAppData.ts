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

  const getTableName = (tab: NavState['tab']) => tab === 'master-setlists' ? 'master_setlists' : tab;

  const fetchEntity = useCallback(async (entityType: string) => {
      try {
          const tableName = entityType === 'masterSetlists' ? 'master_setlists' : entityType;
          console.log(`[fetchEntity] Querying Supabase for ${tableName}`);
          
          // Basic entities update
          if (['bands', 'musicians', 'instruments', 'songs', 'setlists', 'events', 'tours', 'master_setlists'].includes(tableName)) {
              const { data, error } = await supabase.from(tableName).select('*');
              if (error) throw error;
              if (data) {
                  switch(tableName) {
                      case 'bands': setBands(data as any); break;
                      case 'musicians': setMusicians(data as any); break;
                      case 'instruments': setInstruments(data as any); break;
                      case 'songs': setSongs(data.map(s => ({ ...s, vocalRange: s.vocal_range, key: s.key, vocalists: [] }))); break;
                      case 'tours': setTours(data.map(t => ({ ...t, events: [] }))); break; // Events linked separately
                      default: break;
                  }
              }
          }

          // Refetch everything for complex relational changes (junction tables)
          // To be more efficient, we could target specific entities, but loadAll is safer for now.
          if (tableName.includes('_') || ['setlists', 'events', 'master_setlists'].includes(tableName)) {
              await loadAll();
          }

      } catch (err) {
          console.error(`[fetchEntity] Failed to fetch ${entityType}:`, err);
      }
  }, []);

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
        supabase.from('setlist_songs').select('*, linked_to').order('position'),
        supabase.from('event_setlists').select('*').order('position'),
        supabase.from('master_setlist_setlists').select('*').order('position')
      ]);

      setBands((b || []).map(band => ({ ...band, musicians: (bm || []).filter(x => x.band_id === band.id).map(x => x.musician_id) })));
      setMusicians((m || []).map(musician => ({ ...musician, instruments: (mi || []).filter(x => x.musician_id === musician.id).map(x => x.instrument_id), bands: (bm || []).filter(x => x.band_id === musician.id).map(x => x.band_id) })));
      setInstruments((i || []).map(inst => ({ ...inst, musicians: (mi || []).filter(x => x.instrument_id === inst.id).map(x => x.musician_id) })));
      setSongs((s || []).map(song => ({ ...song, vocalRange: song.vocal_range, key: song.key, vocalists: [] })));
      setSetlists((sl || []).map(setlist => ({ ...setlist, songs: (sls || []).filter(x => x.setlist_id === setlist.id).map(x => ({ id: x.song_id, linked_to: x.linked_to })), eventId: (esl || []).find(x => x.setlist_id === setlist.id)?.event_id, masterSetlistId: (msls || []).find(x => x.setlist_id === setlist.id)?.master_setlist_id })));
      setEvents((e || []).map(event => ({ ...event, tourId: event.tour_id, setLists: (esl || []).filter(x => x.event_id === event.id).map(x => ({ id: x.setlist_id || x.master_setlist_id, type: x.setlist_id ? 'setlist' : 'master', position: x.position })) })));
      setTours((t || []).map(tour => ({ ...tour, events: (e || []).filter(event => event.tour_id === tour.id).map(event => event.id) })));
      setMasterSetlists((ms || []).map(msl => ({ ...msl, setlists: (msls || []).filter(x => x.master_setlist_id === msl.id).map(x => x.setlist_id), eventId: (esl || []).find(x => x.master_setlist_id === msl.id)?.event_id })));
    } catch (err) {
      console.error('Failed to load data from Supabase', err);
    }
  }, []);

  const handleSave = async (tab: NavState['tab'], selectedId: string | null, isEditing: boolean, payload: any) => {
    const table = getTableName(tab);
    const { error } = isEditing && selectedId ? await supabase.from(table).update(payload).eq('id', selectedId) : await supabase.from(table).insert(payload);
    if (error) console.error('Save failed:', error);
  };

  const handleDelete = async (tab: NavState['tab'], id: string) => {
    if (!window.confirm('Are you sure?')) return;
    const { error } = await supabase.from(getTableName(tab)).delete().eq('id', id);
    if (error) console.error('Delete failed:', error);
  };

  const handleAssign = async (tab: NavState['tab'], selectedId: string, assignId: string, item: any) => {
    const [type, id] = assignId.split(':');
    let response;
    if (tab === 'bands') response = await supabase.from('band_musicians').insert({ band_id: selectedId, musician_id: assignId });
    else if (tab === 'musicians') response = await supabase.from('musician_instruments').insert({ musician_id: selectedId, instrument_id: assignId });
    else if (tab === 'songs') response = await supabase.from('setlist_songs').insert({ setlist_id: assignId, song_id: selectedId, position: (setlists.find(s => s.id === assignId)?.songs.length || 0) });
    else if (tab === 'setlists') {
      if (type === 'parent-event') response = await supabase.from('event_setlists').insert({ event_id: id, setlist_id: selectedId, position: (events.find(e => e.id === id)?.setLists.length || 0) });
      else if (type === 'parent-master') response = await supabase.from('master_setlist_setlists').insert({ master_setlist_id: id, setlist_id: selectedId, position: (masterSetlists.find(m => m.id === id)?.setlists.length || 0) });
      else if (type === 'song') response = await supabase.from('setlist_songs').insert({ setlist_id: selectedId, song_id: id, position: (item as SetList).songs.length });
      else response = await supabase.from('setlist_songs').insert({ setlist_id: selectedId, song_id: assignId, position: (item as SetList).songs.length });
    }
    else if (tab === 'master-setlists') {
      if (type === 'parent-event') response = await supabase.from('event_setlists').insert({ event_id: id, master_setlist_id: selectedId, position: (events.find(e => e.id === id)?.setLists.length || 0) });
      else if (type === 'setlist') response = await supabase.from('master_setlist_setlists').insert({ master_setlist_id: selectedId, setlist_id: id, position: (item as MasterSetList).setlists.length });
      else response = await supabase.from('master_setlist_setlists').insert({ master_setlist_id: selectedId, setlist_id: assignId, position: (item as MasterSetList).setlists.length });
    }
    else if (tab === 'events') { 
      if (type === 'parent-tour') response = await supabase.from('events').update({ tour_id: id }).eq('id', selectedId);
      else {
        const payload: any = { event_id: selectedId, position: (item as Event).setLists.length };
        if (type === 'setlist') payload.setlist_id = id; else payload.master_setlist_id = id;
        response = await supabase.from('event_setlists').insert(payload);
      }
    }
    else if (tab === 'tours') response = await supabase.from('events').update({ tour_id: selectedId }).eq('id', assignId);
    
    if (response?.error) console.error('Assign failed:', response.error);
  };

  const handleUnassign = async (tab: NavState['tab'], selectedId: string, targetId: string, targetType?: string) => {
    let response;
    if (tab === 'bands') response = await supabase.from('band_musicians').delete().eq('band_id', selectedId).eq('musician_id', targetId);
    else if (tab === 'musicians') response = await supabase.from('musician_instruments').delete().eq('musician_id', selectedId).eq('instrument_id', targetId);
    else if (tab === 'songs') response = await supabase.from('setlist_songs').delete().eq('setlist_id', targetId).eq('song_id', selectedId);
    else if (tab === 'setlists') {
      if (targetType === 'parent-event') response = await supabase.from('event_setlists').delete().eq('setlist_id', selectedId);
      else if (targetType === 'parent-master') response = await supabase.from('master_setlist_setlists').delete().eq('setlist_id', selectedId);
      else response = await supabase.from('setlist_songs').delete().eq('setlist_id', selectedId).eq('song_id', targetId);
    }
    else if (tab === 'master-setlists') {
      if (targetType === 'parent-event') response = await supabase.from('event_setlists').delete().eq('master_setlist_id', selectedId);
      else response = await supabase.from('master_setlist_setlists').delete().eq('master_setlist_id', selectedId).eq('setlist_id', targetId);
    }
    else if (tab === 'events') {
      if (targetType === 'parent-tour') response = await supabase.from('events').update({ tour_id: null }).eq('id', selectedId);
      else {
        const query = supabase.from('event_setlists').delete().eq('event_id', selectedId);
        if (targetType === 'setlist') query.eq('setlist_id', targetId); else query.eq('master_setlist_id', targetId);
        response = await query;
      }
    }
    else if (tab === 'tours') response = await supabase.from('events').update({ tour_id: null }).eq('id', targetId);

    if (response?.error) console.error('Unassign failed:', response.error);
  };

  const handleMove = async (tab: NavState['tab'], selectedId: string, list: any[], index: number, target: number) => {
    const newList = [...list];
    const getChain = (idx: number, currentList: any[]) => {
      const chain = [idx];
      let curr = idx;
      while(curr < currentList.length - 1 && currentList[curr].linked_to === currentList[curr+1].id) {
          chain.push(curr + 1);
          curr++;
      }
      let up = idx;
      while(up > 0 && currentList[up-1].linked_to === currentList[up].id) {
          chain.unshift(up - 1);
          up--;
      }
      return chain;
    };
    const chainIndices = getChain(index, newList);
    const movingItems = chainIndices.map(i => newList[i]);
    chainIndices.sort((a,b) => b-a).forEach(i => newList.splice(i, 1));
    newList.splice(target > index ? target - chainIndices.length + 1 : target, 0, ...movingItems);
    
    if (tab === 'setlists') await supabase.rpc('reorder_setlist_songs', { p_setlist_id: selectedId, p_song_ids: newList.map(s => s.id), p_positions: newList.map((_, i) => i) });
    else if (tab === 'master-setlists') await supabase.rpc('reorder_master_setlist_setlists', { p_master_setlist_id: selectedId, p_setlist_ids: newList.map(s => s.id), p_positions: newList.map((_, i) => i) });
    else if (tab === 'events') await Promise.all(newList.map((e, i) => {
        const query = supabase.from('event_setlists').update({ position: i }).eq('event_id', selectedId);
        return e.type === 'setlist' ? query.eq('setlist_id', e.id) : query.eq('master_setlist_id', e.id);
      }));
  };

  const toggleLink = async (setlistId: string, songId: string, linkedTo: string | null) => {
    await supabase.from('setlist_songs').update({ linked_to: linkedTo }).eq('setlist_id', setlistId).eq('song_id', songId);
  };

  // Realtime subscription
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('[Realtime] Change received:', payload);
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            loadAll();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  // Initial fetch
  useEffect(() => { 
    // We'll let the component control when to loadAll or just check session here if needed
    // For simplicity, we'll keep it as is, Supabase will just return 401/empty if RLS is on.
    loadAll(); 
  }, [loadAll]);

  return {
    bands, musicians, instruments, songs, setlists, events, tours, masterSetlists,
    loadAll, handleSave, handleDelete, handleAssign, handleUnassign, handleMove, toggleLink
  };
};