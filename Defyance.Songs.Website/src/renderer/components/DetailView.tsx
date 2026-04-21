import React from 'react';
import { 
  NavState, Band, Musician, Song, SetList, Event, Tour, MasterSetList 
} from '../../shared/models';
import { theme } from '../styles';
import { formatDate, isPast, getSetlistLabel, getMasterSetlistLabel } from '../utils';

type RelationalItem = any; // Fallback to any for complex heterogeneous relationships

interface DetailViewProps {
  tab: NavState['tab'];
  item: Band | Musician | Song | SetList | Event | Tour | MasterSetList | null;
  available: RelationalItem[];
  currentRelationships: RelationalItem[];
  assignId: string;
  assignSearch: string;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  styles: { [key: string]: React.CSSProperties };
  onBack: () => void;
  onEdit: () => void;
  onPrint: (id: string | null) => void;
  onAssignIdChange: (val: string) => void;
  onAssignSearchChange: (val: string) => void;
  onAssign: () => void;
  onUnassign: (id: string, type?: string) => void;
  onMove: (index: number, direction: 'up' | 'down', targetIndex?: number) => void;
  onToggleLink: (songId: string, linkedTo: string | null) => void;
  onNavigate: (tab: NavState['tab'], id: string, edit: boolean) => void;
  setDraggedIndex: (index: number | null) => void;
  setDragOverIndex: (index: number | null) => void;
  events: Event[];
  masterSetlists: MasterSetList[];
  readOnly?: boolean;
}

