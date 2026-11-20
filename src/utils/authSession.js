export const AUTH_SYNC_EVENT = 'ciis-auth-changed';
export const isDesktopApp = typeof window !== 'undefined' && Boolean(window.electronAPI);
export const accountStorage = typeof window === 'undefined'
  ? undefined
  : (isDesktopApp ? window.localStorage : window.sessionStorage);

const nonAccountStorageKeys = new Set([
  'ciisCompanyRegistrationDraft',
  'last_chunk_reload',
  'vite_preload_reload',
  'themeMode',
  'chatSidebarWidth',
  'ciis-chat-contact-sidebar-width',
  'christmasPopupLastShown',
  'ciis_public_promo_seen',
]);

export const clearTabSession = () => {
  const stores = isDesktopApp ? [accountStorage, window.sessionStorage] : [accountStorage];
  for (const storage of stores) {
    for (const key of Object.keys(storage)) {
      if (!nonAccountStorageKeys.has(key) && !key.startsWith('ciis_promo_seen_')) {
        storage.removeItem(key);
      }
    }
  }
};

export const notifyAuthChanged = () => window.dispatchEvent(new Event(AUTH_SYNC_EVENT));

export const endTabSession = () => {
  clearTabSession();
  notifyAuthChanged();
};

// A same-origin portal link inherits the current tab's session at creation.
// Subsequent changes to either tab's session are independent.
export const openPortalTab = path => {
  const tab = window.open(path, '_blank');
  if (tab) tab.opener = null;
};
