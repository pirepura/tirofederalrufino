import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, METODO_PAGO } from "@/lib/constants";
import { marcarCuotaPagada } from "@/lib/cuotas";

// POST /api/cuotas/[id]/pagar — registra un pago manual (efectivo/transferencia).
// Solo admin. Para pagos con Mercado Pago se usa el flujo de /api/pagos.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const metodo = body?.metodoPago === METODO_PAGO.TRANSFERENCIA
    ? METODO_PAGO.TRANSFERENCIA
    : METODO_PAGO.EFECTIVO;

  try {
    const cuota = await marcarCuotaPagada(params.id, metodo);
    return NextResponse.json(cuota);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al registrar el pago";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
