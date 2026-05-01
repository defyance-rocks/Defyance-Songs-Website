import { NavState, AppEntity, isSong, UserRole } from '../../shared/models';

export { UserRole };

export const canEditItem = (role: UserRole, tab: NavState['tab'], item: AppEntity | null) => {
    if (!role) return false;
    if (role === 'admin') return true;
    if (role === 'band_member' && tab === 'songs') {
        if (!item) return true; // Can create new
        if (isSong(item)) return item.status !== 'Approved';
    }
    return false;
};

export const canAddFiles = (role: UserRole, tab: NavState['tab']) => {
    if (!role) return false;
    if (role === 'admin') return true;
    return role === 'band_member' && tab === 'songs';
};

export const canDeleteDocument = (role: UserRole, tab: NavState['tab'], item: AppEntity | null) => {
    if (!role) return false;
    if (role === 'admin') return true;
    if (role === 'band_member' && tab === 'songs' && isSong(item)) {
        return item.status !== 'Approved';
    }
    return false;
};
