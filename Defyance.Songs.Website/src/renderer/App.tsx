import React, { useEffect, useState } from 'react';

const { ipcRenderer } = (window as any).require('electron');

const predefinedInstruments = [
  'Guitar',
  'Bass Guitar',
  'Drums',
  'Piano',
  'Keyboard',
  'Vocals',
  'Saxophone',
  'Trumpet',
  'Violin',
  'Cello',
  'Flute',
  'Clarinet',
  'Percussion',
  'Other'
];

interface Band {
  id: string;
  name: string;
  musicians: string[];
}

interface Musician {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  bio?: string;
  instruments: string[];
  bands: string[];
}

interface Instrument {
  id: string;
  name: string;
  musicians: string[];
}

interface Song {
  id: string;
  name: string;
  artist: string;
  vocalists: string[];
  vocalRange?: 'High' | 'Low' | null;
  notes?: string;
  link?: string;
}

interface SetList {
  id: string;
  name: string;
  songs: string[];
}

interface Event {
  id: string;
  name: string;
  location: string;
  date: string;
  time: string;
  tourId?: string | null;
  setLists: string[];
}

interface Tour {
  id: string;
  name: string;
  events: string[];
}

const theme = {
  background: '#0f1217',
  surface: '#161b22',
  surfaceAlt: '#1f2937',
  text: '#e5e7eb',
  muted: '#9ca3af',
  border: '#334155',
  accent: '#8b5cf6',
  danger: '#ef4444',
};

