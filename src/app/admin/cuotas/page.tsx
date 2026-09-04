import Link from "next/link";
import { prisma } from "@/lib/db";
import { actualizarCuotasVencidas, cuotasEnRevision } from "@/lib/cuotas";
import {
  ESTADO_CUOTA,
  formatearPesos,
  nombreMes,
} from "@/lib/constants";
import { ESTADO_SOCIO } from "@/lib/constants";
import { CuotaBadge } from "@/components/EstadoBadge";
import GenerarCuotasForm from "@/components/GenerarCuotasForm";
import DeudaAnteriorForm from "@/components/DeudaAnteriorForm";
import RevisarPagoBtn from "@/components/RevisarPagoBtn";

export const dynamic = "force-dynamic";

export default async function CuotasPage() {
  await actualizarCuotasVencidas();

  // Pagos informados por socios, pendientes de verificación
  const enRevision = await cuotasEnRevision();

  // Socios activos para el selector de deuda anterior
  const sociosActivos = await prisma.socio.findMany({
    where: { estado: ESTADO_SOCIO.ACTIVO },
    orderBy: { apellido: "asc" },
    select: { id: true, numeroSocio: true, nombre: true, apellido: true },
  });

  // Últimas cuotas impagas de todo el club (vista de morosos)
  const impagas = await prisma.cuota.findMany({
    where: {
      estado: { in: [ESTADO_CUOTA.PENDIENTE, ESTADO_CUOTA.VENCIDA] },
    },
    orderBy: { fechaVencimiento: "asc" },
    include: {
      socio: { select: { id: true, numeroSocio: true, nombre: true, apellido: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-tiro-azul">Gestión de cuotas</h1>

      {/* Pagos informados a verificar */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Pagos a verificar ({enRevision.length})
        </h2>
        {enRevision.length === 0 ? (
          <div className="card text-center text-tiro-grisTexto">
            No hay pagos informados pendientes de verificación.
          </div>
        ) : (
          <div className="space-y-3">
            {enRevision.map((c) => (
              <div
                key={c.id}
                className="card flex flex-wrap items-center justify-between gap-4 border-blue-200 bg-blue-50/40"
              >
                <div>
                  <p className="font-semibold text-tiro-azul">
                    N° {c.socio.numeroSocio} — {c.socio.apellido}, {c.socio.nombre}
                  </p>
                  <p className="text-sm text-tiro-grisTexto">
                    {nombreMes(c.periodoMes)} {c.periodoAnio} ·{" "}
                    {formatearPesos(c.monto)} · Informado como{" "}
                    {c.metodoPagoInformado ?? "-"}
                  </p>
                  <p className="text-xs text-tiro-grisTexto">
                    {c.comprobanteInformadoEn
                      ? `Informado el ${c.comprobanteInformadoEn.toLocaleDateString("es-AR")}`
                      : ""}
                  </p>
                </div>
                <RevisarPagoBtn cuotaId={c.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Generar cuotas del mes
        </h2>
        <GenerarCuotasForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Cargar deuda anterior (migración)
        </h2>
        <DeudaAnteriorForm socios={sociosActivos} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Cuotas impagas ({impagas.length})
        </h2>
        {impagas.length === 0 ? (
          <div className="card text-center text-tiro-grisTexto">
            No hay cuotas impagas. Todo al día.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-tiro-gris text-tiro-azul">
                <tr>
                  <th className="px-4 py-3 font-semibold">Socio</th>
                  <th className="px-4 py-3 font-semibold">Período</th>
                  <th className="px-4 py-3 font-semibold">Monto</th>
                  <th className="px-4 py-3 font-semibold">Vencimiento</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {impagas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      N° {c.socio.numeroSocio} — {c.socio.apellido}, {c.socio.nombre}
                    </td>
                    <td className="px-4 py-3">
                      {nombreMes(c.periodoMes)} {c.periodoAnio}
                    </td>
                    <td className="px-4 py-3">{formatearPesos(c.monto)}</td>
                    <td className="px-4 py-3 text-tiro-grisTexto">
                      {c.fechaVencimiento.toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <CuotaBadge estado={c.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/socios/${c.socio.id}`}
                        className="font-medium text-tiro-azul hover:underline"
                      >
                        Ver socio
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
