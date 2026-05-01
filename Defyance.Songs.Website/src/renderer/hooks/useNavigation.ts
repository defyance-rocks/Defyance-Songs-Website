import { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { NavState } from '../../shared/models';

export const useNavigation = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams();

  // Parse current state from URL
  const tab = useMemo(() => (params.tab as NavState['tab']) || 'bands', [params.tab]);
  const selectedId = useMemo(() => (params.id === 'edit' ? null : params.id) || null, [params.id]);
  const isEditing = useMemo(() => location.pathname.endsWith('/edit') || (tab === 'login'), [location.pathname, tab]);

  // Persistent List State
  const search = useMemo(() => searchParams.get('q') || '', [searchParams]);
  const sort = useMemo(() => searchParams.get('s') || 'alpha', [searchParams]);
  const filter = useMemo(() => searchParams.get('f') || '', [searchParams]);
  const filterKey = useMemo(() => searchParams.get('k') || '', [searchParams]);

  const navigateTo = useCallback((newTab: NavState['tab'], id: string | null = null, edit: boolean = false) => {
    let path = `/${newTab}`;
    if (id) path += `/${id}`;
    if (edit) path += `/edit`;
    
    // Preserve list params if we are just switching tabs
    if (!id && !edit) {
        navigate({ pathname: path, search: searchParams.toString() });
    } else {
        navigate(path);
    }
  }, [navigate, searchParams]);

  const setListState = useCallback((updates: { q?: string, s?: string, f?: string, k?: string }) => {
    const newParams = new URLSearchParams(searchParams);
    if (updates.q !== undefined) { if (updates.q) newParams.set('q', updates.q); else newParams.delete('q'); }
    if (updates.s !== undefined) { if (updates.s && updates.s !== 'alpha') newParams.set('s', updates.s); else newParams.delete('s'); }
    if (updates.f !== undefined) { if (updates.f) newParams.set('f', updates.f); else newParams.delete('f'); }
    if (updates.k !== undefined) { if (updates.k) newParams.set('k', updates.k); else newParams.delete('k'); }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const resetStack = useCallback(() => {
    navigate('/bands');
  }, [navigate]);

  return {
    tab,
    selectedId,
    isEditing,
    search,
    sort,
    filter,
    filterKey,
    navigateTo,
    handleBack,
    resetStack,
    setListState
  };
};
