import React, { useState } from 'react';
import { Event, MasterSetList, SetList } from '../../shared/models';
import { theme } from '../styles';
import { formatDate, isPast, getSetlistLabel } from '../utils';

interface PrintCenterProps {
  events: Event[];
  masterSetlists: MasterSetList[];
  setlists: SetList[];
  styles: { [key: string]: React.CSSProperties };
  onPrint: (tab: any, id: string) => void;
}

export const PrintCenter: React.FC<PrintCenterProps> = ({ events, masterSetlists, setlists, styles, onPrint }) => {
  const [highVis, setHighVis] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredEvents = events.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()));
  const filteredMasters = masterSetlists.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));
  const filteredSetlists = setlists.filter(sl => sl.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Print Center</h2>
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input style={{ ...styles.input, marginBottom: 0 }} placeholder="Search playlists..." value={filter} onChange={e => setFilter(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={highVis} onChange={e => setHighVis(e.target.checked)} />
          High Visibility Mode
        </label>
      </div>

      <h3 style={styles.subHeading}>Upcoming Events</h3>
      <ul style={styles.list}>{filteredEvents.map(e => {
        const hasContent = e.setLists.length > 0;
        return (
          <li key={e.id} style={{ ...styles.listItem, marginBottom: 4 }}>
            <span>{e.name}{e.date ? ` (${formatDate(e.date)})` : ''}</span>
            <button disabled={!hasContent} style={{ ...styles.button, background: hasContent ? theme.accent : theme.muted, color: '#fff', cursor: hasContent ? 'pointer' : 'default' }} onClick={() => onPrint('events', e.id + (highVis ? '?highVis=true' : ''))}>Print</button>
          </li>
        );
      })}</ul>

      <h3 style={styles.subHeading}>Master SetLists</h3>
      <ul style={styles.list}>{filteredMasters.map(m => {
        const ev = events.find(e => e.id === m.eventId);
        const hasContent = m.setlists.length > 0;
        return (
          <li key={m.id} style={{ ...styles.listItem, marginBottom: 4 }}>
            <span>{ev ? `[${ev.name}] - ` : ''}{m.name}</span>
            <button disabled={!hasContent} style={{ ...styles.button, background: hasContent ? theme.accent : theme.muted, color: '#fff', cursor: hasContent ? 'pointer' : 'default' }} onClick={() => onPrint('master-setlists', m.id + (highVis ? '?highVis=true' : ''))}>Print</button>
          </li>
        );
      })}</ul>

      <h3 style={styles.subHeading}>Individual SetLists</h3>
      <ul style={styles.list}>{filteredSetlists.map(sl => {
        const hasContent = sl.songs.length > 0;
        return (
          <li key={sl.id} style={{ ...styles.listItem, marginBottom: 4 }}>
            <span>{getSetlistLabel(sl, events, masterSetlists)}</span>
            <button disabled={!hasContent} style={{ ...styles.button, background: hasContent ? theme.accent : theme.muted, color: '#fff', cursor: hasContent ? 'pointer' : 'default' }} onClick={() => onPrint('setlists', sl.id + (highVis ? '?highVis=true' : ''))}>Print</button>
          </li>
        );
      })}</ul>
    </div>
  );
};
