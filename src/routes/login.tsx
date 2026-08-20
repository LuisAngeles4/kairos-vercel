import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Kairos Running" },
      {
        name: "description",
        content: "Inicia sesión en Kairos para ver tus carreras y tu progreso.",
      },
      { property: "og:title", content: "Log in — Kairos Running" },
      {
        property: "og:description",
        content: "Accede a tu cuenta de Kairos y continúa tu entrenamiento.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { logIn, resetPassword, isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [ready, isAuthenticated, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Completa correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const user = await logIn(email, password);
      toast.success(`Bienvenido de nuevo, ${user.name}`);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(
        (err as { code?: string }).code === "auth/invalid-credential"
          ? "Correo o contraseña incorrectos"
          : err instanceof Error
            ? err.message
            : "No se pudo iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Timer className="h-7 w-7" />
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold gold-gradient-text">KAIROS</h1>
            <p className="mt-2 text-sm text-muted-foreground">Inicia sesión para continuar.</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Log in"}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-2 text-sm">
            <button
              type="button"
              className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              onClick={async () => {
                if (!email.trim()) {
                  setError("Ingresa tu correo para recuperar la contraseña.");
                  return;
                }
                try {
                  await resetPassword(email);
                  toast.success("Revisa tu correo para restablecer tu contraseña.");
                } catch {
                  setError("No se pudo enviar el correo de recuperación.");
                }
              }}
            >
              Forgot password?
            </button>
            <p className="text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
