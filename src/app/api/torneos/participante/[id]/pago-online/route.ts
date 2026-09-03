import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { crearPreferenciaPago, mercadoPagoConfigurado } from "@/lib/mercadopago";
import { CLUB } from "@/config/club";

// POST /api/torneos/participante/[id]/pago-online — genera el link de pago de
// la inscripción con Mercado Pago (admin). Devuelve initPoint para compartir.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!mercadoPagoConfigurado()) {
    return NextResponse.json(
      { error: "Mercado Pago no está configurado." },
      { status: 503 }
    );
  }

  const part = await prisma.participacionTorneo.findUnique({
    where: { id: params.id },
    include: { torneo: true },
  });
  if (!part) {
    return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
  }
  if (part.estadoPago === "pagado") {
    return NextResponse.json({ error: "Ya está pagada" }, { status: 400 });
  }

  try {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const pref = await crearPreferenciaPago({
      titulo: `Inscripción ${part.torneo.nombre} - ${CLUB.nombre}`,
      monto: part.montoInscripcion,
      externalReference: `torneo:${part.id}`,
      backUrl: `${appUrl}/pago/torneo/gracias`,
    });
    await prisma.participacionTorneo.update({
      where: { id: part.id },
      data: { mpPreferenceId: pref.id ?? null },
    });
    return NextResponse.json({ initPoint: pref.initPoint });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al generar el pago";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
