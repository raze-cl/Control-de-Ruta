import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, driverName, driverRut, driverCargo, details, vehicleCode, faenaName, motivo, observaciones, evidenciaUrl, pendingCount, totalCount } = body;

    if (!tipo || !driverName || !driverRut) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos en el cuerpo de la solicitud." },
        { status: 400 }
      );
    }

    // 1. Query all admins with recibe_notificaciones = true
    const { data: admins, error: adminError } = await supabase
      .from("app_users")
      .select("email, nombre")
      .eq("tipo_usuario", "admin")
      .eq("recibe_notificaciones", true);

    if (adminError) throw adminError;

    // Filter out admins without email address
    const adminEmails = (admins || [])
      .map((admin) => admin.email?.trim())
      .filter((email): email is string => !!email);

    if (adminEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay administradores con correos electrónicos registrados y notificaciones activas.",
      });
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

    // 3. Construct Email subject and content
    let subject = "";
    let htmlBody = "";

    if (tipo === "termino_anticipado") {
      subject = `⚠️ [Alerta ScanQR] Término Anticipado de Ruta - ${driverName}`;
      htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #ea580c; margin-top: 0;">⚠️ Término Anticipado de Ruta</h2>
          <p>Un operador ha finalizado una jornada de ruta de faena con puntos pendientes:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0; width: 140px;">Chofer:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${driverName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">RUT:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${driverRut}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Cargo:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${driverCargo || "Chofer"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Vehículo:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">${vehicleCode || "No especificado"}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Faena:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${faenaName || "No especificada"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Avance:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ea580c; font-weight: bold;">
                Puntos pendientes: ${pendingCount} de ${totalCount} totales
              </td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Motivo:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #dc2626;">${motivo || "No especificado"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Observaciones:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; white-space: pre-wrap;">${observaciones || "Sin observaciones."}</td>
            </tr>
          </table>

          ${evidenciaUrl ? `
          <h3 style="color: #475569; margin-bottom: 12px;">Evidencia Fotográfica:</h3>
          <div style="text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; background-color: #f8fafc;">
            <img src="${evidenciaUrl}" alt="Evidencia de término anticipado" style="max-width: 100%; max-height: 350px; border-radius: 6px; object-fit: contain;" />
          </div>
          ` : ""}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">
            Este es un correo automático del sistema ScanQR. Por favor no responda directamente a este email.
          </p>
        </div>
      `;
    } else {
      const isDocAlert = tipo === "documentos_vencidos";
      subject = `⚠️ [Alerta ScanQR] ${isDocAlert ? "Documentos Vencidos" : "Checklist Rechazado"} - ${driverName}`;

      htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #dc2626; margin-top: 0;">⚠️ Alerta de Seguridad</h2>
          <p>Se ha registrado un evento que bloquea el inicio de operaciones del chofer:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0; width: 140px;">Chofer:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${driverName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">RUT:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${driverRut}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Cargo:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${driverCargo || "Chofer"}</td>
            </tr>
            ${vehicleCode ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Vehículo:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">${vehicleCode}</td>
            </tr>
            ` : ""}
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Tipo de Alerta:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #dc2626;">
                ${isDocAlert ? "Documentos u Obligaciones Vencidas" : "Rechazo de Checklist Seguridad"}
              </td>
            </tr>
          </table>

          <h3 style="color: #475569; margin-bottom: 8px;">Detalles del Bloqueo:</h3>
          <ul style="padding-left: 20px; color: #1e293b; margin-top: 0; line-height: 1.6;">
            ${Array.isArray(details) ? details.map(d => `<li style="margin-bottom: 6px;">${d}</li>`).join("") : ""}
          </ul>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">
            Este es un correo automático del sistema ScanQR. Por favor no responda directamente a este email.
          </p>
        </div>
      `;
    }

    // 4. Send email using Resend REST API
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Notificaciones ScanQR <${fromEmail}>`,
        to: adminEmails,
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
      message: `Notificación enviada con éxito a ${adminEmails.length} administrador(es).`,
      id: resendData.id,
    });
  } catch (err: any) {
    console.error("Error in notify-admins API route:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}
