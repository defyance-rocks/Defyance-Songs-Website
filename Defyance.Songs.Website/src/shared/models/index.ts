export interface SetListSong {
  setlist_id: string;
  song_id: string;
  linked_to?: string | null;
  position: number;
}

export interface Band {
  id: string;
  name: string;
  musicians: string[]; // IDs
}

export interface Musician {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  bio?: string;
  instruments: string[]; // Instrument IDs
  bands: string[]; // IDs
}

export interface Instrument {
  id: string;
  name: string;
  musicians: string[]; // IDs
}

export interface Song {
  id: string;
  name: string;
  artist: string;
  vocalists: string[]; // Musician IDs
  vocalRange?: 'High' | 'Low' | null;
  key?: string | null;
  notes?: string | null;
  link?: string | null;
  linked_to?: string | null;
}

export interface SetList {
  id: string;
  name: string;
  songs: { id: string; linked_to?: string | null }[]; // Ordered Song IDs with linking info
  eventId?: string;
  masterSetlistId?: string;
}

export interface EventSetListEntry {
  id: string;
  type: 'setlist' | 'master';
  position: number;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: string; // ISO date
  time: string; // HH:MM
  tourId?: string | null;
  setLists: EventSetListEntry[]; // Ordered entries
}

export interface Tour {
  id: string;
  name: string;
  events: string[]; // Ordered Event IDs
}

export interface MasterSetList {
  id: string;
  name: string;
  setlists: string[]; // Ordered SetList IDs
  eventId?: string;
}

export type AppEntity = Band | Musician | Instrument | Song | SetList | Event | Tour | MasterSetList;

export const isBand = (item: AppEntity | null): item is Band => !!item && 'musicians' in item && !('phone' in item);
export const isMusician = (item: AppEntity | null): item is Musician => !!item && 'phone' in item;
export const isInstrument = (item: AppEntity | null): item is Instrument => !!item && !('artist' in item) && !('musicians' in item) && !('setlists' in item); // Simplification, might need refinement
export const isSong = (item: AppEntity | null): item is Song => !!item && 'artist' in item;
export const isSetList = (item: AppEntity | null): item is SetList => !!item && 'songs' in item;
export const isEvent = (item: AppEntity | null): item is Event => !!item && 'location' in item;
export const isTour = (item: AppEntity | null): item is Tour => !!item && 'events' in item && !('musicians' in item);
export const isMasterSetList = (item: AppEntity | null): item is MasterSetList => !!item && 'setlists' in item && !('events' in item);

export interface NavState {
  tab: 'bands' | 'musicians' | 'songs' | 'instruments' | 'setlists' | 'events' | 'tours' | 'master-setlists' | 'printouts' | 'login';
  selectedId: string | null;
  isEditing: boolean;
}
