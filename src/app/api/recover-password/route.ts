import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim();

    // 1. Query user by email
    const { data: user, error } = await supabase
      .from("app_users")
      .select("nombre, username, password, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return NextResponse.json(
        { error: "No se encontró ningún usuario registrado con ese correo electrónico." },
        { status: 404 }
      );
    }

    // 2. Prepare Resend API keys
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY no está configurada en las variables de entorno.");
      return NextResponse.json(
        { error: "El servidor de correo no está configurado (RESEND_API_KEY faltante)." },
        { status: 500 }
      );
    }

    // 3. Construct Email content
    const subject = "🔐 [ScanQR] Recuperación de Contraseña";
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-top: 0;">🔐 Recuperación de Credenciales</h2>
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p>Has solicitado la recuperación de tu contraseña para acceder al sistema ScanQR. A continuación se presentan tus credenciales de acceso:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 150px; color: #475569;">Usuario:</td>
              <td style="padding: 4px 0; font-weight: bold; font-family: monospace; color: #0f172a; font-size: 14px;">${user.username}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #475569;">Contraseña:</td>
              <td style="padding: 4px 0; font-weight: bold; font-family: monospace; color: #2563eb; font-size: 14px;">${user.password || "No establecida"}</td>
            </tr>
          </table>
        </div>

        <p>Te recomendamos mantener tus datos en secreto y no compartirlos con terceros.</p>
        <p style="margin-top: 24px;">Si no solicitaste recuperar tus credenciales, puedes ignorar este mensaje.</p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">
          Este es un correo automático del sistema ScanQR. Por favor no responda directamente a este email.
        </p>
      </div>
    `;

    // 4. Send email using Resend REST API
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Soporte ScanQR <${fromEmail}>`,
        to: [user.email],
        subject: subject,
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error response:", resendData);
      throw new Error(resendData.message || "Error al enviar correo vía Resend.");
    }

    return NextResponse.json({
      success: true,
      message: "Credenciales enviadas con éxito a tu correo electrónico.",
      id: resendData.id,
    });
  } catch (err: any) {
    console.error("Error in recover-password API route:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}
