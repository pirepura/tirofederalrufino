import Link from "next/link";
import { requireSocio } from "@/lib/session";
import { prisma } from "@/lib/db";
import { actualizarCuotasVencidas } from "@/lib/cuotas";
import {
  ESTADO_CUOTA,
  formatearPesos,
  nombreMes,
} from "@/lib/constants";
import { CuotaBadge } from "@/components/EstadoBadge";
import PagarCuotaBtn from "@/components/PagarCuotaBtn";

export const dynamic = "force-dynamic";

export default async function MisPagosPage() {
  const session = await requireSocio();
  await actualizarCuotasVencidas();

  const cuotas = await prisma.cuota.findMany({
    where: { socioId: session.user.socioId! },
    orderBy: [{ periodoAnio: "desc" }, { periodoMes: "desc" }],
  });

  const pagadas = cuotas.filter((c) => c.estado === ESTADO_CUOTA.PAGADA);
  const totalPagado = pagadas.reduce((t, c) => t + c.monto, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/socio" className="text-sm text-tiro-azul hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tiro-azul">Mis pagos</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Cuotas pagadas</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {pagadas.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Total abonado</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatearPesos(totalPagado)}
          </p>
        </div>
      </div>

      {cuotas.length === 0 ? (
        <div className="card text-center text-tiro-grisTexto">
          Todavía no tenés cuotas registradas.
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((c) => {
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
                        ? c.fechaPago.toLocaleDateString("es-AR")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {impaga && (
                        <PagarCuotaBtn
                          cuotaId={c.id}
                          className="btn-mp text-xs"
                          label="Pagar"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
