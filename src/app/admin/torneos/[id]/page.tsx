import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerTorneo, resultadosPorCategoria } from "@/lib/torneos";
import { ESTADO_TORNEO, ESTADO_SOCIO, formatearPesos } from "@/lib/constants";
import {
  InscribirParticipante,
  AccionesParticipante,
  CerrarTorneoBtn,
} from "@/components/GestionTorneo";

export const dynamic = "force-dynamic";

export default async function TorneoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const torneo = await obtenerTorneo(params.id);
  if (!torneo) notFound();

  const resultados = await resultadosPorCategoria(params.id);
  const abierto = torneo.estado === ESTADO_TORNEO.ABIERTO;

  const socios = await prisma.socio.findMany({
    where: { estado: ESTADO_SOCIO.ACTIVO },
    select: { id: true, nombre: true, apellido: true },
    orderBy: { apellido: "asc" },
  });

  const totalPagado = torneo.participaciones
    .filter((p) => p.estadoPago === "pagado")
    .reduce((s, p) => s + p.montoInscripcion, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/torneos" className="text-sm text-tiro-azul hover:underline">
            ← Volver a torneos
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-tiro-azul">{torneo.nombre}</h1>
          <p className="text-sm text-tiro-grisTexto">
            {torneo.fecha.toLocaleDateString("es-AR")} · {torneo.disciplina} ·
            Socio {formatearPesos(torneo.precioSocio)} / No socio{" "}
            {formatearPesos(torneo.precioNoSocio)}
          </p>
        </div>
        {abierto && <CerrarTorneoBtn torneoId={torneo.id} />}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Participantes</p>
          <p className="mt-1 text-2xl font-bold text-tiro-azul">
            {torneo.participaciones.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Recaudado (inscripciones)</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatearPesos(totalPagado)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-tiro-grisTexto">Categorías</p>
          <p className="mt-1 text-2xl font-bold text-tiro-azul">
            {torneo.categorias.length}
          </p>
        </div>
      </div>

      {abierto && (
        <InscribirParticipante
          torneoId={torneo.id}
          categorias={torneo.categorias}
          socios={socios}
        />
      )}

      {/* Resultados por categoría */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Resultados por categoría
        </h2>
        {resultados.map(({ categoria, participaciones, campeon }) => (
          <div key={categoria.id} className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-tiro-azul">
                {categoria.nombre}{" "}
                <span className="text-sm font-normal text-tiro-grisTexto">
                  (máx {categoria.puntajeMaximo})
                </span>
              </h3>
              {campeon && (
                <span className="text-sm font-semibold text-tiro-dorado">
                  🏆 {campeon.apellido}, {campeon.nombre}
                </span>
              )}
            </div>
            {participaciones.length === 0 ? (
              <p className="text-sm text-tiro-grisTexto">Sin inscriptos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-tiro-azul">
                    <tr>
                      <th className="py-2 pr-3 font-semibold">Participante</th>
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Pago</th>
                      <th className="py-2 pr-3 font-semibold">Puntaje / Rend.</th>
                      <th className="py-2 pr-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participaciones.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          {p.apellido}, {p.nombre}
                        </td>
                        <td className="py-2 pr-3 text-tiro-grisTexto">
                          {p.esSocio ? "Socio" : "No socio"}
                        </td>
                        <td className="py-2 pr-3">
                          {p.estadoPago === "pagado" ? (
                            <span className="badge bg-green-100 text-green-800">Pagado</span>
                          ) : (
                            <span className="badge bg-amber-100 text-amber-800">Pendiente</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {p.puntaje != null ? (
                            <span>
                              {p.puntaje}{" "}
                              <span className="text-tiro-grisTexto">
                                ({p.rendimiento?.toFixed(1)}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-tiro-grisTexto">-</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <AccionesParticipante
                            participacionId={p.id}
                            estadoPago={p.estadoPago}
                            metodoPago={p.metodoPago}
                            puntaje={p.puntaje}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
