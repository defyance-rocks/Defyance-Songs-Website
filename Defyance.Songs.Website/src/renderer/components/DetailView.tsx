// @ts-nocheck
import React from 'react';
import { 
  NavState, Musician, Song, SetList, Event, Tour, MasterSetList 
} from '../../shared/models';
import { theme } from '../styles';
import { formatDate, isPast, getSetlistLabel, getMasterSetlistLabel } from '../utils';

interface DetailViewProps {
  tab: NavState['tab'];
  item: any;
  available: any[];
  currentRelationships: any[];
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
  onNavigate: (tab: NavState['tab'], id: string, edit: boolean) => void;
  setDraggedIndex: (index: number | null) => void;
  setDragOverIndex: (index: number | null) => void;
  events: Event[];
  masterSetlists: MasterSetList[];
}

export const DetailView: React.FC<DetailViewProps> = ({
  tab, item, available, currentRelationships, assignId, assignSearch, 
  draggedIndex, dragOverIndex, styles, onBack, onEdit, onPrint, 
  onAssignIdChange, onAssignSearchChange, onAssign, onUnassign, 
  onMove, onNavigate, setDraggedIndex, setDragOverIndex, events, masterSetlists
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
            <button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={onEdit}>Edit Details</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
          {tab === 'musicians' && (<><div><label style={styles.label}>Email</label><p>{(item as Musician).email || 'N/A'}</p></div><div><label style={styles.label}>Phone</label><p>{(item as Musician).phone || 'N/A'}</p></div><div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Bio</label><p>{(item as Musician).bio || 'No bio provided.'}</p></div></>)}
          {tab === 'songs' && (<><div><label style={styles.label}>Artist</label><p>{(item as Song).artist}</p></div><div><label style={styles.label}>Vocal Range</label><p>{(item as Song).vocalRange || 'N/A'}</p></div><div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Notes</label><p>{(item as Song).notes || 'None'}</p></div>{(item as Song).link && <div><label style={styles.label}>Link</label><a href={(item as Song).link} target="_blank" rel="noreferrer" style={styles.link}>{(item as Song).link}</a></div>}</>)}
          {tab === 'events' && (<><div><label style={styles.label}>Location</label><p>{(item as Event).location}</p></div><div><label style={styles.label}>Date</label><p>{(item as Event).date}</p></div><div><label style={styles.label}>Time</label><p>{(item as Event).time}</p></div></>)}
        </div>
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 24 }}>
          <h3 style={styles.subHeading}>Relationships</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input style={{ ...styles.input, marginBottom: 0, flex: 2 }} placeholder="Search..." value={assignSearch} onChange={e => onAssignSearchChange(e.target.value)} />
            <select style={{ ...styles.input, marginBottom: 0, flex: 3 }} value={assignId} onChange={e => onAssignIdChange(e.target.value)}>
              <option value="">Select...</option>
              {available.map((avail: any, index: number) => {
                const label = avail.name || 'Unnamed';
                const val = avail.type ? `${avail.type}:${avail.id}` : (avail.id || '');
                return (<option key={`${index}`} value={`${val}`}>{label}</option>);
              })}
            </select>
            <button style={{ ...styles.button, background: theme.success, color: '#fff', flex: 1 }} onClick={onAssign}>Assign</button>
          </div>
          <ul style={styles.list}>{currentRelationships.map((rel: any, index: number) => {
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
            const isRelSong = tab === 'setlists' && !rel.type;
            const hasHigh = isRelSong && rel.vocalRange === 'High';

            return (
              <li 
                key={`${rel.type || 'single'}:${rel.id || index}:${index}`} 
                style={{ ...styles.listItem, opacity: draggedIndex === index ? 0.5 : (past ? 0.4 : 1), cursor: (['setlists', 'master-setlists', 'events', 'tours'].includes(tab)) ? 'grab' : 'default', borderTop: dragOverIndex === index && draggedIndex !== index ? `2px solid ${theme.accent}` : styles.listItem.borderTop, transition: 'border 0.1s' }} 
                draggable={(['setlists', 'master-setlists', 'events', 'tours'].includes(tab))} 
                onDragStart={() => setDraggedIndex(index)} 
                onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }} 
                onDragOver={e => { e.preventDefault(); setDragOverIndex(index); }} 
                onDrop={e => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) onMove(draggedIndex, 'down', index); setDraggedIndex(null); setDragOverIndex(null); }} 
                onDragEnter={e => { e.preventDefault(); setDragOverIndex(index); }} 
                onDragLeave={() => setDragOverIndex(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {(['setlists', 'master-setlists', 'events', 'tours'].includes(tab) && !rel.type?.startsWith('parent')) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button style={{ background: 'transparent', border: 'none', color: index === 0 ? theme.muted : theme.accent, cursor: index === 0 ? 'default' : 'pointer', padding: 0, fontSize: 10 }} onClick={() => onMove(index, 'up')} disabled={index === 0}>▲</button>
                      <button style={{ background: 'transparent', border: 'none', color: index === currentRelationships.length - 1 ? theme.muted : theme.accent, cursor: index === currentRelationships.length - 1 ? 'default' : 'pointer', padding: 0, fontSize: 10 }} onClick={() => onMove(index, 'down')} disabled={index === currentRelationships.length - 1}>▼</button>
                    </div>
                  )}
                  <span style={{ ...styles.link, color: past ? theme.muted : theme.accent, textDecoration: past ? 'line-through' : 'none' }} onClick={() => onNavigate(rTab, rel.id, false)}>
                    {label}{hasHigh ? '*' : ''} {rel.artist ? `(${rel.artist})` : ''} {rel.type === 'master' ? <span style={styles.badge}>MASTER</span> : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {tab === 'events' && !rel.type?.startsWith('parent') && (
                    <button style={{ ...styles.button, background: 'transparent', color: theme.accent, border: `1px solid ${theme.accent}` }} onClick={() => onPrint(rel.id)} title="Print this setlist">Print</button>
                  )}
                  <button style={{ ...styles.button, background: theme.danger, color: '#fff' }} onClick={() => onUnassign(rel.id, rel.type)}>Remove</button>
                </div>
              </li>
            );
          })}</ul>
        </div>
      </div>
    </div>
  );
};
