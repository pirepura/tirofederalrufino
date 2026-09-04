import { NextResponse } from "next/server";
import { enviarRecordatoriosImpagas } from "@/lib/avisos";

// GET /api/cron/recordatorios-cuotas — corre a diario (Vercel Cron).
// Envía recordatorios por WhatsApp a cuotas impagas con ~15 días.
//
// Seguridad: si CRON_SECRET está configurado, exige el header
// "Authorization: Bearer <CRON_SECRET>" (Vercel Cron lo envía automáticamente).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const resultado = await enviarRecordatoriosImpagas();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al enviar recordatorios";
    console.error("Cron recordatorios-cuotas:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
