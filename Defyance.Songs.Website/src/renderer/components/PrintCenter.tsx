import React from 'react';
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
          <button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => onPrint('events', e.id)}>Print Setlists</button>
        </li>
      ))}</ul>
      <h3 style={styles.subHeading}>Master SetLists</h3>
      <ul style={styles.list}>{masterSetlists.map(m => (<li key={m.id} style={styles.listItem}><span>{m.name}</span><button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => onPrint('master-setlists', m.id)}>Print Floor View</button></li>))}</ul>
      <h3 style={styles.subHeading}>Individual SetLists</h3>
      <ul style={styles.list}>{setlists.map(sl => (<li key={sl.id} style={styles.listItem}><span>{getSetlistLabel(sl, events, masterSetlists)}</span><button style={{ ...styles.button, background: theme.accent, color: '#fff' }} onClick={() => onPrint('setlists', sl.id)}>Print Set</button></li>))}</ul>
    </div>
  );
};
