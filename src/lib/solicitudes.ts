import { prisma } from "@/lib/db";
import { ROLES, ESTADO_SOLICITUD, ESTADO_SOCIO } from "@/lib/constants";

// Separa un "nombre completo" en nombre y apellido de forma razonable:
// la última palabra se toma como apellido si hay más de una.
function separarNombre(nombreCompleto: string): {
  nombre: string;
  apellido: string;
} {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 1) {
    return { nombre: partes[0], apellido: "" };
  }
  const apellido = partes.pop()!;
  return { nombre: partes.join(" "), apellido };
}

// Aprueba una solicitud: crea el User + Socio (activo) reutilizando el
// passwordHash ya generado en la solicitud (no se re-hashea).
export async function aprobarSolicitud(solicitudId: string) {
  const sol = await prisma.solicitudInscripcion.findUnique({
    where: { id: solicitudId },
  });
  if (!sol) throw new Error("Solicitud no encontrada");
  if (sol.estado !== ESTADO_SOLICITUD.PENDIENTE) {
    throw new Error("La solicitud ya fue procesada");
  }

  // Revalidar que no exista ya el email o DNI (por si se creó entre medio)
  const userExistente = await prisma.user.findUnique({
    where: { email: sol.email },
  });
  if (userExistente) throw new Error("Ya existe una cuenta con ese email");
  const dniExistente = await prisma.socio.findUnique({
    where: { dni: sol.dni },
  });
  if (dniExistente) throw new Error("Ya existe un socio con ese DNI");

  const { nombre, apellido } = separarNombre(sol.nombreCompleto);

  // Próximo número de socio correlativo
  const ultimo = await prisma.socio.findFirst({
    orderBy: { numeroSocio: "desc" },
    select: { numeroSocio: true },
  });
  const numeroSocio = (ultimo?.numeroSocio ?? 0) + 1;

  const categoria = sol.fueSocio && sol.categoriaPrevia ? sol.categoriaPrevia : "General";

  const user = await prisma.user.create({
    data: {
      email: sol.email,
      passwordHash: sol.passwordHash, // ya viene hasheado desde la solicitud
      nombre: `${nombre} ${apellido}`.trim(),
      rol: ROLES.SOCIO,
      socio: {
        create: {
          numeroSocio,
          dni: sol.dni,
          nombre,
          apellido,
          telefono: sol.celular,
          direccion: sol.domicilio,
          categoria,
          cuotaMensual: 0, // el admin define el monto al editar / generar cuotas
          estado: ESTADO_SOCIO.ACTIVO,
          observaciones: sol.fueSocio
            ? `Ex socio. Año: ${sol.anioAsociado ?? "-"}, primer período: ${sol.primerPeriodo ?? "-"}`
            : null,
        },
      },
    },
    include: { socio: true },
  });

  await prisma.solicitudInscripcion.update({
    where: { id: solicitudId },
    data: {
      estado: ESTADO_SOLICITUD.APROBADA,
      socioIdCreado: user.socio!.id,
    },
  });

  return user;
}

// Rechaza una solicitud con un motivo opcional.
export async function rechazarSolicitud(solicitudId: string, motivo?: string) {
  const sol = await prisma.solicitudInscripcion.findUnique({
    where: { id: solicitudId },
  });
  if (!sol) throw new Error("Solicitud no encontrada");
  if (sol.estado !== ESTADO_SOLICITUD.PENDIENTE) {
    throw new Error("La solicitud ya fue procesada");
  }

  return prisma.solicitudInscripcion.update({
    where: { id: solicitudId },
    data: {
      estado: ESTADO_SOLICITUD.RECHAZADA,
      motivoRechazo: motivo || null,
    },
  });
}
