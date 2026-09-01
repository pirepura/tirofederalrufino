import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/constants";
import type { SocioCreateInput, SocioUpdateInput } from "@/lib/validators";

// Obtiene el próximo número de socio correlativo.
async function siguienteNumeroSocio(): Promise<number> {
  const ultimo = await prisma.socio.findFirst({
    orderBy: { numeroSocio: "desc" },
    select: { numeroSocio: true },
  });
  return (ultimo?.numeroSocio ?? 0) + 1;
}

// Crea un socio junto con su cuenta de usuario (rol SOCIO).
export async function crearSocio(input: SocioCreateInput) {
  const email = input.email.toLowerCase().trim();

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    throw new Error("Ya existe un usuario con ese email");
  }

  const dniExistente = await prisma.socio.findUnique({
    where: { dni: input.dni },
  });
  if (dniExistente) {
    throw new Error("Ya existe un socio con ese DNI");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const numeroSocio = await siguienteNumeroSocio();

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      nombre: `${input.nombre} ${input.apellido}`,
      rol: ROLES.SOCIO,
      socio: {
        create: {
          numeroSocio,
          dni: input.dni,
          nombre: input.nombre,
          apellido: input.apellido,
          telefono: input.telefono || null,
          direccion: input.direccion || null,
          categoria: input.categoria || "General",
          cuotaMensual: input.cuotaMensual,
          estado: input.estado,
          observaciones: input.observaciones || null,
        },
      },
    },
    include: { socio: true },
  });
}

// Actualiza los datos de un socio (y opcionalmente su email/contraseña).
export async function actualizarSocio(
  socioId: string,
  input: SocioUpdateInput
) {
  const socio = await prisma.socio.findUnique({
    where: { id: socioId },
    include: { user: true },
  });
  if (!socio) throw new Error("Socio no encontrado");

  // Actualiza datos de usuario si corresponde
  const userData: Record<string, unknown> = {};
  if (input.email && input.email.toLowerCase().trim() !== socio.user.email) {
    const email = input.email.toLowerCase().trim();
    const otro = await prisma.user.findUnique({ where: { email } });
    if (otro && otro.id !== socio.userId) {
      throw new Error("Ya existe un usuario con ese email");
    }
    userData.email = email;
  }
  if (input.password) {
    userData.passwordHash = await bcrypt.hash(input.password, 10);
  }
  if (input.nombre || input.apellido) {
    const nombre = input.nombre ?? socio.nombre;
    const apellido = input.apellido ?? socio.apellido;
    userData.nombre = `${nombre} ${apellido}`;
  }
  if (Object.keys(userData).length > 0) {
    await prisma.user.update({ where: { id: socio.userId }, data: userData });
  }

  return prisma.socio.update({
    where: { id: socioId },
    data: {
      nombre: input.nombre ?? undefined,
      apellido: input.apellido ?? undefined,
      dni: input.dni ?? undefined,
      telefono: input.telefono === undefined ? undefined : input.telefono || null,
      direccion:
        input.direccion === undefined ? undefined : input.direccion || null,
      categoria: input.categoria ?? undefined,
      cuotaMensual: input.cuotaMensual ?? undefined,
      estado: input.estado ?? undefined,
      observaciones:
        input.observaciones === undefined
          ? undefined
          : input.observaciones || null,
    },
    include: { user: true },
  });
}

// Elimina un socio (y su usuario por cascada).
export async function eliminarSocio(socioId: string) {
  const socio = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!socio) throw new Error("Socio no encontrado");
  // Borrar el user elimina el socio por onDelete: Cascade
  await prisma.user.delete({ where: { id: socio.userId } });
}
