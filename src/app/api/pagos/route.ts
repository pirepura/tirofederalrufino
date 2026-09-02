import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ESTADO_CUOTA, ROLES, nombreMes } from "@/lib/constants";
import { CLUB } from "@/config/club";
import {
  crearPreferenciaPago,
  mercadoPagoConfigurado,
} from "@/lib/mercadopago";

// POST /api/pagos — crea una preferencia de pago de Mercado Pago para una cuota.
// Seguridad: el socio solo puede pagar cuotas propias; el admin puede pagar cualquiera.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const cuotaId: string | undefined = body?.cuotaId;
  if (!cuotaId) {
    return NextResponse.json(
      { error: "Falta el id de la cuota" },
      { status: 400 }
    );
  }

  const cuota = await prisma.cuota.findUnique({
    where: { id: cuotaId },
    include: {
      socio: { include: { user: { select: { email: true } } } },
    },
  });

  if (!cuota) {
    return NextResponse.json({ error: "Cuota no encontrada" }, { status: 404 });
  }

  // Verificación de propiedad: un socio solo paga lo suyo
  if (
    session.user.rol !== ROLES.ADMIN &&
    session.user.socioId !== cuota.socioId
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (cuota.estado === ESTADO_CUOTA.PAGADA) {
    return NextResponse.json(
      { error: "Esta cuota ya fue pagada" },
      { status: 400 }
    );
  }

  if (!mercadoPagoConfigurado()) {
    return NextResponse.json(
      {
        error:
          "Mercado Pago aún no está configurado. Cargá un MP_ACCESS_TOKEN válido en el servidor.",
      },
      { status: 503 }
    );
  }

  try {
    const pref = await crearPreferenciaPago({
      titulo: `Cuota ${nombreMes(cuota.periodoMes)} ${cuota.periodoAnio} - ${CLUB.nombre}`,
      monto: cuota.monto,
      externalReference: cuota.id,
      emailComprador: cuota.socio.user.email,
    });

    // Guarda la referencia de la preferencia en la cuota
    await prisma.cuota.update({
      where: { id: cuota.id },
      data: { mpPreferenceId: pref.id ?? null },
    });

    return NextResponse.json({
      preferenceId: pref.id,
      initPoint: pref.initPoint,
    });
  } catch (e) {
    // Extrae el detalle real del error de Mercado Pago (puede venir anidado)
    const err = e as {
      message?: string;
      cause?: unknown;
      error?: string;
    };
    const detalle =
      err?.message ??
      (typeof err?.error === "string" ? err.error : undefined) ??
      "Error al crear el pago en Mercado Pago";

    console.error("Detalle error MP:", JSON.stringify(e, Object.getOwnPropertyNames(e ?? {})));

    return NextResponse.json(
      { error: `Error al crear el pago en Mercado Pago: ${detalle}` },
      { status: 502 }
    );
  }
}
