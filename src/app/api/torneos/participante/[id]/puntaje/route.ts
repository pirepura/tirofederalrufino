import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { cargarPuntaje } from "@/lib/torneos";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/torneos/participante/[id]/puntaje — carga el puntaje (solo admin)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const puntaje = Number(body?.puntaje);
  if (isNaN(puntaje) || puntaje < 0) {
    return NextResponse.json({ error: "Puntaje inválido" }, { status: 400 });
  }

  try {
    const part = await cargarPuntaje(params.id, puntaje);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.TORNEO_PARTICIPANTE,
      entidad: "torneo",
      entidadId: part.torneoId,
      detalle: `Puntaje cargado: ${part.apellido}, ${part.nombre} = ${puntaje}`,
    });
    return NextResponse.json({ ok: true, rendimiento: part.rendimiento });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar el puntaje";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
