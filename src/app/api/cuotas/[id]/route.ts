import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { eliminarCuota } from "@/lib/cuotas";
import { auditarConSesion } from "@/lib/auditoria";

// DELETE /api/cuotas/[id] — elimina una cuota (solo admin).
// Útil para corregir cuotas mal generadas (por ejemplo con monto $0).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    await eliminarCuota(params.id);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.CUOTA_ELIMINADA,
      entidad: "cuota",
      entidadId: params.id,
      detalle: "Cuota eliminada",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar la cuota";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
