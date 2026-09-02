import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { socioUpdateSchema } from "@/lib/validators";
import { actualizarSocio, eliminarSocio } from "@/lib/socios";
import { auditarConSesion } from "@/lib/auditoria";

// GET /api/socios/[id] — detalle de un socio (solo admin)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const socio = await prisma.socio.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { email: true } },
      cuotas: { orderBy: [{ periodoAnio: "desc" }, { periodoMes: "desc" }] },
    },
  });

  if (!socio) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  return NextResponse.json(socio);
}

// PUT /api/socios/[id] — actualiza un socio (solo admin)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = socioUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const socio = await actualizarSocio(params.id, parsed.data);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.SOCIO_EDITADO,
      entidad: "socio",
      entidadId: socio.id,
      detalle: `Edición de socio: ${socio.apellido}, ${socio.nombre}`,
    });
    return NextResponse.json(socio);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// DELETE /api/socios/[id] — elimina un socio (solo admin)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // Capturamos datos antes de borrar, para el registro de auditoría
    const socio = await prisma.socio.findUnique({ where: { id: params.id } });
    await eliminarSocio(params.id);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.SOCIO_ELIMINADO,
      entidad: "socio",
      entidadId: params.id,
      detalle: socio
        ? `Baja de socio: ${socio.apellido}, ${socio.nombre} (DNI ${socio.dni})`
        : "Baja de socio",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
