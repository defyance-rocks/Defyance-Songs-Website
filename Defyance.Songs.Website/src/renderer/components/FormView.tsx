import React from 'react';
import { NavState } from '../../shared/models';
import { theme } from '../styles';

interface FormViewProps {
  tab: NavState['tab'];
  selectedId: string | null;
  editName: string;
  editPhone: string;
  editEmail: string;
  editBio: string;
  editArtist: string;
  editVocalRange: string;
  editKey: string;
  editNotes: string;
  editLink: string;
  editLocation: string;
  editDate: string;
  editTime: string;
  editStatus: string;
  isUserAdmin: boolean;
  firstInputRef: React.RefObject<HTMLInputElement | HTMLSelectElement | null>;
  styles: { [key: string]: React.CSSProperties };
  onBack: () => void;
  onSave: () => void;
  setEditName: (val: string) => void;
  setEditPhone: (val: string) => void;
  setEditEmail: (val: string) => void;
  setEditBio: (val: string) => void;
  setEditArtist: (val: string) => void;
  setEditVocalRange: (val: string) => void;
  setEditKey: (val: string) => void;
  setEditNotes: (val: string) => void;
  setEditLink: (val: string) => void;
  setEditLocation: (val: string) => void;
  setEditDate: (val: string) => void;
  setEditTime: (val: string) => void;
  setEditStatus: (val: string) => void;
}

export const FormView: React.FC<FormViewProps> = ({
  tab, selectedId, editName, editPhone, editEmail, editBio, editArtist, editVocalRange, editKey,
  editNotes, editLink, editLocation, editDate, editTime, editStatus, isUserAdmin,
  firstInputRef, styles, 
  onBack, onSave, setEditName, setEditPhone, setEditEmail, setEditBio, 
  setEditArtist, setEditVocalRange, setEditKey, setEditNotes, setEditLink, 
  setEditLocation, setEditDate, setEditTime, setEditStatus
}) => (
  <div style={{ maxWidth: 900 }}>
    <button style={styles.backBtn} onClick={onBack}>← Back</button>
    <div style={styles.card}>
      <h2 style={styles.heading}>{selectedId ? 'EDIT' : 'NEW'} {tab.toUpperCase()}</h2>
      <div style={{ maxWidth: 600 }}>
        <label style={styles.label}>Name</label>
        <input ref={firstInputRef as any} style={styles.input} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" />
        {tab === 'musicians' && (<><label style={styles.label}>Phone</label><input style={styles.input} value={editPhone} onChange={e => setEditPhone(e.target.value)} /><label style={styles.label}>Email</label><input style={styles.input} value={editEmail} onChange={e => setEditEmail(e.target.value)} /><label style={styles.label}>Bio</label><textarea style={{ ...styles.input, minHeight: 100 }} value={editBio} onChange={e => setEditBio(e.target.value)} /></>)}
        {tab === 'songs' && (<>
          <label style={styles.label}>Artist</label>
          <input style={styles.input} value={editArtist} onChange={e => setEditArtist(e.target.value)} />
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
                <label style={styles.label}>Vocal Range</label>
                <select style={styles.input} value={editVocalRange} onChange={e => setEditVocalRange(e.target.value as any)}>
                    <option value="">None</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                </select>
            </div>
            <div style={{ flex: 1 }}>
                <label style={styles.label}>Key</label>
                <select style={styles.input} value={editKey} onChange={e => setEditKey(e.target.value)}>
                    <option value="">None</option>
                    {['Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G'].map(k => <option key={k} value={k}>{k}</option>)}
                </select>
            </div>
            {isUserAdmin && (
                <div style={{ flex: 1 }}>
                    <label style={styles.label}>Status</label>
                    <select style={styles.input} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                        <option value="Draft">Draft</option>
                        <option value="Approved">Approved</option>
                    </select>
                </div>
            )}
          </div>
          <label style={styles.label}>Notes</label>
          <textarea style={{ ...styles.input, minHeight: 80 }} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
          <label style={styles.label}>Link</label>
          <input style={styles.input} value={editLink} onChange={(e) => setEditLink(e.target.value)} />
        </>)}
        {tab === 'events' && (<><label style={styles.label}>Location</label><input style={styles.input} value={editLocation} onChange={e => setEditLocation(e.target.value)} /><div style={{ display: 'flex', gap: 16 }}><div style={{ flex: 1 }}><label style={styles.label}>Date</label><input style={styles.input} type="date" value={editDate} onChange={e => setEditDate(e.target.value)} /></div><div style={{ flex: 1 }}><label style={styles.label}>Time</label><input style={styles.input} type="time" value={editTime} onChange={e => setEditTime(e.target.value)} /></div></div></>)}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button style={{ ...styles.button, background: theme.accent, color: '#fff', flex: 1 }} onClick={onSave}>Save</button>
          <button style={{ ...styles.button, background: theme.surfaceAlt, color: theme.text, flex: 1 }} onClick={onBack}>Cancel</button>
        </div>
      </div>
    </div>
  </div>
);
