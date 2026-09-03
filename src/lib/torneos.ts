import { prisma } from "@/lib/db";
import { ESTADO_TORNEO, RANKING_CONFIG } from "@/lib/constants";

// Crea un torneo con sus categorías.
export async function crearTorneo(input: {
  nombre: string;
  fecha: string;
  disciplina?: string;
  categorias: { nombre: string; puntajeMaximo: number }[];
}) {
  return prisma.torneo.create({
    data: {
      nombre: input.nombre,
      fecha: new Date(input.fecha),
      disciplina: input.disciplina || "Aire comprimido",
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
    include: { _count: { select: { participaciones: true } } },
  });
}

export async function obtenerTorneo(id: string) {
  return prisma.torneo.findUnique({
    where: { id },
    include: {
      categorias: { orderBy: { nombre: "asc" } },
      participaciones: {
        orderBy: { puntaje: "desc" },
        include: { categoria: true },
      },
    },
  });
}

// Registra la participación de alguien (socio o no socio) con su puntaje.
// Calcula el rendimiento = puntaje / puntajeMaximo * 100.
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
    throw new Error("Categoría inválida para este torneo");
  }
  if (input.puntaje < 0 || input.puntaje > categoria.puntajeMaximo) {
    throw new Error(
      `El puntaje debe estar entre 0 y ${categoria.puntajeMaximo}`
    );
  }

  const rendimiento = (input.puntaje / categoria.puntajeMaximo) * 100;

  return prisma.participacionTorneo.create({
    data: {
      torneoId: input.torneoId,
      categoriaId: input.categoriaId,
      socioId: input.socioId || null,
      nombre: input.nombre,
      apellido: input.apellido,
      puntaje: input.puntaje,
      rendimiento,
    },
  });
}

export async function cerrarTorneo(id: string) {
  return prisma.torneo.update({
    where: { id },
    data: { estado: ESTADO_TORNEO.CERRADO },
  });
}

// Resultados de un torneo agrupados por categoría, con el campeón de cada una.
export type ResultadoCategoria = {
  categoria: { id: string; nombre: string; puntajeMaximo: number };
  posiciones: {
    posicion: number;
    nombre: string;
    apellido: string;
    puntaje: number;
    rendimiento: number;
    esSocio: boolean;
  }[];
};

export async function resultadosPorCategoria(
  torneoId: string
): Promise<ResultadoCategoria[]> {
  const categorias = await prisma.categoriaTorneo.findMany({
    where: { torneoId },
    orderBy: { nombre: "asc" },
    include: {
      participaciones: { orderBy: { puntaje: "desc" } },
    },
  });

  return categorias.map((cat) => ({
    categoria: {
      id: cat.id,
      nombre: cat.nombre,
      puntajeMaximo: cat.puntajeMaximo,
    },
    posiciones: cat.participaciones.map((p, i) => ({
      posicion: i + 1,
      nombre: p.nombre,
      apellido: p.apellido,
      puntaje: p.puntaje,
      rendimiento: p.rendimiento,
      esSocio: !!p.socioId,
    })),
  }));
}

// Ranking histórico de socios: índice = promedio de rendimiento de sus
// mejores N torneos. Solo entran socios con al menos MINIMO_TORNEOS.
export type RankingItem = {
  socioId: string;
  nombre: string;
  apellido: string;
  indice: number; // promedio de rendimiento (%)
  torneosJugados: number;
};

export async function rankingHistorico(): Promise<{
  ranking: RankingItem[];
  enFormacion: RankingItem[];
}> {
  // Solo participaciones de socios (socioId no nulo)
  const participaciones = await prisma.participacionTorneo.findMany({
    where: { socioId: { not: null } },
    include: {
      socio: { select: { id: true, nombre: true, apellido: true } },
    },
  });

  // Agrupar por socio
  const porSocio = new Map<
    string,
    { nombre: string; apellido: string; rendimientos: number[] }
  >();

  for (const p of participaciones) {
    if (!p.socioId || !p.socio) continue;
    const actual = porSocio.get(p.socioId) ?? {
      nombre: p.socio.nombre,
      apellido: p.socio.apellido,
      rendimientos: [],
    };
    actual.rendimientos.push(p.rendimiento);
    porSocio.set(p.socioId, actual);
  }

  const todos: RankingItem[] = [];
  for (const [socioId, data] of Array.from(porSocio.entries())) {
    // Mejores N rendimientos
    const mejores = [...data.rendimientos]
      .sort((a, b) => b - a)
      .slice(0, RANKING_CONFIG.MEJORES_N);
    const indice =
      mejores.reduce((s, r) => s + r, 0) / mejores.length;
    todos.push({
      socioId,
      nombre: data.nombre,
      apellido: data.apellido,
      indice: Math.round(indice * 100) / 100,
      torneosJugados: data.rendimientos.length,
    });
  }

  const ranking = todos
    .filter((t) => t.torneosJugados >= RANKING_CONFIG.MINIMO_TORNEOS)
    .sort((a, b) => b.indice - a.indice);

  const enFormacion = todos
    .filter((t) => t.torneosJugados < RANKING_CONFIG.MINIMO_TORNEOS)
    .sort((a, b) => b.indice - a.indice);

  return { ranking, enFormacion };
}

// Datos de ranking de un socio puntual (para su panel).
export async function rankingDeSocio(socioId: string) {
  const { ranking, enFormacion } = await rankingHistorico();
  const posicion = ranking.findIndex((r) => r.socioId === socioId);
  if (posicion >= 0) {
    return {
      enRanking: true,
      posicion: posicion + 1,
      total: ranking.length,
      item: ranking[posicion],
    };
  }
  const item = enFormacion.find((r) => r.socioId === socioId);
  return {
    enRanking: false,
    item: item ?? null,
  };
}
