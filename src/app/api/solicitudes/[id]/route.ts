import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { aprobarSolicitud, rechazarSolicitud } from "@/lib/solicitudes";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/solicitudes/[id] — aprueba o rechaza una solicitud (solo admin).
// Body: { accion: "aprobar" | "rechazar", motivo?: string }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const accion = body?.accion;

  try {
    if (accion === "aprobar") {
      const user = await aprobarSolicitud(params.id, body?.categoriaId);
      await auditarConSesion(session.user, {
        accion: ACCION_AUDITORIA.SOLICITUD_APROBADA,
        entidad: "solicitud",
        entidadId: params.id,
        detalle: `Solicitud aprobada. Socio creado: ${user.nombre}`,
      });
      return NextResponse.json({ ok: true, socioId: user.socio?.id });
    }
    if (accion === "rechazar") {
      await rechazarSolicitud(params.id, body?.motivo);
      await auditarConSesion(session.user, {
        accion: ACCION_AUDITORIA.SOLICITUD_RECHAZADA,
        entidad: "solicitud",
        entidadId: params.id,
        detalle: body?.motivo ? `Solicitud rechazada. Motivo: ${body.motivo}` : "Solicitud rechazada",
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al procesar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
