"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TorneoImagenDescripcion({
  torneoId,
  descripcion,
  imagenData,
  editable,
}: {
  torneoId: string;
  descripcion: string | null;
  imagenData: string | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [desc, setDesc] = useState(descripcion ?? "");
  const [img, setImg] = useState(imagenData ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function elegirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("La imagen es demasiado grande (máximo 3 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImg(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function guardar() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/torneos/${torneoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descripcion: desc, imagenData: img }),
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

  // Vista de solo lectura
  if (!editando) {
    if (!descripcion && !imagenData) {
      return editable ? (
        <button
          className="text-sm font-medium text-tiro-azul hover:underline"
          onClick={() => setEditando(true)}
        >
          + Agregar imagen o descripción
        </button>
      ) : null;
    }
    return (
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
            Presentación del torneo
          </h2>
          {editable && (
            <button
              className="text-sm font-medium text-tiro-azul hover:underline"
              onClick={() => setEditando(true)}
            >
              Editar
            </button>
          )}
        </div>
        {imagenData && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagenData}
            alt="Imagen del torneo"
            className="max-h-64 w-full rounded-lg object-cover"
          />
        )}
        {descripcion && (
          <p className="whitespace-pre-line text-sm text-tiro-grisTexto">
            {descripcion}
          </p>
        )}
      </section>
    );
  }

  // Vista de edición
  return (
    <section className="card space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
        Presentación del torneo
      </h2>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div>
        <label className="label">Descripción</label>
        <textarea
          className="input"
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Información adicional: reglas, horarios, etc."
        />
      </div>
      <div>
        <label className="label">Imagen (máx 3 MB)</label>
        <input type="file" accept="image/*" className="input" onChange={elegirImagen} />
        {img && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            <button
              type="button"
              className="mt-1 block text-xs text-red-600 hover:underline"
              onClick={() => setImg("")}
            >
              Quitar imagen
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button className="btn-primary text-sm" disabled={loading} onClick={guardar}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button
          className="btn-secondary text-sm"
          onClick={() => {
            setEditando(false);
            setDesc(descripcion ?? "");
            setImg(imagenData ?? "");
          }}
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
