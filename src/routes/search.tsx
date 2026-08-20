import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  Lock,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeUsername, type PublicProfile, useAuth } from "@/store/auth";
import { useMessages } from "@/store/messages";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Buscar corredores — Kairos Running" }] }),
  component: SearchPage,
});
const LEVEL_LABELS: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

function Avatar({ profile, large = false }: { profile: PublicProfile; large?: boolean }) {
  const size = large ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm";
  const fallback =
    profile.name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "K";
  return profile.profilePhoto ? (
    <img
      src={profile.profilePhoto}
      alt={profile.name}
      className={`${size} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground`}
    >
      {fallback}
    </span>
  );
}

function profileFromDocument(uid: string, data: Record<string, unknown>): PublicProfile {
  const settings =
    typeof data["settings"] === "object" && data["settings"]
      ? (data["settings"] as Record<string, unknown>)
      : {};
  const storedStats =
    typeof data["profileStats"] === "object" && data["profileStats"]
      ? (data["profileStats"] as Record<string, unknown>)
      : {};
  const stat = (key: string) =>
    typeof storedStats[key] === "number" ? storedStats[key] : undefined;
  const isPublic = settings["publicProfile"] === true;
  return {
    uid,
    name: typeof data["name"] === "string" ? data["name"] : "Corredor",
    username: typeof data["username"] === "string" ? data["username"] : "",
    usernameLower: typeof data["usernameLower"] === "string" ? data["usernameLower"] : "",
    profilePhoto:
      isPublic && typeof data["profilePhoto"] === "string" ? data["profilePhoto"] : undefined,
    city: typeof data["city"] === "string" ? data["city"] : "",
    level: typeof settings["level"] === "string" ? settings["level"] : "beginner",
    publicProfile: isPublic,
    ...(isPublic
      ? {
          totalRuns: stat("totalRuns"),
          totalKm: stat("totalKm"),
          totalHours: stat("totalHours"),
          longestRunKm: stat("longestRunKm"),
          bestPace:
            typeof storedStats["bestPace"] === "string" ? storedStats["bestPace"] : undefined,
          totalCalories: stat("totalCalories"),
          streakDays: stat("streakDays"),
          weeklyDoneKm: stat("weeklyDoneKm"),
          monthlyDoneKm: stat("monthlyDoneKm"),
        }
      : {}),
  };
}

type PublicActivity = {
  id: string;
  title: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  paceMinKm: string;
};

