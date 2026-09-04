import { prisma } from "@/lib/db";
import { ESTADO_RIFA, ESTADO_NUMERO_RIFA } from "@/lib/constants";

// Genera un slug único a partir del título.
function generarSlug(titulo: string): string {
  const base = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const sufijo = Math.random().toString(36).slice(2, 7);
  return `${base || "rifa"}-${sufijo}`;
}

// Formatea un número con la cantidad de cifras de la rifa (ceros a la izquierda).
export function formatearNumero(numero: number, cifras: number): string {
  return String(numero).padStart(cifras, "0");
}

type PremioInput = { posicion: number; titulo: string; fotoDataUrl?: string };

// Crea una rifa con sus premios. No crea filas de números por adelantado:
// los números se consideran "disponibles" salvo los que estén en NumeroRifa.
export async function crearRifa(input: {
  titulo: string;
  descripcion?: string;
  imagenData?: string;
  cantidadNumeros: number;
  cifras: number;
  precioNumero: number;
  premios: PremioInput[];
}) {
  const slug = generarSlug(input.titulo);

  return prisma.rifa.create({
    data: {
      slug,
      titulo: input.titulo,
      descripcion: input.descripcion || null,
      imagenData: input.imagenData || null,
      cantidadNumeros: input.cantidadNumeros,
      cifras: input.cifras,
      precioNumero: input.precioNumero,
      estado: ESTADO_RIFA.ACTIVA,
      premios: {
        create: input.premios.map((p) => {
          let fotoData: string | null = null;
          let fotoTipo: string | null = null;
          if (p.fotoDataUrl && p.fotoDataUrl.startsWith("data:")) {
            fotoData = p.fotoDataUrl;
            fotoTipo = p.fotoDataUrl.substring(5, p.fotoDataUrl.indexOf(";"));
          }
          return {
            posicion: p.posicion,
            titulo: p.titulo,
            fotoData,
            fotoTipo,
          };
        }),
      },
    },
    include: { premios: true },
  });
}

export async function listarRifas() {
  const rifas = await prisma.rifa.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          numeros: true,
        },
      },
    },
  });
  // Para cada rifa, contar vendidos y recaudación
  const conStats = await Promise.all(
    rifas.map(async (r) => {
      const vendidos = await prisma.numeroRifa.count({
        where: { rifaId: r.id, estado: ESTADO_NUMERO_RIFA.VENDIDO },
      });
      return {
        ...r,
        // La portada no se usa en la lista del admin: evitamos enviar el base64 pesado.
        imagenData: null,
        vendidos,
        recaudado: vendidos * r.precioNumero,
      };
    })
  );
  return conStats;
}

// Rifa para la vista pública: incluye premios (sin fotos pesadas en la lista,
// las fotos se sirven aparte) y la lista de números ocupados (en_proceso/vendido).
export async function obtenerRifaPublica(slug: string) {
  const rifa = await prisma.rifa.findUnique({
    where: { slug },
    include: {
      premios: {
        orderBy: { posicion: "asc" },
        select: { id: true, posicion: true, titulo: true, fotoData: true },
      },
    },
  });
  if (!rifa) return null;

  // Números ocupados (vendidos o en proceso) para pintar la grilla
  const ocupados = await prisma.numeroRifa.findMany({
    where: {
      rifaId: rifa.id,
      estado: {
        in: [ESTADO_NUMERO_RIFA.VENDIDO, ESTADO_NUMERO_RIFA.EN_PROCESO],
      },
    },
    select: { numero: true },
  });

  return {
    rifa,
    ocupados: ocupados.map((o) => o.numero),
  };
}

// Marca un número como "en proceso" al iniciar la compra. Devuelve la fila.
// Verifica que el número esté libre y dentro del rango.
export async function reservarNumeroEnProceso(params: {
  rifaId: string;
  numero: number;
  nombre: string;
  apellido: string;
  telefono: string;
}) {
  const rifa = await prisma.rifa.findUnique({ where: { id: params.rifaId } });
  if (!rifa) throw new Error("Rifa no encontrada");
  if (rifa.estado !== ESTADO_RIFA.ACTIVA) {
    throw new Error("La rifa no está activa");
  }
  if (params.numero < 0 || params.numero >= rifa.cantidadNumeros) {
    throw new Error("Número fuera de rango");
  }

  const existente = await prisma.numeroRifa.findUnique({
    where: { rifaId_numero: { rifaId: params.rifaId, numero: params.numero } },
  });
  if (existente && existente.estado === ESTADO_NUMERO_RIFA.VENDIDO) {
    throw new Error("Ese número ya fue vendido");
  }

  // upsert: crea o reutiliza la fila del número en estado en_proceso
  return prisma.numeroRifa.upsert({
    where: { rifaId_numero: { rifaId: params.rifaId, numero: params.numero } },
    update: {
      estado: ESTADO_NUMERO_RIFA.EN_PROCESO,
      compradorNombre: params.nombre,
      compradorApellido: params.apellido,
      compradorTelefono: params.telefono,
    },
    create: {
      rifaId: params.rifaId,
      numero: params.numero,
      estado: ESTADO_NUMERO_RIFA.EN_PROCESO,
      compradorNombre: params.nombre,
      compradorApellido: params.apellido,
      compradorTelefono: params.telefono,
    },
  });
}

