import React from 'react';
import { supabase } from '../supabase';
import { 
  NavState, Band, Musician, Song, SetList, Event, Tour, MasterSetList, AppEntity, EntityDocument,
  isSong, isMusician, isEvent, UserRole
} from '../../shared/models';
import { theme } from '../styles';
import { formatDate, isPast, getSetlistLabel, getMasterSetlistLabel } from '../utils';
import { canEditItem, canAddFiles, canDeleteDocument } from '../utils/auth';

interface DetailViewProps {
  tab: NavState['tab'];
  item: AppEntity | null;
  available: (AppEntity & { type?: string })[];
  currentRelationships: (AppEntity & { type?: string; linked_to?: string | null })[];
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
  documents: EntityDocument[];
  onUploadDocument: (type: string, id: string, file: File) => Promise<void>;
  onDeleteDocument: (docId: string, filePath: string) => Promise<void>;
  onApprove?: (id: string) => void;
  userRole?: UserRole;
}

const ArrowLinkedSVG = () => (
  <svg viewBox="0 0 24 24" style={{ width: '1.2em', height: '1.2em' }}>
    <path 
      d="M19 13l-7 7-7-7m14-8l-7 7-7-7" 
      stroke="currentColor" 
      strokeWidth="3" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

const ArrowUnlinkedSVG = () => (
  <svg viewBox="0 0 24 24" style={{ width: '1.2em', height: '1.2em', opacity: 0.3 }}>
    <path 
      d="M19 13l-7 7-7-7m14-8l-7 7-7-7" 
      stroke="currentColor" 
      strokeWidth="3" 
      fill="currentColor" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

const cleanText = (txt: string) => {
  if (!txt) return '';
  return txt
    .normalize('NFKD')               // Decompose combined characters
    .replace(/\u00A0/g, ' ')         // Replace all NBSPs with spaces
    .replace(/[^\x00-\x7F]/g, (char) => {
        // Specifically blacklist the Ghost A (0xC2) and related Latin-1 junk, 
        // but keep common musical symbols if needed.
        return (char === 'Â' || char.charCodeAt(0) === 194) ? '' : char;
    })
    .replace(/\u00C2/g, '');         // Final safety sweep
};

export const DetailView: React.FC<DetailViewProps> = ({
  tab, item, available, currentRelationships, assignId, assignSearch, 
  draggedIndex, dragOverIndex, styles, onBack, onEdit, onPrint, 
  onAssignIdChange, onAssignSearchChange, onAssign, onUnassign, 
  onMove, onToggleLink, onNavigate, setDraggedIndex, setDragOverIndex, events, masterSetlists,
  documents, onUploadDocument, onDeleteDocument, onApprove,
  userRole = null
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  if (!item) return <div style={{ maxWidth: 900 }}><button style={styles.backBtn} onClick={onBack}>← Back</button><p>Item not found.</p></div>;

  const canEdit = canEditItem(userRole, tab, item);
  const canAddFile = canAddFiles(userRole, tab);
  const canDeleteFile = canDeleteDocument(userRole, tab, item);

  return (
    <div style={{ maxWidth: 900 }}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ ...styles.heading, fontSize: 28, marginBottom: 4 }}>
              {item.name || ''}
              {tab === 'songs' && ((item as Song).status === 'Approved' ? (
                <span style={{ ...styles.badge, background: theme.success, marginLeft: 12, fontSize: 12, verticalAlign: 'middle', color: '#fff' }}>APPROVED</span>
              ) : (
                <span style={{ ...styles.badge, background: theme.surfaceAlt, color: theme.muted, marginLeft: 12, fontSize: 12, verticalAlign: 'middle' }}>DRAFT</span>
              ))}
            </h1>
            <p style={{ color: theme.muted, margin: 0 }}>{tab.toUpperCase()}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) && (
              <button style={{ ...styles.button, background: theme.surfaceAlt, color: theme.text, border: `1px solid ${theme.border}` }} onClick={() => onPrint(item.id)}>Print</button>
            )}
            {tab === 'songs' && (item as Song).status !== 'Approved' && userRole === 'admin' && (
                <button style={{ ...styles.button, background: theme.success, color: '#fff' }} onClick={() => onApprove?.(item.id)}>Approve</button>
            )}
            {canEdit && <button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={onEdit}>Edit Details</button>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
          {tab === 'musicians' && (<><div><label style={styles.label}>Email</label><p>{(item as Musician).email || 'N/A'}</p></div><div><label style={styles.label}>Phone</label><p>{(item as Musician).phone || 'N/A'}</p></div><div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Bio</label><p style={{ whiteSpace: 'pre-wrap' }}>{(item as Musician).bio || 'No bio provided.'}</p></div></>)}
          {tab === 'songs' && (<><div><label style={styles.label}>Artist</label><p>{(item as Song).artist}</p></div><div><label style={styles.label}>Vocal Range</label><p>{(item as Song).vocalRange || 'N/A'}</p></div><div><label style={styles.label}>Key</label><p>{(item as Song).key || 'N/A'}</p></div><div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Notes</label><p style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{(item as Song).notes || 'None'}</p></div>{(item as Song).link && <div><label style={styles.label}>Link</label><a href={(item as Song).link || undefined} target="_blank" rel="noreferrer" style={styles.link}>{(item as Song).link}</a></div>}</>)}
          {tab === 'events' && (<><div><label style={styles.label}>Location</label><p>{(item as Event).location}</p></div><div><label style={styles.label}>Date</label><p>{(item as Event).date}</p></div><div><label style={styles.label}>Time</label><p>{(item as Event).time}</p></div></>)}
        </div>

        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 24, marginBottom: 32 }}>
          <h3 style={styles.subHeading}>Documents & Assets</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {documents.filter(d => d.entity_type === tab && d.entity_id === item.id).map(doc => (
              <div key={doc.id} style={{ background: theme.surfaceAlt, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${theme.border}` }}>
                <a 
                  href={supabase.storage.from('documents').getPublicUrl(doc.file_path).data.publicUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ color: theme.accent, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
                >
                  📄 {doc.name}
                </a>
                {canDeleteFile && (
                  <button 
                    onClick={() => onDeleteDocument(doc.id, doc.file_path)}
                    style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: 16, padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {canAddFile && (
              <label style={{ background: theme.accent, color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                + Upload Document
                <input 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadDocument(tab, item.id, file);
                  }} 
                />
              </label>
            )}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 24 }}>
          {canEdit && (
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
              if (tab === 'events') return 'Setlists';
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

                const getRTab = (): NavState['tab'] => {
                  if (rel.type === 'master' || rel.type === 'parent-master') return 'master-setlists';
                  if (rel.type === 'setlist' || rel.type === 'parent-event') return 'setlists';
                  if (rel.type === 'parent-tour') return 'tours';
                  
                  if (tab === 'bands') return 'musicians';
                  if (tab === 'musicians') return 'instruments';
                  if (tab === 'instruments') return 'musicians';
                  if (tab === 'songs') return 'setlists';
                  if (tab === 'setlists') return 'songs';
                  if (tab === 'master-setlists') return 'setlists';
                  if (tab === 'events') return rel.type === 'master' ? 'master-setlists' : 'setlists';
                  if (tab === 'tours') return 'events';
                  return tab as NavState['tab'];
                };
                const rTab = getRTab();

                const isRelSong = (tab === 'setlists' || tab === 'events') && !rel.type;
                const hasHigh = isRelSong && rel.vocalRange === 'High';

                const isLinkedToNext = list[index + 1] && rel.linked_to === list[index + 1].id;
                const isLinkedFromPrev = list[index - 1] && list[index - 1].linked_to === rel.id;
                const canMoveUp = canEdit && !isParent && index > 0 && !isLinkedFromPrev;
                const canMoveDown = canEdit && !isParent && index < list.length - 1 && !isLinkedToNext;

                const isMobile = window.innerWidth < 768;
                const showReorder = canEdit && !isParent && ['setlists', 'master-setlists', 'events', 'tours'].includes(tab);

                return (
                  <li 
                    key={`${rel.type || 'single'}:${rel.id || index}:${index}`} 
                    data-index={index}
                    style={{ ...styles.listItem, opacity: draggedIndex === index ? 0.5 : (past ? 0.4 : 1), cursor: (canEdit && !isParent && ['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) ? 'grab' : 'default', borderTop: dragOverIndex === index && draggedIndex !== index ? `2px solid ${theme.accent}` : styles.listItem.borderTop, transition: 'border 0.1s', userSelect: 'none', WebkitUserSelect: 'none', flexDirection: 'column', alignItems: 'stretch' }} 
                    draggable={!isMobile && (canEdit && !isParent && ['setlists', 'master-setlists', 'events', 'tours'].includes(tab))} 
                    onDragStart={() => setDraggedIndex(index)} 
                    onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }} 
                    onDragOver={e => { e.preventDefault(); setDragOverIndex(index); }} 
                    onDrop={e => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) onMove(draggedIndex, 'down', index); setDraggedIndex(null); setDragOverIndex(null); }} 
                    onDragEnter={e => { e.preventDefault(); setDragOverIndex(index); }} 
                    onDragLeave={() => setDragOverIndex(null)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      {showReorder && (
                        <div 
                          className="reorder-handle"
                          onTouchStart={() => setDraggedIndex(index)}
                          onTouchMove={(e) => {
                            const touch = e.touches[0];
                            const el = document.elementFromPoint(touch.clientX, touch.clientY);
                            const li = el?.closest('li');
                            if (li) {
                              const idx = parseInt(li.getAttribute('data-index') || '-1');
                              if (idx !== -1 && idx !== index) setDragOverIndex(idx);
                            }
                          }}
                          onTouchEnd={() => {
                            if (dragOverIndex !== null && index !== dragOverIndex) {
                              onMove(index, 'down', dragOverIndex);
                            }
                            setDraggedIndex(null);
                            setDragOverIndex(null);
                          }}
                          style={{ fontSize: 24, color: theme.muted, cursor: 'grab', padding: '0 8px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                        >
                          ⣿
                        </div>
                      )}
                      
                      {!isMobile && showReorder && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button style={{ background: 'transparent', border: 'none', color: !canMoveUp ? theme.muted : theme.accent, cursor: !canMoveUp ? 'default' : 'pointer', padding: 0, fontSize: 10 }} onClick={() => onMove(index, 'up')} disabled={!canMoveUp}>▲</button>
                          <button style={{ background: 'transparent', border: 'none', color: !canMoveDown ? theme.muted : theme.accent, cursor: !canMoveDown ? 'default' : 'pointer', padding: 0, fontSize: 10 }} onClick={() => onMove(index, 'down')} disabled={!canMoveDown}>▼</button>
                        </div>
                      )}

                      {tab === 'setlists' && !isParent && (
                          <button 
                            disabled={!canEdit}
                            style={{ background: 'transparent', border: 'none', cursor: !canEdit ? 'default' : 'pointer', marginRight: 8, padding: '8px', opacity: (!canEdit && !rel.linked_to) ? 0 : 1, display: 'flex', alignItems: 'center', color: rel.linked_to ? theme.accent : theme.muted }} 
                            onClick={(e) => {
                                if (!canEdit) return;
                                e.stopPropagation();
                                const nextSongId = list[index + 1]?.id || null;
                                onToggleLink(rel.id, rel.linked_to ? null : nextSongId);
                            }}
                          >
                              {rel.linked_to ? <ArrowLinkedSVG /> : <ArrowUnlinkedSVG />}
                          </button>
                      )}

                      <span style={{ ...styles.link, color: past ? theme.muted : theme.accent, textDecoration: past ? 'line-through' : 'none', flex: 1, fontSize: isMobile ? 16 : 14 }} onClick={() => onNavigate(rTab, rel.id, false)}>
                        {label}{hasHigh ? '*' : ''} {rel.artist ? `(${rel.artist})` : ''} {rel.key ? ` • ${rel.key}` : ''} {rel.type === 'master' ? <span style={styles.badge}>MASTER</span> : ''}
                      </span>
                      
                      {isMobile ? (
                        <button 
                            style={{ ...styles.button, background: 'transparent', color: theme.text, fontSize: 24, padding: '0 8px', minWidth: 44, minHeight: 44 }}
                            onClick={() => setActiveMenuId(activeMenuId === rel.id ? null : rel.id)}
                        >
                            {activeMenuId === rel.id ? '✕' : '⋮'}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                            {tab === 'events' && !isParent && (
                            <button style={{ ...styles.button, background: 'transparent', color: theme.accent, border: `1px solid ${theme.accent}` }} onClick={() => onPrint(rel.id)} title="Print this setlist">Print</button>
                            )}
                            {canEdit && <button style={{ ...styles.button, background: 'transparent', color: theme.danger, border: `1px solid ${theme.danger}` }} onClick={() => onUnassign(rel.id, rel.type)}>Remove</button>}
                        </div>
                      )}
                    </div>                    

                    {activeMenuId === rel.id && (
                      <div style={{ background: theme.surface, borderRadius: 8, marginTop: 8, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, fontWeight: 600, color: theme.textHighlight, fontSize: 14 }}>{label}</div>
                        <div style={{ ...styles.menuItem, padding: '12px 16px', fontSize: 14 }} onClick={() => { onNavigate(rTab, rel.id, false); setActiveMenuId(null); }}>
                          <span style={{ fontSize: 18 }}>👁️</span> View Details
                        </div>
                        {tab === 'events' && !isParent && (
                          <div style={{ ...styles.menuItem, padding: '12px 16px', fontSize: 14 }} onClick={() => { onPrint(rel.id); setActiveMenuId(null); }}>
                            <span style={{ fontSize: 18 }}>🖨️</span> Print Setlist
                          </div>
                        )}
                        {canEdit && (
                          <div style={{ ...styles.menuItem, padding: '12px 16px', fontSize: 14, color: theme.danger }} onClick={() => { onUnassign(rel.id, rel.type); setActiveMenuId(null); }}>
                            <span style={{ fontSize: 18 }}>❌</span> Remove Relationship
                          </div>
                        )}
                        <div style={{ ...styles.menuItem, padding: '12px 16px', fontSize: 14, borderTop: `1px solid ${theme.border}`, justifyContent: 'center', color: theme.muted }} onClick={() => setActiveMenuId(null)}>
                          Close
                        </div>
                      </div>
                    )}
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
