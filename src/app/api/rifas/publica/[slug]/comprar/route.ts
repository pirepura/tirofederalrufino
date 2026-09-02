import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comprarNumeroSchema } from "@/lib/validators";
import { reservarNumeroEnProceso, formatearNumero } from "@/lib/rifas";
import { crearPreferenciaPago, mercadoPagoConfigurado } from "@/lib/mercadopago";
import { CLUB } from "@/config/club";

// POST /api/rifas/publica/[slug]/comprar — inicia la compra de un número.
// Público (sin login). Reserva el número "en proceso" y crea la preferencia
// de Mercado Pago; devuelve el link de pago.
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  if (!mercadoPagoConfigurado()) {
    return NextResponse.json(
      { error: "Los pagos no están disponibles en este momento." },
      { status: 503 }
    );
  }

  const rifa = await prisma.rifa.findUnique({ where: { slug: params.slug } });
  if (!rifa) {
    return NextResponse.json({ error: "Rifa no encontrada" }, { status: 404 });
  }
  if (rifa.estado !== "activa") {
    return NextResponse.json(
      { error: "Esta rifa ya no está activa" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = comprarNumeroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const numeroRifa = await reservarNumeroEnProceso({
      rifaId: rifa.id,
      numero: parsed.data.numero,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      telefono: parsed.data.telefono,
    });

    const numeroFmt = formatearNumero(parsed.data.numero, rifa.cifras);
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const pref = await crearPreferenciaPago({
      titulo: `Rifa ${rifa.titulo} - Número ${numeroFmt} - ${CLUB.nombre}`,
      monto: rifa.precioNumero,
      externalReference: `rifa:${numeroRifa.id}`,
      backUrl: `${appUrl}/rifa/${rifa.slug}/gracias`,
    });

    await prisma.numeroRifa.update({
      where: { id: numeroRifa.id },
      data: { mpPreferenceId: pref.id ?? null },
    });

    return NextResponse.json({ initPoint: pref.initPoint });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al iniciar la compra";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
