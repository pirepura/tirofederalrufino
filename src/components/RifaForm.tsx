"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PremioState = { titulo: string; foto: string | null; nombreArchivo: string };

const premioVacio: PremioState = { titulo: "", foto: null, nombreArchivo: "" };

export default function RifaForm() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cifras, setCifras] = useState(3);
  const [cantidad, setCantidad] = useState("1000");
  const [precio, setPrecio] = useState("");
  const [premios, setPremios] = useState<PremioState[]>([
    { ...premioVacio },
    { ...premioVacio },
    { ...premioVacio },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Máximo de números según las cifras (1 cifra: 10, 2: 100, 3: 1000, 4: 10000)
  const maxNumeros = Math.pow(10, cifras);

  function setPremio(i: number, patch: Partial<PremioState>) {
    setPremios((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function elegirFoto(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("La foto del premio debe ser una imagen.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("La foto es demasiado grande (máximo 3 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setPremio(i, { foto: reader.result as string, nombreArchivo: file.name });
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cant = Number(cantidad);
    if (cant < 2 || cant > maxNumeros) {
      setError(`Con ${cifras} cifra(s), la cantidad debe ser entre 2 y ${maxNumeros}.`);
      return;
    }
    if (premios.some((p) => !p.titulo.trim())) {
      setError("Completá el título de los 3 premios.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/rifas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descripcion,
        cifras,
        cantidadNumeros: cant,
        precioNumero: Number(precio),
        premios: premios.map((p, idx) => ({
          posicion: idx + 1,
          titulo: p.titulo,
          fotoDataUrl: p.foto ?? "",
        })),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo crear la rifa");
      return;
    }
    router.push("/admin/rifas");
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
          Datos de la rifa
        </h2>
        <div>
          <label className="label">Título</label>
          <input
            className="input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Gran Rifa Aniversario"
            required
          />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Se sortea con los últimos dígitos de la Lotería Nacional..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Cifras del número</label>
            <select
              className="input"
              value={cifras}
              onChange={(e) => {
                const c = Number(e.target.value);
                setCifras(c);
                setCantidad(String(Math.pow(10, c)));
              }}
            >
              <option value={1}>1 (0 a 9)</option>
              <option value={2}>2 (00 a 99)</option>
              <option value={3}>3 (000 a 999)</option>
              <option value={4}>4 (0000 a 9999)</option>
            </select>
          </div>
          <div>
            <label className="label">Cantidad de números</label>
            <input
              type="number"
              className="input"
              value={cantidad}
              min={2}
              max={maxNumeros}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-tiro-grisTexto">
              Máximo {maxNumeros} con {cifras} cifra(s).
            </p>
          </div>
          <div>
            <label className="label">Precio por número ($)</label>
            <input
              type="number"
              className="input"
              value={precio}
              min={1}
              onChange={(e) => setPrecio(e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Premios
        </h2>
        {premios.map((p, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[auto_1fr_1fr] sm:items-end border-b pb-4 last:border-0">
            <div className="text-sm font-semibold text-tiro-azul">
              {i + 1}° premio
            </div>
            <div>
              <label className="label">Título del premio</label>
              <input
                className="input"
                value={p.titulo}
                onChange={(e) => setPremio(i, { titulo: e.target.value })}
                placeholder={`Ej: ${["Un asado para 10", "Orden de compra", "Kit deportivo"][i]}`}
                required
              />
            </div>
            <div>
              <label className="label">Foto</label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm"
                onChange={(e) => elegirFoto(i, e)}
              />
              {p.nombreArchivo && (
                <p className="mt-1 text-xs text-green-700">✓ {p.nombreArchivo}</p>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Crear rifa"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
