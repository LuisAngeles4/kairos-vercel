import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMessages } from "@/store/messages";

export const Route = createFileRoute("/messages")({ component: MessagesPage });

function ConversationAvatar({
  name,
  profilePhoto,
}: {
  name: string;
  profilePhoto?: string | undefined;
}) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "K";
  return profilePhoto ? (
    <img src={profilePhoto} alt={name} className="h-12 w-12 rounded-full object-cover" />
  ) : (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
      {initials}
    </span>
  );
}

function MessagesPage() {
  const { conversations, ready } = useMessages();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/messages") return <Outlet />;

  return (
    <AppShell title="Mensajes" subtitle="Conversa con otros corredores de Kairos">
      {!ready ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-20" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
              <MessageCircle className="h-7 w-7" />
            </span>
            <CardTitle className="mt-4">Aún no tienes mensajes</CardTitle>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Visita el perfil público de un corredor para iniciar una conversación.
            </p>
            <Button asChild className="mt-6">
              <Link to="/search">
                <Plus className="mr-2 h-4 w-4" />
                Buscar corredores
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to="/messages/$conversationId"
              params={{ conversationId: conversation.id }}
              className="block"
            >
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <ConversationAvatar
                    name={conversation.otherUser.name}
                    profilePhoto={conversation.otherUser.profilePhoto}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{conversation.otherUser.name}</p>
                      {conversation.unread && (
                        <Badge className="h-2 w-2 rounded-full p-0" aria-label="Mensaje no leído" />
                      )}
                    </div>
                    <p
                      className={`truncate text-sm ${conversation.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}
                    >
                      {conversation.lastMessageText || "Inicia la conversación"}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {conversation.lastMessageAt
                      ? formatDistanceToNow(conversation.lastMessageAt.toDate(), {
                          addSuffix: true,
                          locale: es,
                        })
                      : ""}
                  </time>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
