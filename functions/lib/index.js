"use strict";

const { Resend } = require("resend");

module.exports = async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  try {
    const { to, subject, html } = req.body || {};

    // Validaciones
    if (typeof to !== "string" || !to.trim()) {
      return res.status(400).json({ error: "Destinatario inválido." });
    }
    if (typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "Asunto vacío." });
    }
    if (typeof html !== "string" || !html.trim()) {
      return res.status(400).json({ error: "Contenido vacío." });
    }

    // Verificar API Key
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RESEND_API_KEY no está configurada en Vercel." });
    }

    // Envío con Resend
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Kairos <onboarding@resend.dev>",
      to: [to.trim()],
      subject: subject.trim(),
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(400).json({ error: "No se pudo enviar el correo." });
    }

    return res.status(200).json({ id: data?.id, success: true });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};