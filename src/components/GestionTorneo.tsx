"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Categoria = { id: string; nombre: string; puntajeMaximo: number };
type Socio = { id: string; nombre: string; apellido: string; numeroSocio: number };

export default function GestionTorneo({
  torneoId,
  categorias,
  socios,
}: {
  torneoId: string;
  categorias: Categoria[];
  socios: Socio[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  // Nueva categoría
  const [catNombre, setCatNombre] = useState("");
  const [catMax, setCatMax] = useState("");

  // Nuevo participante
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [esSocio, setEsSocio] = useState(true);
  const [socioId, setSocioId] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [puntaje, setPuntaje] = useState("");
  const [loading, setLoading] = useState(false);

  async function agregarCategoria(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/torneos/${torneoId}/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: catNombre, puntajeMaximo: Number(catMax) }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Error al agregar categoría");
      return;
    }
    setCatNombre("");
    setCatMax("");
    router.refresh();
  }

  async function agregarParticipante(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let nom = nombre;
    let ape = apellido;
    let sid: string | undefined;

    if (esSocio) {
      const s = socios.find((x) => x.id === socioId);
      if (!s) {
        setError("Elegí un socio.");
        return;
      }
      nom = s.nombre;
      ape = s.apellido;
      sid = s.id;
    }

    setLoading(true);
    const res = await fetch(`/api/torneos/${torneoId}/participantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoriaId,
        socioId: sid ?? "",
        nombre: nom,
        apellido: ape,
        puntaje: Number(puntaje),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Error al cargar participante");
      return;
    }
    // limpiar
    setSocioId("");
    setNombre("");
    setApellido("");
    setPuntaje("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Agregar categoría */}
      <form onSubmit={agregarCategoria} className="card">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Agregar categoría
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={catNombre}
              onChange={(e) => setCatNombre(e.target.value)}
              placeholder="Ej: Mayores, Damas, Menores"
              required
            />
          </div>
          <div>
            <label className="label">Puntaje máximo</label>
            <input
              type="number"
              className="input"
              value={catMax}
              onChange={(e) => setCatMax(e.target.value)}
              placeholder="Ej: 400"
              required
            />
          </div>
          <button className="btn-secondary">Agregar categoría</button>
        </div>
      </form>

      {/* Agregar participante */}
      {categorias.length > 0 && (
        <form onSubmit={agregarParticipante} className="card">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-tiro-azul">
            Cargar participante y puntaje
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Categoría</label>
              <select
                className="input"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (máx {c.puntajeMaximo})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <div className="flex gap-4 pt-2 text-sm">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={esSocio}
                    onChange={() => setEsSocio(true)}
                  />
                  Socio
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={!esSocio}
                    onChange={() => setEsSocio(false)}
                  />
                  No socio
                </label>
              </div>
            </div>

            {esSocio ? (
              <div className="sm:col-span-2">
                <label className="label">Socio</label>
                <select
                  className="input"
                  value={socioId}
                  onChange={(e) => setSocioId(e.target.value)}
                  required
                >
                  <option value="">Elegí un socio...</option>
                  {socios.map((s) => (
                    <option key={s.id} value={s.id}>
                      N° {s.numeroSocio} — {s.apellido}, {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="label">Nombre</label>
                  <input
                    className="input"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Apellido</label>
                  <input
                    className="input"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="label">Puntaje</label>
              <input
                type="number"
                className="input"
                value={puntaje}
                onChange={(e) => setPuntaje(e.target.value)}
                required
              />
            </div>
          </div>
          <button className="btn-primary mt-3" disabled={loading}>
            {loading ? "Cargando..." : "Cargar participante"}
          </button>
        </form>
      )}
    </div>
  );
}
