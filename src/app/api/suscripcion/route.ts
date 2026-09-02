import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ESTADO_SUSCRIPCION, ACCION_AUDITORIA } from "@/lib/constants";
import { CLUB } from "@/config/club";
import { prisma } from "@/lib/db";
import { crearSuscripcion, mercadoPagoConfigurado } from "@/lib/mercadopago";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/suscripcion — el socio activa el débito automático de su cuota.
// Crea una suscripción (preapproval) con el monto de su categoría y devuelve
// el link de Mercado Pago para que autorice y cargue su tarjeta.
export async function POST() {
  const session = await getSession();
  if (
    !session?.user ||
    session.user.rol !== ROLES.SOCIO ||
    !session.user.socioId
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!mercadoPagoConfigurado()) {
    return NextResponse.json(
      { error: "Mercado Pago no está configurado en el servidor." },
      { status: 503 }
    );
  }

  const socio = await prisma.socio.findUnique({
    where: { id: session.user.socioId },
    include: {
      categoriaRef: true,
      user: { select: { email: true } },
    },
  });
  if (!socio) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  if (socio.suscripcionEstado === ESTADO_SUSCRIPCION.ACTIVA) {
    return NextResponse.json(
      { error: "Ya tenés el débito automático activo." },
      { status: 400 }
    );
  }

  const monto = socio.categoriaRef?.cuotaMensual ?? 0;
  if (monto <= 0) {
    return NextResponse.json(
      { error: "Tu categoría no tiene un monto de cuota definido. Consultá con el club." },
      { status: 400 }
    );
  }

  try {
    const sub = await crearSuscripcion({
      monto,
      emailPagador: socio.user.email,
      externalReference: socio.id,
      razon: `Cuota mensual ${socio.categoriaRef?.nombre ?? ""} - ${CLUB.nombre}`.trim(),
    });

    // Guardamos la referencia de la suscripción (aún pendiente de autorización)
    await prisma.socio.update({
      where: { id: socio.id },
      data: {
        mpPreapprovalId: sub.id,
        suscripcionMonto: monto,
        // Se marca activa cuando el webhook confirme la autorización
      },
    });

    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.DEBITO_ACTIVADO,
      entidad: "socio",
      entidadId: socio.id,
      detalle: `Débito automático solicitado por el socio (monto ${monto})`,
    });

    return NextResponse.json({ initPoint: sub.initPoint });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Error al activar el débito automático";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
