import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  city: string;
  username?: string;
  profilePhoto?: string;
  publicProfile?: boolean;
};

export type PublicProfile = {
  uid: string;
  name: string;
  username: string;
  usernameLower: string;
  profilePhoto?: string | undefined;
  city?: string | undefined;
  level?: string | undefined;
  publicProfile?: boolean | undefined;
  totalRuns?: number | undefined;
  totalKm?: number | undefined;
  totalHours?: number | undefined;
  longestRunKm?: number | undefined;
  bestPace?: string | undefined;
  totalCalories?: number | undefined;
  streakDays?: number | undefined;
  weeklyDoneKm?: number | undefined;
  monthlyDoneKm?: number | undefined;
};

export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (!normalized) return "El nombre de usuario no puede estar vacío.";
  if (normalized.length < 3) return "El username debe tener al menos 3 caracteres.";
  if (normalized.length > 20) return "El username no puede exceder los 20 caracteres.";
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return "El username solo puede contener letras, números y guiones bajos (_).";
  }
  return null;
}

export async function isUsernameAvailable(
  username: string,
  currentUserId?: string,
): Promise<boolean> {
  if (!db) return true;
  const normalized = normalizeUsername(username);
  if (!normalized) return false;

  const q = query(collection(db, "users"), where("usernameLower", "==", normalized), limit(2));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return true;
  if (currentUserId && snapshot.docs.length === 1 && snapshot.docs[0]?.id === currentUserId) {
    return true;
  }
  return false;
}

export async function compressProfilePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen válida.");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("No se pudo procesar la imagen seleccionada."));
      element.src = sourceUrl;
    });
    const maxDocumentPhotoChars = 450_000;
    const sizes = [300, 260, 220, 180, 140, 100];
    const qualities = [0.82, 0.72, 0.62, 0.52, 0.42];
    for (const maxSize of sizes) {
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Tu navegador no permite procesar imágenes.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of qualities) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= maxDocumentPhotoChars) return dataUrl;
      }
    }
    throw new Error("La imagen no pudo comprimirse lo suficiente para guardarla en el perfil.");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  isAuthenticated: boolean;
  logIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, password: string, username?: string) => Promise<AuthUser>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (
    partial: Partial<
      Pick<AuthUser, "name" | "email" | "city" | "username" | "profilePhoto" | "publicProfile">
    > & { level?: string },
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
}): AuthUser {
  return {
    id: user.uid,
    name: user.displayName?.trim() || "Corredor",
    email: user.email ?? "",
    city: "",
    username: "",
    profilePhoto: "",
    publicProfile: false,
  };
}

