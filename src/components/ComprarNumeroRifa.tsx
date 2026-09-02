"use client";

import { useState } from "react";

function fmt(n: number, cifras: number) {
  return String(n).padStart(cifras, "0");
}

export default function ComprarNumeroRifa({
  slug,
  cantidadNumeros,
  cifras,
  ocupados,
}: {
  slug: string;
  cantidadNumeros: number;
  cifras: number;
  ocupados: number[];
}) {
  const ocupadosSet = new Set(ocupados);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Para escribir el número manualmente (útil cuando son muchos)
  const [numeroManual, setNumeroManual] = useState("");

  const usarGrilla = cantidadNumeros <= 300;

  function elegirManual() {
    setError("");
    const n = parseInt(numeroManual, 10);
    if (isNaN(n) || n < 0 || n >= cantidadNumeros) {
      setError(`Ingresá un número entre 0 y ${cantidadNumeros - 1}.`);
      return;
    }
    if (ocupadosSet.has(n)) {
      setError("Ese número no está disponible.");
      return;
    }
    setSeleccionado(n);
  }

  async function comprar() {
    setError("");
    if (seleccionado === null) {
      setError("Elegí un número.");
      return;
    }
    if (!nombre || !apellido || !telefono) {
      setError("Completá tus datos.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/rifas/publica/${slug}/comprar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: seleccionado, nombre, apellido, telefono }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo iniciar la compra");
      setLoading(false);
      return;
    }
    if (data.initPoint) {
      window.location.href = data.initPoint;
    } else {
      setError("No se recibió el link de pago");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Selección de número */}
      <div className="card">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Elegí tu número
        </h2>

        {usarGrilla ? (
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Array.from({ length: cantidadNumeros }, (_, n) => {
              const ocupado = ocupadosSet.has(n);
              const sel = seleccionado === n;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={ocupado}
                  onClick={() => setSeleccionado(n)}
                  className={`rounded-md border px-1 py-2 text-xs font-medium transition ${
                    ocupado
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                      : sel
                        ? "border-tiro-azul bg-tiro-azul text-white"
                        : "border-slate-300 bg-white text-tiro-azul hover:bg-tiro-gris"
                  }`}
                >
                  {fmt(n, cifras)}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-tiro-grisTexto">
              Escribí el número que querés (de 0 a {cantidadNumeros - 1}) y
              tocá "Elegir".
            </p>
            <div className="flex gap-2">
              <input
                className="input"
                value={numeroManual}
                onChange={(e) => setNumeroManual(e.target.value)}
                placeholder="Ej: 457"
                inputMode="numeric"
              />
              <button type="button" className="btn-secondary" onClick={elegirManual}>
                Elegir
              </button>
            </div>
          </div>
        )}

        {seleccionado !== null && (
          <p className="mt-3 text-sm">
            Número elegido:{" "}
            <span className="text-lg font-bold text-tiro-azul">
              {fmt(seleccionado, cifras)}
            </span>
          </p>
        )}
      </div>

      {/* Datos del comprador */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Tus datos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input className="input" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
      </div>

      <button className="btn-primary w-full" onClick={comprar} disabled={loading}>
        {loading ? "Redirigiendo al pago..." : "Comprar y pagar con Mercado Pago"}
      </button>
      <p className="text-center text-xs text-tiro-grisTexto">
        El número queda reservado cuando se confirma el pago.
      </p>
    </div>
  );
}
