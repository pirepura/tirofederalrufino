import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ESTADO_SUSCRIPCION, ACCION_AUDITORIA } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { cancelarSuscripcion } from "@/lib/mercadopago";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/suscripcion/cancelar — el socio cancela su débito automático.
export async function POST() {
  const session = await getSession();
  if (
    !session?.user ||
    session.user.rol !== ROLES.SOCIO ||
    !session.user.socioId
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const socio = await prisma.socio.findUnique({
    where: { id: session.user.socioId },
  });
  if (!socio || !socio.mpPreapprovalId) {
    return NextResponse.json(
      { error: "No tenés un débito automático activo." },
      { status: 400 }
    );
  }

  try {
    await cancelarSuscripcion(socio.mpPreapprovalId);
  } catch (e) {
    // Si falla en MP, igual lo reflejamos localmente pero avisamos
    console.error("Error al cancelar suscripción en MP:", e);
  }

  await prisma.socio.update({
    where: { id: socio.id },
    data: {
      suscripcionEstado: ESTADO_SUSCRIPCION.CANCELADA,
      mpPreapprovalId: null,
    },
  });

  await auditarConSesion(session.user, {
    accion: ACCION_AUDITORIA.DEBITO_CANCELADO,
    entidad: "socio",
    entidadId: socio.id,
    detalle: "Débito automático cancelado por el socio",
  });

  return NextResponse.json({ ok: true });
}
