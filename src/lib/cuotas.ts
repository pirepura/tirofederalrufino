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

// Registra el pago automático (débito por suscripción) de un socio para el
// período actual: marca la cuota del mes como PAGADA, o la crea ya pagada si
// todavía no existía. Usado por el webhook de suscripción de Mercado Pago.
export async function registrarPagoAutomatico(params: {
  socioId: string;
  monto: number;
  mpPaymentId: string;
}) {
  const ahora = new Date();
  const periodoMes = ahora.getMonth() + 1;
  const periodoAnio = ahora.getFullYear();

  const existente = await prisma.cuota.findUnique({
    where: {
      socioId_periodoMes_periodoAnio: {
        socioId: params.socioId,
        periodoMes,
        periodoAnio,
      },
    },
  });

  if (existente) {
    if (existente.estado === ESTADO_CUOTA.PAGADA) return existente; // ya pagada
    return prisma.cuota.update({
      where: { id: existente.id },
      data: {
        estado: ESTADO_CUOTA.PAGADA,
        fechaPago: ahora,
        metodoPago: "mercadopago-debito",
        mpPaymentId: params.mpPaymentId,
        comprobanteData: null,
        comprobanteTipo: null,
      },
    });
  }

  // No existía la cuota del período: la creamos ya pagada.
  return prisma.cuota.create({
    data: {
      socioId: params.socioId,
      periodoMes,
      periodoAnio,
      monto: params.monto,
      descripcion: "Cuota mensual (débito automático)",
      fechaVencimiento: new Date(periodoAnio, periodoMes - 1, 10),
      estado: ESTADO_CUOTA.PAGADA,
      fechaPago: ahora,
      metodoPago: "mercadopago-debito",
      mpPaymentId: params.mpPaymentId,
    },
  });
}

// Descripción fija que identifica la cuota consolidada de deuda anterior.
// Se usa para garantizar una sola por socio (migración desde papel).
export const DESCRIPCION_DEUDA_ANTERIOR = "Deuda anterior";

// Registra (o actualiza) la deuda anterior consolidada de un socio.
// Crea una única cuota marcada como VENCIDA con el monto total adeudado antes
// de entrar al sistema. Si el socio ya tiene una deuda anterior cargada, la
// actualiza en vez de duplicarla (garantiza una sola por socio).
export async function registrarDeudaAnterior(params: {
  socioId: string;
  monto: number;
  detalle?: string;
}) {
  if (params.monto <= 0) {
    throw new Error("El monto de la deuda debe ser mayor a 0");
  }

  const socio = await prisma.socio.findUnique({ where: { id: params.socioId } });
  if (!socio) throw new Error("Socio inexistente");

  const descripcion = params.detalle?.trim()
    ? `${DESCRIPCION_DEUDA_ANTERIOR} — ${params.detalle.trim()}`
    : DESCRIPCION_DEUDA_ANTERIOR;

  // Buscar una deuda anterior ya cargada para este socio (por prefijo de descripción).
  const existente = await prisma.cuota.findFirst({
    where: {
      socioId: params.socioId,
      descripcion: { startsWith: DESCRIPCION_DEUDA_ANTERIOR },
    },
  });

  if (existente) {
    // No permitir tocar una deuda que ya fue pagada.
    if (existente.estado === ESTADO_CUOTA.PAGADA) {
      throw new Error(
        "Este socio ya tiene una deuda anterior registrada y saldada"
      );
    }
    return prisma.cuota.update({
      where: { id: existente.id },
      data: {
        monto: params.monto,
        descripcion,
        estado: ESTADO_CUOTA.VENCIDA,
      },
    });
  }

  // Período marcador: usamos la fecha actual (mes/año de la migración). El
  // @@unique por período no molesta porque hay una sola deuda anterior por socio.
  const ahora = new Date();
  const periodoMes = ahora.getMonth() + 1;
  const periodoAnio = ahora.getFullYear();

  // Si ya existiera una cuota real de este período, corremos el marcador al
  // mes anterior para no chocar con el @@unique.
  let mes = periodoMes;
  let anio = periodoAnio;
  const choca = await prisma.cuota.findUnique({
    where: {
      socioId_periodoMes_periodoAnio: {
        socioId: params.socioId,
        periodoMes: mes,
        periodoAnio: anio,
      },
    },
  });
  if (choca) {
    if (mes === 1) {
      mes = 12;
      anio -= 1;
    } else {
      mes -= 1;
    }
  }

  return prisma.cuota.create({
    data: {
      socioId: params.socioId,
      periodoMes: mes,
      periodoAnio: anio,
      monto: params.monto,
      descripcion,
      fechaVencimiento: ahora, // ya vencida
      estado: ESTADO_CUOTA.VENCIDA,
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
