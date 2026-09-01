import Link from "next/link";
import { prisma } from "@/lib/db";
import { ESTADO_SOLICITUD } from "@/lib/constants";

export const dynamic = "force-dynamic";

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    PENDIENTE: "bg-amber-100 text-amber-800",
    APROBADA: "bg-green-100 text-green-800",
    RECHAZADA: "bg-red-100 text-red-800",
  };
  return (
    <span className={`badge ${estilos[estado] ?? "bg-slate-100 text-slate-700"}`}>
      {estado}
    </span>
  );
}

export default async function SolicitudesPage() {
  const solicitudes = await prisma.solicitudInscripcion.findMany({
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
  });

  const pendientes = solicitudes.filter(
    (s) => s.estado === ESTADO_SOLICITUD.PENDIENTE
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-tiro-azul">
          Solicitudes de inscripción
        </h1>
        <p className="text-sm text-tiro-grisTexto">
          {pendientes.length} pendiente(s) de revisión.
        </p>
      </div>

      {solicitudes.length === 0 ? (
        <div className="card text-center text-tiro-grisTexto">
          No hay solicitudes de inscripción.
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-tiro-gris text-tiro-azul">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">DNI</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-tiro-grisTexto">
                    {s.createdAt.toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3 font-medium">{s.nombreCompleto}</td>
                  <td className="px-4 py-3">{s.dni}</td>
                  <td className="px-4 py-3 text-tiro-grisTexto">{s.email}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={s.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/solicitudes/${s.id}`}
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
