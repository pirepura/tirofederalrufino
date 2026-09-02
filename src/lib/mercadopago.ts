import crypto from "crypto";

// Integración con Mercado Pago vía API REST directa (fetch).
// Se usa REST en lugar del SDK oficial porque el SDK, en el entorno
// serverless de Vercel, devolvía "policy UNAUTHORIZED" al crear preferencias.
// La misma petición vía REST funciona correctamente.
// El access token se toma de la variable de entorno MP_ACCESS_TOKEN.

const MP_API = "https://api.mercadopago.com";

function getToken(): string {
  const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error(
      "Falta MP_ACCESS_TOKEN. Configurá las credenciales de Mercado Pago en .env"
    );
  }
  return accessToken;
}

// Indica si Mercado Pago está configurado con un token real (no el de placeholder).
export function mercadoPagoConfigurado(): boolean {
  const token = process.env.MP_ACCESS_TOKEN ?? "";
  return token.length > 0 && !token.includes("0000000000000000");
}

type CrearPreferenciaInput = {
  titulo: string;
  monto: number;
  cantidad?: number;
  // Referencia interna (ej: id de la cuota) para reconciliar el pago
  externalReference: string;
  emailComprador?: string;
};

// Detecta si la URL es local (no accesible desde internet).
// Mercado Pago rechaza notification_url y auto_return con URLs locales.
function esUrlLocal(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  );
}

// Crea una preferencia de pago en Mercado Pago y devuelve el link de checkout.
export async function crearPreferenciaPago(input: CrearPreferenciaInput) {
  const token = getToken();
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
  const urlLocal = esUrlLocal(appUrl);

  // Cuerpo de la preferencia
  const body: Record<string, unknown> = {
    items: [
      {
        id: input.externalReference,
        title: input.titulo,
        quantity: input.cantidad ?? 1,
        unit_price: input.monto,
        currency_id: "ARS",
      },
    ],
    external_reference: input.externalReference,
    back_urls: {
      success: `${appUrl}/socio/pago/resultado?estado=exito`,
      failure: `${appUrl}/socio/pago/resultado?estado=error`,
      pending: `${appUrl}/socio/pago/resultado?estado=pendiente`,
    },
  };

  if (input.emailComprador) {
    body.payer = { email: input.emailComprador };
  }

  // notification_url y auto_return solo con URL pública (MP los rechaza en local)
  if (!urlLocal) {
    body.auto_return = "approved";
    body.notification_url = `${appUrl}/api/pagos/webhook`;
  }

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const detalle =
      (data && (data.message || data.error)) ?? `HTTP ${res.status}`;
    console.error("Mercado Pago - error al crear preferencia:", data);
    throw new Error(String(detalle));
  }

  return {
    id: data.id as string,
    initPoint: data.init_point as string,
    sandboxInitPoint: data.sandbox_init_point as string,
  };
}

// Consulta el detalle de un pago por su id (usado en el webhook).
export async function obtenerPago(paymentId: string) {
  const token = getToken();
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Error al consultar el pago: HTTP ${res.status}`);
  }
  return res.json() as Promise<{
    id: number;
    status: string;
    external_reference: string | null;
  }>;
}

// ---------------------------------------------------------------------------
// Suscripciones (débito automático) — endpoint /preapproval
// ---------------------------------------------------------------------------

type CrearSuscripcionInput = {
  monto: number;
  emailPagador: string;
  // Referencia interna (id del socio) para reconciliar
  externalReference: string;
  razon?: string;
};

// Crea una suscripción con débito automático mensual y devuelve el link
// (init_point) donde el socio autoriza y carga su tarjeta.
export async function crearSuscripcion(input: CrearSuscripcionInput) {
  const token = getToken();
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();

  const body: Record<string, unknown> = {
    reason: input.razon ?? "Cuota mensual - Tiro Federal Rufino",
    external_reference: input.externalReference,
    payer_email: input.emailPagador,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: input.monto,
      currency_id: "ARS",
    },
    back_url: `${appUrl}/socio/debito/resultado`,
    status: "pending",
  };

  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const detalle =
      (data && (data.message || data.error)) ?? `HTTP ${res.status}`;
    console.error("Mercado Pago - error al crear suscripción:", data);
    throw new Error(String(detalle));
  }

  return {
    id: data.id as string,
    initPoint: (data.init_point ?? data.sandbox_init_point) as string,
    status: data.status as string,
  };
}

// Consulta una suscripción por su id.
export async function obtenerSuscripcion(preapprovalId: string) {
  const token = getToken();
  const res = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Error al consultar la suscripción: HTTP ${res.status}`);
  }
  return res.json() as Promise<{
    id: string;
    status: string; // pending | authorized | paused | cancelled
    external_reference: string | null;
    payer_email: string | null;
  }>;
}

// Cancela una suscripción (deja de cobrar).
export async function cancelarSuscripcion(preapprovalId: string) {
  const token = getToken();
  const res = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detalle = data?.message ?? `HTTP ${res.status}`;
    throw new Error(String(detalle));
  }
  return res.json();
}

// Consulta un pago de suscripción autorizado (authorized payment).
export async function obtenerPagoAutorizado(authorizedPaymentId: string) {
  const token = getToken();
  const res = await fetch(
    `${MP_API}/authorized_payments/${authorizedPaymentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`Error al consultar el pago autorizado: HTTP ${res.status}`);
  }
  return res.json() as Promise<{
    id: number;
    status: string;
    preapproval_id: string;
    transaction_amount: number;
  }>;
}

// ---------------------------------------------------------------------------
// Validación de la firma del webhook de Mercado Pago.
//
// Mercado Pago firma cada notificación con HMAC-SHA256. Envía dos headers:
//   x-signature: "ts=<timestamp>,v1=<hash>"
//   x-request-id: <id de la petición>
// El hash se calcula sobre el "manifest":
//   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// usando MP_WEBHOOK_SECRET como clave.
//
// Devuelve:
//   - true  si la firma es válida
//   - true  si no hay MP_WEBHOOK_SECRET configurado (validación desactivada)
//   - false si hay secret pero la firma no coincide
// ---------------------------------------------------------------------------
export function validarFirmaWebhook(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;

  // Si no hay secret configurado, no validamos (compatibilidad hacia atrás).
  if (!secret) return true;

  const { xSignature, xRequestId, dataId } = params;
  if (!xSignature || !dataId) return false;

  // Parsear "ts=...,v1=..."
  let ts = "";
  let v1 = "";
  for (const parte of xSignature.split(",")) {
    const [clave, valor] = parte.split("=").map((s) => s.trim());
    if (clave === "ts") ts = valor;
    if (clave === "v1") v1 = valor;
  }
  if (!ts || !v1) return false;

  // Construir el manifest en el formato exacto que espera Mercado Pago.
  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  // Comparación en tiempo constante para evitar timing attacks.
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(v1, "hex")
    );
  } catch {
    return false;
  }
}
