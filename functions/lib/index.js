"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
require("dotenv/config");
const https_1 = require("firebase-functions/v2/https");
const resend_1 = require("resend");
exports.sendEmail = (0, https_1.onCall)(
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
      throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión para enviar correos.");
    }
    const { to, subject, html } = request.data;
    if (typeof to !== "string" || !to.trim()) {
      throw new https_1.HttpsError("invalid-argument", "Destinatario inválido.");
    }
    if (typeof subject !== "string" || !subject.trim()) {
      throw new https_1.HttpsError("invalid-argument", "Asunto vacío.");
    }
    if (typeof html !== "string" || !html.trim()) {
      throw new https_1.HttpsError("invalid-argument", "Contenido vacío.");
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new https_1.HttpsError("failed-precondition", "RESEND_API_KEY no está configurada.");
    }
    const resend = new resend_1.Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Kairos <onboarding@resend.dev>",
      to: [to.trim()],
      subject: subject.trim(),
      html,
    });
    if (error) {
      console.error("Resend error", error);
      throw new https_1.HttpsError("internal", "No se pudo enviar el correo.");
    }
    return { id: data?.id };
  },
);
