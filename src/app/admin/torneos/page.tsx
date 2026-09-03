import Link from "next/link";
import { listarTorneos } from "@/lib/torneos";

export const dynamic = "force-dynamic";

export default async function TorneosPage() {
  const torneos = await listarTorneos();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tiro-azul">Torneos</h1>
        <div className="flex gap-2">
          <Link href="/ranking" className="btn-secondary" target="_blank">
            Ver ranking
          </Link>
          <Link href="/admin/torneos/nuevo" className="btn-primary">
            + Nuevo torneo
          </Link>
        </div>
      </div>

      {torneos.length === 0 ? (
        <div className="card text-center text-tiro-grisTexto">
          No hay torneos creados.
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-tiro-gris text-tiro-azul">
              <tr>
                <th className="px-4 py-3 font-semibold">Torneo</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Participantes</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {torneos.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{t.nombre}</td>
                  <td className="px-4 py-3 text-tiro-grisTexto">
                    {t.fecha.toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">{t._count.participaciones}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        t.estado === "abierto"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {t.estado === "abierto" ? "ABIERTO" : "CERRADO"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/torneos/${t.id}`} className="font-medium text-tiro-azul hover:underline">
                      Gestionar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
