import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatearPesos } from "@/lib/constants";
import { SocioBadge } from "@/components/EstadoBadge";

export const dynamic = "force-dynamic";

export default async function SociosPage() {
  const socios = await prisma.socio.findMany({
    orderBy: { numeroSocio: "asc" },
    include: {
      user: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tiro-azul">Socios</h1>
        <Link href="/admin/socios/nuevo" className="btn-primary">
          + Nuevo socio
        </Link>
      </div>

      {socios.length === 0 ? (
        <div className="card text-center text-tiro-grisTexto">
          Todavía no hay socios cargados.
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-tiro-gris text-tiro-azul">
              <tr>
                <th className="px-4 py-3 font-semibold">N°</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">DNI</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Cuota</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {socios.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{s.numeroSocio}</td>
                  <td className="px-4 py-3">
                    {s.apellido}, {s.nombre}
                  </td>
                  <td className="px-4 py-3">{s.dni}</td>
                  <td className="px-4 py-3 text-tiro-grisTexto">
                    {s.user.email}
                  </td>
                  <td className="px-4 py-3">{s.categoria}</td>
                  <td className="px-4 py-3">{formatearPesos(s.cuotaMensual)}</td>
                  <td className="px-4 py-3">
                    <SocioBadge estado={s.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/socios/${s.id}`}
                      className="font-medium text-tiro-azul hover:underline"
                    >
                      Ver / editar
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
