import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { actualizarCuotasVencidas } from "@/lib/cuotas";
import { categoriasActivas } from "@/lib/categorias";
import {
  ESTADO_CUOTA,
  formatearPesos,
  nombreMes,
} from "@/lib/constants";
import SocioForm from "@/components/SocioForm";
import { CuotaBadge } from "@/components/EstadoBadge";
import {
  RegistrarPagoBtn,
  EliminarSocioBtn,
  EliminarCuotaBtn,
} from "@/components/AccionesCuota";

export const dynamic = "force-dynamic";

export default async function SocioDetallePage({
  params,
}: {
  params: { id: string };
}) {
  await actualizarCuotasVencidas();

  const socio = await prisma.socio.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { email: true } },
      categoriaRef: true,
      cuotas: { orderBy: [{ periodoAnio: "desc" }, { periodoMes: "desc" }] },
    },
  });

  if (!socio) notFound();

  const categorias = await categoriasActivas();

  const saldo = socio.cuotas
    .filter(
      (c) =>
        c.estado === ESTADO_CUOTA.PENDIENTE || c.estado === ESTADO_CUOTA.VENCIDA
    )
    .reduce((t, c) => t + c.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href="/admin/socios"
            className="text-sm text-tiro-azul hover:underline"
          >
            ← Volver a socios
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-tiro-azul">
            Socio N° {socio.numeroSocio} — {socio.apellido}, {socio.nombre}
          </h1>
        </div>
        <EliminarSocioBtn socioId={socio.id} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Saldo adeudado</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              saldo > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatearPesos(saldo)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Cuota mensual</p>
          <p className="mt-1 text-2xl font-bold text-tiro-azul">
            {formatearPesos(socio.categoriaRef?.cuotaMensual ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Categoría</p>
          <p className="mt-1 text-2xl font-bold text-tiro-azul">
            {socio.categoriaRef?.nombre ?? "Sin categoría"}
          </p>
        </div>
      </div>

      <div className="card flex items-center gap-2">
        <span className="text-sm text-tiro-grisTexto">Débito automático:</span>
        {socio.suscripcionEstado === "activa" ? (
          <span className="badge bg-green-100 text-green-800">ACTIVO</span>
        ) : (
          <span className="badge bg-slate-200 text-slate-600">No activo</span>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">Datos del socio</h2>
        <SocioForm
          modo="editar"
          categorias={categorias}
          inicial={{
            id: socio.id,
            nombre: socio.nombre,
            apellido: socio.apellido,
            dni: socio.dni,
            email: socio.user.email,
            telefono: socio.telefono ?? "",
            direccion: socio.direccion ?? "",
            categoriaId: socio.categoriaId ?? "",
            estado: socio.estado,
            observaciones: socio.observaciones ?? "",
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Historial de cuotas
        </h2>
        {socio.cuotas.length === 0 ? (
          <div className="card text-center text-tiro-grisTexto">
            Este socio no tiene cuotas generadas.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-tiro-gris text-tiro-azul">
                <tr>
                  <th className="px-4 py-3 font-semibold">Período</th>
                  <th className="px-4 py-3 font-semibold">Monto</th>
                  <th className="px-4 py-3 font-semibold">Vencimiento</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Pago</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {socio.cuotas.map((c) => {
                  const impaga =
                    c.estado === ESTADO_CUOTA.PENDIENTE ||
                    c.estado === ESTADO_CUOTA.VENCIDA;
                  return (
                    <tr
                      key={c.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
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
                      <td className="px-4 py-3 text-tiro-grisTexto">
                        {c.fechaPago
                          ? `${c.fechaPago.toLocaleDateString("es-AR")} (${c.metodoPago ?? "-"})`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {impaga && <RegistrarPagoBtn cuotaId={c.id} />}
                          <EliminarCuotaBtn cuotaId={c.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
