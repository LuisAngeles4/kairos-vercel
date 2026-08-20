import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/store/auth";
import { useMessages } from "@/store/messages";
import { toast } from "sonner";

export const Route = createFileRoute("/messages/$conversationId")({ component: ConversationPage });
type Message = { id: string; senderId: string; text: string; createdAt: Timestamp | null };

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { user } = useAuth();
  const { conversations, sendMessage, markConversationRead } = useMessages();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversation = conversations.find((item) => item.id === conversationId);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "asc"),
      ),
      (snapshot) => {
        setMessages(
          snapshot.docs.map((message) => {
            const data = message.data();
            return {
              id: message.id,
              senderId: typeof data["senderId"] === "string" ? data["senderId"] : "",
              text: typeof data["text"] === "string" ? data["text"] : "",
              createdAt:
                data["createdAt"] &&
                typeof data["createdAt"] === "object" &&
                "toDate" in data["createdAt"]
                  ? (data["createdAt"] as Timestamp)
                  : null,
            };
          }),
        );
        void markConversationRead(conversationId).catch(() => {
          // El indicador de lectura no debe impedir abrir el chat.
        });
      },
      () => toast.error("No tienes acceso a esta conversación."),
    );
  }, [conversationId, markConversationRead]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      setSending(true);
      await sendMessage(conversationId, text);
      setText("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };
  return (
    <AppShell title={conversation?.otherUser.name ?? "Conversación"} subtitle="Mensajes privados">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Button asChild variant="ghost" className="w-fit">
          <Link to="/messages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mensajes
          </Link>
        </Button>
        <Card>
          <CardContent className="h-[60vh] space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="pt-20 text-center text-sm text-muted-foreground">
                Aún no hay mensajes. Saluda para iniciar la conversación.
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${message.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  {message.createdAt && (
                    <p
                      className={`mt-1 text-[10px] ${message.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {message.createdAt
                        .toDate()
                        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </CardContent>
        </Card>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Escribe un mensaje…"
            maxLength={1000}
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !text.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
