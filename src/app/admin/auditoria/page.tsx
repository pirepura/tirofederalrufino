import Link from "next/link";
import { listarAuditoria } from "@/lib/auditoria";
import { ACCION_AUDITORIA, ACCION_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ROL_ESTILO: Record<string, string> = {
  ADMIN: "bg-tiro-azul/10 text-tiro-azul",
  SOCIO: "bg-amber-100 text-amber-800",
  SISTEMA: "bg-slate-200 text-slate-600",
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: { accion?: string; desde?: string; hasta?: string; page?: string };
}) {
  const accion = searchParams.accion || undefined;
  const desde = searchParams.desde ? new Date(searchParams.desde) : undefined;
  // "hasta" incluye todo el día seleccionado
  const hasta = searchParams.hasta
    ? new Date(new Date(searchParams.hasta).setHours(23, 59, 59, 999))
    : undefined;
  const page = Number(searchParams.page ?? "1") || 1;

  const { registros, total, porPagina } = await listarAuditoria({
    accion,
    desde,
    hasta,
    page,
  });

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  // Para armar links de paginación conservando filtros
  function linkPagina(p: number) {
    const sp = new URLSearchParams();
    if (accion) sp.set("accion", accion);
    if (searchParams.desde) sp.set("desde", searchParams.desde);
    if (searchParams.hasta) sp.set("hasta", searchParams.hasta);
    sp.set("page", String(p));
    return `/admin/auditoria?${sp.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-tiro-azul">Auditoría</h1>
        <p className="text-sm text-tiro-grisTexto">
          Registro de actividad del sistema: quién hizo qué y cuándo.
        </p>
      </div>

      {/* Filtros */}
      <form className="card grid gap-3 sm:grid-cols-4" method="get">
        <div>
          <label className="label">Acción</label>
          <select name="accion" defaultValue={accion ?? ""} className="input">
            <option value="">Todas</option>
            {Object.values(ACCION_AUDITORIA).map((a) => (
              <option key={a} value={a}>
                {ACCION_LABEL[a] ?? a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Desde</label>
          <input
            type="date"
            name="desde"
            defaultValue={searchParams.desde ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input
            type="date"
            name="hasta"
            defaultValue={searchParams.hasta ?? ""}
            className="input"
          />
        </div>
        <div className="flex items-end gap-2">
          <button className="btn-primary" type="submit">
            Filtrar
          </button>
          <Link href="/admin/auditoria" className="btn-secondary">
            Limpiar
          </Link>
        </div>
      </form>

      <p className="text-sm text-tiro-grisTexto">
        {total} registro(s) encontrado(s).
      </p>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-tiro-gris text-tiro-azul">
            <tr>
              <th className="px-4 py-3 font-semibold">Fecha y hora</th>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Acción</th>
              <th className="px-4 py-3 font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-tiro-grisTexto">
                  No hay registros para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-tiro-grisTexto">
                    {r.createdAt.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{r.usuarioNombre ?? "-"}</span>
                      {r.usuarioRol && (
                        <span
                          className={`badge mt-1 w-fit ${
                            ROL_ESTILO[r.usuarioRol] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.usuarioRol}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-tiro-azul">
                    {ACCION_LABEL[r.accion] ?? r.accion}
                  </td>
                  <td className="px-4 py-3 text-tiro-grisTexto">
                    {r.detalle ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={linkPagina(page - 1)} className="btn-secondary text-sm">
              ← Anterior
            </Link>
          )}
          <span className="text-sm text-tiro-grisTexto">
            Página {page} de {totalPaginas}
          </span>
          {page < totalPaginas && (
            <Link href={linkPagina(page + 1)} className="btn-secondary text-sm">
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
