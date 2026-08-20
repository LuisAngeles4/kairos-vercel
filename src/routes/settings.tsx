import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { useSettings, type Settings } from "@/store/settings";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Kairos Running" },
      {
        name: "description",
        content: "Configura tu cuenta, unidades, objetivos y notificaciones en Kairos.",
      },
      { property: "og:title", content: "Settings — Kairos Running" },
      {
        property: "og:description",
        content: "Preferencias de cuenta y entrenamiento en Kairos.",
      },
    ],
  }),
  component: SettingsPage,
});

const toggles = [
  {
    key: "notifyTraining" as const,
    label: "Recordatorios de entrenamiento",
    desc: "Aviso diario a las 6:00 am",
  },
  {
    key: "notifyWeeklyEmail" as const,
    label: "Resumen semanal por correo",
    desc: "Cada domingo por la noche",
  },
  {
    key: "publicProfile" as const,
    label: "Perfil público",
    desc: "Otros corredores pueden ver tus carreras",
  },
];

function SettingsPage() {
  const { logOut, user, updateUser } = useAuth();
  const { settings, ready, saveSettings } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState<Settings>(settings);
  const [profile, setProfile] = useState({ name: "", username: "", email: "", city: "" });

  useEffect(() => {
    if (ready) {
      setForm(settings);
      setProfile({
        name: user?.name ?? "",
        username: user?.username ?? "",
        email: user?.email ?? "",
        city: user?.city ?? "",
      });
    }
  }, [ready, settings, user]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const saved = { ...form, weeklyGoalKm: Number(form.weeklyGoalKm) || 0 };
    try {
      if (user) {
        await updateUser({
          name: profile.name,
          username: profile.username,
          email: profile.email,
          city: profile.city,
          level: form.level,
        });
      }
      await saveSettings(saved);
      toast.success("Información guardada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la información.");
    }
  };

  const handleLogOut = () => {
    logOut();
    navigate({ to: "/welcome", replace: true });
  };

  return (
    <AppShell title="Settings" subtitle="Configuración y preferencias de la cuenta">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username (@)</Label>
              <Input
                id="username"
                placeholder="ej. carlos123"
                value={profile.username}
                onChange={(e) =>
                  setProfile((current) => ({ ...current, username: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((current) => ({ ...current, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => setProfile((current) => ({ ...current, city: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave}>Guardar cambios</Button>
              <Button variant="outline" onClick={handleLogOut}>
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias de entrenamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Unidades</Label>
              <Select
                value={form.units}
                onValueChange={(v) => set("units", v as Settings["units"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilómetros</SelectItem>
                  <SelectItem value="mi">Millas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo semanal (km)</Label>
              <Input
                id="goal"
                type="number"
                value={form.weeklyGoalKm}
                onChange={(e) => set("weeklyGoalKm", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select
                value={form.level}
                onValueChange={(v) => set("level", v as Settings["level"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notificaciones y privacidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {toggles.map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4"
              >
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
                <Switch checked={form[t.key]} onCheckedChange={(v) => set(t.key, v)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
