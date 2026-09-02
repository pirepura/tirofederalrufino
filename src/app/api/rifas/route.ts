import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { rifaCreateSchema } from "@/lib/validators";
import { crearRifa, listarRifas } from "@/lib/rifas";
import { auditarConSesion } from "@/lib/auditoria";

// GET /api/rifas — lista las rifas (admin)
export async function GET() {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(await listarRifas());
}

// POST /api/rifas — crea una rifa (admin)
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = rifaCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const rifa = await crearRifa(parsed.data);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.RIFA_CREADA,
      entidad: "rifa",
      entidadId: rifa.id,
      detalle: `Rifa creada: ${rifa.titulo} (${parsed.data.cantidadNumeros} números)`,
    });
    return NextResponse.json({ id: rifa.id, slug: rifa.slug }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear la rifa";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
