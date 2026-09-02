import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { informarPagoConComprobante } from "@/lib/cuotas";
import { auditarConSesion } from "@/lib/auditoria";

// POST /api/cuotas/[id]/comprobante — el socio informa un pago y sube el comprobante.
// La cuota pasa a EN_REVISION. Solo el socio dueño de la cuota puede hacerlo.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user || session.user.rol !== ROLES.SOCIO || !session.user.socioId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dataUrl: string | undefined = body?.comprobante;
  const metodo: string = body?.metodo || "transferencia";

  if (!dataUrl) {
    return NextResponse.json(
      { error: "Falta el comprobante" },
      { status: 400 }
    );
  }

  try {
    await informarPagoConComprobante({
      cuotaId: params.id,
      socioId: session.user.socioId,
      dataUrl,
      metodo,
    });
    await auditarConSesion(session.user, {
      accion: ACCION_AUDITORIA.PAGO_INFORMADO,
      entidad: "cuota",
      entidadId: params.id,
      detalle: `Pago informado por el socio (${metodo})`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al informar el pago";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// GET /api/cuotas/[id]/comprobante — devuelve el archivo del comprobante.
// Lo puede ver el admin, o el propio socio dueño de la cuota.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cuota = await prisma.cuota.findUnique({
    where: { id: params.id },
    select: {
      comprobanteData: true,
      comprobanteTipo: true,
      socioId: true,
    },
  });

  if (!cuota || !cuota.comprobanteData) {
    return NextResponse.json(
      { error: "Comprobante no encontrado" },
      { status: 404 }
    );
  }

  const esAdmin = session.user.rol === ROLES.ADMIN;
  const esDueño = session.user.socioId === cuota.socioId;
  if (!esAdmin && !esDueño) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // El comprobante está guardado como data URL: data:<tipo>;base64,<datos>
  const base64 = cuota.comprobanteData.split(",")[1] ?? "";
  const buffer = Buffer.from(base64, "base64");
  const tipo = cuota.comprobanteTipo ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": tipo,
      "Content-Disposition": "inline",
    },
  });
}
