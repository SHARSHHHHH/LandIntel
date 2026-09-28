"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { GeographicUnitOut } from "@/lib/gov/types";

const STORAGE_KEY = "land_intel_selected_area";

interface AreaContextState {
  selectedArea: GeographicUnitOut | null;
  setSelectedArea: (area: GeographicUnitOut) => void;
  clearSelectedArea: () => void;
}

const AreaContext = createContext<AreaContextState | null>(null);

export function AreaProvider({ children }: { children: ReactNode }) {
  const [selectedArea, setSelectedAreaState] = useState<GeographicUnitOut | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSelectedAreaState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (selectedArea) localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedArea));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
  }, [selectedArea]);

  return (
    <AreaContext.Provider
      value={{
        selectedArea,
        setSelectedArea: setSelectedAreaState,
        clearSelectedArea: () => setSelectedAreaState(null),
      }}
    >
      {children}
    </AreaContext.Provider>
  );
}

export function useAreaContext(): AreaContextState {
  const ctx = useContext(AreaContext);
  if (!ctx) throw new Error("useAreaContext must be used within AreaProvider");
  return ctx;
}
