import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from './supabase';

interface Band { id: string; name: string; musicians: string[]; }
interface Musician { id: string; name: string; phone?: string; email?: string; bio?: string; instruments: string[]; bands: string[]; }
interface Instrument { id: string; name: string; musicians: string[]; }
interface Song { id: string; name: string; artist: string; vocalists: string[]; vocalRange?: 'High' | 'Low' | null; notes?: string; link?: string; }
interface SetList { id: string; name: string; songs: string[]; eventName?: string; }
interface EventSetListEntry { id: string; type: 'setlist' | 'master'; position: number; }
interface Event { id: string; name: string; location: string; date: string; time: string; tourId?: string | null; setLists: EventSetListEntry[]; }
interface Tour { id: string; name: string; events: string[]; }
interface MasterSetList { id: string; name: string; setlists: string[]; }

interface NavState {
  tab: 'bands' | 'musicians' | 'songs' | 'instruments' | 'setlists' | 'events' | 'tours' | 'master-setlists' | 'printouts';
  selectedId: string | null;
  isEditing: boolean;
}

const theme = {
  background: '#0f1217', sidebar: '#161b22', surface: '#1c2128', surfaceAlt: '#2d333b',
  text: '#adbac7', textHighlight: '#cdd9e5', muted: '#768390', border: '#444c56',
  accent: '#316dca', accentHover: '#388bfd', danger: '#da3633', success: '#3fb950',
};

