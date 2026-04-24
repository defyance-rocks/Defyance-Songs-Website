import { Band, Musician, Song, SetList, Event, Tour, MasterSetList, NavState } from '../../shared/models';
import { formatDate, isPast, getSetlistLabel, getMasterSetlistLabel } from '../utils';

export const getCurrentRels = (
  item: Band | Musician | Song | SetList | Event | Tour | MasterSetList,
  tab: NavState['tab'],
  musicians: Musician[],
  instruments: any[],
  songs: Song[],
  setlists: SetList[],
  events: Event[],
  tours: Tour[],
  masterSetlists: MasterSetList[]
) => {
  if (tab === 'bands') return ((item as Band).musicians || []).map((id: string) => musicians.find(m => m.id === id)).filter(Boolean);
  if (tab === 'musicians') return ((item as Musician).instruments || []).map((id: string) => instruments.find(i => i.id === id)).filter(Boolean);
  if (tab === 'songs') return setlists.filter(sl => (sl.songs || []).some(s => s.id === (item as Song).id));
  
  if (tab === 'setlists') {
    const current = ((item as SetList).songs || []).map((s: {id: string, linked_to?: string | null}) => songs.find(so => so.id === s.id)).filter(Boolean);
    const parent = [];
    if ((item as SetList).eventId) { 
      const ev = events.find(e => e.id === (item as SetList).eventId); 
      if (ev) parent.push({ ...ev, type: 'parent-event' }); 
    }
    if ((item as SetList).masterSetlistId) { 
      const msl = masterSetlists.find(m => m.id === (item as SetList).masterSetlistId); 
      if (msl) parent.push({ ...msl, type: 'parent-master' }); 
    }
    return [...parent, ...current.map((s, i) => s ? ({...s, linked_to: (item as SetList).songs[i].linked_to}) : null).filter(Boolean)];
  }
  
  if (tab === 'master-setlists') {
    const current = ((item as MasterSetList).setlists || []).map((id: string) => setlists.find(s => s.id === id)).filter(Boolean);
    const parent = [];
    if ((item as MasterSetList).eventId) { 
      const ev = events.find(e => e.id === (item as MasterSetList).eventId); 
      if (ev) parent.push({ ...ev, type: 'parent-event' }); 
    }
    return [...parent, ...current];
  }
  
  if (tab === 'events') {
    const current = ((item as Event).setLists || []).map(e => {
      const x = e.type === 'setlist' ? setlists.find(s => s.id === e.id) : masterSetlists.find(m => m.id === e.id);
      return x ? { ...x, type: e.type } : null;
    }).filter(Boolean);
    const parent = [];
    if ((item as Event).tourId) { 
      const t = tours.find(x => x.id === (item as Event).tourId); 
      if (t) parent.push({ ...t, type: 'parent-tour' }); 
    }
    return [...parent, ...current];
  }
  
  if (tab === 'tours') return ((item as Tour).events || []).map((id: string) => events.find(e => e.id === id)).filter(Boolean);
  
  return [];
};
