"use client";

import { useState } from "react";

type Categoria = { id: string; nombre: string; puntajeMaximo: number };

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function InscripcionPublicaTorneo({
  torneoId,
  categorias,
  precioNoSocio,
  mpDisponible,
}: {
  torneoId: string;
  categorias: Categoria[];
  precioNoSocio: number;
  mpDisponible: boolean;
}) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [metodoPago, setMetodoPago] = useState<
    "mercadopago" | "efectivo" | "transferencia"
  >(mpDisponible ? "mercadopago" : "transferencia");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/torneos/publica/${torneoId}/inscribir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoriaId,
        nombre,
        apellido,
        dni,
        telefono,
        email,
        metodoPago,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo completar la inscripción");
      return;
    }
    if (data.initPoint) {
      window.location.href = data.initPoint;
      return;
    }
    setOk(true);
  }

  if (ok) {
    return (
      <div className="card text-center">
        <p className="text-lg font-semibold text-green-700">
          ¡Inscripción registrada! ✅
        </p>
        <p className="mt-2 text-sm text-tiro-grisTexto">
          Tu lugar queda reservado. Coordiná el pago en efectivo o transferencia
          con el club; la administración confirmará tu inscripción al recibirlo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold text-tiro-azul">Inscribirme</h2>
      {precioNoSocio > 0 && (
        <p className="text-sm text-tiro-grisTexto">
          Costo de inscripción:{" "}
          <span className="font-bold text-tiro-azul">{pesos(precioNoSocio)}</span>
        </p>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label className="label">Apellido</label>
          <input className="input" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
        </div>
        <div>
          <label className="label">DNI</label>
          <input className="input" value={dni} onChange={(e) => setDni(e.target.value)} required />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Categoría</label>
          <select
            className="input"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Forma de pago</label>
        <div className="space-y-2">
          {mpDisponible && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="metodoPago"
                checked={metodoPago === "mercadopago"}
                onChange={() => setMetodoPago("mercadopago")}
              />
              Pagar ahora con Mercado Pago
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="metodoPago"
              checked={metodoPago === "transferencia"}
              onChange={() => setMetodoPago("transferencia")}
            />
            Transferencia (coordino con el club)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="metodoPago"
              checked={metodoPago === "efectivo"}
              onChange={() => setMetodoPago("efectivo")}
            />
            Efectivo (pago en el club)
          </label>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading
          ? "Procesando..."
          : metodoPago === "mercadopago"
            ? "Inscribirme y pagar"
            : "Inscribirme"}
      </button>
    </form>
  );
}
