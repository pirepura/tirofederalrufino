import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { categoriaTorneoSchema } from "@/lib/validators";
import { agregarCategoria } from "@/lib/torneos";

// POST /api/torneos/[id]/categorias — agrega una categoría al torneo (admin)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = categoriaTorneoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  try {
    const cat = await agregarCategoria({
      torneoId: params.id,
      nombre: parsed.data.nombre,
      puntajeMaximo: parsed.data.puntajeMaximo,
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al agregar la categoría";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
