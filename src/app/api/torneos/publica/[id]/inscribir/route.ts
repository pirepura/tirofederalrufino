import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ACCION_AUDITORIA } from "@/lib/constants";
import { inscripcionPublicaSchema } from "@/lib/validators";
import { inscribir, guardarPreferenciaInscripcion } from "@/lib/torneos";
import { crearPreferenciaPago, mercadoPagoConfigurado } from "@/lib/mercadopago";
import { registrarAuditoria } from "@/lib/auditoria";
import { CLUB } from "@/config/club";

// POST /api/torneos/publica/[id]/inscribir — inscripción pública de un no socio.
// Sin login. Con Mercado Pago devuelve initPoint; con efectivo/transferencia
// deja la inscripción en standby hasta que el admin confirme el pago.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const torneo = await prisma.torneo.findUnique({ where: { id: params.id } });
  if (!torneo) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }
  if (torneo.estado !== "abierto") {
    return NextResponse.json(
      { error: "La inscripción a este torneo está cerrada" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = inscripcionPublicaSchema.safeParse({ ...body, torneoId: params.id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  if (parsed.data.metodoPago === "mercadopago" && !mercadoPagoConfigurado()) {
    return NextResponse.json(
      { error: "Los pagos online no están disponibles en este momento." },
      { status: 503 }
    );
  }

  try {
    const insc = await inscribir({
      torneoId: params.id,
      categoriaId: parsed.data.categoriaId,
      socioId: null,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      dni: parsed.data.dni,
      telefono: parsed.data.telefono,
      email: parsed.data.email,
      metodoPago: parsed.data.metodoPago,
    });

    await registrarAuditoria({
      accion: ACCION_AUDITORIA.TORNEO_INSCRIPCION,
      usuarioRol: "PUBLICO",
      usuarioNombre: `${parsed.data.apellido}, ${parsed.data.nombre}`,
      entidad: "torneo",
      entidadId: params.id,
      detalle: `No socio inscripto (${parsed.data.metodoPago}) por ${insc.montoInscripcion}`,
    });

    if (parsed.data.metodoPago !== "mercadopago") {
      return NextResponse.json({ ok: true, pendiente: true });
    }

    if (insc.montoInscripcion <= 0) {
      await prisma.participacionTorneo.update({
        where: { id: insc.id },
        data: { estadoPago: "pagado", fechaPago: new Date() },
      });
      return NextResponse.json({ ok: true, pendiente: false });
    }

    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const pref = await crearPreferenciaPago({
      titulo: `Inscripción ${torneo.nombre} - ${CLUB.nombre}`,
      monto: insc.montoInscripcion,
      externalReference: `torneo:${insc.id}`,
      emailComprador: parsed.data.email,
      backUrl: `${appUrl}/torneo/${params.id}/gracias`,
    });
    await guardarPreferenciaInscripcion(insc.id, pref.id);

    return NextResponse.json({ initPoint: pref.initPoint });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al inscribirse";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
