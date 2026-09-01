import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ESTADO_SOLICITUD } from "@/lib/constants";
import { solicitudInscripcionSchema } from "@/lib/validators";

// POST /api/inscripcion — recibe una solicitud de inscripción pública (sin login).
// Queda en estado PENDIENTE hasta que un admin la apruebe.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = solicitudInscripcionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  // Evitar duplicados: si ya existe un usuario/socio con ese email o DNI
  const userExistente = await prisma.user.findUnique({ where: { email } });
  if (userExistente) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email." },
      { status: 400 }
    );
  }
  const socioDni = await prisma.socio.findUnique({ where: { dni: data.dni } });
  if (socioDni) {
    return NextResponse.json(
      { error: "Ya existe un socio con ese DNI." },
      { status: 400 }
    );
  }

  // Evitar solicitudes pendientes duplicadas del mismo email/DNI
  const solicitudPendiente = await prisma.solicitudInscripcion.findFirst({
    where: {
      estado: ESTADO_SOLICITUD.PENDIENTE,
      OR: [{ email }, { dni: data.dni }],
    },
  });
  if (solicitudPendiente) {
    return NextResponse.json(
      {
        error:
          "Ya hay una solicitud pendiente con ese email o DNI. Aguardá la aprobación del club.",
      },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  await prisma.solicitudInscripcion.create({
    data: {
      nombreCompleto: data.nombreCompleto,
      dni: data.dni,
      fechaNacimiento: new Date(data.fechaNacimiento),
      domicilio: data.domicilio,
      email,
      celular: data.celular,
      fueSocio: data.fueSocio,
      anioAsociado: data.fueSocio ? data.anioAsociado ?? null : null,
      categoriaPrevia: data.fueSocio ? data.categoriaPrevia || null : null,
      primerPeriodo: data.fueSocio ? data.primerPeriodo || null : null,
      firmaDataUrl: data.firmaDataUrl,
      aceptaDeclaracion: data.aceptaDeclaracion,
      passwordHash,
      estado: ESTADO_SOLICITUD.PENDIENTE,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
