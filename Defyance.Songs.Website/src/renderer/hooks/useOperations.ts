import { supabase } from '../supabase';
import { 
  NavState, AppEntity, SetList, MasterSetList, Event, Band, Musician, Instrument, Song 
} from '../../shared/models';

export const useOperations = (
  setBands: React.Dispatch<React.SetStateAction<Band[]>>,
  setMusicians: React.Dispatch<React.SetStateAction<Musician[]>>,
  setInstruments: React.Dispatch<React.SetStateAction<Instrument[]>>,
  setSetlists: React.Dispatch<React.SetStateAction<SetList[]>>,
  setMasterSetlists: React.Dispatch<React.SetStateAction<MasterSetList[]>>,
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
  loadAll: () => Promise<void>
) => {

  const handleSave = async (tab: NavState['tab'], selectedId: string | null, isEditing: boolean, payload: Partial<AppEntity>) => {
    const table = tab === 'master-setlists' ? 'master_setlists' : tab;
    const { error } = isEditing && selectedId ? await supabase.from(table).update(payload).eq('id', selectedId) : await supabase.from(table).insert(payload);
    if (error) console.error('Save failed:', error);
  };

  const handleDelete = async (tab: NavState['tab'], id: string) => {
    if (!window.confirm('Are you sure?')) return;
    const table = tab === 'master-setlists' ? 'master_setlists' : tab;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error('Delete failed:', error);
  };

  const handleAssign = async (tab: NavState['tab'], selectedId: string, assignId: string, item: AppEntity | null) => {
    const [type, id] = assignId.split(':');
    let response;
    if (tab === 'bands') response = await supabase.from('band_musicians').insert({ band_id: selectedId, musician_id: assignId });
    else if (tab === 'musicians') response = await supabase.from('musician_instruments').insert({ musician_id: selectedId, instrument_id: assignId });
    else if (tab === 'songs') response = await supabase.from('setlist_songs').insert({ setlist_id: assignId, song_id: selectedId });
    else if (tab === 'setlists') {
      if (type === 'parent-event') response = await supabase.from('event_setlists').insert({ event_id: id, setlist_id: selectedId });
      else if (type === 'parent-master') response = await supabase.from('master_setlist_setlists').insert({ master_setlist_id: id, setlist_id: selectedId });
      else if (type === 'song') response = await supabase.from('setlist_songs').insert({ setlist_id: selectedId, song_id: id, position: (item as SetList).songs.length });
    }
    else if (tab === 'master-setlists') {
      if (type === 'parent-event') response = await supabase.from('event_setlists').insert({ event_id: id, master_setlist_id: selectedId });
      else if (type === 'setlist') response = await supabase.from('master_setlist_setlists').insert({ master_setlist_id: selectedId, setlist_id: id, position: (item as MasterSetList).setlists.length });
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

  const handleMove = async (tab: NavState['tab'], selectedId: string, list: (AppEntity & { type?: string })[], index: number, target: number) => {
    const newList = [...list];
    const getChainRange = (idx: number, currentList: any[]) => {
      let start = idx;
      while(start > 0 && currentList[start-1].linked_to === currentList[start].id) start--;
      let end = idx;
      while(end < currentList.length - 1 && currentList[end].linked_to === currentList[end+1].id) end++;
      return { start, end };
    };

    const range = getChainRange(index, newList);
    const itemsToMove = newList.splice(range.start, range.end - range.start + 1);
    
    let insertAt = target;
    if (range.start < target) {
        insertAt = target - itemsToMove.length;
    }

    const targetInShrunkenList = Math.max(0, Math.min(insertAt, newList.length - 1));
    const targetChain = getChainRange(targetInShrunkenList, newList);
    if (insertAt > targetChain.start && insertAt <= targetChain.end) {
        if (range.start < target) insertAt = targetChain.end + 1;
        else insertAt = targetChain.start;
    }

    newList.splice(insertAt, 0, ...itemsToMove);
    const finalNewList = newList;

    if (tab === 'setlists') setSetlists(prev => prev.map(sl => sl.id === selectedId ? {...sl, songs: finalNewList as any} : sl));
    else if (tab === 'master-setlists') setMasterSetlists(prev => prev.map(ms => ms.id === selectedId ? {...ms, setlists: finalNewList.map(s => s.id)} : ms));
    else if (tab === 'events') setEvents(prev => prev.map(e => e.id === selectedId ? {...e, setLists: finalNewList as any} : e));

    try {
        if (tab === 'setlists') await supabase.rpc('reorder_setlist_songs', { p_setlist_id: selectedId, p_song_ids: finalNewList.map(s => s.id), p_positions: finalNewList.map((_, i) => i) });
        else if (tab === 'master-setlists') await supabase.rpc('reorder_master_setlist_setlists', { p_master_setlist_id: selectedId, p_setlist_ids: finalNewList.map(s => s.id), p_positions: finalNewList.map((_, i) => i) });
        else if (tab === 'events') await Promise.all(finalNewList.map((e, i) => {
            const query = supabase.from('event_setlists').update({ position: i }).eq('event_id', selectedId);
            return e.type === 'setlist' ? query.eq('setlist_id', e.id) : query.eq('master_setlist_id', e.id);
        }));
    } catch (err) {
        console.error('Optimistic reorder failed, rolling back:', err);
        loadAll();
    }
  };

  const toggleLink = async (setlistId: string, songId: string, linkedTo: string | null) => {
    await supabase.from('setlist_songs').update({ linked_to: linkedTo }).eq('setlist_id', setlistId).eq('song_id', songId);
  };

  const handleUploadDocument = async (entityType: string, entityId: string, file: File) => {
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${entityType}/${entityId}/${filename}`;

    // Force charset=utf-8 for text files to prevent the Â issue in browsers
    const contentType = file.type === 'text/plain' ? 'text/plain; charset=utf-8' : file.type;

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
            contentType: contentType,
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error('Document upload failed:', uploadError);
        return;
    }

    const { error: dbError } = await supabase.from('entity_documents').insert({
        entity_type: entityType,
        entity_id: entityId,
        name: file.name,
        file_path: filePath
    });

    if (dbError) {
        console.error('Document DB entry failed:', dbError);
    } else {
        await loadAll();
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!window.confirm('Delete this document?')) return;

    const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

    if (storageError) console.error('Document storage delete failed:', storageError);

    const { error: dbError } = await supabase.from('entity_documents').delete().eq('id', docId);
    if (dbError) {
        console.error('Document DB delete failed:', dbError);
    } else {
        await loadAll();
    }
  };

  return { handleSave, handleDelete, handleAssign, handleUnassign, handleMove, toggleLink, handleUploadDocument, handleDeleteDocument };
};
