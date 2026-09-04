import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { participanteSchema } from "@/lib/validators";
import { registrarParticipacion } from "@/lib/torneos";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/torneos/[id]/participantes — carga un participante con su puntaje (admin)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = participanteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const puntaje =
      parsed.data.puntaje === "" || parsed.data.puntaje == null
        ? null
        : Number(parsed.data.puntaje);
    const p = await registrarParticipacion({
      torneoId: params.id,
      categoriaId: parsed.data.categoriaId,
      socioId: parsed.data.socioId || null,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      telefono: parsed.data.telefono || null,
      email: parsed.data.email || null,
      puntaje,
    });
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.TORNEO_PARTICIPANTE,
      entidad: "torneo",
      entidadId: params.id,
      detalle: `Participante ${parsed.data.apellido}, ${parsed.data.nombre}${
        puntaje != null ? ` — ${puntaje} pts` : " (sin puntaje)"
      }`,
    });
    return NextResponse.json(p, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar participante";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
