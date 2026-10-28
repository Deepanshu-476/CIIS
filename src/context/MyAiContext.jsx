import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useAuth } from './useAuth';

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
      openMyAi,
      closeMyAi,
      toggleExpanded,
    }),
    [isOpen, isExpanded, isClient, openMyAi, closeMyAi, toggleExpanded]
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
