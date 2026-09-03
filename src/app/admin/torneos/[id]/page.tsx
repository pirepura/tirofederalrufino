import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ESTADO_TORNEO, ESTADO_SOCIO } from "@/lib/constants";
import { resultadosPorCategoria } from "@/lib/torneos";
import CargarParticipante from "@/components/CargarParticipante";
import CerrarTorneoBtn from "@/components/CerrarTorneoBtn";

export const dynamic = "force-dynamic";

export default async function TorneoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const torneo = await prisma.torneo.findUnique({
    where: { id: params.id },
    include: { categorias: { orderBy: { nombre: "asc" } } },
  });
  if (!torneo) notFound();

  const resultados = await resultadosPorCategoria(torneo.id);
  const abierto = torneo.estado === ESTADO_TORNEO.ABIERTO;

  // Socios activos para el selector (solo si el torneo está abierto)
  const socios = abierto
    ? await prisma.socio.findMany({
        where: { estado: ESTADO_SOCIO.ACTIVO },
        orderBy: { apellido: "asc" },
        select: { id: true, nombre: true, apellido: true },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/torneos" className="text-sm text-tiro-azul hover:underline">
            ← Volver a torneos
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-tiro-azul">{torneo.nombre}</h1>
          <p className="text-sm text-tiro-grisTexto">
            {torneo.fecha.toLocaleDateString("es-AR")} · {torneo.disciplina}
          </p>
        </div>
        {abierto && <CerrarTorneoBtn torneoId={torneo.id} />}
      </div>

      {abierto && torneo.categorias.length > 0 && (
        <CargarParticipante
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
        {resultados.map((r) => (
          <div key={r.categoria.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-tiro-azulOscuro">
                {r.categoria.nombre}{" "}
                <span className="text-sm font-normal text-tiro-grisTexto">
                  (máx. {r.categoria.puntajeMaximo})
                </span>
              </h3>
              {r.posiciones[0] && (
                <span className="text-sm font-semibold text-tiro-dorado">
                  🏆 Campeón: {r.posiciones[0].apellido}, {r.posiciones[0].nombre}
                </span>
              )}
            </div>
            {r.posiciones.length === 0 ? (
              <div className="card text-sm text-tiro-grisTexto">
                Sin participantes cargados.
              </div>
            ) : (
              <div className="card overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-tiro-gris text-tiro-azul">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Pos.</th>
                      <th className="px-4 py-2 font-semibold">Tirador</th>
                      <th className="px-4 py-2 font-semibold">Puntaje</th>
                      <th className="px-4 py-2 font-semibold">Rendimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.posiciones.map((p) => (
                      <tr key={`${p.apellido}-${p.posicion}`} className="border-b last:border-0">
                        <td className="px-4 py-2 font-bold text-tiro-azul">
                          {p.posicion}°
                        </td>
                        <td className="px-4 py-2">
                          {p.apellido}, {p.nombre}
                          {!p.esSocio && (
                            <span className="ml-2 text-xs text-tiro-grisTexto">
                              (no socio)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">{p.puntaje}</td>
                        <td className="px-4 py-2">{p.rendimiento.toFixed(2)}%</td>
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
