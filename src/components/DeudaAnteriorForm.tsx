"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SocioOpcion = {
  id: string;
  numeroSocio: number;
  nombre: string;
  apellido: string;
};

export default function DeudaAnteriorForm({
  socios,
}: {
  socios: SocioOpcion[];
}) {
  const router = useRouter();
  const [socioId, setSocioId] = useState("");
  const [monto, setMonto] = useState("");
  const [detalle, setDetalle] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!socioId) {
      setError("Elegí un socio.");
      return;
    }
    if (!monto || Number(monto) <= 0) {
      setError("Ingresá un monto mayor a 0.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/cuotas/deuda-anterior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ socioId, monto: Number(monto), detalle }),
    });
    setLoading(false);

    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo cargar la deuda");
      return;
    }
    const s = socios.find((x) => x.id === socioId);
    setMsg(
      `Deuda anterior cargada para ${s?.apellido ?? ""}, ${s?.nombre ?? ""}.`
    );
    setSocioId("");
    setMonto("");
    setDetalle("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <p className="text-sm text-tiro-grisTexto">
        Cargá la deuda que un socio traía en papel como una única cuota vencida.
        El socio la verá como pendiente y podrá pagarla o informar el pago. Si el
        socio ya tiene una deuda anterior cargada, se actualiza el monto.
      </p>

      {msg && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {msg}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Socio</label>
          <select
            className="input"
            value={socioId}
            onChange={(e) => setSocioId(e.target.value)}
          >
            <option value="">Elegí un socio...</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                N° {s.numeroSocio} — {s.apellido}, {s.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Monto adeudado ($)</label>
          <input
            type="number"
            min={1}
            step="0.01"
            className="input"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ej: 15000"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Detalle (opcional)</label>
          <input
            className="input"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Ej: cuotas ene-jun 2025"
          />
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Guardando..." : "Cargar deuda anterior"}
      </button>
    </form>
  );
}
