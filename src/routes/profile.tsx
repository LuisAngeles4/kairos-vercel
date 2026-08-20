import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, LogOut, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActivities } from "@/store/activities";
import { compressProfilePhoto, useAuth } from "@/store/auth";
import { useSettings, type Settings } from "@/store/settings";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Kairos Running" },
      {
        name: "description",
        content: "Tu perfil de corredor: datos personales, estadísticas y objetivos.",
      },
      { property: "og:title", content: "Profile — Kairos Running" },
      {
        property: "og:description",
        content: "Consulta tus estadísticas personales y objetivos de entrenamiento.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { logOut, user, updateUser } = useAuth();
  const { settings, ready, saveSettings } = useSettings();
  const { stats } = useActivities();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    username: string;
    email: string;
    city: string;
    level: Settings["level"];
  }>({
    name: user?.name ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    city: user?.city ?? "",
    level: settings.level,
  });

  useEffect(() => {
    if (!isEditing && ready) {
      setForm({
        name: user?.name ?? "",
        username: user?.username ?? "",
        email: user?.email ?? "",
        city: user?.city ?? "",
        level: settings.level,
      });
    }
  }, [isEditing, ready, settings, user]);

  const handleLogOut = () => {
    logOut();
    navigate({ to: "/welcome", replace: true });
  };

  const startEditing = () => {
    setForm({
      name: user?.name ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      city: user?.city ?? "",
      level: settings.level,
    });
    setPhotoPreview(null);
    setPhotoFile(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo seleccionado no es una imagen válida.");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const saveProfile = async () => {
    const saved = { ...settings, level: form.level };
    try {
      setUploadingPhoto(true);
      let profilePhoto = user?.profilePhoto ?? "";
      if (photoFile && user) {
        profilePhoto = await compressProfilePhoto(photoFile);
      }
      if (user) {
        await updateUser({
          name: form.name,
          username: form.username,
          email: form.email,
          city: form.city,
          level: form.level,
          ...(profilePhoto !== user?.profilePhoto ? { profilePhoto } : {}),
        });
      }
      await saveSettings(saved);
      setIsEditing(false);
      setPhotoPreview(null);
      setPhotoFile(null);
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    } finally {
      setUploadingPhoto(false);
    }
  };
  const displayName = user?.name ?? "Corredor";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const goalKm = settings.weeklyGoalKm;
  const weeklyDoneKm = stats.weeklyDoneKm;
  const weekPct = goalKm > 0 ? Math.min(100, Math.round((weeklyDoneKm / goalKm) * 100)) : 0;
  const monthlyGoalKm = goalKm * 4;
  const monthPct = monthlyGoalKm > 0 ? Math.round((stats.monthlyDoneKm / monthlyGoalKm) * 100) : 0;

  return (
    <AppShell title="Profile" subtitle="Información del corredor">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          {/* Avatar */}
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={displayName}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
              {initials}
            </span>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              {user?.username && (
                <span className="text-sm font-semibold text-primary">@{user.username}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {user?.email ?? ""}
              {user?.city ? ` · ${user.city}` : ""}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">{settings.level}</Badge>
              <Badge variant="secondary">Miembro de Kairos</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={startEditing}>
              Editar perfil
            </Button>
            <Button variant="outline" onClick={handleLogOut}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Editar perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ── Photo upload ── */}
            <div className="space-y-2">
              <Label>Foto de perfil</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  {photoPreview ? (
                    <>
                      <img
                        src={photoPreview}
                        alt="Vista previa"
                        className="h-20 w-20 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoFile(null);
                        }}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                        aria-label="Quitar foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={displayName}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {user?.profilePhoto ? "Cambiar foto" : "Subir foto"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o WebP · se optimiza automáticamente antes de guardar
                    {photoFile && (
                      <span className="ml-1 font-medium text-primary"> · {photoFile.name}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Personal data ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nombre</Label>
                <Input
                  id="profile-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username (@)</Label>
                <Input
                  id="profile-username"
                  placeholder="ej. carlos123"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, username: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Correo</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-city">Ciudad</Label>
                <Input
                  id="profile-city"
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select
                  value={form.level}
                  onValueChange={(level) =>
                    setForm((current) => ({ ...current, level: level as Settings["level"] }))
                  }
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
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button onClick={saveProfile} disabled={uploadingPhoto}>
                  {uploadingPhoto ? "Guardando…" : "Guardar cambios"}
                </Button>
                <Button variant="outline" onClick={cancelEditing} disabled={uploadingPhoto}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Distancia total" value={stats.totalKm} unit="km" />
        <StatCard label="Carreras" value={stats.totalRuns} />
        <StatCard label="Carrera más larga" value={stats.longestRunKm} unit="km" />
        <StatCard label="Mejor ritmo" value={stats.bestPace} unit="/km" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Objetivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Semanal</span>
                <span className="text-muted-foreground">
                  {weeklyDoneKm} / {goalKm} km
                </span>
              </div>
              <Progress value={weekPct} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Mensual</span>
                <span className="text-muted-foreground">
                  {stats.monthlyDoneKm} / {monthlyGoalKm} km
                </span>
              </div>
              <Progress value={monthPct} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Récords personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.personalRecords.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3"
              >
                <span className="text-sm">{r.label}</span>
                <span className="font-display font-bold text-primary">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
