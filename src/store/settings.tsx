import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/auth";

export type Units = "km" | "mi";
export type Settings = {
  units: Units;
  weeklyGoalKm: number;
  level: "beginner" | "intermediate" | "advanced";
  notifyTraining: boolean;
  notifyWeeklyEmail: boolean;
  publicProfile: boolean;
};
export const defaultSettings: Settings = {
  units: "km",
  weeklyGoalKm: 0,
  level: "beginner",
  notifyTraining: true,
  notifyWeeklyEmail: true,
  publicProfile: false,
};
export const UNIT_LABEL: Record<Units, string> = { km: "km", mi: "mi" };

type SettingsContextValue = {
  settings: Settings;
  ready: boolean;
  saveSettings: (next: Settings) => Promise<void>;
};
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    if (!authReady || !user || !db) {
      setSettings(defaultSettings);
      if (authReady) setReady(true);
      return;
    }
    return onSnapshot(
      doc(db, "users", user.id),
      (snapshot) => {
        const stored = snapshot.data()?.["settings"];
        setSettings({
          ...defaultSettings,
          ...(typeof stored === "object" && stored ? stored : {}),
        } as Settings);
        setReady(true);
      },
      () => {
        setSettings(defaultSettings);
        setReady(true);
      },
    );
  }, [authReady, user]);
  const saveSettings = useCallback(
    async (next: Settings) => {
      if (!user || !db) throw new Error("Debes iniciar sesión para guardar tus preferencias.");
      await setDoc(
        doc(db, "users", user.id),
        {
          settings: next,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    [user],
  );
  const value = useMemo(() => ({ settings, ready, saveSettings }), [settings, ready, saveSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