function PublicActivities({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!db) {
      setError(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    void getDocs(query(collection(db, "users", userId, "activities"), orderBy("date", "desc")))
      .then((snapshot) => {
        if (cancelled) return;
        setActivities(
          snapshot.docs.map((activity) => {
            const data = activity.data();
            const distanceKm = Number(data["distanceKm"] ?? data["distance"] ?? 0);
            const durationMin = Number(data["durationMin"] ?? data["duration"] ?? 0);
            return {
              id: activity.id,
              title: typeof data["title"] === "string" ? data["title"] : "Carrera",
              date: typeof data["date"] === "string" ? data["date"] : "Sin fecha",
              distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
              durationMin: Number.isFinite(durationMin) ? durationMin : 0,
              paceMinKm: typeof data["paceMinKm"] === "string" ? data["paceMinKm"] : "—",
            };
          }),
        );
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando carreras…</p>;
  if (error)
    return <p className="text-sm text-muted-foreground">No se pudieron cargar las carreras.</p>;
  if (activities.length === 0)
    return <p className="text-sm text-muted-foreground">Aún no hay carreras registradas.</p>;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" /> Historial de carreras
      </p>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
          >
            <div>
              <p className="font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground">{activity.date}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">{activity.distanceKm} km</p>
              <p>
                {activity.paceMinKm}/km · {activity.durationMin} min
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicProfileModal({
  profile,
  currentUserId,
  onClose,
}: {
  profile: PublicProfile | null;
  currentUserId?: string | undefined;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { getOrCreateConversation } = useMessages();
  if (!profile) return null;
  const level = LEVEL_LABELS[profile.level ?? "beginner"] ?? profile.level;
  const handleMessage = async () => {
    try {
      const conversationId = await getOrCreateConversation(profile.uid);
      onClose();
      navigate({ to: "/messages/$conversationId", params: { conversationId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar la conversación.");
    }
  };
  const statItems = [
    ["Carreras", profile.totalRuns],
    ["Distancia", profile.totalKm === undefined ? undefined : `${profile.totalKm} km`],
    ["Horas", profile.totalHours === undefined ? undefined : `${profile.totalHours} h`],
    [
      "Mayor carrera",
      profile.longestRunKm === undefined ? undefined : `${profile.longestRunKm} km`,
    ],
    ["Mejor ritmo", profile.bestPace],
    ["Calorías", profile.totalCalories],
    ["Racha", profile.streakDays === undefined ? undefined : `${profile.streakDays} días`],
    ["Esta semana", profile.weeklyDoneKm === undefined ? undefined : `${profile.weeklyDoneKm} km`],
    ["Este mes", profile.monthlyDoneKm === undefined ? undefined : `${profile.monthlyDoneKm} km`],
  ].filter(([, value]) => value !== undefined);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Perfil público</DialogTitle>
          <DialogDescription>Información del corredor en la comunidad Kairos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 p-4">
            <Avatar profile={profile} large />
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-bold">{profile.name}</h3>
              <p className="text-sm font-semibold text-primary">
                {profile.username ? `@${profile.username}` : "Sin username"}
              </p>
              <div className="mt-1 flex gap-2">
                <Badge variant="secondary">
                  <Award className="mr-1 h-3 w-3" />
                  {level}
                </Badge>
                {profile.city && (
                  <Badge variant="outline">
                    <MapPin className="mr-1 h-3 w-3" />
                    {profile.city}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {profile.publicProfile ? (
            <>
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Estadísticas públicas
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {statItems.map(([label, value]) => (
                    <div key={String(label)}>
                      <p className="font-display font-bold text-primary">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Este corredor comparte sus estadísticas generales.
              </p>
              <PublicActivities userId={profile.uid} />
            </>
          ) : (
            <div className="flex gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              Las actividades y estadísticas personales permanecen privadas.
            </div>
          )}
        </div>
        <DialogFooter>
          {currentUserId === profile.uid ? (
            <Button asChild>
              <Link to="/profile">Ir a mi perfil completo</Link>
            </Button>
          ) : (
            <>
              <Button onClick={() => void handleMessage()}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Mensaje
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SearchPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  useEffect(() => {
    const term = normalizeUsername(debouncedTerm);
    if (!term) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (!db) {
      setError("La base de datos de Firebase no está disponible.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getDocs(
      query(
        collection(db, "users"),
        where("usernameLower", ">=", term),
        where("usernameLower", "<=", `${term}\uf8ff`),
        limit(20),
      ),
    )
      .then((snapshot) => {
        if (!cancelled)
          setResults(
            snapshot.docs.map((document) => profileFromDocument(document.id, document.data())),
          );
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "No se pudo buscar corredores.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedTerm]);
  const cleanQuery = useMemo(() => normalizeUsername(searchTerm), [searchTerm]);
  return (
    <AppShell
      title="Buscar corredores"
      subtitle="Encuentra a otros miembros de Kairos por su @username"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Escribe un @username..."
                className="pl-10 pr-10"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-40" />
            ))}
          </div>
        )}
        {!loading && error && (
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <CardTitle className="mt-3">Error en la búsqueda</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardContent>
          </Card>
        )}
        {!loading && !error && !cleanQuery && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <User className="mx-auto h-8 w-8 text-muted-foreground" />
              <CardTitle className="mt-3">Busca corredores por su @username</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Sus estadísticas generales se muestran solo si tienen el perfil público activado.
              </p>
            </CardContent>
          </Card>
        )}
        {!loading && !error && cleanQuery && results.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground" />
              <CardTitle className="mt-3">Sin resultados</CardTitle>
            </CardContent>
          </Card>
        )}
        {!loading && !error && results.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((profile) => (
              <Card key={profile.uid} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar profile={profile} />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">{profile.name}</CardTitle>
                      <p className="text-xs font-semibold text-primary">
                        {profile.username ? `@${profile.username}` : "Sin username"}
                      </p>
                    </div>
                    {profile.publicProfile ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex gap-2">
                    <Badge variant="outline">
                      <Award className="mr-1 h-3 w-3" />
                      {LEVEL_LABELS[profile.level ?? "beginner"] ?? profile.level}
                    </Badge>
                    {profile.city && (
                      <Badge variant="outline">
                        <MapPin className="mr-1 h-3 w-3" />
                        {profile.city}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    Ver perfil público
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <PublicProfileModal
        profile={selectedProfile}
        currentUserId={user?.id}
        onClose={() => setSelectedProfile(null)}
      />
    </AppShell>
  );
}
