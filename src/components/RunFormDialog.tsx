import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RUN_TYPES, paceFrom, useActivities } from "@/store/activities";
import { UNIT_LABEL, useSettings } from "@/store/settings";

const today = () => new Date().toISOString().slice(0, 10);

const empty = {
  date: today(),
  distanceKm: "",
  durationMin: "",
  paceMinKm: "",
  calories: "",
  type: "Entrenamiento",
  notes: "",
};

export function RunFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addActivity } = useActivities();
  const { settings } = useSettings();
  const unit = UNIT_LABEL[settings.units];
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...empty, date: today() });
      setError(null);
    }
  }, [open]);

  const distance = Number(form.distanceKm);
  const duration = Number(form.durationMin);
  const autoPace = paceFrom(distance, duration);

  const set = (key: keyof typeof empty, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.date) return setError("Selecciona la fecha de la carrera.");
    if (!(distance > 0) || distance > 500)
      return setError("Ingresa una distancia válida entre 0 y 500 km.");
    if (!(duration > 0) || duration > 2000)
      return setError("Ingresa un tiempo total válido en minutos.");
    const calories = Number(form.calories || Math.round(distance * 65));
    if (calories < 0 || calories > 20000) return setError("Ingresa calorías válidas.");
    if (form.notes.length > 500) return setError("Las notas no pueden superar 500 caracteres.");

    try {
      await addActivity({
        title: `${form.type} · ${distance} km`,
        date: form.date,
        distanceKm: Number(distance.toFixed(2)),
        durationMin: Math.round(duration),
        paceMinKm: form.paceMinKm.trim() || autoPace,
        type: form.type,
        calories,
        notes: form.notes.trim(),
        elevationM: 0,
        avgHr: 0,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar la carrera.");
      return;
    }

    toast.success("Carrera registrada correctamente", {
      description: `${distance} km · ${Math.round(duration)} min · ${form.paceMinKm.trim() || autoPace} /km`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar carrera</DialogTitle>
          <DialogDescription>Añade manualmente una carrera que ya realizaste.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de carrera</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {RUN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="distance">Distancia ({unit})</Label>
            <Input
              id="distance"
              type="number"
              min="0"
              step="0.1"
              placeholder="10.2"
              value={form.distanceKm}
              onChange={(e) => set("distanceKm", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Tiempo total (min)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              step="1"
              placeholder="51"
              value={form.durationMin}
              onChange={(e) => set("durationMin", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pace">Ritmo promedio (min/{unit})</Label>
            <Input
              id="pace"
              placeholder={autoPace}
              maxLength={8}
              value={form.paceMinKm}
              onChange={(e) => set("paceMinKm", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se calcula automáticamente: {autoPace} /{unit}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="calories">Calorías quemadas</Label>
            <Input
              id="calories"
              type="number"
              min="0"
              step="1"
              placeholder={distance > 0 ? String(Math.round(distance * 65)) : "650"}
              value={form.calories}
              onChange={(e) => set("calories", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              rows={3}
              maxLength={500}
              placeholder="¿Cómo te sentiste durante la carrera?"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Guardar carrera</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
