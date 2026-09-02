import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { categoriaSchema } from "@/lib/validators";
import { actualizarCategoria, eliminarCategoria } from "@/lib/categorias";
import { auditarConSesion } from "@/lib/auditoria";

// PUT /api/categorias/[id] — actualiza una categoría (solo admin)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = categoriaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  try {
    const cat = await actualizarCategoria(params.id, parsed.data);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.CATEGORIA_EDITADA,
      entidad: "categoria",
      entidadId: cat.id,
      detalle: `Categoría editada: ${cat.nombre} ($${cat.cuotaMensual})`,
    });
    return NextResponse.json(cat);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// DELETE /api/categorias/[id] — elimina una categoría (solo admin)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    await eliminarCategoria(params.id);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.CATEGORIA_ELIMINADA,
      entidad: "categoria",
      entidadId: params.id,
      detalle: "Categoría eliminada",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
