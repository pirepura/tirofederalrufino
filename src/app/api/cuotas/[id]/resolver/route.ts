import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { resolverPagoInformado } from "@/lib/cuotas";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/cuotas/[id]/resolver — el admin resuelve un pago informado.
// Body: { aprobar: boolean }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const aprobar = body?.aprobar === true;

  try {
    await resolverPagoInformado({ cuotaId: params.id, aprobar });
    await auditarConSesion(session.user, {
      accion: aprobar
        ? ACCION_AUDITORIA.COMPROBANTE_CONFIRMADO
        : ACCION_AUDITORIA.COMPROBANTE_RECHAZADO,
      entidad: "cuota",
      entidadId: params.id,
      detalle: aprobar
        ? "Comprobante confirmado; cuota marcada como pagada"
        : "Comprobante rechazado; cuota vuelve a impaga",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al resolver el pago";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
