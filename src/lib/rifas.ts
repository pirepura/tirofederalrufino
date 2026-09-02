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
    data: { estado: ESTADO_RIFA.FINALIZADA },
  });
}
