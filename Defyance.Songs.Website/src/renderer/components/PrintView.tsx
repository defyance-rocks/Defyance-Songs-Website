import React from 'react';
import { Song, SetList, MasterSetList, Event } from '../../shared/models';
import { theme } from '../styles';

interface PrintViewProps {
  songs: Song[];
  setlists: SetList[];
  masterSetlists: MasterSetList[];
  events: Event[];
  tab: string;
  item: any;
  activePrintId: string | null;
  styles: { [key: string]: React.CSSProperties };
  onClose: () => void;
}

export const renderSongListPrint = (songsToPrint: Song[], h1: string, h2?: string, onClose?: () => void, styles?: any) => {
  const hasHighRange = songsToPrint.some(s => s.vocalRange === 'High');
  const count = songsToPrint.length;
  
  let fontSize = '36pt';
  if (count > 15) fontSize = '28pt';
  if (count > 22) fontSize = '22pt';
  if (count > 30) fontSize = '18pt';

  return (
    <div key={h1+h2} style={{ 
      pageBreakAfter: 'always', 
      padding: '20px 40px', 
      background: '#fff', 
      color: '#000', 
      height: '98vh', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
      boxSizing: 'border-box' 
    }}>
      <div style={{ borderBottom: '5px solid #000', marginBottom: 15, paddingBottom: 10 }}>
        <h1 style={{ margin: 0, fontSize: '42pt', lineHeight: 1, fontWeight: '900', textTransform: 'uppercase' }}>{h1}</h1>
        {h2 && <h2 style={{ margin: '5px 0 0 0', fontSize: '24pt', fontWeight: '700', textTransform: 'uppercase', opacity: 0.8 }}>{h2}</h2>}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {songsToPrint.map((s, i) => (
            <li key={s.id+i} style={{ 
              fontSize: fontSize, 
              lineHeight: '1.1', 
              marginBottom: 8, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              textTransform: 'uppercase', 
              fontWeight: '900' 
            }}>
              <span style={{ marginRight: 20, opacity: 0.3, display: 'inline-block', width: '1.5em' }}>{i+1}</span>
              {s.name}{s.vocalRange === 'High' ? '*' : ''}
            </li>
          ))}
        </ul>
      </div>
      {hasHighRange && (
        <div style={{ borderTop: '5px solid #000', paddingTop: 10, fontSize: '28pt', fontWeight: '900', letterSpacing: '2px' }}>
          *DETUNE
        </div>
      )}
      <div className="no-print" style={{ position: 'fixed', top: 20, right: 40 }}>
        <button style={{ ...styles.button, background: '#000', color: '#fff', marginRight: 10 }} onClick={() => window.print()}>PRINT</button>
        <button style={{ ...styles.button, background: '#eee', color: '#000', border: '1px solid #000' }} onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
};

export const PrintView: React.FC<PrintViewProps> = ({ songs, setlists, masterSetlists, events, tab, item, activePrintId, styles, onClose }) => {
  if (!item) return null;
  if (tab === 'setlists' || tab === 'printouts') {
    const sl = item as SetList;
    let eventName = '';
    if (sl.eventId) {
      eventName = events.find(e => e.id === sl.eventId)?.name || '';
    } else if (sl.masterSetlistId) {
      const msl = masterSetlists.find(m => m.id === sl.masterSetlistId);
      if (msl?.eventId) {
        eventName = events.find(e => e.id === msl.eventId)?.name || '';
      } else if (msl) {
        eventName = msl.name;
      }
    }
    return renderSongListPrint(sl.songs.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[], eventName, sl.name, onClose, styles);
  }
  if (tab === 'master-setlists') {
    const msl = item as MasterSetList;
    let eventName = '';
    if (msl.eventId) {
      eventName = events.find(e => e.id === msl.eventId)?.name || '';
    }
    const all: Song[] = []; msl.setlists.forEach(id => { const sl = setlists.find(s => s.id === id); if (sl) sl.songs.forEach(sid => { const s = songs.find(x => x.id === sid); if (s) all.push(s); }); });
    return renderSongListPrint(all, eventName || msl.name, eventName ? msl.name : '', onClose, styles);
  }
  if (tab === 'events') {
    const ev = item as Event;
    const targetSetLists = activePrintId ? ev.setLists.filter(e => e.id === activePrintId) : ev.setLists;
    return <div style={{ background: '#fff' }}>{targetSetLists.map((e, i) => {
      const sl = e.type === 'setlist' ? setlists.find(s => s.id === e.id) : masterSetlists.find(m => m.id === e.id);
      if (!sl) return null;
      let sToP: Song[] = [];
      if (e.type === 'setlist') sToP = (sl as SetList).songs.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
      else (sl as MasterSetList).setlists.forEach(id => { const sll = setlists.find(s => s.id === id); if (sll) sll.songs.forEach(sid => { const s = songs.find(x => x.id === sid); if (s) sToP.push(s); }); });
      return renderSongListPrint(sToP, ev.name, sl.name, onClose, styles);
    })}</div>;
  }
  return null;
};
