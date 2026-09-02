import { prisma } from "@/lib/db";

// Registra un evento de auditoría. Nunca lanza error hacia afuera:
// si el registro falla, se loguea pero no interrumpe la acción principal.
export async function registrarAuditoria(params: {
  accion: string;
  usuarioId?: string | null;
  usuarioNombre?: string | null;
  usuarioRol?: string | null;
  entidad?: string | null;
  entidadId?: string | null;
  detalle?: string | null;
}) {
  try {
    await prisma.registroAuditoria.create({
      data: {
        accion: params.accion,
        usuarioId: params.usuarioId ?? null,
        usuarioNombre: params.usuarioNombre ?? null,
        usuarioRol: params.usuarioRol ?? null,
        entidad: params.entidad ?? null,
        entidadId: params.entidadId ?? null,
        detalle: params.detalle ?? null,
      },
    });
  } catch (e) {
    console.error("No se pudo registrar auditoría:", e);
  }
}

// Consulta registros de auditoría con filtros opcionales y paginación.
export async function listarAuditoria(opts: {
  accion?: string;
  desde?: Date;
  hasta?: Date;
  page?: number;
  porPagina?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const porPagina = opts.porPagina ?? 50;

  const where: Record<string, unknown> = {};
  if (opts.accion) where.accion = opts.accion;
  if (opts.desde || opts.hasta) {
    where.createdAt = {
      ...(opts.desde ? { gte: opts.desde } : {}),
      ...(opts.hasta ? { lte: opts.hasta } : {}),
    };
  }

  const [registros, total] = await Promise.all([
    prisma.registroAuditoria.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * porPagina,
      take: porPagina,
    }),
    prisma.registroAuditoria.count({ where }),
  ]);

  return { registros, total, page, porPagina };
}

// Helper que toma los datos del usuario desde la sesión de NextAuth.
type SesionUsuario = {
  id: string;
  name?: string | null;
  email?: string | null;
  rol: string;
};

export async function auditarConSesion(
  usuario: SesionUsuario | null | undefined,
  params: {
    accion: string;
    entidad?: string | null;
    entidadId?: string | null;
    detalle?: string | null;
  }
) {
  await registrarAuditoria({
    ...params,
    usuarioId: usuario?.id ?? null,
    usuarioNombre: usuario?.name ?? usuario?.email ?? null,
    usuarioRol: usuario?.rol ?? null,
  });
}
