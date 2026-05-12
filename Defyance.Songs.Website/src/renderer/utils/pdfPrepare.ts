import { Song, SetList, MasterSetList, Event, AppEntity } from '../../shared/models';
import { formatDate } from '../utils';

export interface PDFDataset {
  songs: (Song & { label?: string | null })[];
  h1: string;
  h2?: string;
  h3?: string;
  isDated: boolean;
  fontSize?: 'small' | 'medium' | 'large';
}

export const preparePDFData = (
  tab: string,
  item: AppEntity | null,
  songs: Song[],
  setlists: SetList[],
  masterSetlists: MasterSetList[],
  events: Event[],
  activePrintId: string | null
): PDFDataset[] => {
  if (!item) return [];

  const getSongData = (songsList: any[]) => {
    return songsList.map(s => {
        if (s.label) {
            return { id: s.id, name: s.label, artist: '', status: 'Approved', label: s.label };
        }
        const so = songs.find(x => x.id === s.song_id || x.id === s.id);
        return so ? {...so, linked_to: s.linked_to} : null;
    }).filter(Boolean) as (Song & { label?: string | null })[];
  };

  if (tab === 'setlists' || tab === 'printouts') {
    const sl = item as SetList;
    const ev = events.find(e => e.id === sl.eventId);
    const isDated = !!ev?.date;
    const h1 = ev ? ev.name : sl.name;
    const h2 = ev ? sl.name : undefined;
    const h3 = ev?.date ? formatDate(ev.date) : undefined;
    return [{ songs: getSongData(sl.songs), h1, h2, h3, isDated, fontSize: sl.font_size as any }];
  }

  if (tab === 'master-setlists') {
    const msl = item as MasterSetList;
    const ev = events.find(e => e.id === msl.eventId);
    const isDated = !!ev?.date;
    const allSongs: Song[] = [];
    let firstFontSize: any = 'small';
    msl.setlists.forEach((slId, idx) => {
        const sl = setlists.find(s => s.id === slId);
        if (sl) {
            if (idx === 0) firstFontSize = sl.font_size;
            allSongs.push(...getSongData(sl.songs));
        }
    });
    return [{ 
        songs: allSongs, 
        h1: ev ? ev.name : msl.name, 
        h2: ev ? msl.name : undefined, 
        h3: ev?.date ? formatDate(ev.date) : undefined, 
        isDated,
        fontSize: firstFontSize
    }];
  }

  if (tab === 'events') {
    const ev = item as Event;
    // If item is null or not an event (e.g. called with setlist id but tab 'events'), 
    // try to find the event from the events list as a fallback
    const actualEvent = ev?.setLists ? ev : events.find(e => e.id === (item as any)?.id);
    
    if (!actualEvent) return [];

    const isDated = !!actualEvent.date;
    const targetSetLists = activePrintId ? actualEvent.setLists.filter(e => e.id === activePrintId) : actualEvent.setLists;
    
    return targetSetLists.map(e => {
        const sl = e.type === 'setlist' ? setlists.find(s => s.id === e.id) : masterSetlists.find(m => m.id === e.id);
        if (!sl) return null;
        
        let sToP: Song[] = [];
        let fontSize: any = 'small';
        if (e.type === 'setlist') {
            sToP = getSongData((sl as SetList).songs);
            fontSize = (sl as SetList).font_size;
        } else {
            (sl as MasterSetList).setlists.forEach((id, idx) => {
                const sll = setlists.find(s => s.id === id);
                if (sll) {
                  if (idx === 0) fontSize = sll.font_size;
                  sToP.push(...getSongData(sll.songs));
                }
            });
        }
        return { 
            songs: sToP, 
            h1: actualEvent.name, 
            h2: sl.name, 
            h3: isDated ? formatDate(actualEvent.date) : undefined, 
            isDated,
            fontSize
        };
    }).filter(Boolean) as PDFDataset[];
  }

  return [];
};
