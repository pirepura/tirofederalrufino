"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatearPesos } from "@/lib/constants";

type Categoria = { id: string; nombre: string; cuotaMensual: number };

export default function AccionesSolicitud({
  solicitudId,
  categorias,
}: {
  solicitudId: string;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");

  async function aprobar() {
    setError("");
    if (!categoriaId) {
      setError("Seleccioná una categoría para el socio.");
      return;
    }
    if (
      !confirm(
        "¿Aprobar esta solicitud? Se creará el socio activo con su cuenta de acceso."
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/solicitudes/${solicitudId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "aprobar", categoriaId }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Ocurrió un error");
      return;
    }
    router.refresh();
  }

  async function rechazar() {
    setError("");
    const motivo = prompt("Motivo del rechazo (opcional):");
    if (motivo === null) return;
    setLoading(true);
    const res = await fetch(`/api/solicitudes/${solicitudId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "rechazar", motivo: motivo || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Ocurrió un error");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {categorias.length === 0 ? (
        <p className="text-sm text-tiro-grisTexto">
          Para aprobar necesitás tener al menos una categoría creada.
        </p>
      ) : (
        <div className="max-w-xs">
          <label className="label">Categoría a asignar</label>
          <select
            className="input"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {formatearPesos(c.cuotaMensual)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="btn-primary"
          onClick={aprobar}
          disabled={loading || categorias.length === 0}
        >
          Aprobar y crear socio
        </button>
        <button className="btn-secondary" onClick={rechazar} disabled={loading}>
          Rechazar
        </button>
      </div>
    </div>
  );
}
