import React, { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { NavState, Band, Musician, Instrument, Song, SetList, Event, Tour, MasterSetList } from '../shared/models';
import { theme, getStyles } from './styles';
import { getCurrentRels } from './utils/relationships';
import { preparePDFData } from './utils/pdfPrepare';
import { useAppData } from './hooks/useAppData';
import { useNavigation } from './hooks/useNavigation';
import { useEntityForm } from './hooks/useEntityForm';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { canEditItem, canAddFiles, canDeleteDocument, UserRole } from './utils/auth';

const ListView = lazy(() => import('./components/ListView').then(m => ({ default: m.ListView })));
const DetailView = lazy(() => import('./components/DetailView').then(m => ({ default: m.DetailView })));
const FormView = lazy(() => import('./components/FormView').then(m => ({ default: m.FormView })));
const PrintCenter = lazy(() => import('./components/PrintCenter').then(m => ({ default: m.PrintCenter })));

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (error) {
      console.error('Error fetching role:', error);
      setUserRole(null);
    } else {
      setUserRole(data.role as UserRole);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      setLoadingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setUserRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { 
    bands, musicians, instruments, songs, setlists, events, tours, masterSetlists, documents,
    handleSave: dbSave, handleDelete, handleAssign, handleUnassign, handleMove, toggleLink,
    handleUploadDocument, handleDeleteDocument, loadAll
  } = useAppData();

  const {
    tab, selectedId, isEditing, search, sort, filter, filterKey,
    navigateTo, handleBack, setListState
  } = useNavigation();

  const { editFields, setEditFields, populateFields, onSave: formSave } = useEntityForm(dbSave);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => { setLocalSearch(search); }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (localSearch !== search) setListState({ q: localSearch });
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, setListState]);

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

  useEffect(() => {
      if (selectedId) populateFields(getItemById(selectedId), tab);
      else populateFields(null, tab);
  }, [selectedId, tab, getItemById, populateFields]);

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

  const onPrint = useCallback(async (printTab: string, id: string | null, highVis: boolean = false) => {
    setIsGeneratingPDF(true);
    // Open window IMMEDIATELY to avoid popup blockers
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write('<html><body style="background:#0f1217;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>Generating PDF...</h2></body></html>');
    }

    try {
        let item = getItemById(id || selectedId);
        let activePrintId = null;

        // If we are printing a specific setlist/master from an event/tour context
        if (printTab === 'events' || printTab === 'tours') {
            if (id && id !== selectedId) {
                activePrintId = id;
                // Main item should be the parent (Event/Tour) to preserve header context
                item = getItemById(selectedId);
            }
        }

        const datasets = preparePDFData(printTab, item, songs, setlists, masterSetlists, events, activePrintId);
        if (datasets.length === 0) {
            if (printWindow) printWindow.close();
            return;
        }

        // Dynamic Import of the PDF generator to fix Webpack bundle size warnings
        const { generateAndOpenPDF } = await import('./utils/pdfGenerator');
        await generateAndOpenPDF(datasets, highVis, printWindow);
    } catch (err) {
        console.error('PDF generation failed:', err);
        if (printWindow) printWindow.close();
    } finally {
        setIsGeneratingPDF(false);
    }
  }, [getItemById, songs, setlists, masterSetlists, events, selectedId]);

  const onAssign = async () => {
    if (!selectedId || !assignId) return;
    await handleAssign(tab, selectedId, assignId, getItemById(selectedId));
    setAssignId(''); setAssignSearch('');
  };
  const [assignId, setAssignId] = useState('');

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

  const currentItem = getItemById(selectedId);
  const canEditCurrent = canEditItem(userRole, tab, currentItem);

  if (loadingSession) return <div style={{ background: theme.background, color: theme.text, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  const isReadOnly = !session;

  const BottomNav = () => (
    <div style={styles.bottomNav}>
      {(['songs', 'setlists', 'master-setlists', 'events', 'printouts'] as const).map(t => (
        <div key={t} style={{ ...styles.bottomNavItem, color: tab === t ? theme.accent : theme.muted }} onClick={() => { navigateTo(t as any); if (isMobile) setIsSidebarOpen(false); }}>
          <span style={{ fontSize: 20 }}>
            {t === 'songs' && '🎵'}
            {t === 'setlists' && '📜'}
            {t === 'master-setlists' && '🗂️'}
            {t === 'events' && '📅'}
            {t === 'printouts' && '🖨️'}
          </span>
          <span style={{ fontSize: 9 }}>
            {t === 'master-setlists' ? 'Masters' : (t === 'printouts' ? 'Print' : t.charAt(0).toUpperCase() + t.slice(1))}
          </span>
        </div>
      ))}
      <div 
        style={{ ...styles.bottomNavItem, color: theme.danger }} 
        onClick={() => { 
          if (session) {
            if (window.confirm('Sign out?')) supabase.auth.signOut();
          } else {
            navigateTo('login');
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
      
      {isGeneratingPDF && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
            GENERATING PDF...
        </div>
      )}

      {isMobile && (
        <div style={styles.mobileHeader}>
          <h2 style={{ fontSize: 18, color: theme.accent, margin: 0 }}>Defyance</h2>
          <button style={{ ...styles.button, background: theme.surfaceAlt, color: theme.text, border: `1px solid ${theme.border}` }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? '✕ Close' : '☰ Menu'}
          </button>
        </div>
      )}
      <Sidebar tab={tab} isMobile={isMobile} isSidebarOpen={isSidebarOpen} styles={styles} session={session} onTabChange={(t) => { 
        navigateTo(t);
        if (isMobile) setIsSidebarOpen(false); 
      }} />
      <main style={{ ...styles.main, background: theme.background, overflow: 'auto', padding: isMobile ? '16px' : '32px', paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '32px' }}>
        <div key={`${tab}-${selectedId}-${isEditing}`} className="view-transition">
          <Suspense fallback={<div style={{ color: theme.muted, padding: 20 }}>Loading...</div>}>
            {tab === 'login' ? (
              <Login styles={styles} onGuest={handleBack} />
            ) : (
              tab === 'printouts' ? (
                <PrintCenter events={events} masterSetlists={masterSetlists} setlists={setlists} styles={styles} onPrint={onPrint} />
              ) : (
                isEditing || selectedId ? (
                  isEditing && canEditCurrent ? (
                    <FormView 
                      tab={tab} 
                      selectedId={selectedId} 
                      editName={editFields.name} 
                      editPhone={editFields.phone} 
                      editEmail={editFields.email} 
                      editBio={editFields.bio} 
                      editArtist={editFields.artist} 
                      editVocalRange={editFields.vocalRange} 
                      editKey={editFields.songKey} 
                      editNotes={editFields.notes} 
                      editLink={editFields.link} 
                      editLocation={editFields.location} 
                      editDate={editFields.date} 
                      editTime={editFields.time} 
                      editStatus={editFields.status}
                      isUserAdmin={userRole === 'admin'}
                      firstInputRef={firstInputRef} 
                      styles={styles} 
                      onBack={handleBack} 
                      onSave={onSave} 
                      setEditName={(v: string) => setEditFields({...editFields, name: v})} 
                      setEditPhone={(v: string) => setEditFields({...editFields, phone: v})} 
                      setEditEmail={(v: string) => setEditFields({...editFields, email: v})} 
                      setEditBio={(v: string) => setEditFields({...editFields, bio: v})} 
                      setEditArtist={(v: string) => setEditFields({...editFields, artist: v})} 
                      setEditVocalRange={(v: string) => setEditFields({...editFields, vocalRange: v as any})} 
                      setEditKey={(v: string) => setEditFields({...editFields, songKey: v})} 
                      setEditNotes={(v: string) => setEditFields({...editFields, notes: v})} 
                      setEditLink={(v: string) => setEditFields({...editFields, link: v})} 
                      setEditLocation={(v: string) => setEditFields({...editFields, location: v})} 
                      setEditDate={(v: string) => setEditFields({...editFields, date: v})} 
                      setEditTime={(v: string) => setEditFields({...editFields, time: v})} 
                      setEditStatus={(v: string) => setEditFields({...editFields, status: v})}
                      />
                      ) : (() => {
                      const item = currentItem;
                      return item ? (
                      <DetailView tab={tab} item={item} available={getAvailable().filter((a: any) => (a.name && a.name.toLowerCase().includes(assignSearch.toLowerCase())) || (a.artist && a.artist.toLowerCase().includes(assignSearch.toLowerCase())))} currentRelationships={getCurrentRels(item, tab, musicians, instruments, songs, setlists, events, tours, masterSetlists) || []} assignId={assignId} assignSearch={assignSearch} draggedIndex={draggedIndex} dragOverIndex={dragOverIndex} styles={styles} onBack={handleBack} onEdit={() => navigateTo(tab, selectedId, true)} onPrint={(id: string | null) => onPrint(tab, id || selectedId)} onAssignIdChange={setAssignId} onAssignSearchChange={setAssignSearch} onAssign={onAssign} onUnassign={onUnassign} onMove={onMove} onToggleLink={(songId: string, linkedTo: string | null) => toggleLink(selectedId!, songId, linkedTo)} onNavigate={navigateTo} setDraggedIndex={setDraggedIndex} setDragOverIndex={setDragOverIndex} events={events} masterSetlists={masterSetlists} documents={documents} onUploadDocument={handleUploadDocument} onDeleteDocument={handleDeleteDocument} onApprove={(id: string) => dbSave('songs', id, true, { status: 'Approved' })} userRole={userRole} />
                      ) : <div style={{ color: theme.muted, padding: 20 }}>Item not found.</div>;
                      })()
                      ) : (
                      <ListView 
                      tab={tab} 
                      data={getData()} 
                      songsSearch={localSearch} 
                      onSearchChange={setLocalSearch} 
                      songSortMode={sort as any}
                      onSongSortChange={(s: any) => setListState({ s })}
                      songFilterId={filter}
                      onSongFilterChange={(f: string) => setListState({ f })}
                      songFilterKey={filterKey}
                      onSongFilterKeyChange={(k: string) => setListState({ k })}
                      onNavigate={navigateTo} 
                      onDelete={(id: string) => handleDelete(tab, id)} 
                      onApprove={(id: string) => dbSave('songs', id, true, { status: 'Approved' })}
                      styles={styles} 
                      events={events} 
                      tours={tours} 
                      setlists={setlists} 
                      masterSetlists={masterSetlists} 
                      readOnly={isReadOnly}
                      userRole={userRole}
                      />

                )
              )
            )}
          </Suspense>
        </div>
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
};

export default App;
