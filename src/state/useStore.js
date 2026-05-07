import { useSyncExternalStore } from 'react';
import { getState, subscribe } from './storage';

export function useStore() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => getState(),
    () => getState(),
  );
}

export function useCurrentProject() {
  const s = useStore();
  if (!s.currentProjectId) return null;
  return s.projects[s.currentProjectId] || null;
}
