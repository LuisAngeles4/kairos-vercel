import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Kairos Running" },
      {
        name: "description",
        content: "Crea tu cuenta de Kairos y empieza a registrar tus carreras.",
      },
      { property: "og:title", content: "Sign up — Kairos Running" },
      {
        property: "og:description",
        content: "Regístrate en Kairos y sigue tu progreso como corredor.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp, isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [ready, isAuthenticated, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const user = await signUp(name, email, password, username);
      toast.success(`Cuenta creada. ¡Bienvenido, ${user.name}!`);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la cuenta.";
      if (message.includes("ya está en uso")) {
        window.alert("Ese nombre de usuario ya existe. Elige otro antes de crear tu cuenta.");
      }
      setError(message);
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
            <p className="mt-2 text-sm text-muted-foreground">
              Crea tu cuenta para empezar a registrar carreras.
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username (@)</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. carlos_runner"
              />
              <p className="text-xs text-muted-foreground">
                Único para que otros corredores te encuentren.
              </p>
            </div>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando..." : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
