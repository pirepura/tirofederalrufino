"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatearPesos } from "@/lib/constants";

// Sección de débito automático en el panel del socio.
// Permite activar la suscripción (redirige a Mercado Pago) o cancelarla.
export default function DebitoAutomatico({
  activa,
  monto,
}: {
  activa: boolean;
  monto: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function activar() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/suscripcion", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo activar el débito automático");
      setLoading(false);
      return;
    }
    if (data.initPoint) {
      window.location.href = data.initPoint; // ir a Mercado Pago a autorizar
    } else {
      setError("No se recibió el link de Mercado Pago");
      setLoading(false);
    }
  }

  async function cancelar() {
    if (!confirm("¿Cancelar el débito automático de tu cuota?")) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/suscripcion/cancelar", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo cancelar");
      return;
    }
    router.refresh();
  }

  if (activa) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="text-sm font-semibold text-green-800">
          ✅ Débito automático activo
        </p>
        <p className="mt-1 text-sm text-green-700">
          Tu cuota se debita automáticamente todos los meses de tu tarjeta.
        </p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <button
          className="btn-secondary mt-3 text-sm"
          onClick={cancelar}
          disabled={loading}
        >
          {loading ? "Cancelando..." : "Cancelar débito automático"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-tiro-celeste/40 bg-tiro-celeste/10 p-5">
      <p className="text-sm font-semibold text-tiro-azul">
        💳 Débito automático de la cuota
      </p>
      <p className="mt-1 text-sm text-tiro-grisTexto">
        Activá el débito automático y tu cuota
        {monto > 0 ? ` de ${formatearPesos(monto)}` : ""} se paga sola todos los
        meses desde tu tarjeta. Podés cancelarlo cuando quieras.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        className="btn-primary mt-3 text-sm"
        onClick={activar}
        disabled={loading}
      >
        {loading ? "Redirigiendo..." : "Activar débito automático"}
      </button>
    </div>
  );
}
