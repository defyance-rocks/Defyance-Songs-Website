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

export const renderSongListPrint = (songsToPrint: Song[], h1: string, h2: string | undefined, highVis: boolean, onClose?: () => void, styles?: any) => {
  const hasHighRange = songsToPrint.some(s => s.vocalRange === 'High');
  
  const stylesObj: { [key: string]: React.CSSProperties } = highVis ? {
    container: { padding: '20px', background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '24pt', lineHeight: '1.4' },
    title: { fontSize: '14pt', margin: 0, textTransform: 'uppercase' },
    subtitle: { fontSize: '14pt', margin: '0 0 10px 0', fontWeight: 'bold' },
    item: { fontSize: '24pt', marginBottom: '10px' },
    footer: { fontSize: '14pt', marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }
  } : {
    container: { pageBreakAfter: 'always', padding: '40px 60px', background: '#fff', color: '#000', minHeight: '95vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' },
    title: { margin: 0, fontSize: '48pt', lineHeight: 1.1, fontWeight: '900', textTransform: 'uppercase' },
    subtitle: { margin: '15px 0 0 0', fontSize: '32pt', fontWeight: '800', textTransform: 'uppercase', color: '#333' },
    item: { fontSize: '36pt', lineHeight: '1.2', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #eee', textTransform: 'uppercase', fontWeight: '900', display: 'flex' },
    footer: { borderTop: '6px solid #000', marginTop: 30, paddingTop: 20, fontSize: '32pt', fontWeight: '900', textTransform: 'uppercase' }
  };

  return (
    <div style={stylesObj.container}>
      <div style={{ marginBottom: highVis ? 20 : 30 }}>
        <h1 style={stylesObj.title}>{h1}</h1>
        {h2 && <h2 style={stylesObj.subtitle}>{h2}</h2>}
      </div>
      <div style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {songsToPrint.map((s, i) => (
            <li key={s.id+i} style={stylesObj.item}>
              {!highVis && <span style={{ marginRight: 30, opacity: 0.5, width: '1.2em' }}>{i+1}</span>}
              {s.name}{s.vocalRange === 'High' ? '*' : ''}
              {s.linked_to && <span style={{ marginLeft: 15, fontSize: '0.6em', opacity: 0.6 }}>↓</span>}
            </li>))}
        </ul>
      </div>
      <div style={stylesObj.footer}>
        {hasHighRange && <div>*HIGH RANGE: DETUNE</div>}
        <div>Defyance Songs v1.0 • {new Date().toLocaleDateString()}</div>
      </div>
      {onClose && (
        <div className="no-print" style={{ position: 'fixed', top: 20, right: 40 }}>
          <button style={{ ...styles.button, background: '#000', color: '#fff', marginRight: 10, padding: '15px 30px', fontSize: '18pt' }} onClick={() => window.print()}>PRINT</button>
          <button style={{ ...styles.button, background: '#eee', color: '#000', border: '1px solid #000', padding: '15px 30px', fontSize: '18pt' }} onClick={onClose}>CLOSE</button>
        </div>
      )}
    </div>
  );
};

export const PrintView: React.FC<PrintViewProps> = ({ songs, setlists, masterSetlists, events, tab, item, activePrintId, styles, onClose }) => {
  if (!item) return null;
  const urlParams = new URLSearchParams(window.location.search);
  const highVis = urlParams.get('highVis') === 'true';

  if (tab === 'setlists' || tab === 'printouts') {
    const sl = item as SetList;
    let eventName = '';
    if (sl.eventId) eventName = events.find(e => e.id === sl.eventId)?.name || '';
    else if (sl.masterSetlistId) {
      const msl = masterSetlists.find(m => m.id === sl.masterSetlistId);
      if (msl?.eventId) eventName = events.find(e => e.id === msl.eventId)?.name || '';
      else if (msl) eventName = msl.name;
    }
    return renderSongListPrint(sl.songs.map((s: any) => { 
        const so = songs.find(so => so.id === s.id);
        return so ? {...so, linked_to: s.linked_to} : null;
    }).filter(Boolean) as Song[], eventName, sl.name, highVis, onClose, styles);
  }
  if (tab === 'master-setlists') {
    const msl = item as MasterSetList;
    let eventName = '';
    if (msl.eventId) eventName = events.find(e => e.id === msl.eventId)?.name || '';
    const all: Song[] = []; msl.setlists.forEach(id => { const sl = setlists.find(s => s.id === id); if (sl) sl.songs.forEach(s => { const so = songs.find(x => x.id === s.id); if (so) all.push({...so, linked_to: s.linked_to}); }); });
    return renderSongListPrint(all, eventName || msl.name, eventName ? msl.name : '', highVis, onClose, styles);
  }
  if (tab === 'events') {
    const ev = item as Event;
    const targetSetLists = activePrintId ? ev.setLists.filter(e => e.id === activePrintId) : ev.setLists;
    return <div style={{ background: '#fff' }}>{targetSetLists.map((e, i) => {
      const sl = e.type === 'setlist' ? setlists.find(s => s.id === e.id) : masterSetlists.find(m => m.id === e.id);
      if (!sl) return null;
      let sToP: Song[] = [];
      if (e.type === 'setlist') sToP = (sl as SetList).songs.map((s: any) => { const so = songs.find(so => so.id === s.id); return so ? {...so, linked_to: s.linked_to} : null; }).filter(Boolean) as Song[];
      else (sl as MasterSetList).setlists.forEach(id => { const sll = setlists.find(s => s.id === id); if (sll) sll.songs.forEach(s => { const so = songs.find(x => x.id === s.id); if (so) sToP.push({...so, linked_to: s.linked_to}); }); });
      return renderSongListPrint(sToP, ev.name, sl.name, highVis, onClose, styles);
    })}</div>;
  }
  return null;
};