const App: React.FC = () => {
  const [tab, setTab] = useState<NavState['tab']>('bands');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [navStack, setNavStack] = useState<NavState[]>([]);

  const [isPrinting, setIsPrinting] = useState(false);
  const [activePrintId, setActivePrintId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [songsSearch, setSongsSearch] = useState('');

  const [bands, setBands] = useState<Band[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<SetList[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [masterSetlists, setMasterSetlists] = useState<MasterSetList[]>([]);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editVocalRange, setEditVocalRange] = useState<'High' | 'Low' | ''>('');
  const [editNotes, setEditNotes] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [assignId, setAssignId] = useState('');

  const firstInputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

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

      // Process relationships to match original UI expectations
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
        vocalists: [] // Placeholder if needed
      }));

      const setlistsData = (sl || []).map(setlist => ({
        ...setlist,
        songs: (sls || []).filter(x => x.setlist_id === setlist.id).map(x => x.song_id)
      }));

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
        setlists: (msls || []).filter(x => x.master_setlist_id === msl.id).map(x => x.setlist_id)
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

  const handleBack = useCallback(() => {
    console.log('[NAV] Going back...');
    if (isPrinting) { setIsPrinting(false); return; }
    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1];
      setNavStack(navStack.slice(0, -1));
      setTab(prev.tab);
      setSelectedId(prev.selectedId);
      setIsEditing(prev.isEditing);
      setAssignSearch('');
      if (prev.selectedId) {
        const item = [...bands, ...musicians, ...songs, ...instruments, ...setlists, ...events, ...tours, ...masterSetlists].find(x => x.id === prev.selectedId) as any;
        if (item) {
          setEditName(item.name); setEditPhone(item.phone || ''); setEditEmail(item.email || ''); setEditBio(item.bio || '');
          setEditArtist(item.artist || ''); setEditVocalRange(item.vocalRange || ''); setEditNotes(item.notes || '');
          setEditLink(item.link || ''); setEditLocation(item.location || ''); setEditDate(item.date || ''); setEditTime(item.time || '');
        }
      }
    } else {
      setSelectedId(null);
      setIsEditing(false);
    }
  }, [navStack, isPrinting, bands, musicians, songs, instruments, setlists, events, tours, masterSetlists]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBack(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleBack]);

  useEffect(() => { if (isEditing && firstInputRef.current) firstInputRef.current.focus(); }, [isEditing]);

  const getItemById = () => {
    if (!selectedId) return null;
    const all = [...bands, ...musicians, ...songs, ...instruments, ...setlists, ...events, ...tours, ...masterSetlists];
    return all.find(x => x.id === selectedId) || null;
  };

  const getDataForTab = () => {
    if (tab === 'bands') return bands; if (tab === 'musicians') return musicians; if (tab === 'songs') return songs;
    if (tab === 'instruments') return instruments; if (tab === 'setlists') return setlists;
    if (tab === 'master-setlists') return masterSetlists; if (tab === 'events') return events;
    if (tab === 'tours') return tours; return [];
  };

  const formatUrl = (u: string) => (!u || u.startsWith('http') ? u : `https://${u}`);
  const formatDate = (d: string) => { if (!d) return ''; const [y, m, day] = d.split('-'); return `${m}/${day}/${y.slice(-2)}`; };
  const isPast = (d: string) => { if (!d) return false; const t = new Date(); t.setHours(0,0,0,0); return new Date(d + 'T00:00:00') < t; };
  const getSetlistLabel = (sl: SetList) => sl.eventName ? `${sl.eventName} - ${sl.name}` : sl.name;

  const navigateTo = (newTab: NavState['tab'], id: string | null = null, edit: boolean = false) => {
    console.log(`[NAV] Navigating to ${newTab}, ID: ${id}, Edit: ${edit}`);
    setNavStack(prev => [...prev, { tab, selectedId, isEditing }]);
    setTab(newTab); setSelectedId(id); setIsEditing(edit); setAssignSearch(''); if (!edit) setSongsSearch('');
    if (id) {
      const all = [...bands, ...musicians, ...songs, ...instruments, ...setlists, ...events, ...tours, ...masterSetlists];
      const item = all.find(x => x.id === id) as any;
      if (item) {
        setEditName(item.name); setEditPhone(item.phone || ''); setEditEmail(item.email || ''); setEditBio(item.bio || '');
        setEditArtist(item.artist || ''); setEditVocalRange(item.vocalRange || ''); setEditNotes(item.notes || '');
        setEditLink(item.link || ''); setEditLocation(item.location || ''); setEditDate(item.date || ''); setEditTime(item.time || '');
      }
    } else {
      setEditName(''); setEditPhone(''); setEditEmail(''); setEditBio(''); setEditArtist(''); setEditVocalRange(''); setEditNotes(''); setEditLink(''); setEditLocation(''); setEditDate(''); setEditTime('');
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    const link = formatUrl(editLink.trim());
    const table = tab === 'master-setlists' ? 'master_setlists' : tab;
    
    const payload: any = { name: editName };
    if (tab === 'musicians') { payload.phone = editPhone; payload.email = editEmail; payload.bio = editBio; }
    if (tab === 'songs') { payload.artist = editArtist; payload.vocal_range = editVocalRange || null; payload.notes = editNotes; payload.link = link; }
    if (tab === 'events') { payload.location = editLocation; payload.date = editDate || null; payload.time = editTime || null; }

    if (isEditing && selectedId) {
      await supabase.from(table).update(payload).eq('id', selectedId);
    } else {
      await supabase.from(table).insert(payload);
    }
    
    setNavStack([]); setIsEditing(false); setSelectedId(null); loadAll();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    const table = tab === 'master-setlists' ? 'master_setlists' : tab;
    await supabase.from(table).delete().eq('id', id);
    if (selectedId === id) setSelectedId(null);
    loadAll();
  };

  const getAvailableForAssignment = () => {
    const item = getItemById(); if (!item) return [];
    if (tab === 'bands') return musicians.filter(m => !(item as Band).musicians.includes(m.id));
    if (tab === 'musicians') return instruments.filter(i => !(item as Musician).instruments.includes(i.id));
    if (tab === 'songs') {
      const assigned = setlists.filter(sl => sl.songs.includes((item as Song).id)).map(sl => sl.id);
      return setlists.filter(sl => !assigned.includes(sl.id));
    }
    if (tab === 'setlists') return songs.filter(s => !(item as SetList).songs.includes(s.id));
    if (tab === 'master-setlists') return setlists.filter(sl => !(item as MasterSetList).setlists.includes(sl.id));
    if (tab === 'events') {
      const assignedIds = (item as Event).setLists.map(sl => sl.id);
      const availSL = setlists.filter(sl => !assignedIds.includes(sl.id)).map(sl => ({ ...sl, type: 'setlist' }));
      const availMSL = masterSetlists.filter(msl => !assignedIds.includes(msl.id)).map(msl => ({ ...msl, type: 'master' }));
      return [...availSL, ...availMSL] as any[];
    }
    if (tab === 'tours') return events.filter(e => !(item as Tour).events.includes(e.id));
    return [];
  };

  const getCurrentRelationships = (item: any) => {
    if (tab === 'bands') return item.musicians.map((id: string) => musicians.find(m => m.id === id)).filter(Boolean);
    if (tab === 'musicians') return item.instruments.map((id: string) => instruments.find(i => i.id === id)).filter(Boolean);
    if (tab === 'songs') return setlists.filter(sl => sl.songs.includes((item as Song).id));
    if (tab === 'setlists') return item.songs.map((id: string) => songs.find(s => s.id === id)).filter(Boolean);
    if (tab === 'master-setlists') return item.setlists.map((id: string) => setlists.find(s => s.id === id)).filter(Boolean);
    if (tab === 'events') return (item as Event).setLists.map(e => {
      const x = e.type === 'setlist' ? setlists.find(s => s.id === e.id) : masterSetlists.find(m => m.id === e.id);
      return x ? { ...x, type: e.type } : null;
    }).filter(Boolean);
    if (tab === 'tours') return item.events.map((id: string) => events.find(e => e.id === id)).filter(Boolean);
    return [];
  };

  const handleAssign = async () => {
    if (!selectedId || !assignId) return;
    if (tab === 'bands') await supabase.from('band_musicians').insert({ band_id: selectedId, musician_id: assignId });
    else if (tab === 'musicians') await supabase.from('musician_instruments').insert({ musician_id: selectedId, instrument_id: assignId });
    else if (tab === 'songs') await supabase.from('setlist_songs').insert({ setlist_id: assignId, song_id: selectedId, position: (setlists.find(s => s.id === assignId)?.songs.length || 0) });
    else if (tab === 'setlists') await supabase.from('setlist_songs').insert({ setlist_id: selectedId, song_id: assignId, position: (getItemById() as SetList).songs.length });
    else if (tab === 'master-setlists') await supabase.from('master_setlist_setlists').insert({ master_setlist_id: selectedId, setlist_id: assignId, position: (getItemById() as MasterSetList).setlists.length });
    else if (tab === 'events') { 
      const [type, id] = assignId.split(':'); 
      const payload: any = { event_id: selectedId, position: (getItemById() as Event).setLists.length };
      if (type === 'setlist') payload.setlist_id = id; else payload.master_setlist_id = id;
      await supabase.from('event_setlists').insert(payload);
    }
    else if (tab === 'tours') await supabase.from('events').update({ tour_id: selectedId }).eq('id', assignId);
    setAssignId(''); setAssignSearch(''); loadAll();
  };

  const handleUnassign = async (targetId: string, targetType?: string) => {
    if (!selectedId) return;
    if (tab === 'bands') await supabase.from('band_musicians').delete().eq('band_id', selectedId).eq('musician_id', targetId);
    else if (tab === 'musicians') await supabase.from('musician_instruments').delete().eq('musician_id', selectedId).eq('instrument_id', targetId);
    else if (tab === 'songs') await supabase.from('setlist_songs').delete().eq('setlist_id', targetId).eq('song_id', selectedId);
    else if (tab === 'setlists') await supabase.from('setlist_songs').delete().eq('setlist_id', selectedId).eq('song_id', targetId);
    else if (tab === 'master-setlists') await supabase.from('master_setlist_setlists').delete().eq('master_setlist_id', selectedId).eq('setlist_id', targetId);
    else if (tab === 'events') {
      const query = supabase.from('event_setlists').delete().eq('event_id', selectedId);
      if (targetType === 'setlist') query.eq('setlist_id', targetId); else query.eq('master_setlist_id', targetId);
      await query;
    }
    else if (tab === 'tours') await supabase.from('events').update({ tour_id: null }).eq('id', targetId);
    loadAll();
  };

  const handleMove = async (index: number, direction: 'up' | 'down', targetIndex?: number) => {
    const item = getItemById() as any; if (!item) return;
    const list = [...(item.songs || item.setlists || item.setLists || item.events)];
    const target = targetIndex !== undefined ? targetIndex : (direction === 'up' ? index - 1 : index + 1);
    if (target < 0 || target >= list.length || target === index) return;
    const [moved] = list.splice(index, 1); list.splice(target, 0, moved);
    
    // Reorder logic for Supabase
    if (tab === 'setlists') {
      await Promise.all(list.map((id, i) => supabase.from('setlist_songs').update({ position: i }).eq('setlist_id', selectedId).eq('song_id', id)));
    } else if (tab === 'master-setlists') {
      await Promise.all(list.map((id, i) => supabase.from('master_setlist_setlists').update({ position: i }).eq('master_setlist_id', selectedId).eq('setlist_id', id)));
    } else if (tab === 'events') {
      await Promise.all(list.map((e, i) => {
        const query = supabase.from('event_setlists').update({ position: i }).eq('event_id', selectedId);
        if (e.type === 'setlist') query.eq('setlist_id', e.id); else query.eq('master_setlist_id', e.id);
        return query;
      }));
    } else if (tab === 'tours') {
      // Tours don't have a position field in events table currently, might need to add it if ordering matters
    }
    loadAll();
  };


  const getRelationshipTitle = () => {
    if (tab === 'bands') return 'Band Members'; if (tab === 'musicians') return 'Instruments'; if (tab === 'songs') return 'Associated SetLists';
    if (tab === 'setlists') return 'Songs'; if (tab === 'master-setlists') return 'SetLists'; if (tab === 'events') return 'SetLists';
    if (tab === 'tours') return 'Events'; return 'Relationships';
  };

  const getRelationshipTab = () => {
    if (tab === 'bands' || tab === 'songs') return 'musicians'; if (tab === 'musicians') return 'instruments';
    if (tab === 'setlists' || tab === 'master-setlists') return 'songs';
    if (tab === 'events') return 'setlists'; if (tab === 'tours') return 'events';
    return '';
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', height: '100vh', background: theme.background, color: theme.text, fontFamily: 'Segoe UI, sans-serif' },
    sidebar: { width: 240, background: theme.sidebar, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', padding: '16px 0' },
    sidebarItem: { padding: '12px 24px', cursor: 'pointer', transition: 'background 0.2s', fontSize: 14, fontWeight: 500 },
    main: { flex: 1, overflowY: 'auto', padding: '32px' },
    card: { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 24, marginBottom: 24 },
    heading: { margin: '0 0 16px 0', color: theme.textHighlight },
    subHeading: { margin: '24px 0 12px 0', fontSize: 16, fontWeight: 600, color: theme.textHighlight },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { padding: '12px 16px', background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: 6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    button: { padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
    input: { padding: '10px 12px', background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, width: '100%', marginBottom: 12 },
    label: { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' },
    link: { color: theme.accent, cursor: 'pointer' },
    badge: { padding: '2px 8px', borderRadius: 12, fontSize: 11, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, marginLeft: 8 },
    backBtn: { background: 'transparent', color: theme.muted, border: `1px solid ${theme.border}`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 12px', borderRadius: 6 },
  };

  const renderSongListPrint = (songsToPrint: Song[], h1: string, h2?: string) => {
    const hasHighRange = songsToPrint.some(s => s.vocalRange === 'High');
    const count = songsToPrint.length;
    
    // Dynamic font size calculation to ensure single-page fit
    let fontSize = '36pt';
    if (count > 15) fontSize = '28pt';
    if (count > 22) fontSize = '22pt';
    if (count > 30) fontSize = '18pt';

    return (
      <div key={h1+h2} style={{ 
        pageBreakAfter: 'always', 
        padding: '20px 40px', 
        background: '#fff', 
        color: '#000', 
        height: '98vh', 
        display: 'flex', 
        flexDirection: 'column', 
        fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
        boxSizing: 'border-box' 
      }}>
        <div style={{ borderBottom: '5px solid #000', marginBottom: 15, paddingBottom: 10 }}>
          <h1 style={{ margin: 0, fontSize: '42pt', lineHeight: 1, fontWeight: '900', textTransform: 'uppercase' }}>{h1}</h1>
          {h2 && <h2 style={{ margin: '5px 0 0 0', fontSize: '24pt', fontWeight: '700', textTransform: 'uppercase', opacity: 0.8 }}>{h2}</h2>}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {songsToPrint.map((s, i) => (
              <li key={s.id+i} style={{ 
                fontSize: fontSize, 
                lineHeight: '1.1', 
                marginBottom: 8, 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                textTransform: 'uppercase', 
                fontWeight: '900' 
              }}>
                <span style={{ marginRight: 20, opacity: 0.3, display: 'inline-block', width: '1.5em' }}>{i+1}</span>
                {s.name}{s.vocalRange === 'High' ? '*' : ''}
              </li>
            ))}
          </ul>
        </div>
        {hasHighRange && (
          <div style={{ borderTop: '5px solid #000', paddingTop: 10, fontSize: '28pt', fontWeight: '900', letterSpacing: '2px' }}>
            *DETUNE
          </div>
        )}
        <div className="no-print" style={{ position: 'fixed', top: 20, right: 40 }}>
          <button style={{ ...styles.button, background: '#000', color: '#fff', marginRight: 10 }} onClick={() => window.print()}>PRINT</button>
          <button style={{ ...styles.button, background: '#eee', color: '#000', border: '1px solid #000' }} onClick={() => { setIsPrinting(false); setActivePrintId(null); }}>CLOSE</button>
        </div>
      </div>
    );
  };

  const renderPrintView = () => {
    const item = getItemById(); if (!item) return null;
    if (tab === 'setlists' || tab === 'printouts') {
      const sl = item as SetList;
      return renderSongListPrint(sl.songs.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[], sl.eventName || '', sl.name);
    }
    if (tab === 'master-setlists') {
      const msl = item as MasterSetList;
      const all: Song[] = []; msl.setlists.forEach(id => { const sl = setlists.find(s => s.id === id); if (sl) sl.songs.forEach(sid => { const s = songs.find(x => x.id === sid); if (s) all.push(s); }); });
      return renderSongListPrint(all, (item as MasterSetList).name);
    }
    if (tab === 'events') {
      const ev = item as Event;
      const targetSetLists = activePrintId ? ev.setLists.filter(e => e.id === activePrintId) : ev.setLists;
      return <div style={{ background: '#fff' }}>{targetSetLists.map((e, i) => {
        const sl = e.type === 'setlist' ? setlists.find(s => s.id === e.id) : masterSetlists.find(m => m.id === e.id);
        if (!sl) return null;
        let sToP: Song[] = [];
        if (e.type === 'setlist') sToP = (sl as SetList).songs.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
        else (sl as MasterSetList).setlists.forEach(id => { const sll = setlists.find(s => s.id === id); if (sll) sll.songs.forEach(sid => { const s = songs.find(x => x.id === sid); if (s) sToP.push(s); }); });
        return renderSongListPrint(sToP, ev.name, sl.name);
      })}</div>;
    }
    return null;
  };


  const renderSidebar = () => (
    <div style={styles.sidebar}>
      <h2 style={{ padding: '0 24px', fontSize: 18, marginBottom: 24, color: theme.accent }}>Defyance</h2>
      {(['bands', 'musicians', 'songs', 'setlists', 'master-setlists', 'events', 'tours', 'instruments', 'printouts'] as const).map(t => (
        <div key={t} style={{ ...styles.sidebarItem, background: tab === t ? theme.surfaceAlt : 'transparent', color: tab === t ? theme.accent : theme.text, borderLeft: tab === t ? `4px solid ${theme.accent}` : '4px solid transparent' }} onClick={() => { 
          console.log(`[NAV] Tab click: ${t}. Clearing stack.`);
          setNavStack([]); setTab(t); setSelectedId(null); setIsEditing(false); setIsPrinting(false); setActivePrintId(null);
        }}>
          {t === 'master-setlists' ? 'Master SetLists' : (t === 'printouts' ? 'Print Center' : t.charAt(0).toUpperCase() + t.slice(1))}
        </div>
      ))}
    </div>
  );

  const renderList = (data: any[]) => {
    let filtered = [...data];
    if (tab === 'songs' && songsSearch) filtered = data.filter((s: Song) => s.name.toLowerCase().includes(songsSearch.toLowerCase()) || s.artist.toLowerCase().includes(songsSearch.toLowerCase()));
    
    // Custom sort for events: No date first, then chronological
    if (tab === 'events') {
      filtered.sort((a: Event, b: Event) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return -1;
        if (!b.date) return 1;
        return a.date.localeCompare(b.date);
      });
    }

    return (
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={styles.heading}>{tab.toUpperCase()}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {tab === 'songs' && <input style={{ ...styles.input, marginBottom: 0, width: 250 }} placeholder="Search..." value={songsSearch} onChange={e => setSongsSearch(e.target.value)} />}
            <button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => navigateTo(tab, null, true)}>+ NEW</button>
          </div>
        </div>
        <ul style={styles.list}>{filtered.map(item => {
          const isEvent = tab === 'events'; const past = isEvent && isPast((item as Event).date);
          const dateLabel = isEvent && (item as Event).date ? ` (${formatDate((item as Event).date)})` : '';
          const label = isEvent ? `${item.name}${dateLabel}` : (tab === 'setlists' ? getSetlistLabel(item as SetList) : item.name);
          return (
            <li key={item.id} style={{ ...styles.listItem, opacity: past ? 0.4 : 1 }}>
              <span style={{ fontWeight: 500, cursor: 'pointer', color: past ? theme.muted : theme.textHighlight, textDecoration: past ? 'line-through' : 'none' }} onClick={() => navigateTo(tab, item.id, false)}>
                {label}{tab === 'songs' && item.vocalRange === 'High' ? '*' : ''}
              </span>
              <div style={{ display: 'flex', gap: 8 }}><button style={{ ...styles.button, background: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }} onClick={() => navigateTo(tab, item.id, true)}>Edit</button><button style={{ ...styles.button, background: theme.danger, color: '#fff' }} onClick={() => handleDelete(item.id)}>Delete</button></div>
            </li>
          );
        })}</ul>
      </div>
    );
  };

  const renderForm = () => (
    <div style={{ maxWidth: 900 }}>
      <button style={styles.backBtn} onClick={handleBack}>← Back</button>
      <div style={styles.card}>
        <h2 style={styles.heading}>{selectedId ? 'EDIT' : 'NEW'} {tab.toUpperCase()}</h2>
        <div style={{ maxWidth: 600 }}>
          <label style={styles.label}>Name</label>
          <input ref={firstInputRef as any} style={styles.input} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" />
          {tab === 'musicians' && (<><label style={styles.label}>Phone</label><input style={styles.input} value={editPhone} onChange={e => setEditPhone(e.target.value)} /><label style={styles.label}>Email</label><input style={styles.input} value={editEmail} onChange={e => setEditEmail(e.target.value)} /><label style={styles.label}>Bio</label><textarea style={{ ...styles.input, minHeight: 100 }} value={editBio} onChange={e => setEditBio(e.target.value)} /></>)}
          {tab === 'songs' && (<><label style={styles.label}>Artist</label><input style={styles.input} value={editArtist} onChange={e => setEditArtist(e.target.value)} /><label style={styles.label}>Vocal Range</label><select style={styles.input} value={editVocalRange} onChange={e => setEditVocalRange(e.target.value as any)}><option value="">None</option><option value="High">High</option><option value="Low">Low</option></select><label style={styles.label}>Notes</label><textarea style={{ ...styles.input, minHeight: 80 }} value={editNotes} onChange={e => setEditNotes(e.target.value)} /><label style={styles.label}>Link</label><input style={styles.input} value={editLink} onChange={(e) => setEditLink(e.target.value)} /></>)}
          {tab === 'events' && (<><label style={styles.label}>Location</label><input style={styles.input} value={editLocation} onChange={e => setEditLocation(e.target.value)} /><div style={{ display: 'flex', gap: 16 }}><div style={{ flex: 1 }}><label style={styles.label}>Date</label><input style={styles.input} type="date" value={editDate} onChange={e => setEditDate(e.target.value)} /></div><div style={{ flex: 1 }}><label style={styles.label}>Time</label><input style={styles.input} type="time" value={editTime} onChange={e => setEditTime(e.target.value)} /></div></div></>)}
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}><button style={{ ...styles.button, background: theme.accent, color: '#fff', flex: 1 }} onClick={handleSave}>Save</button><button style={{ ...styles.button, background: theme.surfaceAlt, color: theme.text, flex: 1 }} onClick={handleBack}>Cancel</button></div>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => {
    const item = getItemById(); if (!item) return <div style={{ maxWidth: 900 }}><button style={styles.backBtn} onClick={handleBack}>← Back</button><p>Item not found.</p></div>;
    const available = getAvailableForAssignment().filter((a: any) => a.name.toLowerCase().includes(assignSearch.toLowerCase()) || (a.artist && a.artist.toLowerCase().includes(assignSearch.toLowerCase())));
    return (
      <div style={{ maxWidth: 900 }}>
        <button style={styles.backBtn} onClick={handleBack}>← Back</button>
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div><h1 style={{ ...styles.heading, fontSize: 28, marginBottom: 4 }}>{item.name}</h1><p style={{ color: theme.muted, margin: 0 }}>{tab.toUpperCase()}</p></div>
            <div style={{ display: 'flex', gap: 12 }}>{(['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) && (<button style={{ ...styles.button, background: theme.surfaceAlt, color: theme.text, border: `1px solid ${theme.border}` }} onClick={() => { setActivePrintId(null); setIsPrinting(true); }}>Print View</button>)}<button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => setIsEditing(true)}>Edit Details</button></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
            {tab === 'musicians' && (<><div><label style={styles.label}>Email</label><p>{(item as Musician).email || 'N/A'}</p></div><div><label style={styles.label}>Phone</label><p>{(item as Musician).phone || 'N/A'}</p></div><div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Bio</label><p>{(item as Musician).bio || 'No bio provided.'}</p></div></>)}
            {tab === 'songs' && (<><div><label style={styles.label}>Artist</label><p>{(item as Song).artist}</p></div><div><label style={styles.label}>Vocal Range</label><p>{(item as Song).vocalRange || 'N/A'}</p></div><div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Notes</label><p>{(item as Song).notes || 'None'}</p></div>{(item as Song).link && <div><label style={styles.label}>Link</label><a href={(item as Song).link} target="_blank" rel="noreferrer" style={styles.link}>{(item as Song).link}</a></div>}</>)}
            {tab === 'events' && (<><div><label style={styles.label}>Location</label><p>{(item as Event).location}</p></div><div><label style={styles.label}>Date</label><p>{(item as Event).date}</p></div><div><label style={styles.label}>Time</label><p>{(item as Event).time}</p></div></>)}
          </div>
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 24 }}>
            <h3 style={styles.subHeading}>{getRelationshipTitle()}</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}><input style={{ ...styles.input, marginBottom: 0, flex: 2 }} placeholder="Search..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} /><select style={{ ...styles.input, marginBottom: 0, flex: 3 }} value={assignId} onChange={e => setAssignId(e.target.value)}><option value="">Select...</option>{available.map((avail: any) => (<option key={avail.type ? `${avail.type}:${avail.id}` : avail.id} value={avail.type ? `${avail.type}:${avail.id}` : avail.id}>{tab === 'songs' ? getSetlistLabel(avail as SetList) : (avail.name + (avail.artist ? ` - ${avail.artist}` : '') + (avail.type === 'master' ? ' (Master)' : ''))}</option>))}</select><button style={{ ...styles.button, background: theme.success, color: '#fff', flex: 1 }} onClick={handleAssign}>Assign</button></div>
            <ul style={styles.list}>{getCurrentRelationships(item).map((rel: any, index: number) => {
              const isTour = tab === 'tours'; const past = isTour && isPast((rel as Event).date);
              const label = isTour ? `${rel.name} (${formatDate((rel as Event).date)})` : (tab === 'songs' ? getSetlistLabel(rel as SetList) : rel.name);
              const rTab = rel.type === 'master' ? 'master-setlists' : (rel.type === 'setlist' ? 'setlists' : (tab === 'songs' ? 'setlists' : getRelationshipTab() as any));
              const hasHigh = rTab === 'songs' && rel.vocalRange === 'High';
              return (
                <li key={`${rel.type || 'single'}:${rel.id}:${index}`} style={{ ...styles.listItem, opacity: draggedIndex === index ? 0.5 : (past ? 0.4 : 1), cursor: (['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) ? 'grab' : 'default', borderTop: dragOverIndex === index && draggedIndex !== index ? `2px solid ${theme.accent}` : styles.listItem.borderTop, transition: 'border 0.1s' }} draggable={(['setlists', 'master-setlists', 'events', 'tours'].includes(tab))} onDragStart={() => setDraggedIndex(index)} onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }} onDragOver={e => { e.preventDefault(); setDragOverIndex(index); }} onDrop={e => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) handleMove(draggedIndex, 'down', index); setDraggedIndex(null); setDragOverIndex(null); }} onDragEnter={e => { e.preventDefault(); setDragOverIndex(index); }} onDragLeave={() => setDragOverIndex(null)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{(['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) && (<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><button style={{ background: 'transparent', border: 'none', color: index === 0 ? theme.muted : theme.accent, cursor: index === 0 ? 'default' : 'pointer', padding: 0, fontSize: 10 }} onClick={() => handleMove(index, 'up')} disabled={index === 0}>▲</button><button style={{ background: 'transparent', border: 'none', color: index === getCurrentRelationships(item).length - 1 ? theme.muted : theme.accent, cursor: index === getCurrentRelationships(item).length - 1 ? 'default' : 'pointer', padding: 0, fontSize: 10 }} onClick={() => handleMove(index, 'down')} disabled={index === getCurrentRelationships(item).length - 1}>▼</button></div>)}<span style={{ ...styles.link, color: past ? theme.muted : theme.accent, textDecoration: past ? 'line-through' : 'none' }} onClick={() => navigateTo(rTab, rel.id, false)}>{label}{hasHigh ? '*' : ''} {rel.artist ? `(${rel.artist})` : ''} {rel.type === 'master' ? <span style={styles.badge}>MASTER</span> : ''}</span></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {tab === 'events' && (
                      <button 
                        style={{ ...styles.button, background: 'transparent', color: theme.accent, border: `1px solid ${theme.accent}` }} 
                        onClick={() => { setActivePrintId(rel.id); setIsPrinting(true); }}
                        title="Print this setlist"
                      >
                        Print
                      </button>
                    )}
                    <button style={{ ...styles.button, background: 'transparent', color: theme.danger, border: `1px solid ${theme.danger}` }} onClick={() => handleUnassign(rel.id, rel.type)}>Remove</button>
                  </div>
                </li>
              );
            })}</ul>
          </div>
        </div>
      </div>
    );
  };

  const renderPrintoutsTab = () => {
    const sortedEvents = [...events]
      .filter(e => !e.date || !isPast(e.date))
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return -1;
        if (!b.date) return 1;
        return a.date.localeCompare(b.date);
      });

    return (
      <div style={styles.card}>
        <h2 style={styles.heading}>Print Center</h2>
        <h3 style={styles.subHeading}>Upcoming & Planned Events</h3>
        <ul style={styles.list}>{sortedEvents.map(e => (
          <li key={e.id} style={styles.listItem}>
            <span>{e.name}{e.date ? ` (${formatDate(e.date)})` : ''}</span>
            <button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => { setTab('events'); setSelectedId(e.id); setIsPrinting(true); }}>Print Setlists</button>
          </li>
        ))}</ul>
        <h3 style={styles.subHeading}>Master SetLists</h3>
        <ul style={styles.list}>{masterSetlists.map(m => (<li key={m.id} style={styles.listItem}><span>{m.name}</span><button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => { setTab('master-setlists'); setSelectedId(m.id); setIsPrinting(true); }}>Print Floor View</button></li>))}</ul>
        <h3 style={styles.subHeading}>Individual SetLists</h3>
        <ul style={styles.list}>{setlists.map(sl => (<li key={sl.id} style={styles.listItem}><span>{getSetlistLabel(sl)}</span><button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => { setTab('setlists'); setSelectedId(sl.id); setIsPrinting(true); }}>Print Set</button></li>))}</ul>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; color: #000 !important; } main { padding: 0 !important; overflow: visible !important; } }`}</style>
      {!isPrinting && renderSidebar()}
      <main style={{ ...styles.main, background: isPrinting ? '#fff' : theme.background }}>
        {isPrinting ? renderPrintView() : (
          tab === 'printouts' ? renderPrintoutsTab() : (
            isEditing || selectedId ? (isEditing ? renderForm() : renderDetails()) : renderList(getDataForTab())
          )
        )}
      </main>
    </div>
  );
};

export default App;
