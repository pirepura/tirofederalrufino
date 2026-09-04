"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Categoria = { id: string; nombre: string; puntajeMaximo: number };

type Inscripto = {
  id: string;
  nombre: string;
  apellido: string;
  esSocio: boolean;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  categoriaId: string;
  montoInscripcion: number;
  estadoPago: string; // pendiente | pagado
  metodoPago: string | null;
  puntaje: number | null;
};

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function GestionInscriptos({
  inscriptos,
  categorias,
  editable,
}: {
  inscriptos: Inscripto[];
  categorias: Categoria[];
  editable: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/torneos/inscripcion/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo actualizar");
      return;
    }
    router.refresh();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta inscripción?")) return;
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/torneos/inscripcion/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo eliminar");
      return;
    }
    router.refresh();
  }

  if (inscriptos.length === 0) {
    return (
      <div className="card text-sm text-tiro-grisTexto">
        Todavía no hay inscriptos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-tiro-gris text-tiro-azul">
            <tr>
              <th className="px-3 py-2 font-semibold">Tirador</th>
              <th className="px-3 py-2 font-semibold">Categoría</th>
              <th className="px-3 py-2 font-semibold">Inscripción</th>
              <th className="px-3 py-2 font-semibold">Pago</th>
              <th className="px-3 py-2 font-semibold">Puntaje</th>
              {editable && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {inscriptos.map((p) => (
              <tr key={p.id} className="border-b align-top last:border-0">
                <td className="px-3 py-2">
                  <span className="font-medium">
                    {p.apellido}, {p.nombre}
                  </span>
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                      p.esSocio
                        ? "bg-tiro-azul/10 text-tiro-azul"
                        : "bg-gray-100 text-tiro-grisTexto"
                    }`}
                  >
                    {p.esSocio ? "Socio" : "No socio"}
                  </span>
                  {!p.esSocio && (p.telefono || p.email || p.dni) && (
                    <div className="mt-0.5 text-xs text-tiro-grisTexto">
                      {[p.dni && `DNI ${p.dni}`, p.telefono, p.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editable ? (
                    <select
                      className="input py-1 text-sm"
                      value={p.categoriaId}
                      disabled={busyId === p.id}
                      onChange={(e) =>
                        patch(p.id, { accion: "categoria", categoriaId: e.target.value })
                      }
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    categorias.find((c) => c.id === p.categoriaId)?.nombre ?? "-"
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {pesos(p.montoInscripcion)}
                  {p.metodoPago && (
                    <span className="block text-xs text-tiro-grisTexto">
                      {p.metodoPago}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {p.estadoPago === "pagado" ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Pagado
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Pendiente
                      </span>
                      {editable && (
                        <button
                          className="block text-xs font-medium text-tiro-azul hover:underline"
                          disabled={busyId === p.id}
                          onClick={() => patch(p.id, { accion: "confirmarPago" })}
                        >
                          Confirmar pago
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editable ? (
                    <PuntajeInput
                      valor={p.puntaje}
                      max={
                        categorias.find((c) => c.id === p.categoriaId)?.puntajeMaximo ?? 0
                      }
                      disabled={busyId === p.id}
                      onGuardar={(v) => patch(p.id, { accion: "puntaje", puntaje: v })}
                    />
                  ) : (
                    p.puntaje ?? "-"
                  )}
                </td>
                {editable && (
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-xs text-red-600 hover:underline"
                      disabled={busyId === p.id}
                      onClick={() => eliminar(p.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PuntajeInput({
  valor,
  max,
  disabled,
  onGuardar,
}: {
  valor: number | null;
  max: number;
  disabled: boolean;
  onGuardar: (v: number) => void;
}) {
  const [v, setV] = useState(valor?.toString() ?? "");
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={max}
        className="input w-20 py-1 text-sm"
        value={v}
        disabled={disabled}
        onChange={(e) => setV(e.target.value)}
        placeholder={`/${max}`}
      />
      <button
        className="text-xs font-medium text-tiro-azul hover:underline disabled:opacity-50"
        disabled={disabled || v === "" || v === (valor?.toString() ?? "")}
        onClick={() => onGuardar(Number(v))}
      >
        Guardar
      </button>
    </div>
  );
}
