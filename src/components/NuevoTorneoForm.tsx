"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoTorneoForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [disciplina, setDisciplina] = useState("Aire comprimido");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/torneos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, fecha, disciplina }),
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
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className="label">Nombre del torneo</label>
        <input
          className="input"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Torneo Apertura 2026"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div>
          <label className="label">Disciplina</label>
          <input
            className="input"
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
          />
        </div>
      </div>
      <button className="btn-primary" disabled={loading}>
        {loading ? "Creando..." : "Crear torneo"}
      </button>
    </form>
  );
}
