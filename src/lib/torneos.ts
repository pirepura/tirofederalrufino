import { prisma } from "@/lib/db";
import { ESTADO_TORNEO, ESTADO_PAGO_INSCRIPCION } from "@/lib/constants";

// Configuración del ranking histórico
const MEJORES_N = 5; // se promedian los mejores N rendimientos
const MINIMO_TORNEOS = 2; // torneos jugados para entrar al ranking oficial

// Crea un torneo con sus categorías.
export async function crearTorneo(input: {
  nombre: string;
  fecha: string;
  disciplina?: string;
  precioSocio: number;
  precioNoSocio: number;
  categorias: { nombre: string; puntajeMaximo: number }[];
}) {
  return prisma.torneo.create({
    data: {
      nombre: input.nombre,
      fecha: new Date(input.fecha),
      disciplina: input.disciplina || "Aire comprimido",
      precioSocio: input.precioSocio,
      precioNoSocio: input.precioNoSocio,
      estado: ESTADO_TORNEO.ABIERTO,
      categorias: {
        create: input.categorias.map((c) => ({
          nombre: c.nombre,
          puntajeMaximo: c.puntajeMaximo,
        })),
      },
    },
    include: { categorias: true },
  });
}

export async function listarTorneos() {
  return prisma.torneo.findMany({
    orderBy: { fecha: "desc" },
    include: {
      _count: { select: { participaciones: true } },
    },
  });
}

export async function obtenerTorneo(id: string) {
  return prisma.torneo.findUnique({
    where: { id },
    include: {
      categorias: { orderBy: { nombre: "asc" } },
      participaciones: {
        include: { categoria: true, socio: { select: { numeroSocio: true } } },
        orderBy: { apellido: "asc" },
      },
    },
  });
}

// Inscribe un participante (socio o no socio) en una categoría del torneo.
export async function inscribirParticipante(input: {
  torneoId: string;
  categoriaId: string;
  socioId?: string | null;
  nombre: string;
  apellido: string;
  esSocio: boolean;
  metodoPago: string; // "mercadopago" | "efectivo"
}) {
  const torneo = await prisma.torneo.findUnique({
    where: { id: input.torneoId },
  });
  if (!torneo) throw new Error("Torneo no encontrado");

  const monto = input.esSocio ? torneo.precioSocio : torneo.precioNoSocio;

  return prisma.participacionTorneo.create({
    data: {
      torneoId: input.torneoId,
      categoriaId: input.categoriaId,
      socioId: input.socioId ?? null,
      nombre: input.nombre,
      apellido: input.apellido,
      esSocio: input.esSocio,
      montoInscripcion: monto,
      metodoPago: input.metodoPago,
      // Efectivo lo marca pagado el admin; MP se confirma por webhook.
      estadoPago: ESTADO_PAGO_INSCRIPCION.PENDIENTE,
    },
  });
}

// Marca una inscripción como pagada (efectivo por admin o MP por webhook).
export async function marcarInscripcionPagada(
  participacionId: string,
  metodoPago: string,
  mpPaymentId?: string
) {
  return prisma.participacionTorneo.update({
    where: { id: participacionId },
    data: {
      estadoPago: ESTADO_PAGO_INSCRIPCION.PAGADO,
      metodoPago,
      fechaPago: new Date(),
      mpPaymentId: mpPaymentId ?? undefined,
    },
  });
}

// Carga el puntaje de un participante y calcula su rendimiento %.
export async function cargarPuntaje(participacionId: string, puntaje: number) {
  const part = await prisma.participacionTorneo.findUnique({
    where: { id: participacionId },
    include: { categoria: true },
  });
  if (!part) throw new Error("Participación no encontrada");

  const max = part.categoria.puntajeMaximo || 1;
  const rendimiento = Math.round((puntaje / max) * 10000) / 100; // 2 decimales

  return prisma.participacionTorneo.update({
    where: { id: participacionId },
    data: { puntaje, rendimiento },
  });
}

// Resultados por categoría de un torneo (ordenados por puntaje desc + campeón).
export async function resultadosPorCategoria(torneoId: string) {
  const categorias = await prisma.categoriaTorneo.findMany({
    where: { torneoId },
    orderBy: { nombre: "asc" },
    include: {
      participaciones: {
        orderBy: [{ puntaje: "desc" }],
      },
    },
  });

  return categorias.map((c) => {
    const conPuntaje = c.participaciones.filter((p) => p.puntaje !== null);
    return {
      categoria: c,
      participaciones: c.participaciones,
      campeon: conPuntaje.length > 0 ? conPuntaje[0] : null,
    };
  });
}

export async function cerrarTorneo(torneoId: string) {
  return prisma.torneo.update({
    where: { id: torneoId },
    data: { estado: ESTADO_TORNEO.CERRADO },
  });
}

// ---------------------------------------------------------------------------
// Ranking histórico de socios
// Índice = promedio de rendimiento de sus mejores N torneos.
// Solo socios (socioId no nulo) con al menos MINIMO_TORNEOS participaciones
// con puntaje cargado.
// ---------------------------------------------------------------------------
export async function rankingHistorico() {
  const participaciones = await prisma.participacionTorneo.findMany({
    where: {
      socioId: { not: null },
      rendimiento: { not: null },
    },
    include: {
      socio: { select: { numeroSocio: true } },
    },
  });

  // Agrupar por socio
  const porSocio = new Map<
    string,
    { nombre: string; apellido: string; numeroSocio: number | null; rends: number[] }
  >();

  for (const p of participaciones) {
    const key = p.socioId!;
    if (!porSocio.has(key)) {
      porSocio.set(key, {
        nombre: p.nombre,
        apellido: p.apellido,
        numeroSocio: p.socio?.numeroSocio ?? null,
        rends: [],
      });
    }
    porSocio.get(key)!.rends.push(p.rendimiento!);
  }

  const ranking = Array.from(porSocio.entries())
    .map(([socioId, data]) => {
      const mejores = [...data.rends]
        .sort((a, b) => b - a)
        .slice(0, MEJORES_N);
      const indice =
        mejores.reduce((s, r) => s + r, 0) / (mejores.length || 1);
      return {
        socioId,
        nombre: data.nombre,
        apellido: data.apellido,
        numeroSocio: data.numeroSocio,
        torneosJugados: data.rends.length,
        indice: Math.round(indice * 100) / 100,
        rankeable: data.rends.length >= MINIMO_TORNEOS,
      };
    })
    // Solo los que cumplen el mínimo entran al ranking oficial, ordenados por índice
    .filter((r) => r.rankeable)
    .sort((a, b) => b.indice - a.indice);

  return ranking;
}

// Datos de ranking de un socio puntual (para su panel).
export async function rankingDeSocio(socioId: string) {
  const ranking = await rankingHistorico();
  const idx = ranking.findIndex((r) => r.socioId === socioId);
  if (idx === -1) {
    // No está rankeado aún: devolvemos sus datos igual
    const parts = await prisma.participacionTorneo.count({
      where: { socioId, rendimiento: { not: null } },
    });
    return {
      posicion: null,
      indice: null,
      torneosJugados: parts,
      faltanParaRankear: Math.max(0, MINIMO_TORNEOS - parts),
      total: ranking.length,
    };
  }
  return {
    posicion: idx + 1,
    indice: ranking[idx].indice,
    torneosJugados: ranking[idx].torneosJugados,
    faltanParaRankear: 0,
    total: ranking.length,
  };
}
