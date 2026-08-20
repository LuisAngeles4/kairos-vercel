import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Search,
  MessageCircle,
  User,
  Settings,
  LifeBuoy,
  Menu,
  X,
  Timer,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/store/auth";
import { useActivities } from "@/store/activities";
import { useMessages } from "@/store/messages";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/activities", label: "Activities", icon: Activity },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/messages", label: "Mensajes", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/support", label: "Support", icon: LifeBuoy },
] as const;

function KairosLogo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-3 px-2 py-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Timer className="h-5 w-5" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight gold-gradient-text">
        KAIROS
      </span>
    </Link>
  );
}

function NavLinks({
  onNavigate,
  unreadMessages,
}: {
  onNavigate?: (() => void) | undefined;
  unreadMessages: number;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: true }}
          className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold data-[status=active]:text-sidebar-primary data-[status=active]:before:absolute data-[status=active]:before:left-0 data-[status=active]:before:top-1/2 data-[status=active]:before:h-6 data-[status=active]:before:w-1 data-[status=active]:before:-translate-y-1/2 data-[status=active]:before:rounded-r-full data-[status=active]:before:bg-primary"
        >
          <Icon className="h-4.5 w-4.5" />
          <span className="flex-1">{label}</span>
          {to === "/messages" && unreadMessages > 0 && (
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
              aria-label={`${unreadMessages} mensaje${unreadMessages === 1 ? "" : "s"} sin leer`}
            >
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { stats } = useActivities();
  const { conversations } = useMessages();
  const unreadMessages = conversations.filter((conversation) => conversation.unread).length;
  return (
    <div className="flex h-full flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4">
      <KairosLogo />
      <NavLinks onNavigate={onNavigate} unreadMessages={unreadMessages} />
      <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
        <p className="text-xs text-muted-foreground">Racha actual</p>
        <p className="font-display text-2xl font-bold text-primary">{stats.streakDays} días</p>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !isAuthenticated) navigate({ to: "/welcome", replace: true });
  }, [ready, isAuthenticated, navigate]);

  if (!ready || !isAuthenticated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-border bg-background/80 px-5 py-4 backdrop-blur">
          <button
            className="rounded-lg border border-border p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
            {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </header>
        <main className="p-5">{children}</main>
      </div>
    </div>
  );
}
