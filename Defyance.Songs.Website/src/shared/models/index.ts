// Domain models for the band management app

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
  setlistId?: string | null;
  vocalists: string[]; // Musician IDs
  vocalRange?: 'High' | 'Low' | null;
  notes?: string | null;
  link?: string | null;
}

export interface SetList {
  id: string;
  name: string;
  eventId?: string | null;
  position?: number;
  songs: string[]; // Ordered Song IDs
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: string; // ISO date
  time: string; // HH:MM
  tourId?: string | null;
  position?: number;
  setLists: string[]; // Ordered SetList IDs
}

export interface Tour {
  id: string;
  name: string;
  events: string[]; // Ordered Event IDs
}