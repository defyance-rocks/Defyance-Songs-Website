import React, { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { NavState, Band, Musician, Song, SetList, Event, Tour, MasterSetList } from '../shared/models';
import { theme, getStyles } from './styles';
import { getSetlistLabel } from './utils';
import { getCurrentRels } from './utils/relationships';
import { useAppData } from './hooks/useAppData';
import { useNavigation } from './hooks/useNavigation';
import { useEntityForm } from './hooks/useEntityForm';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { 
    bands, musicians, instruments, songs, setlists, events, tours, masterSetlists,
    handleSave: dbSave, handleDelete, handleAssign, handleUnassign, handleMove, toggleLink 
  } = useAppData();

  const {
    tab, setTab, selectedId, setSelectedId, isEditing, setIsEditing,
    navStack, setNavStack, navigateTo: baseNavigateTo, handleBack: baseHandleBack
  } = useNavigation();

  const { editFields, setEditFields, populateFields, onSave: formSave } = useEntityForm(dbSave);

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
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(songsSearch), 200);
    return () => clearTimeout(timer);
  }, [songsSearch]);

  const [songSortMode, setSongSortMode] = useState<'alpha' | 'artist' | 'unassigned' | 'vocal' | 'key'>('alpha');
  const [songFilterId, setSongFilterId] = useState<string>('');
  const [songFilterKey, setSongFilterKey] = useState<string>('');
  const [assignId, setAssignId] = useState('');
  const firstInputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getItemById = useCallback((id: string | null) => {
    if (!id) return null;
    return [...bands, ...musicians, ...songs, ...instruments, ...setlists, ...events, ...tours, ...masterSetlists].find(x => x.id === id) || null;
  }, [bands, musicians, songs, instruments, setlists, events, tours, masterSetlists]);

  const navigateTo = (newTab: NavState['tab'], id: string | null = null, edit: boolean = false) => {
    baseNavigateTo(newTab, id, edit);
    setAssignSearch('');
    if (!edit) setSongsSearch('');
    if (id) populateFields(getItemById(id), newTab);
    else populateFields(null, newTab);
  };

  const handleBack = useCallback(() => {
    if (isPrinting) { setIsPrinting(false); return; }
    baseHandleBack((prev) => {
        setAssignSearch('');
        if (prev.selectedId) populateFields(getItemById(prev.selectedId), prev.tab);
    });
  }, [baseHandleBack, isPrinting, getItemById, populateFields]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBack(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleBack]);

  useEffect(() => {
    if (session && tab === 'login') handleBack();
  }, [session, tab, handleBack]);

  const onSave = async () => {
    const success = await formSave(tab, selectedId, isEditing);
    if (success) {
      handleBack();
    }
  };

  const onAssign = async () => {
    if (!selectedId || !assignId) return;
    await handleAssign(tab, selectedId, assignId, getItemById(selectedId));
    setAssignId(''); setAssignSearch('');
  };

  const onUnassign = async (id: string, type?: string) => {
    if (!selectedId) return;
    await handleUnassign(tab, selectedId, id, type);
  };

  const onMove = async (index: number, direction: 'up' | 'down', targetIndex?: number) => {
    if (!selectedId) return;
    const item = getItemById(selectedId);
    if (!item) return;
    const rels = getCurrentRels(item, tab, musicians, instruments, songs, setlists, events, tours, masterSetlists);
    const children = rels.filter((r: any) => !r.type?.startsWith('parent-'));
    
    const getChain = (idx: number, currentList: any[]) => {
      let start = idx;
      while(start > 0 && currentList[start-1].linked_to === currentList[start].id) start--;
      let end = idx;
      while(end < currentList.length - 1 && currentList[end].linked_to === currentList[end+1].id) end++;
      return { start, end };
    };

    const range = getChain(index, children);
    let target = targetIndex !== undefined ? targetIndex : (direction === 'up' ? range.start - 1 : range.end + 1);
    if (target < 0 || target >= children.length) return;
    await handleMove(tab, selectedId, children, index, target);
  };

  const styles = getStyles(isMobile, isSidebarOpen);

  const getAvailable = () => {
    const item = getItemById(selectedId); if (!item) return [];
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
      return [...parentOptions, ...availSL, ...availMSL];
    }
    if (tab === 'tours') return events.filter(e => !e.tourId);
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

  const BottomNav = () => (
    <div style={styles.bottomNav}>
      {(['songs', 'setlists', 'master-setlists', 'events', 'tours'] as const).map(t => (
        <div key={t} style={{ ...styles.bottomNavItem, color: tab === t ? theme.accent : theme.muted }} onClick={() => { setNavStack([]); setTab(t); setSelectedId(null); setIsEditing(false); setIsPrinting(false); setActivePrintId(null); if (isMobile) setIsSidebarOpen(false); }}>
          <span style={{ fontSize: 20 }}>
            {t === 'songs' && '🎵'}
            {t === 'setlists' && '📜'}
            {t === 'master-setlists' && '🗂️'}
            {t === 'events' && '📅'}
            {t === 'tours' && '🚌'}
          </span>
          <span style={{ fontSize: 9 }}>
            {t === 'master-setlists' ? 'Masters' : t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        </div>
      ))}
      <div 
        style={{ ...styles.bottomNavItem, color: theme.danger }} 
        onClick={() => { 
          if (session) {
            if (window.confirm('Sign out?')) supabase.auth.signOut();
          } else {
            setNavStack(prev => [...prev, { tab, selectedId, isEditing }]); 
            setTab('login'); 
            setSelectedId(null); 
            setIsEditing(false); 
            setIsPrinting(false); 
            setActivePrintId(null); 
            if (isMobile) setIsSidebarOpen(false); 
          }
        }}
      >
        <span style={{ fontSize: 20 }}>{session ? '🚪' : '🔒'}</span>
        <span style={{ fontSize: 9 }}>{session ? 'Logout' : 'Login'}</span>
      </div>
    </div>
  );

  const isSortablePage = ['setlists', 'master-setlists', 'events', 'tours'].includes(tab) && selectedId && !isEditing;

  return (
    <div style={{ ...styles.container, userSelect: isSortablePage ? 'none' : 'auto', WebkitUserSelect: isSortablePage ? 'none' : 'auto' }}>
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
        if (t === 'login') setNavStack(prev => [...prev, { tab, selectedId, isEditing }]);
        else setNavStack([]); 
        setTab(t); setSelectedId(null); setIsEditing(false); setIsPrinting(false); setActivePrintId(null); if (isMobile) setIsSidebarOpen(false); 
      }} />}
      <main style={{ ...styles.main, background: isPrinting ? '#fff' : theme.background, paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '32px' }}>
        <div key={`${tab}-${selectedId}-${isEditing}`} className={isPrinting ? "" : "view-transition"}>
          <Suspense fallback={<div style={{ color: theme.muted, padding: 20 }}>Loading...</div>}>
            {tab === 'login' ? (
              <Login styles={styles} onGuest={handleBack} />
            ) : isPrinting ? (
              <PrintView songs={songs} setlists={setlists} masterSetlists={masterSetlists} events={events} tab={tab} item={getItemById(selectedId)} activePrintId={activePrintId} styles={styles} onClose={() => { setIsPrinting(false); setActivePrintId(null); }} />
            ) : (
              tab === 'printouts' ? (
                <PrintCenter events={events} masterSetlists={masterSetlists} setlists={setlists} styles={styles} onPrint={(t, id) => { setTab(t); setSelectedId(id); setIsPrinting(true); }} />
              ) : (
                isEditing || selectedId ? (
                  isEditing && !isReadOnly ? (
                    <FormView tab={tab} selectedId={selectedId} editName={editFields.name} editPhone={editFields.phone} editEmail={editFields.email} editBio={editFields.bio} editArtist={editFields.artist} editVocalRange={editFields.vocalRange} editKey={editFields.songKey} editNotes={editFields.notes} editLink={editFields.link} editLocation={editFields.location} editDate={editFields.date} editTime={editFields.time} firstInputRef={firstInputRef} styles={styles} onBack={handleBack} onSave={onSave} setEditName={(v) => setEditFields({...editFields, name: v})} setEditPhone={(v) => setEditFields({...editFields, phone: v})} setEditEmail={(v) => setEditFields({...editFields, email: v})} setEditBio={(v) => setEditFields({...editFields, bio: v})} setEditArtist={(v) => setEditFields({...editFields, artist: v})} setEditVocalRange={(v) => setEditFields({...editFields, vocalRange: v as any})} setEditKey={(v) => setEditFields({...editFields, songKey: v})} setEditNotes={(v) => setEditFields({...editFields, notes: v})} setEditLink={(v) => setEditFields({...editFields, link: v})} setEditLocation={(v) => setEditFields({...editFields, location: v})} setEditDate={(v) => setEditFields({...editFields, date: v})} setEditTime={(v) => setEditFields({...editFields, time: v})} />
                  ) : (() => {
                    const item = getItemById(selectedId);
                    return item ? (
                      <DetailView tab={tab} item={item} available={getAvailable().filter((a: any) => (a.name && a.name.toLowerCase().includes(assignSearch.toLowerCase())) || (a.artist && a.artist.toLowerCase().includes(assignSearch.toLowerCase())))} currentRelationships={getCurrentRels(item, tab, musicians, instruments, songs, setlists, events, tours, masterSetlists) || []} assignId={assignId} assignSearch={assignSearch} draggedIndex={draggedIndex} dragOverIndex={dragOverIndex} styles={styles} onBack={handleBack} onEdit={() => setIsEditing(true)} onPrint={(id) => { setActivePrintId(id || null); setIsPrinting(true); }} onAssignIdChange={setAssignId} onAssignSearchChange={setAssignSearch} onAssign={onAssign} onUnassign={onUnassign} onMove={onMove} onToggleLink={(songId, linkedTo) => toggleLink(selectedId!, songId, linkedTo)} onNavigate={navigateTo} setDraggedIndex={setDraggedIndex} setDragOverIndex={setDragOverIndex} events={events} masterSetlists={masterSetlists} readOnly={isReadOnly} />
                    ) : <div style={{ color: theme.muted, padding: 20 }}>Item not found.</div>;
                  })()
                ) : (
                  <ListView 
                    tab={tab} 
                    data={getData()} 
                    songsSearch={debouncedSearch} 
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
        </div>
      </main>
      {!isPrinting && isMobile && <BottomNav />}
    </div>
  );
};

export default App;
