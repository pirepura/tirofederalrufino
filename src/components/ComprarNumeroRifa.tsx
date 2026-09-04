"use client";

import { useState } from "react";

function fmt(n: number, cifras: number) {
  return String(n).padStart(cifras, "0");
}

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ComprarNumeroRifa({
  slug,
  cantidadNumeros,
  cifras,
  ocupados,
  precioNumero,
}: {
  slug: string;
  cantidadNumeros: number;
  cifras: number;
  ocupados: number[];
  precioNumero: number;
}) {
  const ocupadosSet = new Set(ocupados);
  // Varios números seleccionados
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Para escribir números manualmente (útil cuando son muchos)
  const [numeroManual, setNumeroManual] = useState("");

  const usarGrilla = cantidadNumeros <= 300;
  const total = seleccionados.length * precioNumero;

  function toggle(n: number) {
    setError("");
    setSeleccionados((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  }

  function agregarManual() {
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
    if (seleccionados.includes(n)) {
      setError("Ese número ya está en tu selección.");
      return;
    }
    setSeleccionados((prev) => [...prev, n]);
    setNumeroManual("");
  }

  function quitar(n: number) {
    setSeleccionados((prev) => prev.filter((x) => x !== n));
  }

  async function comprar() {
    setError("");
    if (seleccionados.length === 0) {
      setError("Elegí al menos un número.");
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
      body: JSON.stringify({
        numeros: seleccionados,
        nombre,
        apellido,
        telefono,
      }),
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

      {/* Selección de números */}
      <div className="card">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Elegí tus números
        </h2>

        {usarGrilla ? (
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Array.from({ length: cantidadNumeros }, (_, n) => {
              const ocupado = ocupadosSet.has(n);
              const sel = seleccionados.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  disabled={ocupado}
                  onClick={() => toggle(n)}
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
              Escribí un número (de 0 a {cantidadNumeros - 1}) y tocá "Agregar".
              Repetí para sumar más.
            </p>
            <div className="flex gap-2">
              <input
                className="input"
                value={numeroManual}
                onChange={(e) => setNumeroManual(e.target.value)}
                placeholder="Ej: 457"
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarManual();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={agregarManual}>
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* Números elegidos */}
        {seleccionados.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="text-sm font-medium text-tiro-azul">
              Números elegidos ({seleccionados.length}):
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...seleccionados]
                .sort((a, b) => a - b)
                .map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1 rounded-full bg-tiro-azul/10 px-3 py-1 text-sm text-tiro-azul"
                  >
                    {fmt(n, cifras)}
                    <button
                      type="button"
                      onClick={() => quitar(n)}
                      className="text-tiro-azul/70 hover:text-red-600"
                      aria-label={`Quitar ${fmt(n, cifras)}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
            </div>
            <p className="mt-3 text-sm">
              Total:{" "}
              <span className="text-lg font-bold text-tiro-azul">
                {pesos(total)}
              </span>{" "}
              <span className="text-tiro-grisTexto">
                ({seleccionados.length} × {pesos(precioNumero)})
              </span>
            </p>
          </div>
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
        {loading
          ? "Redirigiendo al pago..."
          : seleccionados.length > 1
            ? `Comprar ${seleccionados.length} números y pagar (${pesos(total)})`
            : "Comprar y pagar con Mercado Pago"}
      </button>
      <p className="text-center text-xs text-tiro-grisTexto">
        Los números quedan reservados cuando se confirma el pago.
      </p>
    </div>
  );
}
