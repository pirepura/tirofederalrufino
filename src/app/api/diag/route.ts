import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";

// DIAGNÓSTICO TEMPORAL — verificar cómo llegan las variables de entorno.
// Solo accesible por admin. No expone los valores completos.
// ELIMINAR este archivo una vez resuelto el problema de Mercado Pago.
export async function GET() {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const token = process.env.MP_ACCESS_TOKEN ?? "";
  const appUrl = process.env.APP_URL ?? "";

  return NextResponse.json({
    mpToken: {
      largo: token.length, // el correcto es 71
      inicio: token.slice(0, 6),
      fin: token.slice(-5),
      tieneEspacios: /\s/.test(token),
      tieneComillas: token.includes('"') || token.includes("'"),
    },
    appUrl: {
      valor: appUrl,
      largo: appUrl.length,
      tieneEspacios: /\s/.test(appUrl),
    },
  });
}
