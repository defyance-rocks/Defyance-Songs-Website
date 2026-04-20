import { Song, SetList, Event, Tour, MasterSetList } from '../shared/models';

export const formatUrl = (u: string) => (!u || u.startsWith('http') ? u : `https://${u}`);

export const formatDate = (d: string) => { 
  if (!d) return ''; 
  const [y, m, day] = d.split('-'); 
  return `${m}/${day}/${y.slice(-2)}`; 
};

export const isPast = (d: string) => { 
  if (!d) return false; 
  const t = new Date(); 
  t.setHours(0,0,0,0); 
  return new Date(d + 'T00:00:00') < t; 
};

export const getSetlistLabel = (sl: SetList, events: Event[], masterSetlists: MasterSetList[]) => {
  let prefix = '';
  if (sl.eventId) {
    const ev = events.find(e => e.id === sl.eventId);
    if (ev) prefix = `[${ev.name}] - `;
  } else if (sl.masterSetlistId) {
    const msl = masterSetlists.find(m => m.id === sl.masterSetlistId);
    if (msl) {
      if (msl.eventId) {
        const ev = events.find(e => e.id === msl.eventId);
        if (ev) prefix = `[${ev.name}] - `;
      } else {
        prefix = `[${msl.name}] - `;
      }
    }
  }
  return `${prefix}${sl.name}`;
};

export const getMasterSetlistLabel = (msl: MasterSetList, events: Event[]) => {
  if (msl.eventId) {
    const ev = events.find(e => e.id === msl.eventId);
    if (ev) return `[${ev.name}] - ${msl.name}`;
  }
  return msl.name;
};

export const getEventLabel = (ev: Event, tours: Tour[]) => {
  if (ev.tourId) {
    const t = tours.find(x => x.id === ev.tourId);
    if (t) return `[${t.name}] - ${ev.name}`;
  }
  return ev.name;
};
