import { rankingHistorico } from "@/lib/torneos";
import { RANKING_CONFIG } from "@/lib/constants";
import { CLUB } from "@/config/club";
import Escudo from "@/components/Escudo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Ranking de tiro — ${CLUB.nombre}`,
};

export default async function RankingPublicoPage() {
  const { ranking, enFormacion } = await rankingHistorico();

  return (
    <main className="min-h-screen bg-tiro-gris py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow">
            <Escudo size={56} />
          </span>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-tiro-azul">
            {CLUB.nombre}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-tiro-azul">
            Ranking de tiro
          </h1>
          <p className="mt-1 text-sm text-tiro-grisTexto">
            Índice: promedio de rendimiento de los mejores{" "}
            {RANKING_CONFIG.MEJORES_N} torneos de cada tirador.
          </p>
        </div>

        {ranking.length === 0 ? (
          <div className="card text-center text-tiro-grisTexto">
            Todavía no hay tiradores con suficientes torneos para el ranking.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-tiro-gris text-tiro-azul">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pos.</th>
                  <th className="px-4 py-3 font-semibold">Tirador</th>
                  <th className="px-4 py-3 font-semibold">Índice</th>
                  <th className="px-4 py-3 font-semibold">Torneos</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.socioId} className="border-b last:border-0">
                    <td className="px-4 py-3 font-bold text-tiro-azul">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}°`}
                    </td>
                    <td className="px-4 py-3">
                      {r.apellido}, {r.nombre}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {r.indice.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-tiro-grisTexto">
                      {r.torneosJugados}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {enFormacion.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-tiro-grisTexto">
              En formación (menos de {RANKING_CONFIG.MINIMO_TORNEOS} torneos)
            </h2>
            <div className="card p-3 text-sm text-tiro-grisTexto">
              {enFormacion
                .map((r) => `${r.apellido}, ${r.nombre}`)
                .join(" · ")}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
