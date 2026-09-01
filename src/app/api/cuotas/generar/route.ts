import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ESTADO_SOCIO, ESTADO_CUOTA } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { generarCuotasSchema } from "@/lib/validators";

// POST /api/cuotas/generar — genera la cuota de un período para todos los
// socios ACTIVOS que aún no la tengan (solo admin).
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = generarCuotasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { periodoMes, periodoAnio, diaVencimiento } = parsed.data;

  const sociosActivos = await prisma.socio.findMany({
    where: { estado: ESTADO_SOCIO.ACTIVO },
    include: { categoriaRef: true },
  });

  const fechaVencimiento = new Date(periodoAnio, periodoMes - 1, diaVencimiento);

  let creadas = 0;
  let omitidas = 0;
  let sinMonto = 0;

  for (const socio of sociosActivos) {
    // El monto sale del precio actual de la categoría del socio.
    const monto = socio.categoriaRef?.cuotaMensual ?? 0;

    // No generamos cuotas de $0 (socio sin categoría o categoría en $0)
    if (monto <= 0) {
      sinMonto++;
      continue;
    }

    // Evita duplicar la cuota del período (respeta el unique del schema)
    const existe = await prisma.cuota.findUnique({
      where: {
        socioId_periodoMes_periodoAnio: {
          socioId: socio.id,
          periodoMes,
          periodoAnio,
        },
      },
    });

    if (existe) {
      omitidas++;
      continue;
    }

    await prisma.cuota.create({
      data: {
        socioId: socio.id,
        periodoMes,
        periodoAnio,
        monto,
        descripcion: "Cuota mensual",
        fechaVencimiento,
        estado: ESTADO_CUOTA.PENDIENTE,
      },
    });
    creadas++;
  }

  return NextResponse.json({ creadas, omitidas, sinMonto });
}
