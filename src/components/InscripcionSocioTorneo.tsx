"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Categoria = { id: string; nombre: string };

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function InscripcionSocioTorneo({
  torneo,
  yaInscripto,
  mpDisponible,
}: {
  torneo: {
    id: string;
    nombre: string;
    fecha: string; // ISO
    disciplina: string;
    precioSocio: number;
    categorias: Categoria[];
  };
  yaInscripto: { estadoPago: string; categoriaNombre: string } | null;
  mpDisponible: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [categoriaId, setCategoriaId] = useState(torneo.categorias[0]?.id ?? "");
  const [metodoPago, setMetodoPago] = useState<
    "mercadopago" | "efectivo" | "transferencia"
  >(mpDisponible ? "mercadopago" : "transferencia");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const fecha = new Date(torneo.fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function inscribirse() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/torneos/inscripcion-socio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ torneoId: torneo.id, categoriaId, metodoPago }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo completar la inscripción");
      return;
    }
    if (data.initPoint) {
      window.location.href = data.initPoint;
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-tiro-azul/30 bg-tiro-azul/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-tiro-azul">
            🎯 Próximo torneo
          </p>
          <h2 className="mt-1 text-xl font-bold text-tiro-azul">{torneo.nombre}</h2>
          <p className="text-sm text-tiro-grisTexto">
            {fecha} · {torneo.disciplina}
          </p>
          <p className="mt-1 text-sm">
            Inscripción socios:{" "}
            <span className="font-bold text-tiro-azul">
              {torneo.precioSocio > 0 ? pesos(torneo.precioSocio) : "Gratis"}
            </span>
          </p>
        </div>
      </div>

      {yaInscripto ? (
        <div className="mt-4 rounded-lg bg-white p-3 text-sm">
          <p className="font-semibold text-green-700">
            Ya estás inscripto ✅ ({yaInscripto.categoriaNombre})
          </p>
          <p className="text-tiro-grisTexto">
            {yaInscripto.estadoPago === "pagado"
              ? "Pago confirmado."
              : "Pago pendiente. Si elegiste efectivo/transferencia, coordiná con el club."}
          </p>
        </div>
      ) : ok ? (
        <div className="mt-4 rounded-lg bg-white p-3 text-sm">
          <p className="font-semibold text-green-700">¡Inscripción registrada! ✅</p>
          <p className="text-tiro-grisTexto">
            Coordiná el pago con el club para confirmar tu lugar.
          </p>
        </div>
      ) : !abierto ? (
        <button className="btn-primary mt-4" onClick={() => setAbierto(true)}>
          Inscribirme
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-lg bg-white p-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="label">Categoría</label>
            <select
              className="input"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              {torneo.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Forma de pago</label>
            <div className="space-y-2">
              {mpDisponible && torneo.precioSocio > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="metodoPagoSocio"
                    checked={metodoPago === "mercadopago"}
                    onChange={() => setMetodoPago("mercadopago")}
                  />
                  Pagar ahora con Mercado Pago
                </label>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="metodoPagoSocio"
                  checked={metodoPago === "transferencia"}
                  onChange={() => setMetodoPago("transferencia")}
                />
                Transferencia (coordino con el club)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="metodoPagoSocio"
                  checked={metodoPago === "efectivo"}
                  onChange={() => setMetodoPago("efectivo")}
                />
                Efectivo (pago en el club)
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" disabled={loading} onClick={inscribirse}>
              {loading ? "Procesando..." : "Confirmar inscripción"}
            </button>
            <button className="btn-secondary" onClick={() => setAbierto(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
