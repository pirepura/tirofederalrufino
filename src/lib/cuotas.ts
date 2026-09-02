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

// Elimina una cuota (para corregir cuotas mal generadas, ej. monto en $0).
export async function eliminarCuota(cuotaId: string) {
  return prisma.cuota.delete({ where: { id: cuotaId } });
}

// Tamaño máximo del comprobante (en bytes del data URL). ~4 MB.
const MAX_COMPROBANTE_BYTES = 4 * 1024 * 1024;
const TIPOS_COMPROBANTE_VALIDOS = ["image/", "application/pdf"];

// El socio informa que pagó por otro medio y adjunta el comprobante.
// La cuota pasa a EN_REVISION hasta que el admin lo verifique.
export async function informarPagoConComprobante(params: {
  cuotaId: string;
  socioId: string;
  dataUrl: string;
  metodo: string;
}) {
  const cuota = await prisma.cuota.findUnique({
    where: { id: params.cuotaId },
  });
  if (!cuota) throw new Error("Cuota no encontrada");

  // Seguridad: el socio solo puede informar pagos de sus propias cuotas.
  if (cuota.socioId !== params.socioId) {
    throw new Error("No autorizado");
  }

  if (cuota.estado === ESTADO_CUOTA.PAGADA) {
    throw new Error("Esta cuota ya está pagada");
  }
  if (cuota.estado === ESTADO_CUOTA.EN_REVISION) {
    throw new Error("Ya informaste un pago para esta cuota; está en revisión");
  }

  // Validar el comprobante
  if (!params.dataUrl || !params.dataUrl.startsWith("data:")) {
    throw new Error("Comprobante inválido");
  }
  const tipo = params.dataUrl.substring(5, params.dataUrl.indexOf(";"));
  const tipoOk = TIPOS_COMPROBANTE_VALIDOS.some((t) => tipo.startsWith(t));
  if (!tipoOk) {
    throw new Error("El comprobante debe ser una imagen o un PDF");
  }
  if (params.dataUrl.length > MAX_COMPROBANTE_BYTES) {
    throw new Error("El comprobante es demasiado grande (máximo 4 MB)");
  }

  return prisma.cuota.update({
    where: { id: params.cuotaId },
    data: {
      estado: ESTADO_CUOTA.EN_REVISION,
      comprobanteData: params.dataUrl,
      comprobanteTipo: tipo,
      comprobanteInformadoEn: new Date(),
      metodoPagoInformado: params.metodo,
    },
  });
}

// El admin resuelve un pago informado: aprobar (queda PAGADA y se borra el
// comprobante) o rechazar (vuelve a PENDIENTE/VENCIDA, se limpia el comprobante).
export async function resolverPagoInformado(params: {
  cuotaId: string;
  aprobar: boolean;
}) {
  const cuota = await prisma.cuota.findUnique({
    where: { id: params.cuotaId },
  });
  if (!cuota) throw new Error("Cuota no encontrada");
  if (cuota.estado !== ESTADO_CUOTA.EN_REVISION) {
    throw new Error("La cuota no está en revisión");
  }

  if (params.aprobar) {
    // Confirmado: queda pagada con el método informado y se borra el archivo.
    return prisma.cuota.update({
      where: { id: params.cuotaId },
      data: {
        estado: ESTADO_CUOTA.PAGADA,
        fechaPago: new Date(),
        metodoPago: cuota.metodoPagoInformado ?? "transferencia",
        comprobanteData: null,
        comprobanteTipo: null,
      },
    });
  }

  // Rechazado: vuelve a impaga. Si ya venció, VENCIDA; si no, PENDIENTE.
  const ahora = new Date();
  const nuevoEstado =
    cuota.fechaVencimiento < ahora
      ? ESTADO_CUOTA.VENCIDA
      : ESTADO_CUOTA.PENDIENTE;

  return prisma.cuota.update({
    where: { id: params.cuotaId },
    data: {
      estado: nuevoEstado,
      comprobanteData: null,
      comprobanteTipo: null,
      comprobanteInformadoEn: null,
      metodoPagoInformado: null,
    },
  });
}

// Cuotas con pago informado pendiente de verificación (para el admin).
export async function cuotasEnRevision() {
  return prisma.cuota.findMany({
    where: { estado: ESTADO_CUOTA.EN_REVISION },
    orderBy: { comprobanteInformadoEn: "asc" },
    include: {
      socio: {
        select: { id: true, numeroSocio: true, nombre: true, apellido: true },
      },
    },
  });
}
