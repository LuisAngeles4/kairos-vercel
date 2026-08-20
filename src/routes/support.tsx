import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { sendEmail } from "@/lib/email";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Kairos Running" },
      {
        name: "description",
        content: "Centro de ayuda de Kairos: preguntas frecuentes y contacto con soporte.",
      },
      { property: "og:title", content: "Support — Kairos Running" },
      {
        property: "og:description",
        content: "Resuelve dudas y contacta al equipo de soporte de Kairos.",
      },
    ],
  }),
  component: SupportPage,
});

const faqs = [
  {
    q: "¿Cómo registro una carrera?",
    a: "Ve a la sección Activities y presiona 'Iniciar carrera'. Al terminar, la actividad se guarda en tu historial.",
  },
  {
    q: "¿Puedo cambiar mi objetivo semanal?",
    a: "Sí, en Settings puedes ajustar el objetivo semanal en kilómetros cuando quieras.",
  },
  {
    q: "¿Cómo se calcula el ritmo promedio?",
    a: "Dividimos el tiempo total de la actividad entre la distancia recorrida, expresado en min/km.",
  },
  {
    q: "¿Kairos funciona sin conexión?",
    a: "Actualmente Kairos requiere conexión. El modo sin conexión está en nuestro roadmap.",
  },
];

function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!subject.trim()) {
      toast.error("Asunto vacío");
      return;
    }
    if (!message.trim()) {
      toast.error("Mensaje vacío");
      return;
    }
    setSending(true);
    try {
      await sendEmail(
        "luisangeles4m@gmail.com",
        `[Kairos] ${subject.trim()}`,
        `<p>${message.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`,
      );
      setSubject("");
      setMessage("");
      toast.success("Mensaje enviado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };
  return (
    <AppShell title="Support" subtitle="Ayuda y soporte de Kairos">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preguntas frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Envíanos un mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="¿En qué podemos ayudarte?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Describe tu situación..."
              />
            </div>
            <Button disabled={sending} onClick={send}>
              {sending ? "Enviando..." : "Enviar mensaje"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
