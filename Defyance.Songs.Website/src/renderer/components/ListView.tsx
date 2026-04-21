import React from 'react';
import { NavState, Song, Event, SetList, MasterSetList, Tour } from '../../shared/models';
import { theme } from '../styles';
import { formatDate, isPast, getSetlistLabel, getMasterSetlistLabel, getEventLabel } from '../utils';

interface ListViewProps {
  tab: NavState['tab'];
  data: any[];
  songsSearch: string;
  onSearchChange: (val: string) => void;
  songSortMode?: 'alpha' | 'artist' | 'unassigned' | 'vocal' | 'key';
  onSongSortChange?: (val: 'alpha' | 'artist' | 'unassigned' | 'vocal' | 'key') => void;
  songFilterId?: string;
  onSongFilterChange?: (val: string) => void;
  songFilterKey?: string;
  onSongFilterKeyChange?: (val: string) => void;
  onNavigate: (tab: NavState['tab'], id: string | null, edit: boolean) => void;
  onDelete: (id: string) => void;
  styles: { [key: string]: React.CSSProperties };
  events: Event[];
  tours: Tour[];
  setlists: SetList[];
  masterSetlists: MasterSetList[];
  readOnly?: boolean;
}

export const ListView: React.FC<ListViewProps> = ({ 
  tab, data, songsSearch, onSearchChange, 
  songSortMode = 'alpha', onSongSortChange, 
  songFilterId = '', onSongFilterChange,
  songFilterKey = '', onSongFilterKeyChange,
  onNavigate, onDelete, styles, 
  events, tours, setlists, masterSetlists,
  readOnly = false
}) => {
  let filtered = [...data];
  let orderedSongs: string[] = [];

  if (tab === 'songs') {
    // 1. Filtering
    if (songsSearch) {
      filtered = filtered.filter((s: Song) => 
        s.name.toLowerCase().includes(songsSearch.toLowerCase()) || 
        s.artist.toLowerCase().includes(songsSearch.toLowerCase())
      );
    }

    if (songFilterId) {
      if (songFilterId === 'unassigned') {
        filtered = filtered.filter(s => !setlists.some(sl => sl.songs.some(sls => sls.id === s.id)));
      } else {
        const [type, id] = songFilterId.split(':');
        if (type === 'setlist') {
          const sl = setlists.find(s => s.id === id);
          if (sl) {
            orderedSongs = sl.songs.map(s => s.id);
            filtered = filtered.filter(s => sl.songs.some(sls => sls.id === s.id));
          }
        } else if (type === 'master') {
          const msl = masterSetlists.find(m => m.id === id);
          if (msl) {
            const allSongsInOrder: string[] = [];
            msl.setlists.forEach(slId => {
              const sl = setlists.find(s => s.id === slId);
              if (sl) sl.songs.forEach(s => {
                  if (!allSongsInOrder.includes(s.id)) allSongsInOrder.push(s.id);
              });
            });
            orderedSongs = allSongsInOrder;
            filtered = filtered.filter(s => allSongsInOrder.includes(s.id));
          }
        }
      }
    }
    
    if (songFilterKey) {
        filtered = filtered.filter(s => s.key === songFilterKey);
    }

    // 2. Sorting
    filtered.sort((a: Song, b: Song) => {
      if (orderedSongs.length > 0) {
          return orderedSongs.indexOf(a.id) - orderedSongs.indexOf(b.id);
      }
      if (songSortMode === 'artist') {
        const art = a.artist.localeCompare(b.artist);
        return art !== 0 ? art : a.name.localeCompare(b.name);
      }
      if (songSortMode === 'vocal') {
        const rangeMap: any = { 'High': 0, 'Low': 1, null: 2, '': 2 };
        const rA = rangeMap[a.vocalRange || ''] ?? 2;
        const rB = rangeMap[b.vocalRange || ''] ?? 2;
        return rA !== rB ? rA - rB : a.name.localeCompare(b.name);
      }
      if (songSortMode === 'key') {
          return (a.key || '').localeCompare(b.key || '');
      }
      if (songSortMode === 'unassigned') {
        const assignedA = setlists.some(sl => sl.songs.some(s => s.id === a.id));
        const assignedB = setlists.some(sl => sl.songs.some(s => s.id === b.id));
        if (assignedA !== assignedB) return assignedA ? 1 : -1;
        return a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
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
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tab === 'songs' ? 12 : 0 }}>
          <h2 style={styles.heading}>{tab.toUpperCase()}</h2>
          {!readOnly && <button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => onNavigate(tab, null, true)}>+ NEW</button>}
        </div>
        
        {tab === 'songs' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <input 
              style={{ ...styles.input, marginBottom: 0, width: '100%', maxWidth: 200 }} 
              placeholder="Search name/artist..." 
              value={songsSearch} 
              onChange={e => onSearchChange(e.target.value)} 
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>SORT:</span>
              <select 
                style={{ ...styles.input, marginBottom: 0, width: 'auto', fontSize: 13, padding: '6px 10px' }}
                value={orderedSongs.length > 0 ? 'setlist' : songSortMode}
                disabled={orderedSongs.length > 0}
                onChange={e => onSongSortChange?.(e.target.value as any)}
              >
                {orderedSongs.length > 0 && <option value="setlist">Setlist Order</option>}
                <option value="alpha">A-Z</option>
                <option value="artist">By Artist</option>
                <option value="unassigned">Unassigned First</option>
                <option value="vocal">Vocal Range</option>
                <option value="key">By Key</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>LIST FILTER:</span>
              <select 
                style={{ ...styles.input, marginBottom: 0, width: 'auto', fontSize: 13, padding: '6px 10px' }}
                value={songFilterId}
                onChange={e => onSongFilterChange?.(e.target.value)}
              >
                <option value="">All Songs</option>
                <option value="unassigned">Unassigned Songs</option>
                <optgroup label="Master Setlists">
                  {masterSetlists.map(m => {
                    const ev = events.find(e => e.id === m.eventId);
                    return <option key={m.id} value={`master:${m.id}`}>{ev ? `[${ev.name}] - ` : ''}{m.name}</option>;
                  })}
                </optgroup>
                <optgroup label="Setlists">
                  {setlists.map(sl => <option key={sl.id} value={`setlist:${sl.id}`}>{getSetlistLabel(sl, events, masterSetlists)}</option>)}
                </optgroup>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>KEY FILTER:</span>
              <select 
                style={{ ...styles.input, marginBottom: 0, width: 'auto', fontSize: 13, padding: '6px 10px' }}
                value={songFilterKey}
                onChange={e => onSongFilterKeyChange?.(e.target.value)}
              >
                <option value="">All Keys</option>
                {['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <ul style={styles.list}>{filtered.map(item => {
        const isEvent = tab === 'events'; const past = isEvent && isPast((item as Event).date);
        const dateLabel = isEvent && (item as Event).date ? ` (${formatDate((item as Event).date)})` : '';
        
        let label = item.name;
        if (tab === 'setlists') label = getSetlistLabel(item as SetList, events, masterSetlists);
        else if (tab === 'master-setlists') label = getMasterSetlistLabel(item as MasterSetList, events);
        else if (tab === 'events') label = getEventLabel(item as Event, tours) + dateLabel;

        const subLabel = tab === 'songs' ? `${(item as Song).artist}${ (item as Song).key ? ` • Key: ${(item as Song).key}` : '' }` : '';

        return (
          <li key={item.id} style={{ ...styles.listItem, opacity: past ? 0.4 : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 500, cursor: 'pointer', color: past ? theme.muted : theme.textHighlight, textDecoration: past ? 'line-through' : 'none' }} onClick={() => onNavigate(tab, item.id, false)}>
                {label}{tab === 'songs' && item.vocalRange === 'High' ? '*' : ''}
              </span>
              {subLabel && <span style={{ fontSize: 12, color: theme.muted }}>{subLabel}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!readOnly && <button style={{ ...styles.button, background: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }} onClick={() => onNavigate(tab, item.id, true)}>Edit</button>}
              {!readOnly && <button style={{ ...styles.button, background: theme.danger, color: '#fff' }} onClick={() => onDelete(item.id)}>Delete</button>}
            </div>
          </li>
        );
      })}</ul>
    </div>
  );
};
