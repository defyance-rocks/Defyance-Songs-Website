import React from 'react';
import { NavState } from '../../shared/models';
import { theme } from '../styles';
import { supabase } from '../supabase';

import { Session } from '@supabase/supabase-js';

interface SidebarProps {
  tab: NavState['tab'];
  isMobile: boolean;
  isSidebarOpen: boolean;
  styles: { [key: string]: React.CSSProperties };
  session: Session | null;
  onTabChange: (tab: NavState['tab']) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ tab, isMobile, isSidebarOpen, styles, session, onTabChange }) => (
  <div style={styles.sidebar}>
    {!isMobile && <h2 style={{ padding: '0 24px', fontSize: 18, marginBottom: 24, color: theme.accent }}>Defyance</h2>}
    <div style={{ flex: 1 }}>
      {(['bands', 'musicians', 'songs', 'setlists', 'master-setlists', 'events', 'tours', 'instruments', 'printouts'] as const).map(t => (
        <div 
          key={t} 
          style={{ 
            ...styles.sidebarItem, 
            background: tab === t ? theme.surfaceAlt : 'transparent', 
            color: tab === t ? theme.accent : theme.text, 
            borderLeft: tab === t ? `4px solid ${theme.accent}` : '4px solid transparent' 
          }} 
          onClick={() => onTabChange(t)}
        >
          {t === 'master-setlists' ? 'Master SetLists' : (t === 'printouts' ? 'Print Center' : t.charAt(0).toUpperCase() + t.slice(1))}
        </div>
      ))}
    </div>
    {session ? (
      <div 
        style={{ ...styles.sidebarItem, borderTop: `1px solid ${theme.border}`, color: theme.danger }} 
        onClick={() => { if (window.confirm('Sign out?')) supabase.auth.signOut(); }}
      >
        Sign Out
      </div>
    ) : (
      <div 
        style={{ ...styles.sidebarItem, borderTop: `1px solid ${theme.border}`, color: theme.success, background: tab === 'login' ? theme.surfaceAlt : 'transparent' }} 
        onClick={() => onTabChange('login')}
      >
        Sign In (Admin)
      </div>
    )}
  </div>
);
