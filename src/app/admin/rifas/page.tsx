import Link from "next/link";
import { listarRifas } from "@/lib/rifas";
import { formatearPesos } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function RifasPage() {
  const rifas = await listarRifas();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tiro-azul">Rifas / Sorteos</h1>
        <Link href="/admin/rifas/nueva" className="btn-primary">
          + Nueva rifa
        </Link>
      </div>

      {rifas.length === 0 ? (
        <div className="card text-center text-tiro-grisTexto">
          No hay rifas creadas. Creá la primera.
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-tiro-gris text-tiro-azul">
              <tr>
                <th className="px-4 py-3 font-semibold">Rifa</th>
                <th className="px-4 py-3 font-semibold">Números</th>
                <th className="px-4 py-3 font-semibold">Vendidos</th>
                <th className="px-4 py-3 font-semibold">Recaudado</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rifas.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{r.titulo}</td>
                  <td className="px-4 py-3">{r.cantidadNumeros}</td>
                  <td className="px-4 py-3">{r.vendidos}</td>
                  <td className="px-4 py-3">{formatearPesos(r.recaudado)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        r.estado === "activa"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {r.estado === "activa" ? "ACTIVA" : "FINALIZADA"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/rifas/${r.id}`}
                      className="font-medium text-tiro-azul hover:underline"
                    >
                      Ver
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
