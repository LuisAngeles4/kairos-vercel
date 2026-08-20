export type Activity = {
  id: string;
  title: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  paceMinKm: string;
  type: "Easy Run" | "Tempo" | "Long Run" | "Intervals" | "Recovery";
  elevationM: number;
  avgHr: number;
};

export const runner = {
  name: "Luis Angeles",
  handle: "@luisruns",
  location: "Ciudad de México, MX",
  level: "Intermediate",
  memberSince: "Marzo 2024",
  weeklyGoalKm: 45,
  weeklyDoneKm: 32.4,
  monthlyGoalKm: 180,
  monthlyDoneKm: 124.8,
  totalKm: 1284.6,
  totalRuns: 186,
  totalHours: 132,
  bestPace: "4:12",
  longestRunKm: 32.1,
  streakDays: 12,
};

export const activities: Activity[] = [
  {
    id: "a1",
    title: "Morning Loop — Chapultepec",
    date: "2026-08-13",
    distanceKm: 10.2,
    durationMin: 51,
    paceMinKm: "5:00",
    type: "Easy Run",
    elevationM: 84,
    avgHr: 148,
  },
  {
    id: "a2",
    title: "Tempo Session",
    date: "2026-08-11",
    distanceKm: 8.0,
    durationMin: 36,
    paceMinKm: "4:30",
    type: "Tempo",
    elevationM: 42,
    avgHr: 168,
  },
  {
    id: "a3",
    title: "Sunday Long Run",
    date: "2026-08-09",
    distanceKm: 21.1,
    durationMin: 116,
    paceMinKm: "5:30",
    type: "Long Run",
    elevationM: 210,
    avgHr: 152,
  },
  {
    id: "a4",
    title: "Track Intervals 8x400",
    date: "2026-08-07",
    distanceKm: 6.4,
    durationMin: 28,
    paceMinKm: "4:22",
    type: "Intervals",
    elevationM: 12,
    avgHr: 174,
  },
  {
    id: "a5",
    title: "Recovery Jog",
    date: "2026-08-06",
    distanceKm: 5.0,
    durationMin: 31,
    paceMinKm: "6:12",
    type: "Recovery",
    elevationM: 25,
    avgHr: 132,
  },
  {
    id: "a6",
    title: "Riverside Run",
    date: "2026-08-04",
    distanceKm: 12.6,
    durationMin: 64,
    paceMinKm: "5:05",
    type: "Easy Run",
    elevationM: 96,
    avgHr: 145,
  },
];

export const weeklyDistance = [
  { day: "Lun", km: 6.2 },
  { day: "Mar", km: 0 },
  { day: "Mié", km: 8.0 },
  { day: "Jue", km: 5.0 },
  { day: "Vie", km: 12.6 },
  { day: "Sáb", km: 0 },
  { day: "Dom", km: 10.2 },
];

export const monthlyProgress = [
  { month: "Mar", km: 96, pace: 5.6 },
  { month: "Abr", km: 118, pace: 5.45 },
  { month: "May", km: 134, pace: 5.3 },
  { month: "Jun", km: 152, pace: 5.2 },
  { month: "Jul", km: 168, pace: 5.05 },
  { month: "Ago", km: 124, pace: 4.95 },
];

export const personalRecords = [
  { label: "5K", value: "21:04", date: "12 Jul 2026" },
  { label: "10K", value: "44:38", date: "28 Jun 2026" },
  { label: "Media maratón", value: "1:38:12", date: "18 May 2026" },
  { label: "Maratón", value: "3:42:55", date: "02 Mar 2026" },
];
