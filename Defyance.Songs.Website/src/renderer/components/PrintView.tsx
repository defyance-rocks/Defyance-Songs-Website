import React, { useState } from 'react';
import { Song, SetList, MasterSetList, Event, AppEntity } from '../../shared/models';
import { theme } from '../styles';
import { formatDate } from '../utils';
import { pdf } from '@react-pdf/renderer';
import { SetlistPDF } from './PDFDocument';

interface PrintViewProps {
  songs: Song[];
  setlists: SetList[];
  masterSetlists: MasterSetList[];
  events: Event[];
  tab: string;
  item: AppEntity | null;
  activePrintId: string | null;
  styles: { [key: string]: React.CSSProperties };
  onClose: () => void;
}

const ArrowDownSVG = () => (
  <svg viewBox="0 0 24 24" style={{ width: '1.5em', height: '1.5em', marginLeft: '1.5em', flexShrink: 0 }}>
    <path 
      d="M12 21l-7-7h4V4h6v10h4l-7 7z" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

const truncateToWord = (text: string, isDated: boolean, hasArrow: boolean) => {
    const limit = isDated ? (hasArrow ? 22 : 28) : (hasArrow ? 28 : 35);
    if (text.length <= limit) return text;
    const sub = text.substring(0, limit);
    const lastSpace = sub.lastIndexOf(' ');
    return (lastSpace > 2 ? sub.substring(0, lastSpace) : sub) + '...';
};

export const renderSongListPrint = (
    songsToPrint: Song[], 
    h1: string, 
    h2: string | undefined, 
    h3: string | undefined,
    isDated: boolean,
    highVis: boolean, 
    onClose?: () => void, 
    styles?: any,
    allDatasets?: {songs: Song[], h1: string, h2?: string, h3?: string, isDated: boolean}[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const hasHighRange = songsToPrint.some(s => s.vocalRange === 'High');
  const isMobile = window.innerWidth < 768;
  const scale = isMobile ? (window.innerWidth / 816) : 1;

  const handleOpenPDF = async () => {
    setIsGenerating(true);
    try {
        const doc = <SetlistPDF datasets={allDatasets || [{songs: songsToPrint, h1, h2, h3, isDated}]} />;
        const blob = await pdf(doc).toBlob();
        // Use File constructor to hint the filename to the browser
        const file = new File([blob], `${h1.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    } catch (err) {
        console.error('PDF generation failed:', err);
    } finally {
        setIsGenerating(false);
    }
  };
  
  const stylesObj: { [key: string]: React.CSSProperties } = {
    wrapper: {
        width: '100%',
        background: isMobile ? '#fff' : '#333',
        padding: isMobile ? '0' : '40px 0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMobile ? 'flex-start' : 'center',
        position: 'relative'
    },
    container: { 
      padding: isDated ? '30pt 40pt' : '15pt 20pt', 
      background: '#fff', 
      color: '#000', 
      width: '8.5in',
      minHeight: '11in',
      fontFamily: 'Arial, sans-serif', 
      boxSizing: 'border-box',
      textAlign: isDated ? 'center' : 'left',
      position: 'relative',
      transform: isMobile ? `scale(${scale})` : 'none',
      transformOrigin: 'top left',
      boxShadow: isMobile ? 'none' : '0 0 20px rgba(0,0,0,0.5)',
    },
    header: { marginBottom: isDated ? '15pt' : '5pt' },
    title: { 
        margin: 0, 
        fontSize: isDated ? '32pt' : '20pt', 
        lineHeight: 1.1, 
        fontWeight: '900', 
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    subtitleLine: { 
        margin: '2pt 0 0 0', 
        fontSize: isDated ? '20pt' : '16pt', 
        fontWeight: '800', 
        textTransform: 'uppercase', 
        color: '#333' 
    },
    listContainer: { textAlign: 'left', marginTop: '10pt' },
    item: { 
        fontSize: isDated ? '28pt' : '24pt', 
        lineHeight: '1.05', 
        marginBottom: '6pt', 
        textTransform: 'uppercase', 
        fontWeight: '900', 
        display: 'flex',
        pageBreakInside: 'avoid',
        alignItems: 'center',
        hyphens: 'none'
    },
    footer: { 
        borderTop: isDated ? '2pt solid #000' : 'none', 
        marginTop: '10pt', 
        paddingTop: '5pt', 
        fontSize: isDated ? '16pt' : '10pt', 
        fontWeight: '800', 
        textTransform: 'uppercase',
        textAlign: 'left'
    }
  };

  if (highVis) {
      stylesObj.item = { ...stylesObj.item, fontSize: '36pt', marginBottom: '12pt' };
      stylesObj.title = { ...stylesObj.title, fontSize: '44pt' };
  }

  const controlsStyle: React.CSSProperties = isMobile ? {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      background: 'rgba(0,0,0,0.9)',
      padding: '16px',
      display: 'flex',
      gap: 12,
      zIndex: 10000,
      justifyContent: 'center',
      borderTop: '1px solid #444'
  } : {
      position: 'fixed',
      top: 20,
      right: 20,
      display: 'flex',
      gap: 10,
      zIndex: 10000
  };

  return (
    <div style={stylesObj.wrapper} className="no-bg-on-print">
      <style>{`
        @media print {
          .no-bg-on-print { background: none !important; padding: 0 !important; display: block !important; }
          .print-canvas { transform: none !important; margin: 0 !important; box-shadow: none !important; width: 8.5in !important; min-height: 0 !important; }
          @page { margin: 0.5in; }
        }
      `}</style>
      <div style={{ width: isMobile ? '100%' : '8.5in', overflow: 'visible' }} className="no-print-container">
        <div style={stylesObj.container} className="print-canvas">
            <div style={stylesObj.header}>
            {isDated && <div style={{ fontSize: '20pt', fontWeight: '900', color: '#666', textTransform: 'uppercase', marginBottom: '2pt' }}>Defyance</div>}
            <h1 style={stylesObj.title}>{h1}</h1>
            {(h2 || h3) && (
                <div style={stylesObj.subtitleLine}>
                {h2}{h2 && h3 ? ' • ' : ''}{h3}
                </div>
            )}
            </div>
            <div style={stylesObj.listContainer}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {songsToPrint.map((s, i) => (
                <li key={s.id+i} style={stylesObj.item}>
                    <span style={{ marginRight: '15pt', opacity: 0.5, width: '1.4em', flexShrink: 0 }}>{i+1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', hyphens: 'none' }}>
                            {truncateToWord(s.name, isDated, !!s.linked_to)}{s.vocalRange === 'High' ? '*' : ''}
                        </span>
                        {s.linked_to && <ArrowDownSVG />}
                    </div>
                </li>))}
            </ul>
            </div>
            <div style={stylesObj.footer}>
            {hasHighRange && <div>*DETUNE</div>}
            </div>

        </div>
      </div>
      {onClose && (
        <div className="no-print" style={controlsStyle}>
          <button 
            disabled={isGenerating} 
            style={{ ...styles.button, background: theme.accent, color: '#fff', padding: '12px 24px', flex: isMobile ? 1 : 'none' }}
            onClick={handleOpenPDF}
          >
            {isGenerating ? 'GENERATING...' : 'OPEN PDF'}
          </button>
          <button style={{ ...styles.button, background: '#000', color: '#fff', padding: '12px 24px', flex: isMobile ? 1 : 'none', display: isMobile ? 'none' : 'block' }} onClick={() => window.print()}>PRINT</button>
          <button style={{ ...styles.button, background: theme.surfaceAlt, color: theme.text, border: `1px solid ${theme.border}`, padding: '12px 24px', flex: isMobile ? 1 : 'none' }} onClick={onClose}>CLOSE</button>
        </div>
      )}
    </div>
  );
};

export const PrintView: React.FC<PrintViewProps> = ({ songs, setlists, masterSetlists, events, tab, item, activePrintId, styles, onClose }) => {
  if (!item) return null;
  const urlParams = new URLSearchParams(window.location.search);
  const highVis = urlParams.get('highVis') === 'true';

  const getSongData = (songsList: {id: string, linked_to?: string | null}[]) => {
    return songsList.map(s => {
        const so = songs.find(x => x.id === s.id);
        return so ? {...so, linked_to: s.linked_to} : null;
    }).filter(Boolean) as Song[];
  };

  if (tab === 'setlists' || tab === 'printouts') {
    const sl = item as SetList;
    const ev = events.find(e => e.id === sl.eventId);
    const isDated = !!ev?.date;
    const h1 = ev ? ev.name : sl.name;
    const h2 = ev ? sl.name : undefined;
    const h3 = ev?.date ? formatDate(ev.date) : undefined;

    return renderSongListPrint(getSongData(sl.songs), h1, h2, h3, isDated, highVis, onClose, styles);
  }

  if (tab === 'master-setlists') {
    const msl = item as MasterSetList;
    const ev = events.find(e => e.id === msl.eventId);
    const isDated = !!ev?.date;
    const allSongs: Song[] = [];
    msl.setlists.forEach(slId => {
        const sl = setlists.find(s => s.id === slId);
        if (sl) allSongs.push(...getSongData(sl.songs));
    });

    return renderSongListPrint(allSongs, ev ? ev.name : msl.name, ev ? msl.name : undefined, ev?.date ? formatDate(ev.date) : undefined, isDated, highVis, onClose, styles);
  }

  if (tab === 'events') {
    const ev = item as Event;
    const isDated = !!ev.date;
    const targetSetLists = activePrintId ? ev.setLists.filter(e => e.id === activePrintId) : ev.setLists;
    
    const allDatasets = targetSetLists.map(e => {
        const sl = e.type === 'setlist' ? setlists.find(s => s.id === e.id) : masterSetlists.find(m => m.id === e.id);
        if (!sl) return null;
        
        let sToP: Song[] = [];
        if (e.type === 'setlist') {
            sToP = getSongData((sl as SetList).songs);
        } else {
            (sl as MasterSetList).setlists.forEach(id => {
                const sll = setlists.find(s => s.id === id);
                if (sll) sToP.push(...getSongData(sll.songs));
            });
        }
        return { songs: sToP, h1: ev.name, h2: sl.name, h3: isDated ? formatDate(ev.date) : undefined, isDated };
    }).filter(Boolean) as any[];

    return <div style={{ background: '#fff' }}>{allDatasets.map((ds, i) => (
      renderSongListPrint(ds.songs, ds.h1, ds.h2, ds.h3, ds.isDated, highVis, i === 0 ? onClose : undefined, styles, allDatasets)
    ))}</div>;
  }
  return null;
};
