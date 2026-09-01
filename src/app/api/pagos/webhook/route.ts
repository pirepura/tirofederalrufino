import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ESTADO_CUOTA, METODO_PAGO } from "@/lib/constants";
import { obtenerPago } from "@/lib/mercadopago";
import { marcarCuotaPagada } from "@/lib/cuotas";

// POST /api/pagos/webhook — recibe notificaciones (IPN/Webhooks) de Mercado Pago.
// Cuando un pago es aprobado, marca la cuota correspondiente como PAGADA.
// La cuota se identifica por external_reference (que guardamos = cuota.id).
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    // Mercado Pago puede enviar el id del pago en el body o en la query string.
    const tipo =
      (body as { type?: string }).type ??
      url.searchParams.get("type") ??
      url.searchParams.get("topic");

    const paymentId =
      (body as { data?: { id?: string } }).data?.id ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id");

    // Solo procesamos notificaciones de pago
    if (tipo && !String(tipo).includes("payment")) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const pago = await obtenerPago(String(paymentId));
    const cuotaId = pago.external_reference;
    const estadoPago = pago.status; // approved | pending | rejected

    if (estadoPago === "approved" && cuotaId) {
      const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId } });
      if (cuota && cuota.estado !== ESTADO_CUOTA.PAGADA) {
        await marcarCuotaPagada(
          cuotaId,
          METODO_PAGO.MERCADOPAGO,
          String(paymentId)
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Ante error respondemos 200 igual para que MP no reintente en loop;
    // el estado real de la cuota se puede reconciliar manualmente.
    console.error("Error en webhook de Mercado Pago:", e);
    return NextResponse.json({ ok: false });
  }
}

// Mercado Pago a veces valida el endpoint con un GET
export async function GET() {
  return NextResponse.json({ ok: true });
}
