import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA, formatearPesos } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { registrarDeudaAnterior } from "@/lib/cuotas";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/cuotas/deuda-anterior — carga (o actualiza) la deuda anterior
// consolidada de un socio migrado desde el papel. Solo admin.
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const socioId = String((body as { socioId?: string }).socioId ?? "");
  const monto = Number((body as { monto?: unknown }).monto);
  const detalle = String((body as { detalle?: string }).detalle ?? "");

  if (!socioId) {
    return NextResponse.json({ error: "Elegí un socio" }, { status: 400 });
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    return NextResponse.json(
      { error: "El monto debe ser mayor a 0" },
      { status: 400 }
    );
  }

  try {
    const cuota = await registrarDeudaAnterior({ socioId, monto, detalle });
    const socio = await prisma.socio.findUnique({ where: { id: socioId } });
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.DEUDA_ANTERIOR_CARGADA,
      entidad: "cuota",
      entidadId: cuota.id,
      detalle: `Deuda anterior de ${socio?.apellido ?? ""}, ${socio?.nombre ?? ""}: ${formatearPesos(monto)}`,
    });
    return NextResponse.json({ ok: true, id: cuota.id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar la deuda";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
