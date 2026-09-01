import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";

// Configuración del SDK de Mercado Pago (v2).
// El access token se toma de la variable de entorno MP_ACCESS_TOKEN.

function getConfig() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "Falta MP_ACCESS_TOKEN. Configurá las credenciales de Mercado Pago en .env"
    );
  }
  return new MercadoPagoConfig({ accessToken });
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
  const config = getConfig();
  const preference = new Preference(config);

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const urlLocal = esUrlLocal(appUrl);

  // Cuerpo base de la preferencia
  const body: PreferenceRequest = {
    items: [
      {
        id: input.externalReference,
        title: input.titulo,
        quantity: input.cantidad ?? 1,
        unit_price: input.monto,
        currency_id: "ARS",
      },
    ],
    payer: input.emailComprador ? { email: input.emailComprador } : undefined,
    external_reference: input.externalReference,
    back_urls: {
      success: `${appUrl}/socio/pago/resultado?estado=exito`,
      failure: `${appUrl}/socio/pago/resultado?estado=error`,
      pending: `${appUrl}/socio/pago/resultado?estado=pendiente`,
    },
  };

  // Solo agregamos notification_url y auto_return si la URL es pública.
  // En local, Mercado Pago rechaza estos campos por no ser accesibles.
  if (!urlLocal) {
    body.auto_return = "approved";
    body.notification_url = `${appUrl}/api/pagos/webhook`;
  }

  try {
    const result = await preference.create({ body });
    return {
      id: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    };
  } catch (e) {
    // Logueamos el detalle real que devuelve Mercado Pago para diagnóstico
    console.error("Mercado Pago - error al crear preferencia:", e);
    throw e;
  }
}

// Consulta el detalle de un pago por su id (usado en el webhook).
export async function obtenerPago(paymentId: string) {
  const config = getConfig();
  const payment = new Payment(config);
  return payment.get({ id: paymentId });
}
