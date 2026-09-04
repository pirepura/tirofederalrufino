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

// Genera un id de compra para agrupar varios números pagados juntos.
function generarCompraId(): string {
  return `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Reserva UNO O VARIOS números "en proceso" en una sola compra. Todos comparten
// un compraId (para reconciliar un único pago que cubre varios números).
// Verifica que estén libres y en rango. Devuelve el compraId y los números.
export async function reservarNumerosEnProceso(params: {
  rifaId: string;
  numeros: number[];
  nombre: string;
  apellido: string;
  telefono: string;
}) {
  const rifa = await prisma.rifa.findUnique({ where: { id: params.rifaId } });
  if (!rifa) throw new Error("Rifa no encontrada");
  if (rifa.estado !== ESTADO_RIFA.ACTIVA) {
    throw new Error("La rifa no está activa");
  }

  // Quitar duplicados y validar rango.
  const numeros = Array.from(new Set(params.numeros));
  if (numeros.length === 0) throw new Error("Elegí al menos un número");
  for (const n of numeros) {
    if (n < 0 || n >= rifa.cantidadNumeros) {
      throw new Error(`El número ${n} está fuera de rango`);
    }
  }

  // Verificar que ninguno esté vendido o en proceso (ocupado).
  const ocupados = await prisma.numeroRifa.findMany({
    where: {
      rifaId: params.rifaId,
      numero: { in: numeros },
      estado: {
        in: [ESTADO_NUMERO_RIFA.VENDIDO, ESTADO_NUMERO_RIFA.EN_PROCESO],
      },
    },
    select: { numero: true },
  });
  if (ocupados.length > 0) {
    const lista = ocupados.map((o) => o.numero).join(", ");
    throw new Error(`Estos números ya no están disponibles: ${lista}`);
  }

  const compraId = generarCompraId();

  // Reservar todos en una transacción (upsert por cada número).
  await prisma.$transaction(
    numeros.map((numero) =>
      prisma.numeroRifa.upsert({
        where: { rifaId_numero: { rifaId: params.rifaId, numero } },
        update: {
          estado: ESTADO_NUMERO_RIFA.EN_PROCESO,
          compradorNombre: params.nombre,
          compradorApellido: params.apellido,
          compradorTelefono: params.telefono,
          compraId,
        },
        create: {
          rifaId: params.rifaId,
          numero,
          estado: ESTADO_NUMERO_RIFA.EN_PROCESO,
          compradorNombre: params.nombre,
          compradorApellido: params.apellido,
          compradorTelefono: params.telefono,
          compraId,
        },
      })
    )
  );

  return { compraId, numeros };
}

// Confirma la venta de TODOS los números de una compra (llamado desde el webhook
// al aprobarse el pago). Devuelve la lista de números confirmados.
export async function confirmarCompraVendida(params: {
  compraId: string;
  mpPaymentId: string;
}) {
  const nums = await prisma.numeroRifa.findMany({
    where: { compraId: params.compraId },
  });
  if (nums.length === 0) return null;

  await prisma.numeroRifa.updateMany({
    where: {
      compraId: params.compraId,
      estado: { not: ESTADO_NUMERO_RIFA.VENDIDO },
    },
    data: {
      estado: ESTADO_NUMERO_RIFA.VENDIDO,
      mpPaymentId: params.mpPaymentId,
      fechaPago: new Date(),
    },
  });

  // Devolver info útil para la auditoría (rifaId y números).
  return {
    rifaId: nums[0].rifaId,
    numeros: nums.map((n) => n.numero),
    compradorNombre: nums[0].compradorNombre,
    compradorApellido: nums[0].compradorApellido,
  };
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
