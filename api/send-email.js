import { Resend } from "resend";

export default async function handler(req, res) {
  // Permitir solo peticiones POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const { to, subject, html } = req.body || {};

    // Validaciones
    if (!to || typeof to !== "string" || !to.trim()) {
      return res.status(400).json({ error: "Destinatario inválido." });
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "Asunto vacío." });
    }

    if (!html || typeof html !== "string" || !html.trim()) {
      return res.status(400).json({ error: "Contenido vacío." });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RESEND_API_KEY no está configurada." });
    }

    // Envío con Resend
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Kairos <onboarding@resend.dev>",
      to: [to.trim()],
      subject: subject.trim(),
      html,
    });

    if (error) {
      console.error("Error de Resend:", error);
      return res.status(400).json({ error: "No se pudo enviar el correo.", details: error });
    }

    return res.status(200).json({ id: data?.id, success: true });
  } catch (err) {
    console.error("Error en Serverless Function:", err);
    return res.status(500).json({ error: "Error interno del servidor.", details: err.message });
  }
}