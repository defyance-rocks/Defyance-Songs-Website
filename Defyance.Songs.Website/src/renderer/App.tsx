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
  const [tab, setTab] = useState<'bands' | 'musicians' | 'songs' | 'instruments'>('bands');
  const [bands, setBands] = useState<Band[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [bandName, setBandName] = useState('');
  const [musicName, setMusicName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [instrumentName, setInstrumentName] = useState('');
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [assignMusicId, setAssignMusicId] = useState('');
  const [selectedMusicianId, setSelectedMusicianId] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [songName, setSongName] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songVocalRange, setSongVocalRange] = useState<'High' | 'Low' | ''>('');
  const [songNotes, setSongNotes] = useState('');
  const [songLink, setSongLink] = useState('');
  const [assignInstrumentId, setAssignInstrumentId] = useState('');
  const [assignVocalistId, setAssignVocalistId] = useState('');

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

  useEffect(() => {
    loadBands();
    loadMusicians();
    loadInstruments();
    loadSongs();
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
    </div>
  );
};

export default App;
