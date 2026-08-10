"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { VolunteerName } from "@/lib/types";

type VolunteerContextValue = {
  names: VolunteerName[];
  selectedId: string;
  selectedName: string | null;
  setSelected: (id: string, name: string) => void;
  clearSelected: () => void;
};

const VolunteerContext = createContext<VolunteerContextValue | null>(null);

const STORAGE_ID_KEY = "alpfa_volunteer_id";
const STORAGE_NAME_KEY = "alpfa_volunteer_name";

export function VolunteerProvider({
  names,
  children,
}: {
  names: VolunteerName[];
  children: React.ReactNode;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_ID_KEY);
    const storedName = localStorage.getItem(STORAGE_NAME_KEY);
    if (storedId && storedName) {
      setSelectedId(storedId);
      setSelectedName(storedName);
    }
  }, []);

  function setSelected(id: string, name: string) {
    setSelectedId(id);
    setSelectedName(name);
    localStorage.setItem(STORAGE_ID_KEY, id);
    localStorage.setItem(STORAGE_NAME_KEY, name);
  }

  function clearSelected() {
    setSelectedId("");
    setSelectedName(null);
    localStorage.removeItem(STORAGE_ID_KEY);
    localStorage.removeItem(STORAGE_NAME_KEY);
  }

  return (
    <VolunteerContext.Provider value={{ names, selectedId, selectedName, setSelected, clearSelected }}>
      {children}
    </VolunteerContext.Provider>
  );
}

export function useVolunteer() {
  const ctx = useContext(VolunteerContext);
  if (!ctx) throw new Error("useVolunteer must be used within VolunteerProvider");
  return ctx;
}
