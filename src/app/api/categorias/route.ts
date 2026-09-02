import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { categoriaSchema } from "@/lib/validators";
import { listarCategorias, crearCategoria } from "@/lib/categorias";
import { auditarConSesion } from "@/lib/auditoria";

// GET /api/categorias — lista categorías (solo admin)
export async function GET() {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(await listarCategorias());
}

// POST /api/categorias — crea una categoría (solo admin)
export async function POST(req: Request) {
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
    const cat = await crearCategoria(parsed.data);
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.CATEGORIA_CREADA,
      entidad: "categoria",
      entidadId: cat.id,
      detalle: `Categoría creada: ${cat.nombre} ($${cat.cuotaMensual})`,
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear la categoría";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
