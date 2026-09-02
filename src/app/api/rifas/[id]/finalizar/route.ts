import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { finalizarRifa } from "@/lib/rifas";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/rifas/[id]/finalizar — finaliza la rifa y borra las fotos (admin)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const rifa = await finalizarRifa(params.id);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.RIFA_FINALIZADA,
      entidad: "rifa",
      entidadId: params.id,
      detalle: `Rifa finalizada: ${rifa.titulo}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al finalizar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
