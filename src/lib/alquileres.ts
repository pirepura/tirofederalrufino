import { prisma } from "@/lib/db";
import { ESTADO_ALQUILER } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Servicio de alquiler de líneas de tiro — PREPARADO PARA EL FUTURO.
//
// La estructura de datos (LineaTiro, AlquilerLinea) ya está definida en el
// schema de Prisma. Estas funciones son la base para el desarrollo posterior
// del módulo de reservas y su cobro por Mercado Pago (reutilizando
// crearPreferenciaPago de src/lib/mercadopago.ts con external_reference del
// alquiler).
//
// La UI completa (calendario de turnos, disponibilidad, confirmación) se
// implementará más adelante. Por ahora dejamos las operaciones básicas.
// ---------------------------------------------------------------------------

// Lista las líneas de tiro activas.
export async function lineasActivas() {
  return prisma.lineaTiro.findMany({
    where: { activa: true },
    orderBy: { numero: "asc" },
  });
}

// Verifica si una línea está disponible en un rango horario dado
// (no se solapa con otra reserva confirmada o reservada).
export async function lineaDisponible(
  lineaId: string,
  inicio: Date,
  fin: Date
): Promise<boolean> {
  const solapada = await prisma.alquilerLinea.findFirst({
    where: {
      lineaId,
      estado: { in: [ESTADO_ALQUILER.RESERVADO, ESTADO_ALQUILER.CONFIRMADO] },
      // Solapamiento: comienza antes de que termine y termina después de que empieza
      fechaInicio: { lt: fin },
      fechaFin: { gt: inicio },
    },
  });
  return solapada === null;
}

// Crea una reserva de línea (estado inicial RESERVADO).
// El cobro con Mercado Pago se agregará en la etapa futura.
export async function crearReserva(params: {
  socioId: string;
  lineaId: string;
  fechaInicio: Date;
  fechaFin: Date;
  monto: number;
}) {
  const disponible = await lineaDisponible(
    params.lineaId,
    params.fechaInicio,
    params.fechaFin
  );
  if (!disponible) {
    throw new Error("La línea no está disponible en ese horario");
  }

  return prisma.alquilerLinea.create({
    data: {
      socioId: params.socioId,
      lineaId: params.lineaId,
      fechaInicio: params.fechaInicio,
      fechaFin: params.fechaFin,
      monto: params.monto,
      estado: ESTADO_ALQUILER.RESERVADO,
    },
  });
}
