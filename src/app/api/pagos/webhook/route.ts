import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ESTADO_CUOTA, ESTADO_SUSCRIPCION, METODO_PAGO } from "@/lib/constants";
import {
  obtenerPago,
  obtenerSuscripcion,
  obtenerPagoAutorizado,
  validarFirmaWebhook,
} from "@/lib/mercadopago";
import {
  marcarCuotaPagada,
  registrarPagoAutomatico,
} from "@/lib/cuotas";

// POST /api/pagos/webhook — recibe notificaciones (IPN/Webhooks) de Mercado Pago.
// Maneja tres tipos de eventos:
//   - payment: pago único de una cuota (checkout normal)
//   - subscription_preapproval: alta/cambio de estado de una suscripción
//   - subscription_authorized_payment: cobro mensual automático (débito)
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const tipo =
      (body as { type?: string }).type ??
      url.searchParams.get("type") ??
      url.searchParams.get("topic") ??
      "";

    const dataId =
      (body as { data?: { id?: string } }).data?.id ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id");

    if (!dataId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Validar la firma del webhook (si MP_WEBHOOK_SECRET está configurado).
    const firmaValida = validarFirmaWebhook({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId: String(dataId),
    });
    if (!firmaValida) {
      console.warn("Webhook de Mercado Pago con firma inválida. Ignorado.");
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const t = String(tipo);

    // --- Alta / cambio de estado de una suscripción (preapproval) ---
    if (t.includes("preapproval") && !t.includes("authorized_payment")) {
      const sub = await obtenerSuscripcion(String(dataId));
      const socioId = sub.external_reference;
      if (socioId) {
        const estado =
          sub.status === "authorized"
            ? ESTADO_SUSCRIPCION.ACTIVA
            : sub.status === "paused"
              ? ESTADO_SUSCRIPCION.PAUSADA
              : sub.status === "cancelled"
                ? ESTADO_SUSCRIPCION.CANCELADA
                : null;
        await prisma.socio.updateMany({
          where: { id: socioId },
          data: {
            suscripcionEstado: estado,
            mpPreapprovalId:
              sub.status === "cancelled" ? null : String(dataId),
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    // --- Cobro mensual automático de una suscripción ---
    if (t.includes("authorized_payment")) {
      const authPay = await obtenerPagoAutorizado(String(dataId));
      if (authPay.status === "approved") {
        const sub = await obtenerSuscripcion(authPay.preapproval_id);
        const socioId = sub.external_reference;
        if (socioId) {
          await registrarPagoAutomatico({
            socioId,
            monto: authPay.transaction_amount,
            mpPaymentId: String(authPay.id),
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // --- Pago único de una cuota (checkout normal) ---
    if (t.includes("payment")) {
      const pago = await obtenerPago(String(dataId));
      const cuotaId = pago.external_reference;
      if (pago.status === "approved" && cuotaId) {
        const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId } });
        if (cuota && cuota.estado !== ESTADO_CUOTA.PAGADA) {
          await marcarCuotaPagada(
            cuotaId,
            METODO_PAGO.MERCADOPAGO,
            String(dataId)
          );
        }
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: true });
  } catch (e) {
    // Ante error respondemos 200 igual para que MP no reintente en loop;
    // el estado real se puede reconciliar manualmente.
    console.error("Error en webhook de Mercado Pago:", e);
    return NextResponse.json({ ok: false });
  }
}

// Mercado Pago a veces valida el endpoint con un GET
export async function GET() {
  return NextResponse.json({ ok: true });
}
