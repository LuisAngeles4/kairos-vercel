import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivities } from "@/store/activities";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Kairos Running" },
      {
        name: "description",
        content: "Gráficas de volumen mensual, ritmo y récords personales de tu evolución.",
      },
      { property: "og:title", content: "Progress — Kairos Running" },
      {
        property: "og:description",
        content: "Visualiza tu evolución como corredor con estadísticas y gráficas.",
      },
    ],
  }),
  component: ProgressPage,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };

function ProgressPage() {
  const { stats } = useActivities();
  const { monthlyProgress, weeklyDistance } = stats;

  return (
    <AppShell title="Progress" subtitle="Tu evolución en los últimos 6 meses">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Distancia total" value={stats.totalKm} unit="km" />
        <StatCard label="Carreras" value={stats.totalRuns} />
        <StatCard label="Horas corridas" value={stats.totalHours} unit="h" />
        <StatCard label="Mejor ritmo" value={stats.bestPace} unit="/km" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volumen mensual (km)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyProgress}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" {...axis} />
                <YAxis {...axis} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="km"
                  stroke="var(--primary)"
                  fill="url(#gold)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distancia semanal (km)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyDistance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="km" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Récords personales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.personalRecords.map((r) => (
            <div key={r.label} className="rounded-lg border border-border bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</p>
              <p className="font-display text-2xl font-bold text-primary">{r.value}</p>
              <p className="text-xs text-muted-foreground">{r.date}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
