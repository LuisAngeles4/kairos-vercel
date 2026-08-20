import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!functions) throw new Error("Firebase Functions no está configurado.");
  const callable = httpsCallable<{ to: string; subject: string; html: string }, { id?: string }>(
    functions,
    "sendEmail",
  );
  return (await callable({ to, subject, html })).data;
}