const App: React.FC = () => {
  const [tab, setTab] = useState<'bands' | 'musicians' | 'songs' | 'instruments' | 'setlists' | 'events' | 'tours'>('bands');
  const [bands, setBands] = useState<Band[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<SetList[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);

  const [bandName, setBandName] = useState('');
  const [musicName, setMusicName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [instrumentName, setInstrumentName] = useState('');
  
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [selectedMusicianId, setSelectedMusicianId] = useState<string | null>(null);
  
  const [songName, setSongName] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songVocalRange, setSongVocalRange] = useState<'High' | 'Low' | ''>('');
  const [songNotes, setSongNotes] = useState('');
  const [songLink, setSongLink] = useState('');
  
  const [setlistName, setSetlistName] = useState('');
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);
  
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  const [tourName, setTourName] = useState('');
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  const [assignInstrumentId, setAssignInstrumentId] = useState('');
  const [assignVocalistId, setAssignVocalistId] = useState('');
  const [assignSongId, setAssignSongId] = useState('');
  const [assignSetlistId, setAssignSetlistId] = useState('');
  const [assignEventId, setAssignEventId] = useState('');

  const loadBands = async () => {
    const result = await ipcRenderer.invoke('bands:list');
    setBands(result);
  };

  const loadMusicians = async () => {
    const result = await ipcRenderer.invoke('musicians:list');
    console.log('Loaded musicians:', result);
    setMusicians(result);
  };

  const loadInstruments = async () => {
    const result = await ipcRenderer.invoke('instruments:list');
    setInstruments(result);
  };

  const loadSetlists = async () => {
    const result = await ipcRenderer.invoke('setlists:list');
    setSetlists(result);
  };

  const loadEvents = async () => {
    const result = await ipcRenderer.invoke('events:list');
    setEvents(result);
  };

  const loadTours = async () => {
    const result = await ipcRenderer.invoke('tours:list');
    setTours(result);
  };

  useEffect(() => {
    loadBands();
    loadMusicians();
    loadInstruments();
    loadSongs();
    loadSetlists();
    loadEvents();
    loadTours();
  }, []);

  const addBand = async () => {
    if (!bandName.trim()) return;
    await ipcRenderer.invoke('bands:create', bandName.trim());
    setBandName('');
    loadBands();
  };

  const removeBand = async (id: string) => {
    await ipcRenderer.invoke('bands:delete', id);
    loadBands();
    if (selectedBandId === id) setSelectedBandId(null);
  };

  const assignMusician = async (bandId: string, musicianId: string) => {
    await ipcRenderer.invoke('bands:assign-musician', bandId, musicianId);
    loadBands();
  };

  const removeMusicianFromBand = async (bandId: string, musicianId: string) => {
    await ipcRenderer.invoke('bands:remove-musician', bandId, musicianId);
    loadBands();
  };

  const addMusician = async () => {
    if (!musicName.trim()) return;
    await ipcRenderer.invoke('musicians:create', musicName.trim(), phone.trim() || null, email.trim() || null, bio.trim() || null);
    setMusicName('');
    setPhone('');
    setEmail('');
    setBio('');
    loadMusicians();
  };

  const removeMusician = async (id: string) => {
    await ipcRenderer.invoke('musicians:delete', id);
    loadMusicians();
    loadBands();
    loadInstruments();
  };

  const addInstrument = async () => {
    if (!instrumentName.trim()) return;
    await ipcRenderer.invoke('instruments:create', instrumentName.trim());
    setInstrumentName('');
    loadInstruments();
  };

  const assignInstrumentToMusician = async (musicianId: string, instrumentId: string) => {
    console.log(`Assigning instrument ${instrumentId} to musician ${musicianId}`);
    await ipcRenderer.invoke('instruments:assign-to-musician', musicianId, instrumentId);
    console.log('Assignment completed, reloading musicians');
    const assignments = await ipcRenderer.invoke('debug:assignments');
    console.log('Current assignments after assignment:', assignments);
    loadMusicians();
    loadInstruments();
  };

  const removeInstrument = async (id: string) => {
    await ipcRenderer.invoke('instruments:delete', id);
    loadInstruments();
    loadMusicians();
  };

  const removeInstrumentFromMusician = async (musicianId: string, instrumentId: string) => {
    await ipcRenderer.invoke('instruments:remove-from-musician', musicianId, instrumentId);
    loadMusicians();
  };

  const formatMusicianWithInstruments = (musician: Musician) => {
    const instrumentNames = musician.instruments
      .map((instId) => instruments.find((inst) => inst.id === instId)?.name || '')
      .filter(Boolean);
    return instrumentNames.length > 0 ? `${musician.name} (${instrumentNames.join(', ')})` : musician.name;
  };

  async function loadSongs() {
    const result = await ipcRenderer.invoke('songs:list');
    setSongs(result);
  }

  const addSong = async () => {
    if (!songName.trim() || !songArtist.trim()) return;
    await ipcRenderer.invoke(
      'songs:create',
      songName.trim(),
      songArtist.trim(),
      null,
      null,
      songVocalRange || null,
      songNotes.trim() || null,
      songLink.trim() || null
    );
    setSongName('');
    setSongArtist('');
    setSongVocalRange('');
    setSongNotes('');
    setSongLink('');
    loadSongs();
  };

  const removeSong = async (id: string) => {
    await ipcRenderer.invoke('songs:delete', id);
    loadSongs();
  };

  const assignVocalist = async (songId: string, musicianId: string) => {
    await ipcRenderer.invoke('songs:assign-vocalist', songId, musicianId);
    loadSongs();
  };

  const removeVocalistFromSong = async (songId: string, musicianId: string) => {
    await ipcRenderer.invoke('songs:remove-vocalist', songId, musicianId);
    loadSongs();
  };

  const addSetlist = async () => {
    if (!setlistName.trim()) return;
    await ipcRenderer.invoke('setlists:create', setlistName.trim());
    setSetlistName('');
    loadSetlists();
  };

  const removeSetlist = async (id: string) => {
    await ipcRenderer.invoke('setlists:delete', id);
    loadSetlists();
    if (selectedSetlistId === id) setSelectedSetlistId(null);
  };

  const addSongToSetlist = async (setlistId: string, songId: string) => {
    const setlist = setlists.find(s => s.id === setlistId);
    const position = setlist ? setlist.songs.length : 0;
    await ipcRenderer.invoke('setlists:add-song', setlistId, songId, position);
    loadSetlists();
  };

  const removeSongFromSetlist = async (setlistId: string, songId: string) => {
    await ipcRenderer.invoke('setlists:remove-song', setlistId, songId);
    loadSetlists();
  };

  const addEvent = async () => {
    if (!eventName.trim()) return;
    await ipcRenderer.invoke('events:create', eventName.trim(), eventLocation.trim(), eventDate, eventTime);
    setEventName('');
    setEventLocation('');
    setEventDate('');
    setEventTime('');
    loadEvents();
  };

  const removeEvent = async (id: string) => {
    await ipcRenderer.invoke('events:delete', id);
    loadEvents();
    if (selectedEventId === id) setSelectedEventId(null);
  };

  const addSetlistToEvent = async (eventId: string, setlistId: string) => {
    const event = events.find(e => e.id === eventId);
    const position = event ? event.setLists.length : 0;
    await ipcRenderer.invoke('events:add-setlist', eventId, setlistId, position);
    loadEvents();
  };

  const removeSetlistFromEvent = async (eventId: string, setlistId: string) => {
    await ipcRenderer.invoke('events:remove-setlist', eventId, setlistId);
    loadEvents();
  };

  const addTour = async () => {
    if (!tourName.trim()) return;
    await ipcRenderer.invoke('tours:create', tourName.trim());
    setTourName('');
    loadTours();
  };

  const removeTour = async (id: string) => {
    await ipcRenderer.invoke('tours:delete', id);
    loadTours();
    if (selectedTourId === id) setSelectedTourId(null);
  };

  const addEventToTour = async (tourId: string, eventId: string) => {
    await ipcRenderer.invoke('tours:add-event', tourId, eventId);
    loadTours();
    loadEvents();
  };

  const removeEventFromTour = async (eventId: string) => {
    await ipcRenderer.invoke('tours:remove-event', eventId);
    loadTours();
    loadEvents();
  };

  const buttonStyle = {
    padding: '8px 16px',
    background: theme.surfaceAlt,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    cursor: 'pointer',
  };

  const inputStyle = {
    padding: 10,
    background: theme.surfaceAlt,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px', fontFamily: 'Inter, sans-serif', background: theme.background, color: theme.text }}>
      <h1 style={{ marginBottom: 12 }}>Defyance Songs Website</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setTab('bands')}
          style={{
            ...buttonStyle,
            background: tab === 'bands' ? theme.accent : theme.surface,
            color: tab === 'bands' ? '#fff' : theme.text,
          }}
        >
          Bands
        </button>
        <button
          onClick={() => setTab('musicians')}
          style={{
            ...buttonStyle,
            background: tab === 'musicians' ? theme.accent : theme.surface,
            color: tab === 'musicians' ? '#fff' : theme.text,
          }}
        >
          Musicians
        </button>
        <button
          onClick={() => setTab('songs')}
          style={{
            ...buttonStyle,
            background: tab === 'songs' ? theme.accent : theme.surface,
            color: tab === 'songs' ? '#fff' : theme.text,
          }}
        >
          Songs
        </button>
        <button
          onClick={() => setTab('setlists')}
          style={{
            ...buttonStyle,
            background: tab === 'setlists' ? theme.accent : theme.surface,
            color: tab === 'setlists' ? '#fff' : theme.text,
          }}
        >
          SetLists
        </button>
        <button
          onClick={() => setTab('events')}
          style={{
            ...buttonStyle,
            background: tab === 'events' ? theme.accent : theme.surface,
            color: tab === 'events' ? '#fff' : theme.text,
          }}
        >
          Events
        </button>
        <button
          onClick={() => setTab('tours')}
          style={{
            ...buttonStyle,
            background: tab === 'tours' ? theme.accent : theme.surface,
            color: tab === 'tours' ? '#fff' : theme.text,
          }}
        >
          Tours
        </button>
        <button
          onClick={() => setTab('instruments')}
          style={{
            ...buttonStyle,
            background: tab === 'instruments' ? theme.accent : theme.surface,
            color: tab === 'instruments' ? '#fff' : theme.text,
          }}
        >
          Instruments
        </button>
      </div>

      {tab === 'bands' && (
        <section style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 24, padding: 20, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}` }}>
            <h2 style={{ marginBottom: 12 }}>Bands</h2>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={bandName} onChange={(e) => setBandName(e.target.value)} placeholder="New band name" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addBand} style={buttonStyle}>Add Band</button>
            </div>
            <div style={{ marginBottom: 16, color: theme.muted }}>
              Select a band to manage members.
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {bands.length === 0 && <li style={{ color: theme.muted }}>No bands yet.</li>}
              {bands.map((band) => (
                <li key={band.id} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: theme.surfaceAlt, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                  <span>{band.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedBandId(band.id)} style={buttonStyle}>Manage</button>
                    <button onClick={() => removeBand(band.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            {selectedBandId && (
              <div style={{ marginTop: 28, padding: 20, borderRadius: 20, background: theme.surface, border: `1px solid ${theme.border}` }}>
                <h3 style={{ marginBottom: 16 }}>Band members</h3>
                {(() => {
                  const selectedBand = bands.find((b) => b.id === selectedBandId);
                  if (!selectedBand) return <p>Selected band not found.</p>;
                  const members = musicians.filter((m) => selectedBand.musicians.includes(m.id));
                  const availableMusicians = musicians.filter((m) => !selectedBand.musicians.includes(m.id));
                  return (
                    <>
                      <div style={{ marginBottom: 18 }}>
                        <strong>{selectedBand.name}</strong>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 12 }}>Current members</h4>
                        {members.length === 0 && <p style={{ color: theme.muted }}>No members assigned.</p>}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {members.map((member) => (
                            <li key={member.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: theme.surfaceAlt, borderRadius: 14, border: `1px solid ${theme.border}` }}>
                              <span>{formatMusicianWithInstruments(member)}</span>
                              <button onClick={() => removeMusicianFromBand(selectedBand.id, member.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: 12 }}>Add member</h4>
                        {availableMusicians.length === 0 ? (
                          <p style={{ color: theme.muted }}>No available musicians to add.</p>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select id="assign-musician" style={{ ...inputStyle, width: 220 }}>
                              {availableMusicians.map((musician) => (
                                <option key={musician.id} value={musician.id}>{formatMusicianWithInstruments(musician)}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const select = document.getElementById('assign-musician') as HTMLSelectElement | null;
                                if (!select || !select.value) return;
                                assignMusician(selectedBand.id, select.value);
                              }}
                              style={buttonStyle}
                            >
                              Add Member
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'musicians' && (
        <section style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 24, padding: 20, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}` }}>
            <h2 style={{ marginBottom: 12 }}>Musicians</h2>
            <div style={{ marginBottom: 16, display: 'grid', gap: 12 }}>
              <input value={musicName} onChange={(e) => setMusicName(e.target.value)} placeholder="Name" style={inputStyle} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" style={{ ...inputStyle, minHeight: 96 }} />
              <button onClick={addMusician} style={buttonStyle}>Add Musician</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {musicians.length === 0 && <li style={{ color: theme.muted }}>No musicians yet.</li>}
              {musicians.map((musician) => (
                <li key={musician.id} style={{ marginBottom: 14, padding: 16, background: theme.surfaceAlt, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: theme.text }}>{musician.name}</div>
                      <div style={{ color: theme.muted }}>{musician.email || musician.phone}</div>
                      <div style={{ fontSize: 13, color: theme.muted, marginTop: 6 }}>{musician.bio}</div>
                      {musician.instruments.length > 0 && (
                        <div style={{ marginTop: 10, color: theme.text }}>
                          <strong>Instruments: </strong>
                          {musician.instruments
                            .map((instId) => instruments.find((inst) => inst.id === instId)?.name || '')
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setSelectedMusicianId(musician.id)} style={buttonStyle}>Manage</button>
                      <button onClick={() => removeMusician(musician.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {selectedMusicianId && (
              <div style={{ marginTop: 28, padding: 20, borderRadius: 20, background: theme.surface, border: `1px solid ${theme.border}` }}>
                <h3 style={{ marginBottom: 16 }}>Manage musician</h3>
                {(() => {
                  const selectedMusician = musicians.find((m) => m.id === selectedMusicianId);
                  if (!selectedMusician) return <p>Selected musician not found.</p>;
                  return (
                    <>
                      <div style={{ marginBottom: 18 }}>
                        <strong>{selectedMusician.name}</strong>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 12 }}>Instruments</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {selectedMusician.instruments.map((instId) => {
                            const instrument = instruments.find((i) => i.id === instId);
                            return instrument ? (
                              <li key={instrument.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: theme.surfaceAlt, borderRadius: 14, border: `1px solid ${theme.border}` }}>
                                <span>{instrument.name}</span>
                                <button onClick={() => removeInstrumentFromMusician(selectedMusician.id, instrument.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                                  Remove
                                </button>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: 12 }}>Assign instrument</h4>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select value={assignInstrumentId} onChange={(e) => setAssignInstrumentId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                            <option value="">Select instrument</option>
                            {instruments
                              .filter((inst) => !selectedMusician.instruments.includes(inst.id))
                              .map((instrument) => (
                                <option key={instrument.id} value={instrument.id}>{instrument.name}</option>
                              ))}
                          </select>
                          <button
                            onClick={() => {
                              if (!assignInstrumentId) return;
                              assignInstrumentToMusician(selectedMusician.id, assignInstrumentId);
                              setAssignInstrumentId('');
                            }}
                            style={buttonStyle}
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'songs' && (
        <section style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 24, padding: 20, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}` }}>
            <h2 style={{ marginBottom: 12 }}>Songs</h2>
            <div style={{ marginBottom: 16, display: 'grid', gap: 12 }}>
              <input value={songName} onChange={(e) => setSongName(e.target.value)} placeholder="Song name" style={inputStyle} />
              <input value={songArtist} onChange={(e) => setSongArtist(e.target.value)} placeholder="Artist" style={inputStyle} />
              <select value={songVocalRange} onChange={(e) => setSongVocalRange(e.target.value as 'High' | 'Low' | '')} style={inputStyle}>
                <option value="">Vocal Range</option>
                <option value="High">High</option>
                <option value="Low">Low</option>
              </select>
              <textarea value={songNotes} onChange={(e) => setSongNotes(e.target.value)} placeholder="Notes" style={{ ...inputStyle, minHeight: 96 }} />
              <input value={songLink} onChange={(e) => setSongLink(e.target.value)} placeholder="Link" style={inputStyle} />
              <button onClick={addSong} style={buttonStyle}>Add Song</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {songs.length === 0 && <li style={{ color: theme.muted }}>No songs yet.</li>}
              {songs.map((song) => (
                <li key={song.id} style={{ marginBottom: 14, padding: 16, background: theme.surfaceAlt, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: theme.text }}>{song.name}</div>
                      <div style={{ color: theme.muted }}>{song.artist}</div>
                      {song.vocalRange && <div style={{ color: theme.muted, marginTop: 6 }}>Vocal range: {song.vocalRange}</div>}
                      {song.notes && <div style={{ fontSize: 13, color: theme.muted, marginTop: 6 }}>{song.notes}</div>}
                      {song.link && (
                        <div style={{ marginTop: 6 }}>
                          <a href={song.link} target="_blank" rel="noreferrer" style={{ color: theme.accent }}>{song.link}</a>
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeSong(song.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                      Delete
                    </button>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <strong style={{ color: theme.text }}>Vocalists</strong>
                    </div>
                    {song.vocalists.length === 0 ? (
                      <p style={{ color: theme.muted }}>No vocalists assigned.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {song.vocalists.map((musicianId) => {
                          const musician = musicians.find((m) => m.id === musicianId);
                          return (
                            musician && (
                              <li key={musician.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}` }}>
                                <span>{formatMusicianWithInstruments(musician)}</span>
                                <button onClick={() => removeVocalistFromSong(song.id, musician.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                                  Remove
                                </button>
                              </li>
                            )
                          );
                        })}
                      </ul>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={assignVocalistId} onChange={(e) => setAssignVocalistId(e.target.value)} style={{ ...inputStyle, width: 220 }}>
                        <option value="">Select musician</option>
                        {musicians
                          .filter((m) => !song.vocalists.includes(m.id))
                          .map((musician) => (
                            <option key={musician.id} value={musician.id}>{formatMusicianWithInstruments(musician)}</option>
                          ))}
                      </select>
                      <button
                        onClick={() => {
                          if (!assignVocalistId) return;
                          assignVocalist(song.id, assignVocalistId);
                          setAssignVocalistId('');
                        }}
                        style={buttonStyle}
                      >
                        Assign Vocalist
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === 'instruments' && (
        <section style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 24, padding: 20, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}` }}>
            <h2 style={{ marginBottom: 12 }}>Instruments</h2>
            <div style={{ marginBottom: 16, display: 'grid', gap: 12 }}>
              <input
                type="text"
                placeholder="Instrument name"
                value={instrumentName}
                onChange={(e) => setInstrumentName(e.target.value)}
                style={inputStyle}
              />
              <button onClick={addInstrument} style={buttonStyle}>Add Instrument</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {instruments.length === 0 && <li style={{ color: theme.muted }}>No instruments yet.</li>}
              {instruments.map((instrument) => (
                <li key={instrument.id} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: theme.surfaceAlt, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                  <div>
                    <div>{instrument.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => removeInstrument(instrument.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {tab === 'setlists' && (
        <section style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 24, padding: 20, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}` }}>
            <h2 style={{ marginBottom: 12 }}>SetLists</h2>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={setlistName} onChange={(e) => setSetlistName(e.target.value)} placeholder="New setlist name" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addSetlist} style={buttonStyle}>Add SetList</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {setlists.length === 0 && <li style={{ color: theme.muted }}>No setlists yet.</li>}
              {setlists.map((setlist) => (
                <li key={setlist.id} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: theme.surfaceAlt, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                  <span>{setlist.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedSetlistId(setlist.id)} style={buttonStyle}>Manage</button>
                    <button onClick={() => removeSetlist(setlist.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            {selectedSetlistId && (
              <div style={{ marginTop: 28, padding: 20, borderRadius: 20, background: theme.surface, border: `1px solid ${theme.border}` }}>
                <h3 style={{ marginBottom: 16 }}>Manage SetList</h3>
                {(() => {
                  const selectedSetlist = setlists.find((s) => s.id === selectedSetlistId);
                  if (!selectedSetlist) return <p>Selected setlist not found.</p>;
                  return (
                    <>
                      <div style={{ marginBottom: 18 }}>
                        <strong>{selectedSetlist.name}</strong>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 12 }}>Songs</h4>
                        {selectedSetlist.songs.length === 0 && <p style={{ color: theme.muted }}>No songs in this setlist.</p>}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {selectedSetlist.songs.map((songId) => {
                            const song = songs.find(s => s.id === songId);
                            return song ? (
                              <li key={song.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: theme.surfaceAlt, borderRadius: 14, border: `1px solid ${theme.border}` }}>
                                <span>{song.name} - {song.artist}</span>
                                <button onClick={() => removeSongFromSetlist(selectedSetlist.id, song.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                                  Remove
                                </button>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: 12 }}>Add Song</h4>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select value={assignSongId} onChange={(e) => setAssignSongId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                            <option value="">Select song</option>
                            {songs
                              .filter((s) => !selectedSetlist.songs.includes(s.id))
                              .map((song) => (
                                <option key={song.id} value={song.id}>{song.name} - {song.artist}</option>
                              ))}
                          </select>
                          <button
                            onClick={() => {
                              if (!assignSongId) return;
                              addSongToSetlist(selectedSetlist.id, assignSongId);
                              setAssignSongId('');
                            }}
                            style={buttonStyle}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'events' && (
        <section style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 24, padding: 20, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}` }}>
            <h2 style={{ marginBottom: 12 }}>Events</h2>
            <div style={{ marginBottom: 16, display: 'grid', gap: 12 }}>
              <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event name" style={inputStyle} />
              <input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Location" style={inputStyle} />
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={inputStyle} />
              <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} style={inputStyle} />
              <button onClick={addEvent} style={buttonStyle}>Add Event</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {events.length === 0 && <li style={{ color: theme.muted }}>No events yet.</li>}
              {events.map((event) => (
                <li key={event.id} style={{ marginBottom: 14, padding: 16, background: theme.surfaceAlt, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: theme.text }}>{event.name}</div>
                      <div style={{ color: theme.muted }}>{event.location} - {event.date} {event.time}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setSelectedEventId(event.id)} style={buttonStyle}>Manage</button>
                      <button onClick={() => removeEvent(event.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {selectedEventId && (
              <div style={{ marginTop: 28, padding: 20, borderRadius: 20, background: theme.surface, border: `1px solid ${theme.border}` }}>
                <h3 style={{ marginBottom: 16 }}>Manage Event</h3>
                {(() => {
                  const selectedEvent = events.find((e) => e.id === selectedEventId);
                  if (!selectedEvent) return <p>Selected event not found.</p>;
                  return (
                    <>
                      <div style={{ marginBottom: 18 }}>
                        <strong>{selectedEvent.name}</strong>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 12 }}>SetLists</h4>
                        {selectedEvent.setLists.length === 0 && <p style={{ color: theme.muted }}>No setlists assigned.</p>}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {selectedEvent.setLists.map((setlistId) => {
                            const setlist = setlists.find(s => s.id === setlistId);
                            return setlist ? (
                              <li key={setlist.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: theme.surfaceAlt, borderRadius: 14, border: `1px solid ${theme.border}` }}>
                                <span>{setlist.name}</span>
                                <button onClick={() => removeSetlistFromEvent(selectedEvent.id, setlist.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                                  Remove
                                </button>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: 12 }}>Assign SetList</h4>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select value={assignSetlistId} onChange={(e) => setAssignSetlistId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                            <option value="">Select setlist</option>
                            {setlists
                              .filter((s) => !selectedEvent.setLists.includes(s.id))
                              .map((setlist) => (
                                <option key={setlist.id} value={setlist.id}>{setlist.name}</option>
                              ))}
                          </select>
                          <button
                            onClick={() => {
                              if (!assignSetlistId) return;
                              addSetlistToEvent(selectedEvent.id, assignSetlistId);
                              setAssignSetlistId('');
                            }}
                            style={buttonStyle}
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'tours' && (
        <section style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 24, padding: 20, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}` }}>
            <h2 style={{ marginBottom: 12 }}>Tours</h2>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={tourName} onChange={(e) => setTourName(e.target.value)} placeholder="New tour name" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addTour} style={buttonStyle}>Add Tour</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {tours.length === 0 && <li style={{ color: theme.muted }}>No tours yet.</li>}
              {tours.map((tour) => (
                <li key={tour.id} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: theme.surfaceAlt, borderRadius: 16, border: `1px solid ${theme.border}` }}>
                  <span>{tour.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedTourId(tour.id)} style={buttonStyle}>Manage</button>
                    <button onClick={() => removeTour(tour.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            {selectedTourId && (
              <div style={{ marginTop: 28, padding: 20, borderRadius: 20, background: theme.surface, border: `1px solid ${theme.border}` }}>
                <h3 style={{ marginBottom: 16 }}>Manage Tour</h3>
                {(() => {
                  const selectedTour = tours.find((t) => t.id === selectedTourId);
                  if (!selectedTour) return <p>Selected tour not found.</p>;
                  return (
                    <>
                      <div style={{ marginBottom: 18 }}>
                        <strong>{selectedTour.name}</strong>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 12 }}>Events</h4>
                        {selectedTour.events.length === 0 && <p style={{ color: theme.muted }}>No events in this tour.</p>}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {selectedTour.events.map((eventId) => {
                            const event = events.find(e => e.id === eventId);
                            return event ? (
                              <li key={event.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: theme.surfaceAlt, borderRadius: 14, border: `1px solid ${theme.border}` }}>
                                <span>{event.name} ({event.date})</span>
                                <button onClick={() => removeEventFromTour(event.id)} style={{ ...buttonStyle, background: theme.danger, color: '#fff' }}>
                                  Remove
                                </button>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: 12 }}>Add Event</h4>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select value={assignEventId} onChange={(e) => setAssignEventId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                            <option value="">Select event</option>
                            {events
                              .filter((e) => !selectedTour.events.includes(e.id))
                              .map((event) => (
                                <option key={event.id} value={event.id}>{event.name} ({event.date})</option>
                              ))}
                          </select>
                          <button
                            onClick={() => {
                              if (!assignEventId) return;
                              addEventToTour(selectedTour.id, assignEventId);
                              setAssignEventId('');
                            }}
                            style={buttonStyle}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default App;
