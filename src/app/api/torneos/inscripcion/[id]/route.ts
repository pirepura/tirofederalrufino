import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import {
  confirmarPagoInscripcion,
  cambiarCategoriaParticipante,
  cargarPuntaje,
  eliminarParticipacion,
} from "@/lib/torneos";
import { auditarConSesion } from "@/lib/auditoria";

// PATCH /api/torneos/inscripcion/[id] — el admin gestiona una inscripción.
// Acciones (según el body):
//   { accion: "confirmarPago" }          → marca la inscripción como pagada
//   { accion: "categoria", categoriaId } → cambia la categoría
//   { accion: "puntaje", puntaje }       → carga/corrige el puntaje
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const accion = String((body as { accion?: string }).accion ?? "");

  try {
    if (accion === "confirmarPago") {
      const insc = await confirmarPagoInscripcion({ participacionId: params.id });
      await auditarConSesion(session.user, {
        accion: ACCION_AUDITORIA.TORNEO_PAGO_CONFIRMADO,
        entidad: "torneo",
        entidadId: insc?.torneoId ?? params.id,
        detalle: `Pago confirmado manualmente: ${insc?.apellido ?? ""}, ${insc?.nombre ?? ""}`,
      });
      return NextResponse.json(insc);
    }

    if (accion === "categoria") {
      const categoriaId = String((body as { categoriaId?: string }).categoriaId ?? "");
      if (!categoriaId) {
        return NextResponse.json({ error: "Falta la categoría" }, { status: 400 });
      }
      const insc = await cambiarCategoriaParticipante(params.id, categoriaId);
      return NextResponse.json(insc);
    }

    if (accion === "puntaje") {
      const puntaje = Number((body as { puntaje?: unknown }).puntaje);
      if (!Number.isFinite(puntaje)) {
        return NextResponse.json({ error: "Puntaje inválido" }, { status: 400 });
      }
      const insc = await cargarPuntaje(params.id, puntaje);
      await auditarConSesion(session.user, {
        accion: ACCION_AUDITORIA.TORNEO_PARTICIPANTE,
        entidad: "torneo",
        entidadId: insc.torneoId,
        detalle: `Puntaje cargado: ${insc.apellido}, ${insc.nombre} — ${puntaje} pts`,
      });
      return NextResponse.json(insc);
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// DELETE /api/torneos/inscripcion/[id] — el admin elimina una inscripción.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    await eliminarParticipacion(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