export const DetailView: React.FC<DetailViewProps> = ({
  tab, item, available, currentRelationships, assignId, assignSearch, 
  draggedIndex, dragOverIndex, styles, onBack, onEdit, onPrint, 
  onAssignIdChange, onAssignSearchChange, onAssign, onUnassign, 
  onMove, onToggleLink, onNavigate, setDraggedIndex, setDragOverIndex, events, masterSetlists,
  readOnly = false
}) => {
  if (!item) return <div style={{ maxWidth: 900 }}><button style={styles.backBtn} onClick={onBack}>← Back</button><p>Item not found.</p></div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div><h1 style={{ ...styles.heading, fontSize: 28, marginBottom: 4 }}>{item.name || ''}</h1><p style={{ color: theme.muted, margin: 0 }}>{tab.toUpperCase()}</p></div>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) && (
              <button style={{ ...styles.button, background: theme.surfaceAlt, color: theme.text, border: `1px solid ${theme.border}` }} onClick={() => onPrint(null)}>Print View</button>
            )}
            {!readOnly && <button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={onEdit}>Edit Details</button>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
          {tab === 'musicians' && (<><div><label style={styles.label}>Email</label><p>{(item as Musician).email || 'N/A'}</p></div><div><label style={styles.label}>Phone</label><p>{(item as Musician).phone || 'N/A'}</p></div><div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Bio</label><p>{(item as Musician).bio || 'No bio provided.'}</p></div></>)}
          {tab === 'songs' && (<><div><label style={styles.label}>Artist</label><p>{(item as Song).artist}</p></div><div><label style={styles.label}>Vocal Range</label><p>{(item as Song).vocalRange || 'N/A'}</p></div><div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Notes</label><p>{(item as Song).notes || 'None'}</p></div>{(item as Song).link && <div><label style={styles.label}>Link</label><a href={(item as Song).link || undefined} target="_blank" rel="noreferrer" style={styles.link}>{(item as Song).link}</a></div>}</>)}
          {tab === 'events' && (<><div><label style={styles.label}>Location</label><p>{(item as Event).location}</p></div><div><label style={styles.label}>Date</label><p>{(item as Event).date}</p></div><div><label style={styles.label}>Time</label><p>{(item as Event).time}</p></div></>)}
        </div>
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 24 }}>
          {!readOnly && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input style={{ ...styles.input, marginBottom: 0, flex: 2 }} placeholder="Search to assign..." value={assignSearch} onChange={e => onAssignSearchChange(e.target.value)} />
              <select style={{ ...styles.input, marginBottom: 0, flex: 3 }} value={assignId} onChange={e => onAssignIdChange(e.target.value)}>
                <option value="">Select entity to assign...</option>
                {available.map((avail: any, index: number) => {
                  let label = avail.name || 'Unnamed';
                  if (avail.type === 'parent-event') label = `Assign to Event: ${avail.name}`;
                  else if (avail.type === 'parent-master') label = `Assign to Master: ${avail.name}`;
                  else if (avail.type === 'parent-tour') label = `Assign to Tour: ${avail.name}`;
                  else if (avail.type === 'master') label = `${avail.name} (Master)`;
                  else if (tab === 'songs') label = getSetlistLabel(avail as SetList, events, masterSetlists);
                  return (<option key={`${avail.type || 'avail'}:${avail.id || index}`} value={`${avail.type ? `${avail.type}:${avail.id}` : (avail.id || '')}`}>{label + (avail.artist ? ` - ${avail.artist}` : '')}</option>);
                })}
              </select>
              <button style={{ ...styles.button, background: theme.success, color: '#fff', flex: 1 }} onClick={onAssign}>Assign</button>
            </div>
          )}

          {(() => {
            const parents = currentRelationships.filter(r => r.type?.startsWith('parent-'));
            const children = currentRelationships.filter(r => !r.type?.startsWith('parent-'));
            
            const getChildHeader = () => {
              if (tab === 'bands') return 'Musicians';
              if (tab === 'musicians') return 'Instruments';
              if (tab === 'songs') return 'Setlists';
              if (tab === 'setlists') return 'Songs';
              if (tab === 'master-setlists') return 'Setlists';
              if (tab === 'events') return 'Playlists';
              if (tab === 'tours') return 'Events';
              return 'Children';
            };

            const renderRelList = (list: any[], isParent: boolean) => (
              <ul style={styles.list}>{list.map((rel: any, index: number) => {
                const isTourTab = tab === 'tours'; const past = isTourTab && isPast((rel as Event).date);
                
                let label = rel.name || '';
                if (rel.type === 'parent-event') label = `Assigned to Event: ${rel.name}`;
                else if (rel.type === 'parent-master') label = `Assigned to Master: ${rel.name}`;
                else if (rel.type === 'parent-tour') label = `Assigned to Tour: ${rel.name}`;
                else if (isTourTab) label = `${rel.name} (${formatDate((rel as Event).date)})`;
                else if (tab === 'songs') label = getSetlistLabel(rel as SetList, events, masterSetlists);
                else if (tab === 'events') {
                  if (rel.type === 'setlist') label = getSetlistLabel(rel as SetList, events, masterSetlists);
                  else label = getMasterSetlistLabel(rel as MasterSetList, events) + ' (Master)';
                }

                const rTab: NavState['tab'] = (rel.type === 'master' || rel.type === 'parent-master') ? 'master-setlists' : ((rel.type === 'setlist' || rel.type === 'parent-event') ? 'setlists' : (rel.type === 'parent-tour' ? 'tours' : (tab === 'songs' ? 'setlists' : (tab === 'bands' ? 'musicians' : (tab === 'musicians' ? 'instruments' : (tab === 'instruments' ? 'musicians' : (tab === 'setlists' ? 'songs' : tab)))))));
                const isRelSong = (tab === 'setlists' || tab === 'master-setlists' || tab === 'events') && !rel.type;
                const hasHigh = isRelSong && rel.vocalRange === 'High';

                const isLinkedToNext = list[index + 1] && rel.linked_to === list[index + 1].id;
                const isLinkedFromPrev = list[index - 1] && list[index - 1].linked_to === rel.id;
                const canMoveUp = !readOnly && !isParent && index > 0 && !isLinkedFromPrev;
                const canMoveDown = !readOnly && !isParent && index < list.length - 1 && !isLinkedToNext;

                return (
                  <li 
                    key={`${rel.type || 'single'}:${rel.id || index}:${index}`} 
                    style={{ ...styles.listItem, opacity: draggedIndex === index ? 0.5 : (past ? 0.4 : 1), cursor: (!readOnly && !isParent && ['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) ? 'grab' : 'default', borderTop: dragOverIndex === index && draggedIndex !== index ? `2px solid ${theme.accent}` : styles.listItem.borderTop, transition: 'border 0.1s' }} 
                    draggable={(!readOnly && !isParent && ['setlists', 'master-setlists', 'events', 'tours'].includes(tab))} 
                    onDragStart={() => setDraggedIndex(index)} 
                    onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }} 
                    onDragOver={e => { e.preventDefault(); setDragOverIndex(index); }} 
                    onDrop={e => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) onMove(draggedIndex, 'down', index); setDraggedIndex(null); setDragOverIndex(null); }} 
                    onDragEnter={e => { e.preventDefault(); setDragOverIndex(index); }} 
                    onDragLeave={() => setDragOverIndex(null)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {(!readOnly && !isParent && ['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button style={{ background: 'transparent', border: 'none', color: !canMoveUp ? theme.muted : theme.accent, cursor: !canMoveUp ? 'default' : 'pointer', padding: 0, fontSize: 10 }} onClick={() => onMove(index, 'up')} disabled={!canMoveUp}>▲</button>
                          <button style={{ background: 'transparent', border: 'none', color: !canMoveDown ? theme.muted : theme.accent, cursor: !canMoveDown ? 'default' : 'pointer', padding: 0, fontSize: 10 }} onClick={() => onMove(index, 'down')} disabled={!canMoveDown}>▼</button>
                        </div>
                      )}
                      {tab === 'setlists' && !isParent && (
                          <button 
                            disabled={readOnly}
                            style={{ background: 'transparent', border: 'none', cursor: readOnly ? 'default' : 'pointer', marginRight: 8, fontSize: 16, opacity: (readOnly && !rel.linked_to) ? 0 : 1 }} 
                            onClick={(e) => {
                                if (readOnly) return;
                                e.stopPropagation();
                                const nextSongId = list[index + 1]?.id || null;
                                onToggleLink(rel.id, rel.linked_to ? null : nextSongId);
                            }}
                          >
                              {rel.linked_to ? '🔗' : '⛓️'}
                          </button>
                      )}
                      <span style={{ ...styles.link, color: past ? theme.muted : theme.accent, textDecoration: past ? 'line-through' : 'none' }} onClick={() => onNavigate(rTab, rel.id, false)}>
                        {label}{hasHigh ? '*' : ''} {rel.artist ? `(${rel.artist})` : ''} {rel.type === 'master' ? <span style={styles.badge}>MASTER</span> : ''}
                      </span>
                    </div>                    <div style={{ display: 'flex', gap: 8 }}>
                      {tab === 'events' && !isParent && (
                        <button style={{ ...styles.button, background: 'transparent', color: theme.accent, border: `1px solid ${theme.accent}` }} onClick={() => onPrint(rel.id)} title="Print this setlist">Print</button>
                      )}
                      {!readOnly && <button style={{ ...styles.button, background: 'transparent', color: theme.danger, border: `1px solid ${theme.danger}` }} onClick={() => onUnassign(rel.id, rel.type)}>Remove</button>}
                    </div>
                  </li>
                );
              })}</ul>
            );

            return (<>
              {parents.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={styles.subHeading}>Assigned To</h3>
                  {renderRelList(parents, true)}
                </div>
              )}
              <div>
                <h3 style={styles.subHeading}>{getChildHeader()}</h3>
                {children.length > 0 ? renderRelList(children, false) : <p style={{ color: theme.muted, fontSize: 14 }}>No {getChildHeader().toLowerCase()} assigned yet.</p>}
              </div>
            </>);
          })()}
        </div>
      </div>
    </div>
  );
};
