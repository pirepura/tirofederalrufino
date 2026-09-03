import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { cerrarTorneo } from "@/lib/torneos";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/torneos/[id]/cerrar — cierra el torneo (admin)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const t = await cerrarTorneo(params.id);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.TORNEO_CERRADO,
      entidad: "torneo",
      entidadId: params.id,
      detalle: `Torneo cerrado: ${t.nombre}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cerrar el torneo";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
