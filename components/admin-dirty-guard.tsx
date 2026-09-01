'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

type DirtyEntry = {
  id: string;
  label: string;
};

type DirtyGuardContextValue = {
  confirmDiscardChanges: () => boolean;
  register: (entry: DirtyEntry | null, id: string) => void;
};

const DirtyGuardContext = createContext<DirtyGuardContextValue | null>(null);

const discardMessage = 'You have unsaved changes. Leave this view and discard them?';

function isPrimaryNavigation(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function AdminDirtyGuardProvider({ children }: { children: React.ReactNode }) {
  const entriesRef = useRef(new Map<string, DirtyEntry>());
  const ignoreNextPopState = useRef(false);
  const [entries, setEntries] = useState<DirtyEntry[]>([]);

  const register = useCallback((entry: DirtyEntry | null, id: string) => {
    if (entry) entriesRef.current.set(id, entry);
    else entriesRef.current.delete(id);
    setEntries([...entriesRef.current.values()]);
  }, []);

  const confirmDiscardChanges = useCallback(() => {
    if (entriesRef.current.size === 0) return true;
    return window.confirm(discardMessage);
  }, []);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (entriesRef.current.size === 0) return;
      event.preventDefault();
      event.returnValue = '';
    }

    function click(event: MouseEvent) {
      if (entriesRef.current.size === 0 || !isPrimaryNavigation(event)) return;
      const target = event.target instanceof Element ? event.target : null;
      const navigationTarget = target?.closest<HTMLAnchorElement | HTMLElement>('a[href], [data-admin-guard-navigation]');
      if (!navigationTarget) return;

      if (navigationTarget instanceof HTMLAnchorElement) {
        if (navigationTarget.target === '_blank' || navigationTarget.hasAttribute('download')) return;
        const destination = new URL(navigationTarget.href, window.location.href);
        if (destination.href === window.location.href) return;
      }

      if (!confirmDiscardChanges()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }

    function popState() {
      if (ignoreNextPopState.current) {
        ignoreNextPopState.current = false;
        return;
      }
      if (entriesRef.current.size === 0 || confirmDiscardChanges()) return;
      ignoreNextPopState.current = true;
      window.history.forward();
    }

    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('popstate', popState);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', popState);
      document.removeEventListener('click', click, true);
    };
  }, [confirmDiscardChanges]);

  const context = useMemo(() => ({ confirmDiscardChanges, register }), [confirmDiscardChanges, register]);

  return (
    <DirtyGuardContext.Provider value={context}>
      {children}
      {entries.length > 0 ? (
        <div className="admin-unsaved-indicator" role="status" aria-live="polite">
          <strong>Unsaved changes</strong>
          <span>{entries.length === 1 ? entries[0].label : `${entries.length} open edits`}</span>
        </div>
      ) : null}
    </DirtyGuardContext.Provider>
  );
}

export function useAdminUnsavedChanges(isDirty: boolean, label: string) {
  const id = useId();
  const context = useContext(DirtyGuardContext);

  if (!context) throw new Error('useAdminUnsavedChanges must be used inside AdminDirtyGuardProvider.');

  useEffect(() => {
    context.register(isDirty ? { id, label } : null, id);
    return () => context.register(null, id);
  }, [context, id, isDirty, label]);

  return { confirmDiscardChanges: context.confirmDiscardChanges };
}

export function useAdminFormChanges(label: string) {
  const [isDirty, setDirty] = useState(false);
  const guard = useAdminUnsavedChanges(isDirty, label);
  return {
    ...guard,
    isDirty,
    markDirty: () => setDirty(true),
    markClean: () => setDirty(false),
  };
}
