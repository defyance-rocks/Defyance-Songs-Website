import { Song, SetList, MasterSetList, Event, AppEntity } from '../../shared/models';
import { formatDate } from '../utils';

export interface PDFDataset {
  songs: Song[];
  h1: string;
  h2?: string;
  h3?: string;
  isDated: boolean;
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
    return [{ songs: getSongData(sl.songs), h1, h2, h3, isDated }];
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
    return [{ 
        songs: allSongs, 
        h1: ev ? ev.name : msl.name, 
        h2: ev ? msl.name : undefined, 
        h3: ev?.date ? formatDate(ev.date) : undefined, 
        isDated 
    }];
  }

  if (tab === 'events') {
    const ev = item as Event;
    const isDated = !!ev.date;
    const targetSetLists = activePrintId ? ev.setLists.filter(e => e.id === activePrintId) : ev.setLists;
    
    return targetSetLists.map(e => {
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
    }).filter(Boolean) as PDFDataset[];
  }

  return [];
};
