import { useState, useCallback } from 'react';
import { NavState } from '../../shared/models';

export const useNavigation = (initialTab: NavState['tab'] = 'bands') => {
  const [tab, setTab] = useState<NavState['tab']>(initialTab);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [navStack, setNavStack] = useState<NavState[]>([]);

  const navigateTo = useCallback((newTab: NavState['tab'], id: string | null = null, edit: boolean = false) => {
    setNavStack(prev => [...prev, { tab, selectedId, isEditing }]);
    setTab(newTab);
    setSelectedId(id);
    setIsEditing(edit);
  }, [tab, selectedId, isEditing]);

  const handleBack = useCallback((onBackCallback?: (prev: NavState) => void) => {
    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1];
      setNavStack(prevStack => prevStack.slice(0, -1));
      setTab(prev.tab);
      setSelectedId(prev.selectedId);
      setIsEditing(prev.isEditing);
      if (onBackCallback) onBackCallback(prev);
      return true;
    }
    setSelectedId(null);
    setIsEditing(false);
    return false;
  }, [navStack]);

  const resetStack = useCallback(() => {
    setNavStack([]);
  }, []);

  return {
    tab, setTab,
    selectedId, setSelectedId,
    isEditing, setIsEditing,
    navStack, setNavStack,
    navigateTo, handleBack, resetStack
  };
};
