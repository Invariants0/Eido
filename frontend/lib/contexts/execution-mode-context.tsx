'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export type ExecutionMode = 'controlled' | 'live';

interface ExecutionModeContextValue {
  mode: ExecutionMode;
  isControlled: boolean;
  setMode: (mode: ExecutionMode) => void;
  toggle: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const ExecutionModeContext = createContext<ExecutionModeContextValue | null>(null);

const STORAGE_KEY = 'eido-execution-mode';

// ── Provider ─────────────────────────────────────────────────────────────────

export function ExecutionModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ExecutionMode>('controlled');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ExecutionMode | null;
    if (saved === 'controlled' || saved === 'live') {
      setModeState(saved);
    }
  }, []);

  const setMode = (next: ExecutionMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const toggle = () => setMode(mode === 'controlled' ? 'live' : 'controlled');

  return (
    <ExecutionModeContext.Provider
      value={{ mode, isControlled: mode === 'controlled', setMode, toggle }}
    >
      {children}
    </ExecutionModeContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useExecutionMode(): ExecutionModeContextValue {
  const ctx = useContext(ExecutionModeContext);
  if (!ctx) {
    throw new Error('useExecutionMode must be used within ExecutionModeProvider');
  }
  return ctx;
}
