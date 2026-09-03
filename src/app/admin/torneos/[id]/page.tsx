import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { detalleTorneo } from "@/lib/torneos";
import { ESTADO_TORNEO, ESTADO_SOCIO } from "@/lib/constants";
import GestionTorneo from "@/components/GestionTorneo";
import { CerrarTorneoBtn } from "@/components/RankingWidgets";

export const dynamic = "force-dynamic";

export default async function TorneoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const data = await detalleTorneo(params.id);
  if (!data) notFound();
  const { torneo, porCategoria } = data;

  const abierto = torneo.estado === ESTADO_TORNEO.ABIERTO;

  // Socios activos para el selector de participantes
  const socios = await prisma.socio.findMany({
    where: { estado: ESTADO_SOCIO.ACTIVO },
    orderBy: { numeroSocio: "asc" },
    select: { id: true, nombre: true, apellido: true, numeroSocio: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/torneos" className="text-sm text-tiro-azul hover:underline">
            ← Volver a torneos
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-tiro-azul">{torneo.nombre}</h1>
          <p className="text-sm text-tiro-grisTexto">
            {torneo.fecha.toLocaleDateString("es-AR")} · {torneo.disciplina} ·{" "}
            <span className={abierto ? "text-green-600" : "text-slate-500"}>
              {abierto ? "Abierto" : "Cerrado"}
            </span>
          </p>
        </div>
        {abierto && <CerrarTorneoBtn torneoId={torneo.id} />}
      </div>

      {abierto && (
        <GestionTorneo
          torneoId={torneo.id}
          categorias={torneo.categorias}
          socios={socios}
        />
      )}

      {/* Resultados por categoría */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Resultados y posiciones
        </h2>
        {porCategoria.length === 0 ? (
          <div className="card text-center text-tiro-grisTexto">
            Todavía no hay categorías. Agregá una arriba.
          </div>
        ) : (
          porCategoria.map(({ categoria, participantes, campeon }) => (
            <div key={categoria.id} className="card">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-tiro-azul">
                  {categoria.nombre}{" "}
                  <span className="text-sm font-normal text-tiro-grisTexto">
                    (máx {categoria.puntajeMaximo})
                  </span>
                </h3>
                {campeon && (
                  <span className="badge bg-tiro-dorado/20 text-tiro-dorado">
                    🏆 {campeon.apellido}, {campeon.nombre}
                  </span>
                )}
              </div>
              {participantes.length === 0 ? (
                <p className="text-sm text-tiro-grisTexto">Sin participantes aún.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-tiro-grisTexto">
                    <tr>
                      <th className="py-2 font-semibold">Pos.</th>
                      <th className="py-2 font-semibold">Participante</th>
                      <th className="py-2 font-semibold">Puntaje</th>
                      <th className="py-2 font-semibold">Rendimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantes.map((p, i) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{i + 1}°</td>
                        <td className="py-2">
                          {p.apellido}, {p.nombre}
                          {!p.socioId && (
                            <span className="ml-1 text-xs text-tiro-grisTexto">
                              (no socio)
                            </span>
                          )}
                        </td>
                        <td className="py-2 font-medium">{p.puntaje}</td>
                        <td className="py-2 text-tiro-grisTexto">
                          {p.rendimiento.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
