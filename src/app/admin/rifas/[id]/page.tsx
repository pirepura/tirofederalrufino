import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ESTADO_NUMERO_RIFA,
  ESTADO_RIFA,
  formatearPesos,
} from "@/lib/constants";
import { formatearNumero } from "@/lib/rifas";
import { CopiarLink, FinalizarRifaBtn } from "@/components/RifaAcciones";

export const dynamic = "force-dynamic";

export default async function RifaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const rifa = await prisma.rifa.findUnique({
    where: { id: params.id },
    include: {
      premios: { orderBy: { posicion: "asc" } },
    },
  });
  if (!rifa) notFound();

  const vendidos = await prisma.numeroRifa.findMany({
    where: { rifaId: rifa.id, estado: ESTADO_NUMERO_RIFA.VENDIDO },
    orderBy: { numero: "asc" },
  });
  const recaudado = vendidos.length * rifa.precioNumero;

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const linkPublico = `${appUrl}/rifa/${rifa.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/rifas" className="text-sm text-tiro-azul hover:underline">
            ← Volver a rifas
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-tiro-azul">{rifa.titulo}</h1>
        </div>
        {rifa.estado === ESTADO_RIFA.ACTIVA && (
          <FinalizarRifaBtn rifaId={rifa.id} />
        )}
      </div>

      {/* Link público para compartir */}
      {rifa.estado === ESTADO_RIFA.ACTIVA && (
        <section className="card space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
            Link para compartir (WhatsApp)
          </h2>
          <p className="text-sm text-tiro-grisTexto">
            Compartí este link. Quien lo abra puede elegir su número, pagar y
            recibir su comprobante.
          </p>
          <CopiarLink url={linkPublico} />
        </section>
      )}

      {/* Resumen */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Precio del número</p>
          <p className="mt-1 text-2xl font-bold text-tiro-azul">
            {formatearPesos(rifa.precioNumero)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Vendidos</p>
          <p className="mt-1 text-2xl font-bold text-tiro-azul">
            {vendidos.length} / {rifa.cantidadNumeros}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Recaudado</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatearPesos(recaudado)}
          </p>
        </div>
      </div>

      {/* Premios */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">Premios</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {rifa.premios.map((p) => (
            <div key={p.id} className="card">
              <p className="text-sm font-semibold text-tiro-azul">
                {p.posicion}° premio
              </p>
              <p className="text-sm">{p.titulo}</p>
              {p.fotoData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.fotoData}
                  alt={`Premio ${p.posicion}`}
                  className="mt-2 max-h-32 rounded-lg border border-slate-200"
                />
              ) : (
                <p className="mt-2 text-xs text-tiro-grisTexto">
                  {rifa.estado === ESTADO_RIFA.FINALIZADA
                    ? "Foto eliminada (rifa finalizada)"
                    : "Sin foto"}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Números vendidos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Números vendidos ({vendidos.length})
        </h2>
        {vendidos.length === 0 ? (
          <div className="card text-center text-tiro-grisTexto">
            Todavía no se vendió ningún número.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-tiro-gris text-tiro-azul">
                <tr>
                  <th className="px-4 py-3 font-semibold">Número</th>
                  <th className="px-4 py-3 font-semibold">Comprador</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {vendidos.map((n) => (
                  <tr key={n.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-bold text-tiro-azul">
                      {formatearNumero(n.numero, rifa.cifras)}
                    </td>
                    <td className="px-4 py-3">
                      {n.compradorApellido}, {n.compradorNombre}
                    </td>
                    <td className="px-4 py-3 text-tiro-grisTexto">
                      {n.compradorTelefono}
                    </td>
                    <td className="px-4 py-3 text-tiro-grisTexto">
                      {n.fechaPago?.toLocaleDateString("es-AR") ?? "-"}
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
