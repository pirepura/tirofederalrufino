import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comprarNumeroSchema } from "@/lib/validators";
import { reservarNumerosEnProceso, formatearNumero } from "@/lib/rifas";
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
    const { compraId, numeros } = await reservarNumerosEnProceso({
      rifaId: rifa.id,
      numeros: parsed.data.numeros,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      telefono: parsed.data.telefono,
    });

    const cantidad = numeros.length;
    const numerosFmt = numeros
      .map((n) => formatearNumero(n, rifa.cifras))
      .join(", ");
    const titulo =
      cantidad === 1
        ? `Rifa ${rifa.titulo} - Número ${numerosFmt} - ${CLUB.nombre}`
        : `Rifa ${rifa.titulo} - ${cantidad} números (${numerosFmt}) - ${CLUB.nombre}`;

    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const pref = await crearPreferenciaPago({
      titulo,
      monto: rifa.precioNumero,
      cantidad,
      externalReference: `rifa:${compraId}`,
      backUrl: `${appUrl}/rifa/${rifa.slug}/gracias`,
    });

    // Guardar el id de preferencia en todos los números de la compra.
    await prisma.numeroRifa.updateMany({
      where: { compraId },
      data: { mpPreferenceId: pref.id ?? null },
    });

    return NextResponse.json({ initPoint: pref.initPoint });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al iniciar la compra";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
