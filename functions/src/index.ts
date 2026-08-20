import "dotenv/config";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { Resend } from "resend";

type SendEmailData = { to: string; subject: string; html: string };

export const sendEmail = onCall(
  {
    region: "us-central1",
    cors: [
      "http://localhost:8080",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://kairos-run-progress.lovable.app",
    ],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión para enviar correos.");
    }

    const { to, subject, html } = request.data as Partial<SendEmailData>;
    if (typeof to !== "string" || !to.trim()) {
      throw new HttpsError("invalid-argument", "Destinatario inválido.");
    }
    if (typeof subject !== "string" || !subject.trim()) {
      throw new HttpsError("invalid-argument", "Asunto vacío.");
    }
    if (typeof html !== "string" || !html.trim()) {
      throw new HttpsError("invalid-argument", "Contenido vacío.");
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new HttpsError("failed-precondition", "RESEND_API_KEY no está configurada.");
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Kairos <onboarding@resend.dev>",
      to: [to.trim()],
      subject: subject.trim(),
      html,
    });
    if (error) {
      console.error("Resend error", error);
      throw new HttpsError("internal", "No se pudo enviar el correo.");
    }
    return { id: data?.id };
  },
);
