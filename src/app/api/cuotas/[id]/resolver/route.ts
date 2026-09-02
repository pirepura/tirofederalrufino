import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { resolverPagoInformado } from "@/lib/cuotas";

// POST /api/cuotas/[id]/resolver — el admin resuelve un pago informado.
// Body: { aprobar: boolean }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const aprobar = body?.aprobar === true;

  try {
    await resolverPagoInformado({ cuotaId: params.id, aprobar });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al resolver el pago";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
