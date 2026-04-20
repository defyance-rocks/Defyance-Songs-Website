import React from 'react';
import { NavState, Song, Event, SetList, MasterSetList, Tour } from '../../shared/models';
import { theme } from '../styles';
import { formatDate, isPast, getSetlistLabel, getMasterSetlistLabel, getEventLabel } from '../utils';

interface ListViewProps {
  tab: NavState['tab'];
  data: any[];
  songsSearch: string;
  onSearchChange: (val: string) => void;
  onNavigate: (tab: NavState['tab'], id: string | null, edit: boolean) => void;
  onDelete: (id: string) => void;
  styles: { [key: string]: React.CSSProperties };
  events: Event[];
  tours: Tour[];
  setlists: SetList[];
  masterSetlists: MasterSetList[];
}

export const ListView: React.FC<ListViewProps> = ({ 
  tab, data, songsSearch, onSearchChange, onNavigate, onDelete, styles, 
  events, tours, setlists, masterSetlists 
}) => {
  let filtered = [...data];
  if (tab === 'songs') {
    if (songsSearch) filtered = data.filter((s: Song) => s.name.toLowerCase().includes(songsSearch.toLowerCase()) || s.artist.toLowerCase().includes(songsSearch.toLowerCase()));
    filtered.sort((a: Song, b: Song) => a.name.localeCompare(b.name));
  }
  
  if (tab === 'events') {
    filtered.sort((a: Event, b: Event) => {
      if (a.tourId && !b.tourId) return 1;
      if (!a.tourId && b.tourId) return -1;
      if (a.tourId && b.tourId && a.tourId !== b.tourId) {
        const tA = tours.find(t => t.id === a.tourId)?.name || '';
        const tB = tours.find(t => t.id === b.tourId)?.name || '';
        return tA.localeCompare(tB);
      }
      if (!a.date && !b.date) return 0;
      if (!a.date) return -1;
      if (!b.date) return 1;
      return a.date.localeCompare(b.date);
    });
  }

  if (tab === 'setlists') {
    filtered.sort((a: SetList, b: SetList) => {
      const parentA = a.eventId || a.masterSetlistId;
      const parentB = b.eventId || b.masterSetlistId;
      if (parentA && !parentB) return 1;
      if (!parentA && parentB) return -1;
      if (parentA && parentB) {
        const labelA = getSetlistLabel(a, events, masterSetlists);
        const labelB = getSetlistLabel(b, events, masterSetlists);
        return labelA.localeCompare(labelB);
      }
      return a.name.localeCompare(b.name);
    });
  }

  if (tab === 'master-setlists') {
    filtered.sort((a: MasterSetList, b: MasterSetList) => {
      if (a.eventId && !b.eventId) return 1;
      if (!a.eventId && b.eventId) return -1;
      if (a.eventId && b.eventId) {
        const labelA = getMasterSetlistLabel(a, events);
        const labelB = getMasterSetlistLabel(b, events);
        return labelA.localeCompare(labelB);
      }
      return a.name.localeCompare(b.name);
    });
  }

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={styles.heading}>{tab.toUpperCase()}</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {tab === 'songs' && <input style={{ ...styles.input, marginBottom: 0, width: 250 }} placeholder="Search..." value={songsSearch} onChange={e => onSearchChange(e.target.value)} />}
          <button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => onNavigate(tab, null, true)}>+ NEW</button>
        </div>
      </div>
      <ul style={styles.list}>{filtered.map(item => {
        const isEvent = tab === 'events'; const past = isEvent && isPast((item as Event).date);
        const dateLabel = isEvent && (item as Event).date ? ` (${formatDate((item as Event).date)})` : '';
        
        let label = item.name;
        if (tab === 'setlists') label = getSetlistLabel(item as SetList, events, masterSetlists);
        else if (tab === 'master-setlists') label = getMasterSetlistLabel(item as MasterSetList, events);
        else if (tab === 'events') label = getEventLabel(item as Event, tours) + dateLabel;

        return (
          <li key={item.id} style={{ ...styles.listItem, opacity: past ? 0.4 : 1 }}>
            <span style={{ fontWeight: 500, cursor: 'pointer', color: past ? theme.muted : theme.textHighlight, textDecoration: past ? 'line-through' : 'none' }} onClick={() => onNavigate(tab, item.id, false)}>
              {label}{tab === 'songs' && item.vocalRange === 'High' ? '*' : ''}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...styles.button, background: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }} onClick={() => onNavigate(tab, item.id, true)}>Edit</button>
              <button style={{ ...styles.button, background: theme.danger, color: '#fff' }} onClick={() => onDelete(item.id)}>Delete</button>
            </div>
          </li>
        );
      })}</ul>
    </div>
  );
};
