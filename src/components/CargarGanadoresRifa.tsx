"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CargarGanadoresRifa({
  rifaId,
  cifras,
  cantidadNumeros,
  ganadoresActuales,
}: {
  rifaId: string;
  cifras: number;
  cantidadNumeros: number;
  ganadoresActuales: {
    numero1: number | null;
    numero2: number | null;
    numero3: number | null;
  };
}) {
  const router = useRouter();
  const [n1, setN1] = useState(ganadoresActuales.numero1?.toString() ?? "");
  const [n2, setN2] = useState(ganadoresActuales.numero2?.toString() ?? "");
  const [n3, setN3] = useState(ganadoresActuales.numero3?.toString() ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const yaCargados =
    ganadoresActuales.numero1 != null ||
    ganadoresActuales.numero2 != null ||
    ganadoresActuales.numero3 != null;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (n1 === "" || n2 === "" || n3 === "") {
      setError("Cargá los 3 números ganadores.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/rifas/${rifaId}/ganadores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numero1: Number(n1),
        numero2: Number(n2),
        numero3: Number(n3),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudieron cargar los ganadores");
      return;
    }
    router.refresh();
  }

  return (
    <section className="card space-y-4 border-tiro-dorado/40 bg-tiro-dorado/5">
      <div>
        <h2 className="text-lg font-semibold text-tiro-azul">
          🎁 Cargar números ganadores
        </h2>
        <p className="mt-1 text-sm text-tiro-grisTexto">
          Todos los números están vendidos. Cargá los {cifras}-dígitos que
          salieron en la Lotería Nacional para cada premio (0 a{" "}
          {cantidadNumeros - 1}). El sistema busca al ganador de cada número.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Número 1° premio</label>
          <input
            type="number"
            min={0}
            max={cantidadNumeros - 1}
            className="input"
            value={n1}
            onChange={(e) => setN1(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Número 2° premio</label>
          <input
            type="number"
            min={0}
            max={cantidadNumeros - 1}
            className="input"
            value={n2}
            onChange={(e) => setN2(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Número 3° premio</label>
          <input
            type="number"
            min={0}
            max={cantidadNumeros - 1}
            className="input"
            value={n3}
            onChange={(e) => setN3(e.target.value)}
          />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? "Guardando..."
              : yaCargados
                ? "Actualizar ganadores"
                : "Cargar ganadores"}
          </button>
        </div>
      </form>
    </section>
  );
}
