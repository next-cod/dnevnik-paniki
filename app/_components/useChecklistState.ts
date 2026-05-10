"use client";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function useChecklistState<T extends Record<string, unknown>>(
  storageKey: string,
  initial: T,
) {
  const [state, setState] = useState<T>(initial);
  const hydrated = useRef(false);
  const skippedInitialPersist = useRef(false);
  const stateRef = useRef<T>(initial);

  const persist = useCallback((next: T) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const next = { ...initial, ...parsed };
        stateRef.current = next;
        setState(next);
      }
    } catch {}
    hydrated.current = true;
  }, [initial, storageKey]);

  useEffect(() => {
    if (!hydrated.current) return;
    stateRef.current = state;
    if (!skippedInitialPersist.current) {
      skippedInitialPersist.current = true;
      return;
    }
    persist(state);
  }, [persist, state]);

  const setSavedState = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    const next = typeof action === "function"
      ? (action as (value: T) => T)(stateRef.current)
      : action;
    stateRef.current = next;
    if (hydrated.current) persist(next);
    setState(next);
  }, [persist]);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setSavedState((prev) => ({ ...prev, [key]: value }));
  }, [setSavedState]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    stateRef.current = initial;
    setState(initial);
  }, [storageKey, initial]);

  return { state, update, setState: setSavedState, reset } as const;
}
