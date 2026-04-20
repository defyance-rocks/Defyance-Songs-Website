import React from 'react';
import { NavState } from '../../shared/models';
import { theme } from '../styles';

interface SidebarProps {
  tab: NavState['tab'];
  isMobile: boolean;
  isSidebarOpen: boolean;
  styles: { [key: string]: React.CSSProperties };
  onTabChange: (tab: NavState['tab']) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ tab, isMobile, isSidebarOpen, styles, onTabChange }) => (
  <div style={styles.sidebar}>
    {!isMobile && <h2 style={{ padding: '0 24px', fontSize: 18, marginBottom: 24, color: theme.accent }}>Defyance</h2>}
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
);
