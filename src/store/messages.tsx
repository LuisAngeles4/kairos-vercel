import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/auth";

export type ChatParticipant = { id: string; name: string; profilePhoto?: string | undefined };
export type Conversation = {
  id: string;
  participants: string[];
  otherUser: ChatParticipant;
  lastMessageText: string;
  lastMessageAt: Timestamp | null;
  lastMessageSenderId: string;
  unread: boolean;
};
export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp | null;
  read: boolean;
};

type MessagesContextValue = {
  conversations: Conversation[];
  ready: boolean;
  getOrCreateConversation: (otherUserId: string) => Promise<string>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
};
const MessagesContext = createContext<MessagesContextValue | null>(null);

function conversationIdFor(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join("_");
}

function asTimestamp(value: unknown): Timestamp | null {
  return value && typeof value === "object" && "toDate" in value ? (value as Timestamp) : null;
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (!authReady || !user || !db) {
      setConversations([]);
      if (authReady) setReady(true);
      return;
    }
    const firestore = db;
    return onSnapshot(
      query(
        collection(firestore, "conversations"),
        where("participants", "array-contains", user.id),
      ),
      async (snapshot) => {
        const next = await Promise.all(
          snapshot.docs.map(async (conversationDoc) => {
            const data = conversationDoc.data();
            const participants = Array.isArray(data["participants"])
              ? data["participants"].filter((id): id is string => typeof id === "string")
              : [];
            const otherUserId = participants.find((id) => id !== user.id) ?? user.id;
            const otherSnapshot = await getDoc(doc(firestore, "users", otherUserId));
            const otherData = otherSnapshot.data();
            const unreadBy =
              typeof data["unreadBy"] === "object" && data["unreadBy"]
                ? (data["unreadBy"] as Record<string, unknown>)
                : {};
            return {
              id: conversationDoc.id,
              participants,
              otherUser: {
                id: otherUserId,
                name: typeof otherData?.["name"] === "string" ? otherData["name"] : "Corredor",
                profilePhoto:
                  typeof otherData?.["profilePhoto"] === "string"
                    ? otherData["profilePhoto"]
                    : undefined,
              },
              lastMessageText:
                typeof data["lastMessageText"] === "string" ? data["lastMessageText"] : "",
              lastMessageAt: asTimestamp(data["lastMessageAt"]),
              lastMessageSenderId:
                typeof data["lastMessageSenderId"] === "string" ? data["lastMessageSenderId"] : "",
              unread: unreadBy[user.id] === true,
            } satisfies Conversation;
          }),
        );
        next.sort(
          (a, b) => (b.lastMessageAt?.toMillis() ?? 0) - (a.lastMessageAt?.toMillis() ?? 0),
        );
        setConversations(next);
        setReady(true);
      },
      () => {
        setConversations([]);
        setReady(true);
      },
    );
  }, [authReady, user]);

  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      if (!user || !db) throw new Error("Debes iniciar sesión para enviar mensajes.");
      if (otherUserId === user.id)
        throw new Error("No puedes iniciar una conversación contigo mismo.");
      const id = conversationIdFor(user.id, otherUserId);
      // No se lee el documento antes de crearlo: las reglas no deben revelar
      // conversaciones inexistentes a quien aún no es participante. El ID
      // determinista permite que ambos usuarios lleguen al mismo chat.
      await setDoc(
        doc(db, "conversations", id),
        {
          participants: [user.id, otherUserId].sort(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
      return id;
    },
    [user],
  );

  const sendMessage = useCallback(
    async (conversationId: string, rawText: string) => {
      if (!user || !db) throw new Error("Debes iniciar sesión para enviar mensajes.");
      const text = rawText.trim();
      if (!text) return;
      if (text.length > 1000) throw new Error("El mensaje no puede exceder 1000 caracteres.");
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnapshot = await getDoc(conversationRef);
      const participants = conversationSnapshot.data()?.["participants"];
      if (
        !conversationSnapshot.exists() ||
        !Array.isArray(participants) ||
        !participants.includes(user.id)
      ) {
        throw new Error("No tienes acceso a esta conversación.");
      }
      const recipientId = participants.find(
        (id): id is string => typeof id === "string" && id !== user.id,
      );
      if (!recipientId) throw new Error("La conversación no tiene un destinatario válido.");
      await addDoc(collection(conversationRef, "messages"), {
        senderId: user.id,
        text,
        createdAt: serverTimestamp(),
        read: false,
      });
      await setDoc(
        conversationRef,
        {
          lastMessageText: text,
          lastMessageSenderId: user.id,
          lastMessageAt: serverTimestamp(),
          unreadBy: {
            [user.id]: false,
            [recipientId]: true,
          },
        },
        { merge: true },
      );
    },
    [user],
  );

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (!user || !db) return;
      const conversationRef = doc(db, "conversations", conversationId);
      await setDoc(conversationRef, { unreadBy: { [user.id]: false } }, { merge: true });
    },
    [user],
  );

  const value = useMemo(
    () => ({ conversations, ready, getOrCreateConversation, sendMessage, markConversationRead }),
    [conversations, ready, getOrCreateConversation, sendMessage, markConversationRead],
  );
  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) throw new Error("useMessages must be used within MessagesProvider");
  return context;
}
