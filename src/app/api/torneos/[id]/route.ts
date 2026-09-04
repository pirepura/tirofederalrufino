import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { actualizarTorneo } from "@/lib/torneos";

// PATCH /api/torneos/[id] — actualiza datos y precios del torneo (admin)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const data: {
    nombre?: string;
    fecha?: string;
    disciplina?: string;
    descripcion?: string | null;
    imagenData?: string | null;
    precioSocio?: number;
    precioNoSocio?: number;
  } = {};

  if (typeof body.nombre === "string") data.nombre = body.nombre;
  if (typeof body.fecha === "string") data.fecha = body.fecha;
  if (typeof body.disciplina === "string") data.disciplina = body.disciplina;
  if (typeof body.descripcion === "string") data.descripcion = body.descripcion;
  if (typeof body.imagenData === "string") data.imagenData = body.imagenData;
  if (body.precioSocio !== undefined) {
    const n = Number(body.precioSocio);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Precio socio inválido" }, { status: 400 });
    }
    data.precioSocio = n;
  }
  if (body.precioNoSocio !== undefined) {
    const n = Number(body.precioNoSocio);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Precio no socio inválido" }, { status: 400 });
    }
    data.precioNoSocio = n;
  }

  try {
    const torneo = await actualizarTorneo(params.id, data);
    return NextResponse.json(torneo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar el torneo";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
