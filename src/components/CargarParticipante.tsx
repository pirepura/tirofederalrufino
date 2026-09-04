"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Categoria = { id: string; nombre: string; puntajeMaximo: number };
type SocioOpcion = { id: string; nombre: string; apellido: string };

export default function CargarParticipante({
  torneoId,
  categorias,
  socios,
}: {
  torneoId: string;
  categorias: Categoria[];
  socios: SocioOpcion[];
}) {
  const router = useRouter();
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [esSocio, setEsSocio] = useState(true);
  const [socioId, setSocioId] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [puntaje, setPuntaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // El puntaje es opcional: se envía solo si se cargó.
    let payload: Record<string, unknown> = {
      categoriaId,
      puntaje: puntaje === "" ? null : Number(puntaje),
    };

    if (esSocio) {
      if (!socioId) {
        setError("Elegí un socio.");
        return;
      }
      const s = socios.find((x) => x.id === socioId);
      payload = {
        ...payload,
        socioId,
        nombre: s?.nombre ?? "",
        apellido: s?.apellido ?? "",
      };
    } else {
      if (!nombre || !apellido) {
        setError("Completá nombre y apellido del participante.");
        return;
      }
      payload = { ...payload, nombre, apellido, telefono, email };
    }

    setLoading(true);
    const res = await fetch(`/api/torneos/${torneoId}/participantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo cargar el participante");
      return;
    }
    // limpiar para cargar el siguiente
    setSocioId("");
    setNombre("");
    setApellido("");
    setTelefono("");
    setEmail("");
    setPuntaje("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
        Cargar participante
      </h2>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

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
                {c.nombre} (máx. {c.puntajeMaximo})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Puntaje (opcional)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={puntaje}
            onChange={(e) => setPuntaje(e.target.value)}
            placeholder="Podés cargarlo después"
          />
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={esSocio} onChange={() => setEsSocio(true)} />
          Socio
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!esSocio} onChange={() => setEsSocio(false)} />
          No socio
        </label>
      </div>

      {esSocio ? (
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
                {s.apellido}, {s.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input className="input" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
          <div>
            <label className="label">Teléfono (opcional)</label>
            <input
              className="input"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 2477 123456"
            />
          </div>
          <div>
            <label className="label">Email (opcional)</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: tirador@mail.com"
            />
          </div>
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Cargando..." : "Agregar participante"}
      </button>
    </form>
  );
}
