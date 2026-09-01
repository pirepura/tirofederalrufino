import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { socioCreateSchema } from "@/lib/validators";
import { crearSocio } from "@/lib/socios";

// GET /api/socios — lista todos los socios (solo admin)
export async function GET() {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const socios = await prisma.socio.findMany({
    orderBy: { numeroSocio: "asc" },
    include: { user: { select: { email: true } } },
  });

  return NextResponse.json(socios);
}

// POST /api/socios — crea un socio (solo admin)
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = socioCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const user = await crearSocio(parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear el socio";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
