"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatearPesos } from "@/lib/constants";

type Categoria = {
  id: string;
  nombre: string;
  cuotaMensual: number;
  activa: boolean;
  _count: { socios: number };
};

export default function CategoriasManager({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Edición inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMonto, setEditMonto] = useState("");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, cuotaMensual: Number(monto), activa: true }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Error al crear");
      return;
    }
    setNombre("");
    setMonto("");
    router.refresh();
  }

  async function guardarEdicion(id: string) {
    setError("");
    const res = await fetch(`/api/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: editNombre,
        cuotaMensual: Number(editMonto),
        activa: true,
      }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Error al guardar");
      return;
    }
    setEditId(null);
    router.refresh();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Error al eliminar");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Alta de categoría */}
      <form onSubmit={crear} className="card space-y-3">
        <h2 className="text-sm font-semibold text-tiro-azul">Nueva categoría</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="label">Nombre</label>
            <input
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Estudiante"
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="label">Cuota mensual ($)</label>
            <input
              type="number"
              min={0}
              className="input"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Creando..." : "Agregar categoría"}
            </button>
          </div>
        </div>
      </form>

      {/* Listado */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-tiro-gris text-tiro-azul">
            <tr>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Cuota mensual</th>
              <th className="px-4 py-3 font-semibold">Socios</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-tiro-grisTexto">
                  No hay categorías. Creá la primera arriba.
                </td>
              </tr>
            ) : (
              categorias.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  {editId === c.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          className="input"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          className="input"
                          value={editMonto}
                          onChange={(e) => setEditMonto(e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">{c._count.socios}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className="mr-3 text-sm font-medium text-green-700 hover:underline"
                          onClick={() => guardarEdicion(c.id)}
                        >
                          Guardar
                        </button>
                        <button
                          className="text-sm text-tiro-grisTexto hover:underline"
                          onClick={() => setEditId(null)}
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{c.nombre}</td>
                      <td className="px-4 py-3">
                        {formatearPesos(c.cuotaMensual)}
                      </td>
                      <td className="px-4 py-3">{c._count.socios}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="mr-3 text-sm font-medium text-tiro-azul hover:underline"
                          onClick={() => {
                            setEditId(c.id);
                            setEditNombre(c.nombre);
                            setEditMonto(String(c.cuotaMensual));
                            setError("");
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => eliminar(c.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
