import Link from "next/link";
import { prisma } from "@/lib/db";
import { actualizarCuotasVencidas } from "@/lib/cuotas";
import {
  ESTADO_SOCIO,
  ESTADO_CUOTA,
  ESTADO_SOLICITUD,
  formatearPesos,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await actualizarCuotasVencidas();

  const [
    totalSocios,
    sociosActivos,
    cuotasPendientes,
    cuotasVencidas,
    recaudadoAgg,
  ] = await Promise.all([
    prisma.socio.count(),
    prisma.socio.count({ where: { estado: ESTADO_SOCIO.ACTIVO } }),
    prisma.cuota.count({ where: { estado: ESTADO_CUOTA.PENDIENTE } }),
    prisma.cuota.count({ where: { estado: ESTADO_CUOTA.VENCIDA } }),
    prisma.cuota.aggregate({
      where: { estado: ESTADO_CUOTA.PAGADA },
      _sum: { monto: true },
    }),
  ]);

  const impagasAgg = await prisma.cuota.aggregate({
    where: {
      estado: { in: [ESTADO_CUOTA.PENDIENTE, ESTADO_CUOTA.VENCIDA] },
    },
    _sum: { monto: true },
  });

  const solicitudesPendientes = await prisma.solicitudInscripcion.count({
    where: { estado: ESTADO_SOLICITUD.PENDIENTE },
  });

  const pagosAVerificar = await prisma.cuota.count({
    where: { estado: ESTADO_CUOTA.EN_REVISION },
  });

  const tarjetas = [
    { label: "Socios totales", valor: totalSocios, color: "text-tiro-azul" },
    { label: "Socios activos", valor: sociosActivos, color: "text-green-600" },
    {
      label: "Cuotas pendientes",
      valor: cuotasPendientes,
      color: "text-amber-600",
    },
    { label: "Cuotas vencidas", valor: cuotasVencidas, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tiro-azul">
          Panel de administración
        </h1>
        <p className="text-sm text-tiro-grisTexto">
          Resumen general del club.
        </p>
      </div>

      {solicitudesPendientes > 0 && (
        <Link
          href="/admin/solicitudes"
          className="block rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100"
        >
          <p className="text-sm font-semibold text-amber-800">
            📋 Tenés {solicitudesPendientes} solicitud(es) de inscripción
            pendiente(s) de revisión.
          </p>
          <p className="text-xs text-amber-700">Hacé clic para revisarlas.</p>
        </Link>
      )}

      {pagosAVerificar > 0 && (
        <Link
          href="/admin/cuotas"
          className="block rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100"
        >
          <p className="text-sm font-semibold text-blue-800">
            💳 Tenés {pagosAVerificar} pago(s) informado(s) por socios para
            verificar.
          </p>
          <p className="text-xs text-blue-700">
            Hacé clic para revisar los comprobantes.
          </p>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="card">
            <p className="text-sm text-tiro-grisTexto">{t.label}</p>
            <p className={`mt-1 text-3xl font-bold ${t.color}`}>{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Total recaudado</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatearPesos(recaudadoAgg._sum.monto ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Por cobrar (impago)</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {formatearPesos(impagasAgg._sum.monto ?? 0)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/socios/nuevo" className="btn-primary">
          + Nuevo socio
        </Link>
        <Link href="/admin/socios" className="btn-secondary">
          Ver socios
        </Link>
        <Link href="/admin/cuotas" className="btn-secondary">
          Gestionar cuotas
        </Link>
      </div>
    </div>
  );
}
