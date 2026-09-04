"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function PreciosTorneo({
  torneoId,
  precioSocio,
  precioNoSocio,
  linkPublico,
  recaudacion,
  editable,
}: {
  torneoId: string;
  precioSocio: number;
  precioNoSocio: number;
  linkPublico: string;
  recaudacion: {
    recaudado: number;
    pendiente: number;
    inscriptos: number;
    socios: number;
    noSocios: number;
  };
  editable: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [ps, setPs] = useState(precioSocio.toString());
  const [pns, setPns] = useState(precioNoSocio.toString());
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function guardar() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/torneos/${torneoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        precioSocio: Number(ps) || 0,
        precioNoSocio: Number(pns) || 0,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo guardar");
      return;
    }
    setEditando(false);
    router.refresh();
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Precios + recaudación */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
            Inscripción
          </h2>
          {editable && !editando && (
            <button
              className="text-sm font-medium text-tiro-azul hover:underline"
              onClick={() => setEditando(true)}
            >
              Editar precios
            </button>
          )}
        </div>

        {editando ? (
          <div className="space-y-3">
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Precio socio ($)</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={ps}
                  onChange={(e) => setPs(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Precio no socio ($)</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={pns}
                  onChange={(e) => setPns(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-sm" disabled={loading} onClick={guardar}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => {
                  setEditando(false);
                  setPs(precioSocio.toString());
                  setPns(precioNoSocio.toString());
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-tiro-grisTexto">Socios</p>
              <p className="text-lg font-bold text-tiro-azul">
                {precioSocio > 0 ? pesos(precioSocio) : "Gratis"}
              </p>
            </div>
            <div>
              <p className="text-tiro-grisTexto">No socios</p>
              <p className="text-lg font-bold text-tiro-azul">
                {precioNoSocio > 0 ? pesos(precioNoSocio) : "Gratis"}
              </p>
            </div>
          </div>
        )}

        <div className="border-t pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-tiro-grisTexto">Recaudado</span>
            <span className="font-bold text-green-700">
              {pesos(recaudacion.recaudado)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tiro-grisTexto">Pendiente de cobro</span>
            <span className="font-medium text-amber-700">
              {pesos(recaudacion.pendiente)}
            </span>
          </div>
          <div className="mt-1 text-xs text-tiro-grisTexto">
            {recaudacion.inscriptos} inscripto(s) · {recaudacion.socios} socio(s) ·{" "}
            {recaudacion.noSocios} no socio(s)
          </div>
        </div>
      </section>

      {/* Link público para no socios */}
      <section className="card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Link público (no socios)
        </h2>
        <p className="text-xs text-tiro-grisTexto">
          Compartí este link por WhatsApp para que los no socios se inscriban y
          paguen online o elijan efectivo/transferencia.
        </p>
        <div className="flex gap-2">
          <input readOnly className="input text-xs" value={linkPublico} />
          <button className="btn-secondary whitespace-nowrap text-sm" onClick={copiar}>
            {copiado ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <a
          href={linkPublico}
          target="_blank"
          className="inline-block text-sm font-medium text-tiro-azul hover:underline"
        >
          Abrir página pública →
        </a>
      </section>
    </div>
  );
}
