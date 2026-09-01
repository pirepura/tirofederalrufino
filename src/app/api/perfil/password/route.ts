import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

const schema = z
  .object({
    actual: z.string().min(1, "Ingresá tu contraseña actual"),
    nueva: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    repetir: z.string().min(1, "Repetí la nueva contraseña"),
  })
  .refine((d) => d.nueva === d.repetir, {
    message: "Las contraseñas nuevas no coinciden",
    path: ["repetir"],
  });

// POST /api/perfil/password — el usuario logueado cambia su propia contraseña.
// Requiere validar la contraseña actual.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const actualOk = await bcrypt.compare(parsed.data.actual, user.passwordHash);
  if (!actualOk) {
    return NextResponse.json(
      { error: "La contraseña actual es incorrecta" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.nueva, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
