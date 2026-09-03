import { prisma } from "@/lib/db";
import { ESTADO_TORNEO } from "@/lib/constants";

// Config del ranking histórico
const MEJORES_N = 5; // se promedian los mejores 5 rendimientos
const MIN_TORNEOS = 2; // mínimo de torneos para entrar al ranking oficial

export async function crearTorneo(input: {
  nombre: string;
  fecha: Date;
  disciplina?: string;
}) {
  return prisma.torneo.create({
    data: {
      nombre: input.nombre,
      fecha: input.fecha,
      disciplina: input.disciplina || "Aire comprimido",
      estado: ESTADO_TORNEO.ABIERTO,
    },
  });
}

export async function listarTorneos() {
  return prisma.torneo.findMany({
    orderBy: { fecha: "desc" },
    include: {
      _count: { select: { participaciones: true, categorias: true } },
    },
  });
}

export async function agregarCategoria(input: {
  torneoId: string;
  nombre: string;
  puntajeMaximo: number;
}) {
  return prisma.categoriaTorneo.create({
    data: {
      torneoId: input.torneoId,
      nombre: input.nombre.trim(),
      puntajeMaximo: input.puntajeMaximo,
    },
  });
}

// Registra un participante (socio o no socio) con su puntaje.
// Calcula el rendimiento % respecto del puntaje máximo de la categoría.
export async function registrarParticipacion(input: {
  torneoId: string;
  categoriaId: string;
  socioId?: string | null;
  nombre: string;
  apellido: string;
  puntaje: number;
}) {
  const categoria = await prisma.categoriaTorneo.findUnique({
    where: { id: input.categoriaId },
  });
  if (!categoria || categoria.torneoId !== input.torneoId) {
    throw new Error("Categoría inválida");
  }
  if (input.puntaje < 0 || input.puntaje > categoria.puntajeMaximo) {
    throw new Error(
      `El puntaje debe estar entre 0 y ${categoria.puntajeMaximo}`
    );
  }

  const rendimiento =
    categoria.puntajeMaximo > 0
      ? (input.puntaje / categoria.puntajeMaximo) * 100
      : 0;

  return prisma.participacionTorneo.create({
    data: {
      torneoId: input.torneoId,
      categoriaId: input.categoriaId,
      socioId: input.socioId || null,
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      puntaje: input.puntaje,
      rendimiento,
    },
  });
}

export async function cerrarTorneo(torneoId: string) {
  return prisma.torneo.update({
    where: { id: torneoId },
    data: { estado: ESTADO_TORNEO.CERRADO },
  });
}

// Detalle del torneo con resultados agrupados por categoría (ordenados por
// puntaje desc) y el campeón de cada una.
export async function detalleTorneo(torneoId: string) {
  const torneo = await prisma.torneo.findUnique({
    where: { id: torneoId },
    include: {
      categorias: { orderBy: { nombre: "asc" } },
      participaciones: {
        orderBy: { puntaje: "desc" },
      },
    },
  });
  if (!torneo) return null;

  const porCategoria = torneo.categorias.map((cat) => {
    const parts = torneo.participaciones
      .filter((p) => p.categoriaId === cat.id)
      .sort((a, b) => b.puntaje - a.puntaje);
    return {
      categoria: cat,
      participantes: parts,
      campeon: parts[0] ?? null,
    };
  });

  return { torneo, porCategoria };
}

// Ranking histórico de socios: índice = promedio de rendimiento de sus
// mejores N torneos. Solo entran los socios con al menos MIN_TORNEOS.
export async function rankingHistorico() {
  // Traemos todas las participaciones de socios (con socioId no nulo)
  const parts = await prisma.participacionTorneo.findMany({
    where: { socioId: { not: null } },
    include: {
      socio: {
        select: { id: true, numeroSocio: true, nombre: true, apellido: true },
      },
    },
  });

  // Agrupar por socio
  const porSocio = new Map<
    string,
    {
      socio: { id: string; numeroSocio: number; nombre: string; apellido: string };
      rendimientos: number[];
    }
  >();

  for (const p of parts) {
    if (!p.socio) continue;
    const entry = porSocio.get(p.socio.id) ?? {
      socio: p.socio,
      rendimientos: [],
    };
    entry.rendimientos.push(p.rendimiento);
    porSocio.set(p.socio.id, entry);
  }

  const ranking = [];
  for (const { socio, rendimientos } of Array.from(porSocio.values())) {
    const torneosJugados = rendimientos.length;
    // Mejores N rendimientos
    const mejores = [...rendimientos].sort((a, b) => b - a).slice(0, MEJORES_N);
    const indice =
      mejores.reduce((s, r) => s + r, 0) / mejores.length;
    ranking.push({
      socio,
      torneosJugados,
      indice, // promedio de rendimiento (%)
      rankeable: torneosJugados >= MIN_TORNEOS,
    });
  }

  // Ordenar: primero los rankeables por índice desc, luego el resto
  ranking.sort((a, b) => {
    if (a.rankeable !== b.rankeable) return a.rankeable ? -1 : 1;
    return b.indice - a.indice;
  });

  return { ranking, mejoresN: MEJORES_N, minTorneos: MIN_TORNEOS };
}

// Posición e índice de un socio puntual (para su panel).
export async function rankingDeSocio(socioId: string) {
  const { ranking } = await rankingHistorico();
  const idx = ranking.findIndex((r) => r.socio.id === socioId);
  if (idx === -1) return null;
  const entry = ranking[idx];
  // La posición solo tiene sentido si es rankeable
  const posicion = entry.rankeable ? idx + 1 : null;
  return { ...entry, posicion, totalRankeables: ranking.filter((r) => r.rankeable).length };
}
