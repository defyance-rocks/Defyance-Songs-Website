import React, { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { NavState, Band, Musician, Song, SetList, Event, Tour, MasterSetList } from '../shared/models';
import { theme, getStyles } from './styles';
import { formatUrl, getSetlistLabel } from './utils';
import { useAppData } from './hooks/useAppData';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';

const ListView = lazy(() => import('./components/ListView').then(m => ({ default: m.ListView })));
const DetailView = lazy(() => import('./components/DetailView').then(m => ({ default: m.DetailView })));
const FormView = lazy(() => import('./components/FormView').then(m => ({ default: m.FormView })));
const PrintView = lazy(() => import('./components/PrintView').then(m => ({ default: m.PrintView })));
const PrintCenter = lazy(() => import('./components/PrintCenter').then(m => ({ default: m.PrintCenter })));

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [tab, setTab] = useState<NavState['tab']>('bands');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [navStack, setNavStack] = useState<NavState[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { 
    bands, musicians, instruments, songs, setlists, events, tours, masterSetlists,
    handleSave, handleDelete, handleAssign, handleUnassign, handleMove, toggleLink 
  } = useAppData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isPrinting, setIsPrinting] = useState(false);
  const [activePrintId, setActivePrintId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [songsSearch, setSongsSearch] = useState('');
  const [songSortMode, setSongSortMode] = useState<'alpha' | 'artist' | 'unassigned' | 'vocal' | 'key'>('alpha');
  const [songFilterId, setSongFilterId] = useState<string>('');
  const [songFilterKey, setSongFilterKey] = useState<string>('');

  const [editFields, setEditFields] = useState({
    name: '', phone: '', email: '', bio: '', artist: '', vocalRange: '' as 'High' | 'Low' | '', songKey: '', notes: '', link: '', location: '', date: '', time: ''
  });
  const [assignId, setAssignId] = useState('');
  const firstInputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigateTo = (newTab: NavState['tab'], id: string | null = null, edit: boolean = false) => {
    setNavStack(prev => [...prev, { tab, selectedId, isEditing }]);
    setTab(newTab); 
    setSelectedId(id); 
    setIsEditing(edit); 
    setAssignSearch(''); 
    if (!edit) setSongsSearch('');
    
    // Explicitly scroll or focus if needed, but react should re-render
    console.log(`[Navigate] To: ${newTab}, ID: ${id}, Edit: ${edit}`);
    
    if (id) {
      const all = [...bands, ...musicians, ...songs, ...instruments, ...setlists, ...events, ...tours, ...masterSetlists];
      const item = all.find(x => x.id === id) as any;
      if (item) {
        setEditFields({
          name: item.name, phone: item.phone || '', email: item.email || '', bio: item.bio || '',
          artist: item.artist || '', vocalRange: item.vocalRange || '', songKey: item.key || '', notes: item.notes || '',
          link: item.link || '', location: item.location || '', date: item.date || '', time: item.time || ''
        });
      }
    } else {
      setEditFields({ name: '', phone: '', email: '', bio: '', artist: '', vocalRange: '', songKey: '', notes: '', link: '', location: '', date: '', time: '' });
    }
  };

  const handleBack = useCallback(() => {
    if (isPrinting) { setIsPrinting(false); return; }
    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1];
      setNavStack(navStack.slice(0, -1));
      setTab(prev.tab); setSelectedId(prev.selectedId); setIsEditing(prev.isEditing);
      setAssignSearch('');
      if (prev.selectedId) {
        const item = [...bands, ...musicians, ...songs, ...instruments, ...setlists, ...events, ...tours, ...masterSetlists].find(x => x.id === prev.selectedId) as any;
        if (item) {
          setEditFields({
            name: item.name, phone: item.phone || '', email: item.email || '', bio: item.bio || '',
            artist: item.artist || '', vocalRange: item.vocalRange || '', songKey: item.key || '', notes: item.notes || '',
            link: item.link || '', location: item.location || '', date: item.date || '', time: item.time || ''
          });
        }
      }
    } else { setSelectedId(null); setIsEditing(false); }
  }, [navStack, isPrinting, bands, musicians, songs, instruments, setlists, events, tours, masterSetlists]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBack(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleBack]);

  useEffect(() => {
    if (session && tab === 'login') {
      handleBack();
    }
  }, [session, tab, handleBack]);

  const getItemById = () => {
    if (!selectedId) return null;
    return [...bands, ...musicians, ...songs, ...instruments, ...setlists, ...events, ...tours, ...masterSetlists].find(x => x.id === selectedId) || null;
  };

  const onSave = async () => {
    if (!editFields.name.trim()) return;
    const link = formatUrl(editFields.link.trim());
    const payload: any = { name: editFields.name };
    if (tab === 'musicians') { payload.phone = editFields.phone; payload.email = editFields.email; payload.bio = editFields.bio; }
    if (tab === 'songs') { payload.artist = editFields.artist; payload.vocal_range = editFields.vocalRange || null; payload.key = editFields.songKey || null; payload.notes = editFields.notes; payload.link = link; }
    if (tab === 'events') { payload.location = editFields.location; payload.date = editFields.date || null; payload.time = editFields.time || null; }

    await handleSave(tab, selectedId, isEditing, payload);
    setNavStack([]); setIsEditing(false); setSelectedId(null);
  };

  const onAssign = async () => {
    if (!selectedId || !assignId) return;
    await handleAssign(tab, selectedId, assignId, getItemById());
    setAssignId(''); setAssignSearch('');
  };

  const onUnassign = async (id: string, type?: string) => {
    if (!selectedId) return;
    await handleUnassign(tab, selectedId, id, type);
  };

  const onMove = async (index: number, direction: 'up' | 'down', targetIndex?: number) => {
    if (!selectedId) return;
    const item = getItemById();
    if (!item) return;
    const rels = getCurrentRels(item);
    const children = rels.filter((r: any) => !r.type?.startsWith('parent-'));
    
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
      return { indices: chain, start: chain[0], end: chain[chain.length - 1] };
    };

    const chain = getChain(index, children);
    let target: number;
    if (targetIndex !== undefined) {
      target = targetIndex;
    } else {
      target = direction === 'up' ? chain.start - 1 : chain.end + 1;
    }

    if (target < 0 || target >= children.length) return;
    await handleMove(tab, selectedId, children, index, target);
  };

  const styles = getStyles(isMobile, isSidebarOpen);


  const getAvailable = () => {
    const item = getItemById(); if (!item) return [];
    if (tab === 'bands') return musicians.filter(m => !(item as Band).musicians.includes(m.id));
    if (tab === 'musicians') return instruments.filter(i => !(item as Musician).instruments.includes(i.id));
    if (tab === 'songs') return setlists.filter(sl => !sl.songs.some(s => s.id === (item as Song).id));
    if (tab === 'setlists') {
      const currentSongs = (item as SetList).songs;
      const songOptions = songs.filter(s => !currentSongs.some(cs => cs.id === s.id)).map(s => ({ ...s, type: 'song' }));
      const parentOptions = [];
      if (!(item as SetList).eventId && !(item as SetList).masterSetlistId) {
        parentOptions.push(...events.map(e => ({ ...e, type: 'parent-event' })));
        parentOptions.push(...masterSetlists.map(m => ({ ...m, type: 'parent-master' })));
      }
      return [...parentOptions, ...songOptions];
    }
    if (tab === 'master-setlists') {
      const currentSetlists = (item as MasterSetList).setlists;
      const setlistOptions = setlists.filter(sl => !sl.eventId && !sl.masterSetlistId && !currentSetlists.includes(sl.id)).map(sl => ({ ...sl, type: 'setlist' }));
      const parentOptions = [];
      if (!(item as MasterSetList).eventId) parentOptions.push(...events.map(e => ({ ...e, type: 'parent-event' })));
      return [...parentOptions, ...setlistOptions];
    }
    if (tab === 'events') {
      const assignedIds = (item as Event).setLists.map(sl => sl.id);
      const availSL = setlists.filter(sl => !sl.eventId && !sl.masterSetlistId && !assignedIds.includes(sl.id)).map(sl => ({ ...sl, type: 'setlist' }));
      const availMSL = masterSetlists.filter(msl => !msl.eventId && !assignedIds.includes(msl.id)).map(msl => ({ ...msl, type: 'master' }));
      const parentOptions = [];
      if (!(item as Event).tourId) parentOptions.push(...tours.map(t => ({ ...t, type: 'parent-tour' })));
      return [...parentOptions, ...availSL, ...availMSL] as any[];
    }
    if (tab === 'tours') return events.filter(e => !e.tourId);
    return [];
  };

  const getCurrentRels = (item: Band | Musician | Song | SetList | Event | Tour | MasterSetList) => {
    if (tab === 'bands') return ((item as Band).musicians || []).map((id: string) => musicians.find(m => m.id === id)).filter(Boolean);
    if (tab === 'musicians') return ((item as Musician).instruments || []).map((id: string) => instruments.find(i => i.id === id)).filter(Boolean);
    if (tab === 'songs') return setlists.filter(sl => (sl.songs || []).some(s => s.id === (item as Song).id));
    if (tab === 'setlists') {
      const current = ((item as SetList).songs || []).map((s: {id: string, linked_to?: string | null}) => songs.find(so => so.id === s.id)).filter(Boolean);
      const parent = [];
      if ((item as SetList).eventId) { const ev = events.find(e => e.id === (item as SetList).eventId); if (ev) parent.push({ ...ev, type: 'parent-event' }); }
      if ((item as SetList).masterSetlistId) { const msl = masterSetlists.find(m => m.id === (item as SetList).masterSetlistId); if (msl) parent.push({ ...msl, type: 'parent-master' }); }
      // Inject linked_to into the song objects for the DetailView to use
      return [...parent, ...current.map((s, i) => s ? ({...s, linked_to: (item as SetList).songs[i].linked_to}) : null).filter(Boolean)];
    }
    if (tab === 'master-setlists') {
      const current = ((item as MasterSetList).setlists || []).map((id: string) => setlists.find(s => s.id === id)).filter(Boolean);
      const parent = [];
      if ((item as MasterSetList).eventId) { const ev = events.find(e => e.id === (item as MasterSetList).eventId); if (ev) parent.push({ ...ev, type: 'parent-event' }); }
      return [...parent, ...current];
    }
    if (tab === 'events') {
      const current = ((item as Event).setLists || []).map(e => {
        const x = e.type === 'setlist' ? setlists.find(s => s.id === e.id) : masterSetlists.find(m => m.id === e.id);
        return x ? { ...x, type: e.type } : null;
      }).filter(Boolean);
      const parent = [];
      if ((item as Event).tourId) { const t = tours.find(x => x.id === (item as Event).tourId); if (t) parent.push({ ...t, type: 'parent-tour' }); }
      return [...parent, ...current];
    }
    if (tab === 'tours') return ((item as Tour).events || []).map((id: string) => events.find(e => e.id === id)).filter(Boolean);
    return [];
  };

  const getData = () => {
    if (tab === 'bands') return bands; if (tab === 'musicians') return musicians; if (tab === 'songs') return songs;
    if (tab === 'instruments') return instruments; if (tab === 'setlists') return setlists;
    if (tab === 'master-setlists') return masterSetlists; if (tab === 'events') return events;
    if (tab === 'tours') return tours; return [];
  };

  if (loadingSession) return <div style={{ background: theme.background, color: theme.text, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  const isReadOnly = !session;

  return (
    <div style={styles.container}>
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; color: #000 !important; } main { padding: 0 !important; overflow: visible !important; } }`}</style>
      {!isPrinting && isMobile && (
        <div style={styles.mobileHeader}>
          <h2 style={{ fontSize: 18, color: theme.accent, margin: 0 }}>Defyance</h2>
          <button style={{ ...styles.button, background: theme.surfaceAlt, color: theme.text, border: `1px solid ${theme.border}` }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? '✕ Close' : '☰ Menu'}
          </button>
        </div>
      )}
      {!isPrinting && <Sidebar tab={tab} isMobile={isMobile} isSidebarOpen={isSidebarOpen} styles={styles} session={session} onTabChange={(t) => { 
        if (t === 'login') {
          setNavStack(prev => [...prev, { tab, selectedId, isEditing }]);
        } else {
          setNavStack([]); 
        }
        setTab(t); setSelectedId(null); setIsEditing(false); setIsPrinting(false); setActivePrintId(null); if (isMobile) setIsSidebarOpen(false); 
      }} />}
      <main style={{ ...styles.main, background: isPrinting ? '#fff' : theme.background }}>
        <Suspense fallback={<div style={{ color: theme.muted, padding: 20 }}>Loading...</div>}>
          {tab === 'login' ? (
            <Login styles={styles} onGuest={handleBack} />
          ) : isPrinting ? (
            <PrintView songs={songs} setlists={setlists} masterSetlists={masterSetlists} events={events} tab={tab} item={getItemById()} activePrintId={activePrintId} styles={styles} onClose={() => { setIsPrinting(false); setActivePrintId(null); }} />
          ) : (
            tab === 'printouts' ? (
              <PrintCenter events={events} masterSetlists={masterSetlists} setlists={setlists} styles={styles} onPrint={(t, id) => { setTab(t); setSelectedId(id); setIsPrinting(true); }} />
            ) : (
              isEditing || selectedId ? (
                isEditing && !isReadOnly ? (
                  <FormView tab={tab} selectedId={selectedId} editName={editFields.name} editPhone={editFields.phone} editEmail={editFields.email} editBio={editFields.bio} editArtist={editFields.artist} editVocalRange={editFields.vocalRange} editKey={editFields.songKey} editNotes={editFields.notes} editLink={editFields.link} editLocation={editFields.location} editDate={editFields.date} editTime={editFields.time} firstInputRef={firstInputRef} styles={styles} onBack={handleBack} onSave={onSave} setEditName={(v) => setEditFields({...editFields, name: v})} setEditPhone={(v) => setEditFields({...editFields, phone: v})} setEditEmail={(v) => setEditFields({...editFields, email: v})} setEditBio={(v) => setEditFields({...editFields, bio: v})} setEditArtist={(v) => setEditFields({...editFields, artist: v})} setEditVocalRange={(v) => setEditFields({...editFields, vocalRange: v as any})} setEditKey={(v) => setEditFields({...editFields, songKey: v})} setEditNotes={(v) => setEditFields({...editFields, notes: v})} setEditLink={(v) => setEditFields({...editFields, link: v})} setEditLocation={(v) => setEditFields({...editFields, location: v})} setEditDate={(v) => setEditFields({...editFields, date: v})} setEditTime={(v) => setEditFields({...editFields, time: v})} />
                ) : (() => {
                  const item = getItemById();
                  return item ? (
                    <DetailView tab={tab} item={item} available={getAvailable().filter((a: any) => (a.name && a.name.toLowerCase().includes(assignSearch.toLowerCase())) || (a.artist && a.artist.toLowerCase().includes(assignSearch.toLowerCase())))} currentRelationships={getCurrentRels(item) || []} assignId={assignId} assignSearch={assignSearch} draggedIndex={draggedIndex} dragOverIndex={dragOverIndex} styles={styles} onBack={handleBack} onEdit={() => setIsEditing(true)} onPrint={(id) => { setActivePrintId(id || null); setIsPrinting(true); }} onAssignIdChange={setAssignId} onAssignSearchChange={setAssignSearch} onAssign={onAssign} onUnassign={onUnassign} onMove={onMove} onToggleLink={(songId, linkedTo) => toggleLink(selectedId!, songId, linkedTo)} onNavigate={navigateTo} setDraggedIndex={setDraggedIndex} setDragOverIndex={setDragOverIndex} events={events} masterSetlists={masterSetlists} readOnly={isReadOnly} />
                  ) : <div style={{ color: theme.muted, padding: 20 }}>Item not found.</div>;
                })()
              ) : (
                <ListView 
                  tab={tab} 
                  data={getData()} 
                  songsSearch={songsSearch} 
                  onSearchChange={setSongsSearch} 
                  songSortMode={songSortMode}
                  onSongSortChange={setSongSortMode}
                  songFilterId={songFilterId}
                  onSongFilterChange={setSongFilterId}
                  songFilterKey={songFilterKey}
                  onSongFilterKeyChange={setSongFilterKey}
                  onNavigate={navigateTo} 
                  onDelete={(id) => handleDelete(tab, id)} 
                  styles={styles} 
                  events={events} 
                  tours={tours} 
                  setlists={setlists} 
                  masterSetlists={masterSetlists} 
                  readOnly={isReadOnly}
                />
              )            )
          )}
        </Suspense>
      </main>
    </div>
  );
};

export default App;
