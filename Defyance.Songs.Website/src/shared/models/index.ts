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

export interface NavState {
  tab: 'bands' | 'musicians' | 'songs' | 'instruments' | 'setlists' | 'events' | 'tours' | 'master-setlists' | 'printouts' | 'login';
  selectedId: string | null;
  isEditing: boolean;
}
