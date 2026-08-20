import { Resend } from "resend";

export async function POST(request) {
  try {
    const { to, subject, html } = await request.json();

    // Validaciones
    if (typeof to !== "string" || !to.trim()) {
      return new Response(JSON.stringify({ error: "Destinatario inválido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (typeof subject !== "string" || !subject.trim()) {
      return new Response(JSON.stringify({ error: "Asunto vacío." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (typeof html !== "string" || !html.trim()) {
      return new Response(JSON.stringify({ error: "Contenido vacío." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY no está configurada." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ error: "No se pudo enviar el correo." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ id: data?.id, success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error interno del servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}