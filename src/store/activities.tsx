import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/store/auth";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export const RUN_TYPES = ["Entrenamiento", "Carrera libre", "5K", "10K", "Otra"] as const;

export type RunActivity = {
  id: string;
  title: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  paceMinKm: string;
  type: string;
  calories: number;
  notes?: string;
  elevationM: number;
  avgHr: number;
};

export type NewRunInput = Omit<RunActivity, "id">;

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isRunActivity(value: unknown): value is RunActivity {
  if (!isRecord(value)) return false;

  return (
    typeof value["id"] === "string" &&
    typeof value["title"] === "string" &&
    typeof value["date"] === "string" &&
    isFiniteNonNegativeNumber(value["distanceKm"]) &&
    isFiniteNonNegativeNumber(value["durationMin"]) &&
    typeof value["paceMinKm"] === "string" &&
    typeof value["type"] === "string" &&
    isFiniteNonNegativeNumber(value["calories"]) &&
    (value["notes"] === undefined || typeof value["notes"] === "string") &&
    isFiniteNonNegativeNumber(value["elevationM"]) &&
    isFiniteNonNegativeNumber(value["avgHr"])
  );
}

function fromFirestoreActivity(id: string, value: Record<string, unknown>): RunActivity {
  const distanceKm = Number(value["distanceKm"] ?? value["distance"] ?? 0);
  const durationMin = Number(value["durationMin"] ?? value["duration"] ?? 0);
  return {
    id,
    title: typeof value["title"] === "string" ? value["title"] : "Carrera",
    date:
      typeof value["date"] === "string"
        ? value["date"]
        : typeof value["activityDate"] === "string"
          ? value["activityDate"]
          : "",
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
    durationMin: Number.isFinite(durationMin) ? durationMin : 0,
    paceMinKm:
      typeof value["paceMinKm"] === "string"
        ? value["paceMinKm"]
        : paceFrom(distanceKm, durationMin),
    type: typeof value["type"] === "string" ? value["type"] : "Entrenamiento",
    calories: Number(value["calories"] ?? 0) || 0,
    notes: typeof value["notes"] === "string" ? value["notes"] : "",
    elevationM: Number(value["elevationM"] ?? 0) || 0,
    avgHr: Number(value["avgHr"] ?? 0) || 0,
  };
}

export function paceFrom(distanceKm: number, durationMin: number) {
  if (!distanceKm || !durationMin) return "0:00";
  const pace = durationMin / distanceKm;
  const totalSeconds = Math.round(pace * 60);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function toDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
}

function isInRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function formatDuration(durationMin: number) {
  const totalSeconds = Math.round(durationMin * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type PersonalRecord = { label: string; value: string; date: string };

const RECORD_DISTANCES = [
  { label: "5K", distanceKm: 5 },
  { label: "10K", distanceKm: 10 },
  { label: "Media maratón", distanceKm: 21.0975 },
  { label: "Maratón", distanceKm: 42.195 },
] as const;

function getPersonalRecords(activities: RunActivity[]): PersonalRecord[] {
  return RECORD_DISTANCES.map(({ label, distanceKm }) => {
    const matchingRuns = activities.filter(
      (activity) => Math.abs(activity.distanceKm - distanceKm) <= distanceKm * 0.05,
    );
    const record = matchingRuns.reduce<RunActivity | undefined>((best, activity) => {
      const projectedTime = (activity.durationMin / activity.distanceKm) * distanceKm;
      const bestProjectedTime = best
        ? (best.durationMin / best.distanceKm) * distanceKm
        : Number.POSITIVE_INFINITY;
      return projectedTime < bestProjectedTime ? activity : best;
    }, undefined);

    if (!record) return { label, value: "Sin registro", date: "Registra una carrera" };

    return {
      label,
      value: formatDuration((record.durationMin / record.distanceKm) * distanceKm),
      date: record.date,
    };
  });
}

type Ctx = {
  activities: RunActivity[];
  ready: boolean;
  addActivity: (input: NewRunInput) => Promise<RunActivity>;
  stats: {
    totalKm: number;
    totalRuns: number;
    totalHours: number;
    longestRunKm: number;
    bestPace: string;
    weeklyDoneKm: number;
    monthlyDoneKm: number;
    totalCalories: number;
    streakDays: number;
    weeklyDistance: { day: string; km: number }[];
    dailyDistance: { day: string; km: number }[];
    monthlyProgress: { month: string; km: number; pace: number }[];
    personalRecords: PersonalRecord[];
  };
};

const ActivitiesContext = createContext<Ctx | null>(null);

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [activities, setActivities] = useState<RunActivity[]>([]);
  const [ready, setReady] = useState(false);
  const activitiesRef = useRef(activities);

  useEffect(() => {
    setReady(false);
    if (!authReady || !user || !db) {
      activitiesRef.current = [];
      setActivities([]);
      if (authReady) setReady(true);
      return;
    }

    const activitiesQuery = query(
      collection(db, "users", user.id, "activities"),
      orderBy("date", "desc"),
    );
    return onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((activityDoc) => fromFirestoreActivity(activityDoc.id, activityDoc.data()))
          .filter((activity) => activity.date && activity.distanceKm > 0);
        activitiesRef.current = next;
        setActivities(next);
        setReady(true);
      },
      () => {
        activitiesRef.current = [];
        setActivities([]);
        setReady(true);
      },
    );
  }, [authReady, user]);

  const addActivity = useCallback(
    async (input: NewRunInput) => {
      if (!user || !db) throw new Error("Debes iniciar sesión para registrar una actividad.");
      const created = await addDoc(collection(db, "users", user.id, "activities"), {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { ...input, id: created.id };
    },
    [user],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weeklyDistance = DAYS.map((day) => ({ day, km: 0 }));
    activities.forEach((activity) => {
      const date = toDate(activity.date);
      if (isInRange(date, weekStart, weekEnd)) {
        const day = weeklyDistance[date.getDay()];
        if (day) day.km += activity.distanceKm;
      }
    });
    weeklyDistance.forEach((day) => {
      day.km = Number(day.km.toFixed(1));
    });

    // The dashboard is a rolling view so it always represents the last seven
    // calendar days, including runs added today. The weekly series above is
    // retained for the weekly goal and Progress page.
    const dailyDistance = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`;
      const km = activities
        .filter((activity) => activity.date === dateKey)
        .reduce((sum, activity) => sum + activity.distanceKm, 0);

      return {
        day: `${DAYS[date.getDay()]} ${date.getDate()}`,
        km: Number(km.toFixed(1)),
      };
    });

    const monthlyProgress = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
      const monthlyActivities = activities.filter((activity) => {
        const activityDate = toDate(activity.date);
        return (
          activityDate.getFullYear() === date.getFullYear() &&
          activityDate.getMonth() === date.getMonth()
        );
      });
      const km = monthlyActivities.reduce((sum, activity) => sum + activity.distanceKm, 0);
      const durationMin = monthlyActivities.reduce(
        (sum, activity) => sum + activity.durationMin,
        0,
      );

      return {
        month: MONTHS[date.getMonth()] ?? "",
        km: Number(km.toFixed(1)),
        pace: km > 0 ? Number((durationMin / km).toFixed(2)) : 0,
      };
    });

    const totalKm = activities.reduce((sum, activity) => sum + activity.distanceKm, 0);
    const totalMin = activities.reduce((sum, activity) => sum + activity.durationMin, 0);
    const fastestActivity = activities.reduce<RunActivity | undefined>(
      (best, activity) =>
        !best || activity.durationMin / activity.distanceKm < best.durationMin / best.distanceKm
          ? activity
          : best,
      undefined,
    );
    const currentMonthKm = monthlyProgress.at(-1)?.km ?? 0;
    const activityDates = new Set(activities.map((activity) => activity.date));
    let streakDays = 0;
    const streakDate = new Date(today);
    while (
      activityDates.has(
        `${streakDate.getFullYear()}-${String(streakDate.getMonth() + 1).padStart(2, "0")}-${String(streakDate.getDate()).padStart(2, "0")}`,
      )
    ) {
      streakDays += 1;
      streakDate.setDate(streakDate.getDate() - 1);
    }

    return {
      totalKm: Number(totalKm.toFixed(1)),
      totalRuns: activities.length,
      totalHours: Number((totalMin / 60).toFixed(1)),
      longestRunKm: Math.max(0, ...activities.map((a) => a.distanceKm)),
      bestPace: fastestActivity
        ? paceFrom(fastestActivity.distanceKm, fastestActivity.durationMin)
        : "—",
      weeklyDoneKm: Number(weeklyDistance.reduce((s, d) => s + d.km, 0).toFixed(1)),
      monthlyDoneKm: currentMonthKm,
      totalCalories: activities.reduce((s, a) => s + a.calories, 0),
      streakDays,
      weeklyDistance,
      dailyDistance,
      monthlyProgress,
      personalRecords: getPersonalRecords(activities),
    };
  }, [activities]);

  // Los agregados se guardan en el documento del usuario para que el perfil
  // público no tenga que exponer ni consultar sus actividades privadas.
  const lastPublishedStats = useRef<string>("");
  useEffect(() => {
    if (!user || !db || !ready) return;
    const publicStats = {
      totalKm: stats.totalKm,
      totalRuns: stats.totalRuns,
      totalHours: stats.totalHours,
      longestRunKm: stats.longestRunKm,
      bestPace: stats.bestPace,
      totalCalories: stats.totalCalories,
      streakDays: stats.streakDays,
      weeklyDoneKm: stats.weeklyDoneKm,
      monthlyDoneKm: stats.monthlyDoneKm,
    };
    const serialized = `${user.id}:${JSON.stringify(publicStats)}`;
    if (serialized === lastPublishedStats.current) return;
    lastPublishedStats.current = serialized;
    void setDoc(
      doc(db, "users", user.id),
      { profileStats: publicStats, updatedAt: serverTimestamp() },
      { merge: true },
    ).catch(() => {
      // El dashboard sigue funcionando aunque el agregado público no se pueda sincronizar.
      lastPublishedStats.current = "";
    });
  }, [ready, stats, user]);

  const value = useMemo(
    () => ({ activities, ready, addActivity, stats }),
    [activities, ready, addActivity, stats],
  );

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error("useActivities must be used within ActivitiesProvider");
  return ctx;
}
