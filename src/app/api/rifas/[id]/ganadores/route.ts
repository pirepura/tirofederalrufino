import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { cargarNumerosGanadores } from "@/lib/rifas";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/rifas/[id]/ganadores — carga los 3 números ganadores (admin).
// Solo cuando todos los números están vendidos.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const numero1 = Number((body as { numero1?: unknown }).numero1);
  const numero2 = Number((body as { numero2?: unknown }).numero2);
  const numero3 = Number((body as { numero3?: unknown }).numero3);

  if (![numero1, numero2, numero3].every((n) => Number.isFinite(n))) {
    return NextResponse.json(
      { error: "Cargá los 3 números ganadores" },
      { status: 400 }
    );
  }

  try {
    const rifa = await cargarNumerosGanadores({
      rifaId: params.id,
      numero1,
      numero2,
      numero3,
    });
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.RIFA_FINALIZADA,
      entidad: "rifa",
      entidadId: rifa.id,
      detalle: `Números ganadores cargados: ${numero1}, ${numero2}, ${numero3}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar ganadores";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
