"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { nombre: string; puntajeMaximo: string };

export default function TorneoForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [disciplina, setDisciplina] = useState("Aire comprimido");
  const [precioSocio, setPrecioSocio] = useState("");
  const [precioNoSocio, setPrecioNoSocio] = useState("");
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
    const categorias = cats
      .filter((c) => c.nombre.trim() && c.puntajeMaximo)
      .map((c) => ({ nombre: c.nombre, puntajeMaximo: Number(c.puntajeMaximo) }));
    if (categorias.length === 0) {
      setError("Cargá al menos una categoría con su puntaje máximo.");
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
        precioSocio: Number(precioSocio || 0),
        precioNoSocio: Number(precioNoSocio || 0),
        categorias,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo crear el torneo");
      return;
    }
    router.push("/admin/torneos");
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
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div>
            <label className="label">Disciplina</label>
            <input className="input" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Inscripción socio ($)</label>
            <input type="number" min={0} className="input" value={precioSocio} onChange={(e) => setPrecioSocio(e.target.value)} required />
          </div>
          <div>
            <label className="label">Inscripción no socio ($)</label>
            <input type="number" min={0} className="input" value={precioNoSocio} onChange={(e) => setPrecioNoSocio(e.target.value)} required />
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
            Categorías
          </h2>
          <button type="button" className="text-sm font-medium text-tiro-azul hover:underline" onClick={agregarCat}>
            + Agregar categoría
          </button>
        </div>
        <p className="text-xs text-tiro-grisTexto">
          El puntaje máximo se usa para calcular el rendimiento (%) de cada tirador.
        </p>
        {cats.map((c, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label className="label">Nombre de la categoría</label>
              <input
                className="input"
                value={c.nombre}
                onChange={(e) => setCat(i, { nombre: e.target.value })}
                placeholder="Ej: Mayores, Menores, Damas..."
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
              <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => quitarCat(i)}>
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
