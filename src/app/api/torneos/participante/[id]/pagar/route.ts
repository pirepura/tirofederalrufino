import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { marcarInscripcionPagada } from "@/lib/torneos";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/torneos/participante/[id]/pagar — marca la inscripción pagada en
// efectivo (admin). Para pagos con MP se confirma por webhook.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const part = await marcarInscripcionPagada(params.id, "efectivo");
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.TORNEO_PARTICIPANTE,
      entidad: "torneo",
      entidadId: part.torneoId,
      detalle: `Inscripción pagada en efectivo: ${part.apellido}, ${part.nombre}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al marcar pago";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
