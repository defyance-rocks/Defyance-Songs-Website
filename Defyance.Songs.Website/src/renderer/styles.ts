import React from 'react';

export const theme = {
  background: '#0f1217',
  sidebar: '#161b22',
  surface: '#1c2128',
  surfaceAlt: '#2d333b',
  text: '#adbac7',
  textHighlight: '#cdd9e5',
  muted: '#768390',
  border: '#444c56',
  accent: '#316dca',
  accentHover: '#388bfd',
  danger: '#da3633',
  success: '#3fb950',
};

export const getStyles = (isMobile: boolean, isSidebarOpen: boolean) => {
  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', height: '100vh', background: theme.background, color: theme.text, fontFamily: 'Segoe UI, sans-serif', flexDirection: isMobile ? 'column' : 'row' },
    sidebar: { 
      width: isMobile ? '100%' : 240, 
      background: theme.sidebar, 
      borderRight: isMobile ? 'none' : `1px solid ${theme.border}`, 
      borderBottom: isMobile ? `1px solid ${theme.border}` : 'none',
      display: isMobile ? (isSidebarOpen ? 'flex' : 'none') : 'flex', 
      flexDirection: 'column', 
      padding: '16px 0',
      position: isMobile ? 'fixed' : 'relative',
      top: isMobile ? 60 : 0,
      left: 0,
      height: isMobile ? 'calc(100vh - 60px)' : '100vh',
      zIndex: 1000
    },
    sidebarItem: { padding: '12px 24px', cursor: 'pointer', transition: 'background 0.2s', fontSize: 14, fontWeight: 500 },
    main: { flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px', paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '32px', marginTop: isMobile ? 60 : 0 },
    card: { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, padding: isMobile ? 16 : 24, marginBottom: 24 },
    heading: { margin: '0 0 16px 0', color: theme.textHighlight, fontSize: isMobile ? 20 : 24 },
    subHeading: { margin: '24px 0 12px 0', fontSize: 16, fontWeight: 600, color: theme.textHighlight },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { padding: isMobile ? '12px 12px' : '12px 16px', minHeight: isMobile ? 56 : 'auto', background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: 6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    button: { padding: isMobile ? '12px 16px' : '8px 16px', minHeight: isMobile ? 44 : 'auto', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
    input: { padding: '12px 12px', background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, width: '100%', marginBottom: 12, minHeight: isMobile ? 48 : 'auto' },
    label: { display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' },
    link: { color: theme.accent, cursor: 'pointer', fontSize: isMobile ? 15 : 14, minHeight: isMobile ? 44 : 'auto', display: 'flex', alignItems: 'center' },
    badge: { padding: '2px 8px', borderRadius: 12, fontSize: 11, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, marginLeft: 8 },
    backBtn: { background: 'transparent', color: theme.muted, border: `1px solid ${theme.border}`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '12px 16px', borderRadius: 6, minHeight: 48 },
    mobileHeader: {
      height: 60,
      background: theme.sidebar,
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1001
    },
    bottomNav: {
      display: isMobile ? 'flex' : 'none',
      height: 60,
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: theme.sidebar,
      borderTop: `1px solid ${theme.border}`,
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      zIndex: 1001,
      justifyContent: 'space-around',
      alignItems: 'center'
    },
    bottomNavItem: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      gap: 4,
      color: theme.muted,
      cursor: 'pointer'
    },
    menuOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    },
    menuContent: {
      background: theme.surface,
      width: '100%',
      borderRadius: '12px 12px 0 0',
      padding: '16px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    },
    menuItem: {
      padding: '16px 24px',
      fontSize: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      cursor: 'pointer'
    }
  };
  return styles;
};
