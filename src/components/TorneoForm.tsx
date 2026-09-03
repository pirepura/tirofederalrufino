"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { nombre: string; puntajeMaximo: string };

export default function TorneoForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [disciplina, setDisciplina] = useState("Aire comprimido");
  const [cats, setCats] = useState<Cat[]>([{ nombre: "", puntajeMaximo: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setCat(i: number, patch: Partial<Cat>) {
    setCats((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function agregarCat() {
    setCats((prev) => [...prev, { nombre: "", puntajeMaximo: "" }]);
  }
  function quitarCat(i: number) {
    setCats((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (cats.some((c) => !c.nombre.trim() || !c.puntajeMaximo)) {
      setError("Completá el nombre y el puntaje máximo de cada categoría.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/torneos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        fecha,
        disciplina,
        categorias: cats.map((c) => ({
          nombre: c.nombre,
          puntajeMaximo: Number(c.puntajeMaximo),
        })),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo crear el torneo");
      return;
    }
    const data = await res.json();
    router.push(`/admin/torneos/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="card space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Datos del torneo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Torneo Aniversario"
              required
            />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Disciplina</label>
            <input
              className="input"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
            Categorías
          </h2>
          <button type="button" className="btn-secondary text-sm" onClick={agregarCat}>
            + Agregar categoría
          </button>
        </div>
        <p className="text-xs text-tiro-grisTexto">
          El puntaje máximo se usa para calcular el rendimiento (%) de cada tirador.
        </p>
        {cats.map((c, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <div>
              <label className="label">Categoría</label>
              <input
                className="input"
                value={c.nombre}
                onChange={(e) => setCat(i, { nombre: e.target.value })}
                placeholder="Ej: Mayores, Damas, Menores"
              />
            </div>
            <div>
              <label className="label">Puntaje máximo</label>
              <input
                type="number"
                min={1}
                className="input"
                value={c.puntajeMaximo}
                onChange={(e) => setCat(i, { puntajeMaximo: e.target.value })}
                placeholder="Ej: 400"
              />
            </div>
            {cats.length > 1 && (
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={() => quitarCat(i)}
              >
                Quitar
              </button>
            )}
          </div>
        ))}
      </section>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Crear torneo"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
