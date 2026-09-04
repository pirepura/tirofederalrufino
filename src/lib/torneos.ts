import { prisma } from "@/lib/db";
import { ESTADO_TORNEO, RANKING_CONFIG } from "@/lib/constants";

// Crea un torneo con sus categorías y precios de inscripción.
export async function crearTorneo(input: {
  nombre: string;
  fecha: string;
  disciplina?: string;
  precioSocio?: number;
  precioNoSocio?: number;
  categorias: { nombre: string; puntajeMaximo: number }[];
}) {
  return prisma.torneo.create({
    data: {
      nombre: input.nombre,
      fecha: new Date(input.fecha),
      disciplina: input.disciplina || "Aire comprimido",
      estado: ESTADO_TORNEO.ABIERTO,
      precioSocio: input.precioSocio ?? 0,
      precioNoSocio: input.precioNoSocio ?? 0,
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

// Actualiza datos básicos y precios de un torneo (no toca categorías).
export async function actualizarTorneo(
  id: string,
  input: {
    nombre?: string;
    fecha?: string;
    disciplina?: string;
    precioSocio?: number;
    precioNoSocio?: number;
  }
) {
  return prisma.torneo.update({
    where: { id },
    data: {
      ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
      ...(input.fecha !== undefined ? { fecha: new Date(input.fecha) } : {}),
      ...(input.disciplina !== undefined
        ? { disciplina: input.disciplina || "Aire comprimido" }
        : {}),
      ...(input.precioSocio !== undefined
        ? { precioSocio: input.precioSocio }
        : {}),
      ...(input.precioNoSocio !== undefined
        ? { precioNoSocio: input.precioNoSocio }
        : {}),
    },
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
        orderBy: [{ estadoPago: "asc" }, { apellido: "asc" }],
        include: { categoria: true },
      },
    },
  });
}

// El próximo torneo abierto (para el panel del socio y el link público).
export async function proximoTorneoAbierto() {
  return prisma.torneo.findFirst({
    where: { estado: ESTADO_TORNEO.ABIERTO },
    orderBy: { fecha: "asc" },
    include: { categorias: { orderBy: { nombre: "asc" } } },
  });
}

// Verifica que la categoría pertenezca al torneo y la devuelve.
async function categoriaDelTorneo(torneoId: string, categoriaId: string) {
  const categoria = await prisma.categoriaTorneo.findUnique({
    where: { id: categoriaId },
  });
  if (!categoria || categoria.torneoId !== torneoId) {
    throw new Error("Categoría inválida para este torneo");
  }
  return categoria;
}

// ---------------------------------------------------------------------------
// Inscripción con cobro
// ---------------------------------------------------------------------------

// Crea una inscripción PENDIENTE (sin puntaje aún). El monto se toma del
// precio del torneo según sea socio o no. Devuelve la participación creada.
export async function inscribir(input: {
  torneoId: string;
  categoriaId: string;
  socioId?: string | null;
  nombre: string;
  apellido: string;
  dni?: string | null;
  telefono?: string | null;
  email?: string | null;
  metodoPago: "mercadopago" | "efectivo" | "transferencia";
}) {
  const torneo = await prisma.torneo.findUnique({
    where: { id: input.torneoId },
  });
  if (!torneo) throw new Error("Torneo inexistente");
  if (torneo.estado !== ESTADO_TORNEO.ABIERTO) {
    throw new Error("La inscripción a este torneo está cerrada");
  }
  await categoriaDelTorneo(input.torneoId, input.categoriaId);

  const esSocio = !!input.socioId;
  const monto = esSocio ? torneo.precioSocio : torneo.precioNoSocio;

  // Evitar doble inscripción de un mismo socio en el torneo.
  if (esSocio) {
    const ya = await prisma.participacionTorneo.findFirst({
      where: { torneoId: input.torneoId, socioId: input.socioId },
    });
    if (ya) throw new Error("Ya estás inscripto en este torneo");
  }

  return prisma.participacionTorneo.create({
    data: {
      torneoId: input.torneoId,
      categoriaId: input.categoriaId,
      socioId: input.socioId || null,
      nombre: input.nombre,
      apellido: input.apellido,
      dni: input.dni || null,
      telefono: input.telefono || null,
      email: input.email || null,
      esSocio,
      montoInscripcion: monto,
      estadoPago: "pendiente",
      metodoPago: input.metodoPago,
    },
  });
}

// Marca una inscripción como pagada (por webhook de MP o confirmación manual del admin).
export async function confirmarPagoInscripcion(input: {
  participacionId: string;
  mpPaymentId?: string | null;
}) {
  const p = await prisma.participacionTorneo.findUnique({
    where: { id: input.participacionId },
  });
  if (!p || p.estadoPago === "pagado") return p;
  return prisma.participacionTorneo.update({
    where: { id: input.participacionId },
    data: {
      estadoPago: "pagado",
      mpPaymentId: input.mpPaymentId ?? p.mpPaymentId,
      fechaPago: new Date(),
    },
  });
}

// Guarda el id de preferencia de MP en la inscripción.
export async function guardarPreferenciaInscripcion(
  participacionId: string,
  mpPreferenceId: string
) {
  return prisma.participacionTorneo.update({
    where: { id: participacionId },
    data: { mpPreferenceId },
  });
}

// El admin cambia la categoría de un inscripto (ej: se equivocó al anotarse).
export async function cambiarCategoriaParticipante(
  participacionId: string,
  categoriaId: string
) {
  const p = await prisma.participacionTorneo.findUnique({
    where: { id: participacionId },
  });
  if (!p) throw new Error("Inscripción inexistente");
  await categoriaDelTorneo(p.torneoId, categoriaId);
  return prisma.participacionTorneo.update({
    where: { id: participacionId },
    data: { categoriaId },
  });
}

// El admin carga (o corrige) el puntaje de un inscripto. Recalcula rendimiento.
export async function cargarPuntaje(participacionId: string, puntaje: number) {
  const p = await prisma.participacionTorneo.findUnique({
    where: { id: participacionId },
    include: { categoria: true },
  });
  if (!p) throw new Error("Inscripción inexistente");
  if (puntaje < 0 || puntaje > p.categoria.puntajeMaximo) {
    throw new Error(`El puntaje debe estar entre 0 y ${p.categoria.puntajeMaximo}`);
  }
  const rendimiento = (puntaje / p.categoria.puntajeMaximo) * 100;
  return prisma.participacionTorneo.update({
    where: { id: participacionId },
    data: { puntaje, rendimiento },
  });
}

// El admin elimina una inscripción.
export async function eliminarParticipacion(participacionId: string) {
  return prisma.participacionTorneo.delete({ where: { id: participacionId } });
}

// Recaudación de un torneo: total cobrado (pagado) y desglose.
export async function recaudacionTorneo(torneoId: string) {
  const participaciones = await prisma.participacionTorneo.findMany({
    where: { torneoId },
    select: { estadoPago: true, montoInscripcion: true, esSocio: true },
  });
  let recaudado = 0;
  let pendiente = 0;
  let socios = 0;
  let noSocios = 0;
  for (const p of participaciones) {
    if (p.estadoPago === "pagado") recaudado += p.montoInscripcion;
    else pendiente += p.montoInscripcion;
    if (p.esSocio) socios++;
    else noSocios++;
  }
  return {
    recaudado,
    pendiente,
    inscriptos: participaciones.length,
    socios,
    noSocios,
  };
}

// Carga directa por el admin de un participante que ya jugó (con puntaje).
// Marca la inscripción como pagada (el admin la registra tras cobrar en la mesa).
export async function registrarParticipacion(input: {
  torneoId: string;
  categoriaId: string;
  socioId?: string | null;
  nombre: string;
  apellido: string;
  puntaje: number;
}) {
  const categoria = await categoriaDelTorneo(input.torneoId, input.categoriaId);
  if (input.puntaje < 0 || input.puntaje > categoria.puntajeMaximo) {
    throw new Error(`El puntaje debe estar entre 0 y ${categoria.puntajeMaximo}`);
  }

  const rendimiento = (input.puntaje / categoria.puntajeMaximo) * 100;
  const torneo = await prisma.torneo.findUnique({ where: { id: input.torneoId } });
  const esSocio = !!input.socioId;
  const monto = esSocio
    ? torneo?.precioSocio ?? 0
    : torneo?.precioNoSocio ?? 0;

  return prisma.participacionTorneo.create({
    data: {
      torneoId: input.torneoId,
      categoriaId: input.categoriaId,
      socioId: input.socioId || null,
      nombre: input.nombre,
      apellido: input.apellido,
      esSocio,
      montoInscripcion: monto,
      estadoPago: "pagado",
      metodoPago: "efectivo",
      fechaPago: new Date(),
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
// Solo incluye a quienes ya tienen puntaje cargado.
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
      participaciones: {
        where: { puntaje: { not: null } },
        orderBy: { puntaje: "desc" },
      },
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
      puntaje: p.puntaje ?? 0,
      rendimiento: p.rendimiento ?? 0,
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
  // Solo participaciones de socios con puntaje ya cargado.
  const participaciones = await prisma.participacionTorneo.findMany({
    where: { socioId: { not: null }, rendimiento: { not: null } },
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
    if (!p.socioId || !p.socio || p.rendimiento == null) continue;
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
