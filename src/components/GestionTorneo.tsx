"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Categoria = { id: string; nombre: string; puntajeMaximo: number };
type Socio = { id: string; nombre: string; apellido: string };

// Formulario para inscribir un participante
export function InscribirParticipante({
  torneoId,
  categorias,
  socios,
}: {
  torneoId: string;
  categorias: Categoria[];
  socios: Socio[];
}) {
  const router = useRouter();
  const [esSocio, setEsSocio] = useState(true);
  const [socioId, setSocioId] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function inscribir(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let nom = nombre;
    let ape = apellido;
    if (esSocio) {
      const s = socios.find((x) => x.id === socioId);
      if (!s) {
        setError("Elegí un socio.");
        return;
      }
      nom = s.nombre;
      ape = s.apellido;
    }
    if (!nom || !ape) {
      setError("Completá nombre y apellido.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/torneos/${torneoId}/participantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoriaId,
        socioId: esSocio ? socioId : "",
        nombre: nom,
        apellido: ape,
        esSocio,
        metodoPago,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo inscribir");
      return;
    }
    setSocioId("");
    setNombre("");
    setApellido("");
    router.refresh();
  }

  return (
    <form onSubmit={inscribir} className="card space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
        Inscribir participante
      </h2>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={esSocio} onChange={() => setEsSocio(true)} />
          Socio
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={!esSocio} onChange={() => setEsSocio(false)} />
          No socio
        </label>
      </div>

      {esSocio ? (
        <div>
          <label className="label">Socio</label>
          <select className="input" value={socioId} onChange={(e) => setSocioId(e.target.value)}>
            <option value="">Elegí un socio</option>
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
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Categoría</label>
          <select className="input" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} (máx {c.puntajeMaximo})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Pago de inscripción</label>
          <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="efectivo">Efectivo (cobrado)</option>
            <option value="mercadopago">Mercado Pago (generar link)</option>
          </select>
        </div>
      </div>

      <button className="btn-primary" disabled={loading}>
        {loading ? "Inscribiendo..." : "Inscribir"}
      </button>
    </form>
  );
}

// Botones por participante: cargar puntaje, generar link de pago, marcar pagado
export function AccionesParticipante({
  participacionId,
  estadoPago,
  metodoPago,
  puntaje,
}: {
  participacionId: string;
  estadoPago: string;
  metodoPago: string | null;
  puntaje: number | null;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(puntaje != null ? String(puntaje) : "");
  const [loading, setLoading] = useState(false);

  async function guardarPuntaje() {
    setLoading(true);
    await fetch(`/api/torneos/participante/${participacionId}/puntaje`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puntaje: Number(valor) }),
    });
    setLoading(false);
    router.refresh();
  }

  async function generarLink() {
    setLoading(true);
    const res = await fetch(`/api/torneos/participante/${participacionId}/pago-online`, {
      method: "POST",
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (data.initPoint) {
      navigator.clipboard?.writeText(data.initPoint).catch(() => {});
      window.open(data.initPoint, "_blank");
    }
  }

  async function marcarPagado() {
    setLoading(true);
    await fetch(`/api/torneos/participante/${participacionId}/pagar`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        className="input w-24 py-1 text-sm"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Puntaje"
      />
      <button className="text-xs font-medium text-tiro-azul hover:underline" onClick={guardarPuntaje} disabled={loading}>
        Guardar
      </button>
      {estadoPago !== "pagado" && (
        <>
          <span className="text-slate-300">|</span>
          {metodoPago === "mercadopago" && (
            <button className="text-xs font-medium text-tiro-celeste hover:underline" onClick={generarLink} disabled={loading}>
              Link de pago
            </button>
          )}
          <button className="text-xs font-medium text-green-700 hover:underline" onClick={marcarPagado} disabled={loading}>
            Marcar pagado
          </button>
        </>
      )}
    </div>
  );
}


// Botón para cerrar el torneo
export function CerrarTorneoBtn({ torneoId }: { torneoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cerrar() {
    if (!confirm("¿Cerrar el torneo? Ya no se podrán inscribir más participantes.")) {
      return;
    }
    setLoading(true);
    await fetch(`/api/torneos/${torneoId}/cerrar`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50" onClick={cerrar} disabled={loading}>
      Cerrar torneo
    </button>
  );
}
