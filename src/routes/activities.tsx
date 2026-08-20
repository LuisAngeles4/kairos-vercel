import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RunFormDialog } from "@/components/RunFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActivities } from "@/store/activities";

export const Route = createFileRoute("/activities")({
  head: () => ({
    meta: [
      { title: "Activities — Kairos Running" },
      {
        name: "description",
        content: "Historial completo de tus carreras y registro manual de nuevas actividades.",
      },
      { property: "og:title", content: "Activities — Kairos Running" },
      {
        property: "og:description",
        content: "Consulta tu historial de carreras y registra una nueva actividad.",
      },
    ],
  }),
  component: Activities,
});

function Activities() {
  const [open, setOpen] = useState(false);
  const { activities } = useActivities();

  return (
    <AppShell
      title="Activities"
      subtitle="Historial de carreras registradas"
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Registrar carrera
        </Button>
      }
    >
      <RunFormDialog open={open} onOpenChange={setOpen} />

      <Card>
        <CardHeader>
          <CardTitle>Todas las actividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrera</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Distancia</TableHead>
                  <TableHead className="text-right">Tiempo</TableHead>
                  <TableHead className="text-right">Ritmo</TableHead>
                  <TableHead className="text-right">Calorías</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell className="text-muted-foreground">{a.date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{a.distanceKm} km</TableCell>
                    <TableCell className="text-right">{a.durationMin} min</TableCell>
                    <TableCell className="text-right text-primary">{a.paceMinKm}</TableCell>
                    <TableCell className="text-right">{a.calories} kcal</TableCell>
                    <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                      {a.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
