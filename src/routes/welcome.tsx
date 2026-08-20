import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to Kairos — Running Tracker" },
      {
        name: "description",
        content:
          "Entra a Kairos para registrar tus carreras manualmente y seguir tu progreso como corredor.",
      },
      { property: "og:title", content: "Welcome to Kairos" },
      {
        property: "og:description",
        content: "Registra tus carreras y visualiza tu progreso con Kairos.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [ready, isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Timer className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold gold-gradient-text">KAIROS</h1>
            <p className="mt-1 text-lg font-semibold">Welcome to Kairos</p>
            <p className="mt-2 text-sm text-muted-foreground">
              La plataforma para corredores: registra tus carreras manualmente, revisa tus
              estadísticas y visualiza tu progreso semana a semana.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