function requireAuth() {
  if (!auth || !isFirebaseConfigured) {
    throw new Error("Firebase no está configurado. Agrega las variables VITE_FIREBASE_*.");
  }
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setReady(true);
      return;
    }
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeProfile?.();
      if (!firebaseUser) {
        setUser(null);
        setReady(true);
        return;
      }
      const baseUser = mapUser(firebaseUser);
      if (db) {
        const userDocRef = doc(db, "users", firebaseUser.uid);

        unsubscribeProfile = onSnapshot(
          userDocRef,
          (snapshot) => {
            // La cuenta no se considera lista hasta contar con su documento en
            // users. Esto evita navegar a la app si el alta se revierte.
            if (!snapshot.exists()) {
              setUser(null);
              setReady(true);
              return;
            }
            const data = snapshot.data();
            setUser({
              ...baseUser,
              name: typeof data?.["name"] === "string" ? data["name"] : baseUser.name,
              city: typeof data?.["city"] === "string" ? data["city"] : "",
              username: typeof data?.["username"] === "string" ? data["username"] : "",
              profilePhoto: typeof data?.["profilePhoto"] === "string" ? data["profilePhoto"] : "",
              publicProfile:
                typeof data?.["settings"]?.["publicProfile"] === "boolean"
                  ? data["settings"]["publicProfile"]
                  : typeof data?.["publicProfile"] === "boolean"
                    ? data["publicProfile"]
                    : false,
            });
            setReady(true);
          },
          () => {
            setUser(null);
            setReady(true);
          },
        );
      } else {
        setUser(baseUser);
        setReady(true);
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      async logIn(email, password) {
        const result = await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
        return mapUser(result.user);
      },
      async signUp(name, email, password, username) {
        const finalUsername = username ? username.trim().replace(/^@+/, "") : "";
        const validationError = validateUsername(finalUsername);
        if (validationError) throw new Error(validationError);
        if (!db) throw new Error("Firestore no está configurado.");
        const firestore = db;

        const result = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
        const uid = result.user.uid;
        const normalizedLower = normalizeUsername(finalUsername);
        try {
          await updateProfile(result.user, { displayName: name.trim() });
          // La sesión ya existe en este punto, por lo que las reglas permiten
          // consultar users sin abrir la colección a visitantes anónimos.
          const available = await isUsernameAvailable(finalUsername, uid);
          if (!available) {
            throw new Error(`El nombre de usuario @${finalUsername} ya está en uso.`);
          }
          await setDoc(doc(firestore, "users", uid), {
            name: name.trim(),
            email: result.user.email ?? email.trim(),
            city: "",
            username: finalUsername,
            usernameLower: normalizedLower,
            profilePhoto: "",
            settings: {
              units: "km",
              weeklyGoalKm: 0,
              level: "beginner",
              notifyTraining: true,
              notifyWeeklyEmail: true,
              publicProfile: false,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          await deleteUser(result.user).catch(() => undefined);
          throw error;
        }

        return {
          id: uid,
          name: name.trim(),
          email: result.user.email ?? "",
          city: "",
          username: finalUsername,
          profilePhoto: "",
          publicProfile: false,
        };
      },
      async logOut() {
        await signOut(requireAuth());
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(requireAuth(), email.trim());
      },
      async updateUser(partial) {
        const currentAuth = requireAuth();
        if (!currentAuth.currentUser)
          throw new Error("Debes iniciar sesión para actualizar tu perfil.");
        const uid = currentAuth.currentUser.uid;

        let trimmedUsername: string | undefined;
        let normalizedLower: string | undefined;

        if (partial.username !== undefined) {
          const raw = partial.username.trim().replace(/^@+/, "");
          if (raw) {
            const validationError = validateUsername(raw);
            if (validationError) throw new Error(validationError);
            const available = await isUsernameAvailable(raw, uid);
            if (!available) {
              throw new Error(`El nombre de usuario @${raw} ya está en uso por otro corredor.`);
            }
            trimmedUsername = raw;
            normalizedLower = normalizeUsername(raw);
          } else {
            trimmedUsername = "";
            normalizedLower = "";
          }
        }

        const profileUpdatesToAuth: { displayName?: string } = {};
        if (partial.name !== undefined && partial.name.trim()) {
          profileUpdatesToAuth.displayName = partial.name.trim();
        }
        if (Object.keys(profileUpdatesToAuth).length > 0) {
          await updateProfile(currentAuth.currentUser, profileUpdatesToAuth);
        }

        if (!db) throw new Error("Firestore no está configurado.");

        const userUpdates: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        };
        if (partial.name !== undefined) {
          userUpdates["name"] = partial.name.trim();
        }
        if (partial.email !== undefined) {
          userUpdates["email"] = partial.email.trim();
        }
        if (partial.city !== undefined) {
          userUpdates["city"] = partial.city.trim();
        }
        if (trimmedUsername !== undefined) {
          userUpdates["username"] = trimmedUsername;
          userUpdates["usernameLower"] = normalizedLower;
        }
        if (partial.profilePhoto !== undefined) {
          userUpdates["profilePhoto"] = partial.profilePhoto;
        }

        await setDoc(doc(db, "users", uid), userUpdates, { merge: true });

        setUser((current) =>
          current
            ? {
                ...current,
                ...(partial.name !== undefined ? { name: partial.name.trim() } : {}),
                ...(partial.email !== undefined ? { email: partial.email.trim() } : {}),
                ...(partial.city !== undefined ? { city: partial.city.trim() } : {}),
                ...(trimmedUsername !== undefined ? { username: trimmedUsername } : {}),
                ...(partial.profilePhoto !== undefined
                  ? { profilePhoto: partial.profilePhoto }
                  : {}),
                ...(partial.publicProfile !== undefined
                  ? { publicProfile: partial.publicProfile }
                  : {}),
              }
            : current,
        );
      },
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
