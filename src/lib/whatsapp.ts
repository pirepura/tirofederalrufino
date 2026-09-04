// ===========================================================================
// Integración con WhatsApp Cloud API (Meta) — envío de mensajes con plantilla.
// ---------------------------------------------------------------------------
// Los mensajes que inicia el club (no respuesta a un socio) deben usar una
// PLANTILLA aprobada por Meta. Las credenciales se leen del entorno:
//   WHATSAPP_TOKEN            token de acceso de la app de Meta
//   WHATSAPP_PHONE_NUMBER_ID  id del número emisor
//   WHATSAPP_API_VERSION      opcional (por defecto v21.0)
//   WHATSAPP_TEMPLATE_CUOTA   nombre de la plantilla de aviso de cuota
//   WHATSAPP_TEMPLATE_LANG    idioma de la plantilla (por defecto es_AR)
//
// Diseño defensivo: si no hay credenciales, no envía y NO rompe el flujo
// (mismo criterio que Mercado Pago). Así el código se puede desplegar antes
// de tener la cuenta de Meta lista.
// ===========================================================================

const GRAPH_API = "https://graph.facebook.com";

function apiVersion(): string {
  return (process.env.WHATSAPP_API_VERSION ?? "v21.0").trim();
}

// ¿Están las credenciales de WhatsApp configuradas?
export function whatsappConfigurado(): boolean {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  return !!token && !!phoneId;
}

// ---------------------------------------------------------------------------
// Normalización de teléfonos a formato internacional de Argentina para Meta.
// Meta espera el número sin "+", sin espacios ni guiones. Para Argentina, el
// formato de móvil es: 54 9 <característica> <número> (sin el 0 ni el 15).
//   Ej: "03385-15-401234" -> "5493385401234"
//       "+54 9 3385 40-1234" -> "5493385401234"
//       "3385401234" -> "5493385401234"
// Devuelve null si no logra formar un número plausible.
// ---------------------------------------------------------------------------
export function normalizarTelefonoAR(bruto: string | null | undefined): string | null {
  if (!bruto) return null;

  // Dejar solo dígitos (descarta +, espacios, guiones, paréntesis).
  let d = bruto.replace(/\D/g, "");
  if (!d) return null;

  // Quitar prefijo internacional 54 si vino, para normalizar la parte local.
  if (d.startsWith("54")) d = d.slice(2);

  // Quitar el 9 de móvil si vino pegado al 54 (54 9 ...).
  if (d.startsWith("9")) d = d.slice(1);

  // Quitar el 0 inicial de la característica (0 3385 ...).
  if (d.startsWith("0")) d = d.slice(1);

  // Quitar el 15 de móvil si aparece justo antes del número de abonado.
  // Heurística: si empieza con "15" y el resto es largo, lo sacamos.
  if (d.startsWith("15") && d.length >= 10) d = d.slice(2);

  // Un número argentino local (característica + abonado) tiene 10 dígitos.
  // Si quedó con más (por un 15 intermedio), intentamos removerlo.
  if (d.length === 12 && d.includes("15")) {
    d = d.replace("15", "");
  }

  // Validación mínima: debe quedar en 10 dígitos.
  if (d.length !== 10) return null;

  // Formato final para móvil argentino: 54 + 9 + 10 dígitos.
  return `549${d}`;
}

type EnviarPlantillaResult = {
  ok: boolean;
  error?: string;
  messageId?: string;
};

// Envía un mensaje de plantilla a un número (ya normalizado).
// `parametros` son los valores que reemplazan {{1}}, {{2}}, ... en la plantilla.
export async function enviarPlantilla(params: {
  telefono: string; // formato internacional sin "+"
  plantilla: string; // nombre de la plantilla aprobada en Meta
  idioma?: string; // ej: es_AR
  parametros: string[];
}): Promise<EnviarPlantillaResult> {
  if (!whatsappConfigurado()) {
    return { ok: false, error: "WhatsApp no está configurado" };
  }

  const token = process.env.WHATSAPP_TOKEN!.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
  const idioma = params.idioma ?? process.env.WHATSAPP_TEMPLATE_LANG ?? "es_AR";

  const body = {
    messaging_product: "whatsapp",
    to: params.telefono,
    type: "template",
    template: {
      name: params.plantilla,
      language: { code: idioma },
      components: [
        {
          type: "body",
          parameters: params.parametros.map((p) => ({
            type: "text",
            text: p,
          })),
        },
      ],
    },
  };

  try {
    const res = await fetch(
      `${GRAPH_API}/${apiVersion()}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detalle =
        (data && data.error && (data.error.message as string)) ??
        `HTTP ${res.status}`;
      console.error("WhatsApp - error al enviar plantilla:", data);
      return { ok: false, error: String(detalle) };
    }
    const messageId = data?.messages?.[0]?.id as string | undefined;
    return { ok: true, messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de red";
    console.error("WhatsApp - excepción al enviar:", msg);
    return { ok: false, error: msg };
  }
}
