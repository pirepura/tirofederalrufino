"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADO_SOCIO } from "@/lib/constants";

export type SocioFormData = {
  id?: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  categoria: string;
  cuotaMensual: number;
  estado: string;
  observaciones: string;
};

const vacio: SocioFormData = {
  nombre: "",
  apellido: "",
  dni: "",
  email: "",
  telefono: "",
  direccion: "",
  categoria: "General",
  cuotaMensual: 5000,
  estado: ESTADO_SOCIO.ACTIVO,
  observaciones: "",
};

export default function SocioForm({
  inicial,
  modo,
}: {
  inicial?: Partial<SocioFormData>;
  modo: "crear" | "editar";
}) {
  const router = useRouter();
  const [data, setData] = useState<SocioFormData>({ ...vacio, ...inicial });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SocioFormData>(
    key: K,
    value: SocioFormData[K]
  ) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload: Record<string, unknown> = { ...data };
    if (password) payload.password = password;

    const url =
      modo === "crear" ? "/api/socios" : `/api/socios/${data.id}`;
    const method = modo === "crear" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Ocurrió un error");
      return;
    }

    router.push("/admin/socios");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nombre</label>
          <input
            className="input"
            value={data.nombre}
            onChange={(e) => update("nombre", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Apellido</label>
          <input
            className="input"
            value={data.apellido}
            onChange={(e) => update("apellido", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">DNI</label>
          <input
            className="input"
            value={data.dni}
            onChange={(e) => update("dni", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input
            className="input"
            value={data.telefono}
            onChange={(e) => update("telefono", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Dirección</label>
          <input
            className="input"
            value={data.direccion}
            onChange={(e) => update("direccion", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Categoría</label>
          <input
            className="input"
            value={data.categoria}
            onChange={(e) => update("categoria", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Cuota mensual ($)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={data.cuotaMensual}
            onChange={(e) => update("cuotaMensual", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            className="input"
            value={data.estado}
            onChange={(e) => update("estado", e.target.value)}
          >
            <option value={ESTADO_SOCIO.ACTIVO}>Activo</option>
            <option value={ESTADO_SOCIO.INACTIVO}>Inactivo</option>
            <option value={ESTADO_SOCIO.SUSPENDIDO}>Suspendido</option>
          </select>
        </div>
      </div>

      <hr className="border-slate-200" />
      <p className="text-sm font-semibold text-tiro-azul">Cuenta de acceso</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Email (usuario)</label>
          <input
            type="email"
            className="input"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">
            Contraseña{" "}
            {modo === "editar" && (
              <span className="font-normal text-tiro-grisTexto">
                (dejar vacío para no cambiar)
              </span>
            )}
          </label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={modo === "crear"}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <label className="label">Observaciones</label>
        <textarea
          className="input"
          rows={2}
          value={data.observaciones}
          onChange={(e) => update("observaciones", e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : modo === "crear" ? "Crear socio" : "Guardar cambios"}
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
