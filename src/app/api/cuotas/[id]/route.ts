import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { eliminarCuota } from "@/lib/cuotas";

// DELETE /api/cuotas/[id] — elimina una cuota (solo admin).
// Útil para corregir cuotas mal generadas (por ejemplo con monto $0).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    await eliminarCuota(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar la cuota";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