// Confirma la venta de un número (llamado desde el webhook al aprobarse el pago).
export async function confirmarNumeroVendido(params: {
  numeroRifaId: string;
  mpPaymentId: string;
}) {
  const num = await prisma.numeroRifa.findUnique({
    where: { id: params.numeroRifaId },
  });
  if (!num) return null;
  if (num.estado === ESTADO_NUMERO_RIFA.VENDIDO) return num;

  return prisma.numeroRifa.update({
    where: { id: params.numeroRifaId },
    data: {
      estado: ESTADO_NUMERO_RIFA.VENDIDO,
      mpPaymentId: params.mpPaymentId,
      fechaPago: new Date(),
    },
  });
}

// Finaliza una rifa y borra las fotos de los premios (para no acumular).
export async function finalizarRifa(rifaId: string) {
  const rifa = await prisma.rifa.findUnique({ where: { id: rifaId } });
  if (!rifa) throw new Error("Rifa no encontrada");

  await prisma.premioRifa.updateMany({
    where: { rifaId },
    data: { fotoData: null, fotoTipo: null },
  });

  return prisma.rifa.update({
    where: { id: rifaId },
    data: { estado: ESTADO_RIFA.FINALIZADA, imagenData: null },
  });
}

// Rifas activas para mostrar en el panel del socio (con portada, precio y
// disponibilidad de números). Ordenadas de la más nueva a la más vieja.
export async function rifasActivasParaSocio() {
  const rifas = await prisma.rifa.findMany({
    where: { estado: ESTADO_RIFA.ACTIVA },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      titulo: true,
      descripcion: true,
      imagenData: true,
      precioNumero: true,
      cantidadNumeros: true,
    },
  });

  return Promise.all(
    rifas.map(async (r) => {
      const vendidos = await prisma.numeroRifa.count({
        where: { rifaId: r.id, estado: ESTADO_NUMERO_RIFA.VENDIDO },
      });
      return {
        ...r,
        vendidos,
        disponibles: r.cantidadNumeros - vendidos,
      };
    })
  );
}

// ¿Están todos los números de la rifa vendidos? (habilita la carga de ganadores)
export async function rifaCompletaVendida(rifaId: string): Promise<boolean> {
  const rifa = await prisma.rifa.findUnique({ where: { id: rifaId } });
  if (!rifa) return false;
  const vendidos = await prisma.numeroRifa.count({
    where: { rifaId, estado: ESTADO_NUMERO_RIFA.VENDIDO },
  });
  return vendidos >= rifa.cantidadNumeros;
}

// Carga (a mano) los 3 números ganadores según la Lotería Nacional.
// Requiere que TODOS los números estén vendidos. Valida rango y que no se
// repitan. No sortea nada: solo guarda los números para mapearlos a compradores.
export async function cargarNumerosGanadores(params: {
  rifaId: string;
  numero1: number;
  numero2: number;
  numero3: number;
}) {
  const rifa = await prisma.rifa.findUnique({ where: { id: params.rifaId } });
  if (!rifa) throw new Error("Rifa no encontrada");

  const completa = await rifaCompletaVendida(params.rifaId);
  if (!completa) {
    throw new Error(
      "Todavía no se vendieron todos los números. Los ganadores se cargan cuando la rifa está completa."
    );
  }

  const nums = [params.numero1, params.numero2, params.numero3];
  for (const n of nums) {
    if (!Number.isInteger(n) || n < 0 || n >= rifa.cantidadNumeros) {
      throw new Error(
        `Cada número ganador debe estar entre 0 y ${rifa.cantidadNumeros - 1}`
      );
    }
  }
  if (new Set(nums).size !== 3) {
    throw new Error("Los 3 números ganadores deben ser distintos");
  }

  return prisma.rifa.update({
    where: { id: params.rifaId },
    data: {
      numeroGanador1: params.numero1,
      numeroGanador2: params.numero2,
      numeroGanador3: params.numero3,
    },
  });
}

// Devuelve los ganadores (premio, número, comprador) según los números
// ganadores cargados. Si un número no fue vendido, ganador queda en null.
export type GanadorRifa = {
  posicion: number; // 1 | 2 | 3
  premioTitulo: string;
  numero: number | null;
  numeroFormateado: string | null;
  comprador: { nombre: string; apellido: string; telefono: string | null } | null;
};

export async function obtenerGanadoresRifa(
  rifaId: string
): Promise<GanadorRifa[] | null> {
  const rifa = await prisma.rifa.findUnique({
    where: { id: rifaId },
    include: { premios: { orderBy: { posicion: "asc" } } },
  });
  if (!rifa) return null;

  const numerosGanadores = [
    rifa.numeroGanador1,
    rifa.numeroGanador2,
    rifa.numeroGanador3,
  ];

  // Si no se cargó ningún ganador, no hay nada que mostrar.
  if (numerosGanadores.every((n) => n == null)) return null;

  const resultado: GanadorRifa[] = [];
  for (let i = 0; i < 3; i++) {
    const numero = numerosGanadores[i] ?? null;
    const premio = rifa.premios.find((p) => p.posicion === i + 1);

    let comprador: GanadorRifa["comprador"] = null;
    if (numero != null) {
      const fila = await prisma.numeroRifa.findUnique({
        where: { rifaId_numero: { rifaId, numero } },
      });
      if (fila && fila.estado === ESTADO_NUMERO_RIFA.VENDIDO) {
        comprador = {
          nombre: fila.compradorNombre ?? "",
          apellido: fila.compradorApellido ?? "",
          telefono: fila.compradorTelefono ?? null,
        };
      }
    }

    resultado.push({
      posicion: i + 1,
      premioTitulo: premio?.titulo ?? `${i + 1}° premio`,
      numero,
      numeroFormateado: numero != null ? formatearNumero(numero, rifa.cifras) : null,
      comprador,
    });
  }

  return resultado;
}
