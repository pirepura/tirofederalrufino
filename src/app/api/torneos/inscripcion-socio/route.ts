import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { inscripcionSocioSchema } from "@/lib/validators";
import {
  inscribir,
  guardarPreferenciaInscripcion,
} from "@/lib/torneos";
import { crearPreferenciaPago, mercadoPagoConfigurado } from "@/lib/mercadopago";
import { registrarAuditoria } from "@/lib/auditoria";
import { CLUB } from "@/config/club";

// POST /api/torneos/inscripcion-socio — el socio logueado se inscribe a un torneo.
// Si el método es Mercado Pago devuelve initPoint; si es efectivo/transferencia
// deja la inscripción pendiente para que el admin la confirme.
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.SOCIO || !session.user.socioId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = inscripcionSocioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const socio = await prisma.socio.findUnique({
    where: { id: session.user.socioId },
    include: { user: { select: { email: true } } },
  });
  if (!socio) {
    return NextResponse.json({ error: "Socio inexistente" }, { status: 404 });
  }
  const socioEmail = socio.user?.email ?? null;

  if (parsed.data.metodoPago === "mercadopago" && !mercadoPagoConfigurado()) {
    return NextResponse.json(
      { error: "Los pagos online no están disponibles en este momento." },
      { status: 503 }
    );
  }

  try {
    const insc = await inscribir({
      torneoId: parsed.data.torneoId,
      categoriaId: parsed.data.categoriaId,
      socioId: socio.id,
      nombre: socio.nombre,
      apellido: socio.apellido,
      dni: socio.dni,
      telefono: socio.telefono,
      email: socioEmail,
      metodoPago: parsed.data.metodoPago,
    });

    await registrarAuditoria({
      accion: ACCION_AUDITORIA.TORNEO_INSCRIPCION,
      usuarioRol: "SOCIO",
      usuarioNombre: `${socio.apellido}, ${socio.nombre}`,
      entidad: "torneo",
      entidadId: insc.torneoId,
      detalle: `Socio inscripto (${parsed.data.metodoPago}) por ${insc.montoInscripcion}`,
    });

    // Pago en efectivo/transferencia: queda pendiente hasta que el admin confirme.
    if (parsed.data.metodoPago !== "mercadopago") {
      return NextResponse.json({ ok: true, pendiente: true });
    }

    // Si el monto es 0 (torneo gratis para socios), se da por pagado directo.
    if (insc.montoInscripcion <= 0) {
      await prisma.participacionTorneo.update({
        where: { id: insc.id },
        data: { estadoPago: "pagado", fechaPago: new Date() },
      });
      return NextResponse.json({ ok: true, pendiente: false });
    }

    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const torneo = await prisma.torneo.findUnique({
      where: { id: insc.torneoId },
    });
    const pref = await crearPreferenciaPago({
      titulo: `Inscripción ${torneo?.nombre ?? "torneo"} - ${CLUB.nombre}`,
      monto: insc.montoInscripcion,
      externalReference: `torneo:${insc.id}`,
      emailComprador: socioEmail ?? undefined,
      backUrl: `${appUrl}/socio`,
    });
    await guardarPreferenciaInscripcion(insc.id, pref.id);

    return NextResponse.json({ initPoint: pref.initPoint });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al inscribirse";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
