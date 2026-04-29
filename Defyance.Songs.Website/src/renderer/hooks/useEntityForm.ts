import { useState, useCallback } from 'react';
import { NavState, Song, Musician, Event, AppEntity } from '../../shared/models';
import { formatUrl } from '../utils';

export interface EditFields {
  name: string;
  phone: string;
  email: string;
  bio: string;
  artist: string;
  vocalRange: 'High' | 'Low' | '';
  songKey: string;
  notes: string;
  link: string;
  location: string;
  date: string;
  time: string;
}

const initialFields: EditFields = {
  name: '', phone: '', email: '', bio: '', artist: '', vocalRange: '', songKey: '', notes: '', link: '', location: '', date: '', time: ''
};

export const useEntityForm = (handleSave: (tab: NavState['tab'], id: string | null, isEditing: boolean, payload: Partial<AppEntity>) => Promise<void>) => {
  const [editFields, setEditFields] = useState<EditFields>(initialFields);

  const resetFields = useCallback(() => {
    setEditFields(initialFields);
  }, []);

  const populateFields = useCallback((item: AppEntity | null, tab: NavState['tab']) => {
    if (!item) {
      resetFields();
      return;
    }
    setEditFields({
      name: item.name || '',
      phone: (item as Musician).phone || '',
      email: (item as Musician).email || '',
      bio: (item as Musician).bio || '',
      artist: (item as Song).artist || '',
      vocalRange: (item as Song).vocalRange as any || '',
      songKey: (item as Song).key || '',
      notes: (item as Song).notes || '',
      link: (item as Song).link || '',
      location: (item as Event).location || '',
      date: (item as Event).date || '',
      time: (item as Event).time || ''
    });
  }, [resetFields]);

  const sanitizeText = (text: string) => {
    if (!text) return '';
    return text
        .replace(/\u00A0/g, ' ') // Non-breaking space -> regular space
        .replace(/\u00C2/g, '')  // Clean up existing split-UTF artifacts
        .replace(/[\u2018\u2019]/g, "'") // Smart quotes
        .replace(/[\u201C\u201D]/g, '"'); // Smart double quotes
  };

  const onSave = async (tab: NavState['tab'], selectedId: string | null, isEditing: boolean) => {
    if (!editFields.name.trim()) return false;
    
    const link = formatUrl(editFields.link.trim());
    const payload: any = { name: editFields.name };
    
    if (tab === 'musicians') { 
      payload.phone = editFields.phone; 
      payload.email = editFields.email; 
      payload.bio = sanitizeText(editFields.bio); 
    }
    if (tab === 'songs') { 
      payload.artist = editFields.artist; 
      payload.vocal_range = editFields.vocalRange || null; 
      payload.key = editFields.songKey || null; 
      payload.notes = sanitizeText(editFields.notes); 
      payload.link = link; 
    }
    if (tab === 'events') { 
      payload.location = editFields.location; 
      payload.date = editFields.date || null; 
      payload.time = editFields.time || null; 
    }

    await handleSave(tab, selectedId, isEditing, payload);
    return true;
  };

  return {
    editFields,
    setEditFields,
    resetFields,
    populateFields,
    onSave
  };
};
