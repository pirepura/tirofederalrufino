import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { torneoCreateSchema } from "@/lib/validators";
import { crearTorneo, listarTorneos } from "@/lib/torneos";
import { auditarConSesion } from "@/lib/auditoria";

// GET /api/torneos — lista torneos (admin)
export async function GET() {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(await listarTorneos());
}

// POST /api/torneos — crea un torneo (admin)
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = torneoCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  try {
    const torneo = await crearTorneo({
      nombre: parsed.data.nombre,
      fecha: new Date(parsed.data.fecha),
      disciplina: parsed.data.disciplina || undefined,
    });
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.TORNEO_CREADO,
      entidad: "torneo",
      entidadId: torneo.id,
      detalle: `Torneo creado: ${torneo.nombre}`,
    });
    return NextResponse.json({ id: torneo.id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear el torneo";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
