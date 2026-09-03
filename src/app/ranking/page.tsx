import { rankingHistorico } from "@/lib/torneos";
import { CLUB } from "@/config/club";
import Escudo from "@/components/Escudo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Ranking de tiradores — ${CLUB.nombre}`,
};

export default async function RankingPublicoPage() {
  const { ranking, mejoresN, minTorneos } = await rankingHistorico();
  const rankeables = ranking.filter((r) => r.rankeable);
  const enFormacion = ranking.filter((r) => !r.rankeable);

  return (
    <main className="min-h-screen bg-tiro-gris py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow">
            <Escudo size={56} />
          </span>
          <h1 className="mt-3 text-2xl font-bold text-tiro-azul">
            Ranking de tiradores
          </h1>
          <p className="text-sm text-tiro-grisTexto">
            {CLUB.nombre} · Índice = promedio de rendimiento de los mejores{" "}
            {mejoresN} torneos
          </p>
        </div>

        {rankeables.length === 0 ? (
          <div className="card text-center text-tiro-grisTexto">
            Todavía no hay tiradores con el mínimo de {minTorneos} torneos para
            el ranking.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-tiro-gris text-tiro-azul">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pos.</th>
                  <th className="px-4 py-3 font-semibold">Tirador</th>
                  <th className="px-4 py-3 font-semibold">Torneos</th>
                  <th className="px-4 py-3 font-semibold">Índice</th>
                </tr>
              </thead>
              <tbody>
                {rankeables.map((r, i) => (
                  <tr key={r.socio.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-bold text-tiro-azul">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}°`}
                    </td>
                    <td className="px-4 py-3">
                      {r.socio.apellido}, {r.socio.nombre}
                    </td>
                    <td className="px-4 py-3 text-tiro-grisTexto">
                      {r.torneosJugados}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {r.indice.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {enFormacion.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-tiro-grisTexto">
              En formación (menos de {minTorneos} torneos)
            </p>
            <div className="card p-4 text-sm text-tiro-grisTexto">
              {enFormacion
                .map((r) => `${r.socio.apellido}, ${r.socio.nombre}`)
                .join(" · ")}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-tiro-grisTexto">
          Solo se rankean socios con al menos {minTorneos} torneos jugados.
        </p>
      </div>
    </main>
  );
}
