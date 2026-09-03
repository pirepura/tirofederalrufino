import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA, ESTADO_PAGO_INSCRIPCION } from "@/lib/constants";
import { inscripcionTorneoSchema } from "@/lib/validators";
import { inscribirParticipante, marcarInscripcionPagada } from "@/lib/torneos";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/torneos/[id]/participantes — inscribe un participante (admin).
// Si paga en efectivo, se marca pagado en el acto.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = inscripcionTorneoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const part = await inscribirParticipante({
      torneoId: params.id,
      categoriaId: parsed.data.categoriaId,
      socioId: parsed.data.socioId || null,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      esSocio: parsed.data.esSocio,
      metodoPago: parsed.data.metodoPago,
    });

    // Si es efectivo, se marca pagado directamente (lo cobra el admin).
    if (parsed.data.metodoPago === "efectivo") {
      await marcarInscripcionPagada(part.id, "efectivo");
    }

    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.TORNEO_PARTICIPANTE,
      entidad: "torneo",
      entidadId: params.id,
      detalle: `Inscripción: ${parsed.data.apellido}, ${parsed.data.nombre} (${parsed.data.metodoPago})`,
    });

    return NextResponse.json({ id: part.id, estadoPago: parsed.data.metodoPago === "efectivo" ? ESTADO_PAGO_INSCRIPCION.PAGADO : ESTADO_PAGO_INSCRIPCION.PENDIENTE });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al inscribir";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
