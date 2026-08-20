import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/welcome" });
  },
  head: () => ({
    meta: [
      { title: "Kairos Running — Registra tus carreras" },
      {
        name: "description",
        content:
          "Kairos es la plataforma para corredores: registra actividades y visualiza tu progreso.",
      },
      { property: "og:title", content: "Kairos Running" },
      {
        property: "og:description",
        content: "Registra tus carreras y visualiza tu progreso con Kairos.",
      },
    ],
  }),
  component: () => null,
});
