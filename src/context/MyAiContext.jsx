import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useAuth } from './useAuth';
import axiosInstance from '../utils/axiosConfig';

export const MyAiStateContext = createContext(null);
export const MyAiActionsContext = createContext(null);

/**
 * MyAiProvider
 * 
 * Global UI coordinator for My AI popup state (open, expanded, client check).
 * Turn and conversation handling is delegated directly to useTaskAgentSession,
 * ensuring exactly one source of truth across the application.
 */
export function MyAiProvider({ children }) {
  const { user: currentUser } = useAuth();

  const isClient = useMemo(() => {
    const r = String(currentUser?.role || currentUser?.userRole || '').toLowerCase();
    const cr = String(currentUser?.companyRole || '').toLowerCase();
    return cr === 'client' || r === 'client';
  }, [currentUser]);

  const isPrivileged = useMemo(() => {
    if (!currentUser) return false;
    const roles = [currentUser.companyRole, currentUser.role, currentUser.jobRole, currentUser.jobRoleName]
      .filter(Boolean)
      .map((r) =>
        String(typeof r === 'object' ? r.name || r.role || '' : r)
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, '_')
      );
    return (
      roles.some((r) =>
        ['owner', 'company_owner', 'companyowner', 'admin', 'company_admin', 'companyadmin', 'super_admin', 'superadmin'].includes(r)
      ) || Boolean(currentUser.isSuperAdmin || currentUser.isPlatformOwner)
    );
  }, [currentUser]);

  const [serverAccessOverride, setServerAccessOverride] = useState(null);

  const localAiAccess = useMemo(() => {
    if (!currentUser) return false;
    if (isClient) return false;
    if (isPrivileged) return true;
    const aiConfig = currentUser.aiConfig;
    if (aiConfig) {
      if (aiConfig.enabled === false) return false;
      if (aiConfig.customDailyTokenLimit === 0) return false;
    }
    return true;
  }, [currentUser, isClient, isPrivileged]);

  const hasAiAccess = serverAccessOverride !== null ? serverAccessOverride : localAiAccess;

  // Background sync for fresh AI access status
  useEffect(() => {
    if (!currentUser || isClient || isPrivileged) return;
    const companyId = currentUser.company?._id || currentUser.company || currentUser.companyId;
    if (!companyId) return;

    let isMounted = true;
    const checkAccess = async () => {
      try {
        const res = await axiosInstance.get(`/company/${companyId}/ai-settings/my-access`);
        if (isMounted && res.data?.success) {
          setServerAccessOverride(Boolean(res.data.hasAccess));
          if (res.data.aiConfig && typeof localStorage !== 'undefined') {
            try {
              const raw = localStorage.getItem('user');
              if (raw) {
                const u = JSON.parse(raw);
                if (JSON.stringify(u.aiConfig) !== JSON.stringify(res.data.aiConfig)) {
                  u.aiConfig = res.data.aiConfig;
                  localStorage.setItem('user', JSON.stringify(u));
                }
              }
            } catch {}
          }
        }
      } catch (err) {
        // Retain localAiAccess fallback silently
      }
    };

    checkAccess();
    const onFocus = () => checkAccess();
    window.addEventListener('focus', onFocus);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser, isClient, isPrivileged]);

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync expanded class to document body to auto-hide other floating launchers
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isOpen && isExpanded) {
        document.body.classList.add('my-ai-expanded-active');
      } else {
        document.body.classList.remove('my-ai-expanded-active');
      }
    }
  }, [isOpen, isExpanded]);

  const openMyAi = useCallback(({ expanded = false } = {}) => {
    window.dispatchEvent(new CustomEvent('close-support-widget'));
    setIsOpen(true);
    if (expanded) {
      setIsExpanded(true);
    }
  }, []);

  const closeMyAi = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
    window.dispatchEvent(new CustomEvent('close-messenger-widget'));
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      isExpanded,
      isClient,
      hasAiAccess,
      openMyAi,
      closeMyAi,
      toggleExpanded,
    }),
    [isOpen, isExpanded, isClient, hasAiAccess, openMyAi, closeMyAi, toggleExpanded]
  );

  return (
    <MyAiStateContext.Provider value={value}>
      <MyAiActionsContext.Provider value={value}>{children}</MyAiActionsContext.Provider>
    </MyAiStateContext.Provider>
  );
}

const DEFAULT_MY_AI_STATE = {
  isOpen: false,
  isExpanded: false,
  isClient: false,
  hasAiAccess: false,
};

const DEFAULT_MY_AI_ACTIONS = {
  openMyAi: () => {},
  closeMyAi: () => {},
  toggleExpanded: () => {},
};

export function useMyAiState() {
  const context = useContext(MyAiStateContext);
  return context || DEFAULT_MY_AI_STATE;
}

export function useMyAiActions() {
  const context = useContext(MyAiActionsContext);
  return context || DEFAULT_MY_AI_ACTIONS;
}

export function useMyAi() {
  const state = useMyAiState();
  const actions = useMyAiActions();
  return { ...state, ...actions };
}
