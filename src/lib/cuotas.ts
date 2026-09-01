import { prisma } from "@/lib/db";
import { ESTADO_CUOTA } from "@/lib/constants";

// Lógica de negocio de cuotas, reutilizable por admin y socio.

// Marca como VENCIDA cualquier cuota PENDIENTE cuya fecha de vencimiento ya pasó.
// Se llama al cargar los paneles para mantener los estados al día.
export async function actualizarCuotasVencidas() {
  const ahora = new Date();
  await prisma.cuota.updateMany({
    where: {
      estado: ESTADO_CUOTA.PENDIENTE,
      fechaVencimiento: { lt: ahora },
    },
    data: { estado: ESTADO_CUOTA.VENCIDA },
  });
}

// Devuelve las cuotas impagas (PENDIENTE o VENCIDA) de un socio.
export async function cuotasImpagasDeSocio(socioId: string) {
  return prisma.cuota.findMany({
    where: {
      socioId,
      estado: { in: [ESTADO_CUOTA.PENDIENTE, ESTADO_CUOTA.VENCIDA] },
    },
    orderBy: [{ periodoAnio: "asc" }, { periodoMes: "asc" }],
  });
}

// Calcula el saldo total adeudado por un socio.
export async function saldoDeSocio(socioId: string): Promise<number> {
  const impagas = await cuotasImpagasDeSocio(socioId);
  return impagas.reduce((total, c) => total + c.monto, 0);
}

// Marca una cuota como pagada (usado por pago manual del admin o webhook MP).
export async function marcarCuotaPagada(
  cuotaId: string,
  metodoPago: string,
  mpPaymentId?: string
) {
  return prisma.cuota.update({
    where: { id: cuotaId },
    data: {
      estado: ESTADO_CUOTA.PAGADA,
      fechaPago: new Date(),
      metodoPago,
      mpPaymentId: mpPaymentId ?? undefined,
    },
  });
}
