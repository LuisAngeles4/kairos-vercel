import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as RouteIcon, Timer, Gauge, Flame, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useActivities } from "@/store/activities";
import { useAuth } from "@/store/auth";
import { useSettings } from "@/store/settings";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Kairos Running" },
      {
        name: "description",
        content:
          "Resumen de tu entrenamiento: distancia, tiempo, ritmo promedio y objetivo semanal en Kairos.",
      },
      { property: "og:title", content: "Dashboard — Kairos Running" },
      {
        property: "og:description",
        content: "Registra tus carreras y visualiza tu progreso con Kairos.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { activities, ready: activitiesReady, stats } = useActivities();
  const { user } = useAuth();
  const { settings } = useSettings();
  const goalKm = settings.weeklyGoalKm;
  const displayName = user?.name ?? "";
  const firstName = displayName.trim().split(" ")[0] || "Corredor";
  const dailyDistance = stats.dailyDistance;
  const weeklyDoneKm = stats.weeklyDoneKm;
  const goalPct = goalKm > 0 ? Math.min(100, Math.round((weeklyDoneKm / goalKm) * 100)) : 0;
  const remainingKm = Math.max(0, goalKm - weeklyDoneKm);
  const maxKm = Math.max(...dailyDistance.map((d) => d.km), 1);
  const recent = activities.slice(0, 7);
  const recentMin = recent.reduce((s, a) => s + a.durationMin, 0);
  const recentKm = recent.reduce((s, a) => s + a.distanceKm, 0);
  const timeLabel = `${Math.floor(recentMin / 60)}h ${recentMin % 60}m`;
  const avgPace = recentKm > 0 ? recentMin / recentKm : 0;
  const avgPaceLabel = `${Math.floor(avgPace)}:${String(Math.round((avgPace % 1) * 60)).padStart(2, "0")}`;

  return (
    <AppShell
      title={`Hola, ${firstName}`}
      subtitle="Este es el resumen de tu semana de entrenamiento"
      actions={
        <Button asChild>
          <Link to="/activities">
            <Play className="h-4 w-4" /> Nueva carrera
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Distancia semanal"
          value={weeklyDoneKm}
          unit="km"
          hint={`Objetivo ${goalKm} km`}
          icon={RouteIcon}
        />
        <StatCard label="Tiempo total" value={timeLabel} hint="Últimas carreras" icon={Timer} />
        <StatCard
          label="Ritmo promedio"
          value={avgPaceLabel}
          unit="/km"
          hint="Últimas carreras"
          icon={Gauge}
        />
        <StatCard
          label="Racha"
          value={stats.streakDays}
          unit="días"
          hint="Sigue así"
          icon={Flame}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distancia por día</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">Últimos 7 días</p>
            {!activitiesReady ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Cargando actividades…
              </div>
            ) : (
              <div className="flex h-48 items-end gap-3">
                {dailyDistance.map((d) => (
                  <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end rounded-t-md bg-secondary/70">
                      <div
                        className="w-full rounded-t-md bg-primary/80"
                        aria-label={`${d.day}: ${d.km} km`}
                        style={{
                          height: d.km > 0 ? `${Math.max((d.km / maxKm) * 100, 4)}%` : "0%",
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                    <span className="text-xs font-medium">{d.km} km</span>
                  </div>
                ))}
              </div>
            )}
            {activitiesReady && dailyDistance.every((day) => day.km === 0) && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Aún no hay carreras registradas durante los últimos 7 días.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objetivo semanal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalKm <= 0 ? (
              <Button variant="secondary" asChild className="w-full">
                <Link to="/settings">Ponte un objetivo semanal</Link>
              </Button>
            ) : (
              <>
                <p className="font-display text-4xl font-bold text-primary">{goalPct}%</p>
                <Progress value={goalPct} />
                <p className="text-sm text-muted-foreground">
                  {weeklyDoneKm} km de {goalKm} km completados. Faltan {remainingKm.toFixed(1)} km.
                </p>
                <Button variant="secondary" asChild className="w-full">
                  <Link to="/progress">Ver progreso</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Actividades recientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/activities">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.slice(0, 4).map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-4"
            >
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.date}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary">{a.type}</Badge>
                <span>{a.distanceKm} km</span>
                <span className="text-muted-foreground">{a.durationMin} min</span>
                <span className="text-primary">{a.paceMinKm} /km</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
