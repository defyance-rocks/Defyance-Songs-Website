import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Band, Musician, Instrument, Song, SetList, Event, Tour, MasterSetList, EntityDocument } from '../../shared/models';
import { useDataSync } from './useDataSync';
import { useOperations } from './useOperations';

export const useAppData = () => {
  const [bands, setBands] = useState<Band[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<SetList[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [masterSetlists, setMasterSetlists] = useState<MasterSetList[]>([]);
  const [documents, setDocuments] = useState<EntityDocument[]>([]);

  const { fetchEntity, loadAll, syncSetlistData, syncBandData } = useDataSync(
    setBands, setMusicians, setInstruments, setSongs, setSetlists, setEvents, setTours, setMasterSetlists, setDocuments
  );

  const { 
    handleSave, handleDelete, handleAssign, handleUnassign, handleMove, toggleLink, 
    handleUploadDocument, handleDeleteDocument 
  } = useOperations(
    setBands, setMusicians, setInstruments, setSetlists, setMasterSetlists, setEvents, loadAll
  );

  // Realtime subscription
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    const handleUpdate = (payload: any) => {
        const { table } = payload;
        console.log(`[Realtime] Granular change for ${table}:`, payload);
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (['setlist_songs', 'event_setlists', 'master_setlist_setlists'].includes(table)) {
                syncSetlistData();
            } else if (['band_musicians', 'musician_instruments'].includes(table)) {
                syncBandData();
            } else if (table === 'entity_documents') {
                fetchEntity('entity_documents');
            } else {
                fetchEntity(table);
            }
        }, 300);
    };

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, handleUpdate)
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchEntity, syncSetlistData, syncBandData]);

  // Initial fetch
  useEffect(() => { 
    loadAll(); 
  }, [loadAll]);

  return {
    bands, musicians, instruments, songs, setlists, events, tours, masterSetlists, documents,
    loadAll, handleSave, handleDelete, handleAssign, handleUnassign, handleMove, toggleLink, handleUploadDocument, handleDeleteDocument
  };
};
